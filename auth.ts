// /auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { sql } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import type { Usuario } from "@/types";

// Esquema de validación para el login
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        try {
          // 1. Validar credenciales
          const parsedCredentials = loginSchema.parse(credentials);
          const { email, password } = parsedCredentials;

          // 2. Buscar al usuario

          // ---- ¡CORRECCIÓN APLICADA AQUÍ! ----
          // Se usa la sintaxis sql(query, [params]) que espera tu lib/db.ts
          const query = `
            SELECT id, email, password_hash, nombre_completo, rol, departamento_id, activo
            FROM usuarios
            WHERE email = $1
            LIMIT 1
          `;
          const result = await sql(query, [email]);
          const usuario = result.rows[0];

          if (!usuario || !usuario.password_hash) {
            console.log("Auth: Usuario no encontrado.");
            return null;
          }

          if (!usuario.activo) {
            console.log("Auth: Usuario inactivo.");
            return null;
          }

          // 3. Verificar la contraseña
          const passwordValida = await verifyPassword(
            password,
            usuario.password_hash
          );

          if (!passwordValida) {
            console.log("Auth: Contraseña incorrecta.");
            return null;
          }

          // 4. Retornar el objeto usuario para la sesión
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
    // Añadimos 'rol' al token
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.rol = user.rol; // Esto funciona gracias al archivo next-auth.d.ts
      }
      return token;
    },
    // Añadimos 'rol' a la sesión
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.rol = token.rol as Usuario["rol"];
      }
      return session;
    },
  },
  pages: {
    signIn: "/", // Página de inicio de sesión es la raíz
  },
  session: {
    strategy: "jwt",
  },
});
