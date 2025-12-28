// /auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { sql } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import type { Usuario } from "@/types";

import { UsuariosService } from "@/services/usuarios.service";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        try {
          const parsedCredentials = loginSchema.parse(credentials);
          const { email, password } = parsedCredentials;

          const result = await sql(
            `SELECT password_hash, activo FROM usuarios WHERE email = $1`,
            [email]
          );
          const usuarioDb = result.rows[0];

          if (!usuarioDb || !usuarioDb.password_hash || !usuarioDb.activo) {
            console.log("Auth: Usuario no encontrado o inactivo.");
            return null;
          }

          // 2. Verificamos la contraseña
          const passwordValida = await verifyPassword(
            password,
            usuarioDb.password_hash
          );

          if (!passwordValida) {
            console.log("Auth: Contraseña incorrecta.");
            return null;
          }

          // 3. Si es válida, obtenemos el usuario completo desde el SERVICIO
          const usuario = await UsuariosService.obtenerUsuarioPorEmail(email);
          if (!usuario) return null; // No debería pasar, pero es seguro

          // 4. Retornamos los datos para la sesión
          return {
            id: usuario.id,
            email: usuario.email,
            name: usuario.nombre_completo,
            rol: usuario.rol,
          };
        } catch (error) {
          console.error("Error en authorize:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rol = user.rol;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.rol = token.rol as Usuario["rol"];
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
  session: {
    strategy: "jwt",
  },
});
