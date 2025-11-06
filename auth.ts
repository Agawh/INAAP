// /auth.ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";
import { sql } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import type { Usuario } from "@/types";

// Esquema de validación para el login, similar al de tu página
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      async authorize(credentials) {
        try {
          // 1. Validar que las credenciales tengan la forma correcta
          const parsedCredentials = loginSchema.parse(credentials);
          const { email, password } = parsedCredentials;

          // 2. Buscar al usuario en la base de datos (incluyendo el hash de la contraseña)
          // Usamos una consulta directa porque 'obtenerUsuarioPorEmail' no devuelve el password_hash

          // ---- CORRECCIÓN AQUÍ ----
          // La función 'sql' debe usarse con comillas invertidas (template literal)
          const result = await sql` 
            SELECT id, email, password_hash, nombre_completo, rol, departamento_id, activo
            FROM usuarios
            WHERE email = ${email}
            LIMIT 1
          `;

          const usuario = result.rows[0];

          if (!usuario || !usuario.password_hash) {
            console.log("Auth: Usuario no encontrado.");
            return null; // Usuario no encontrado
          }

          if (!usuario.activo) {
            console.log("Auth: Usuario inactivo.");
            return null; // Usuario inactivo
          }

          // 3. Verificar la contraseña
          const passwordValida = await verifyPassword(
            password,
            usuario.password_hash
          );

          if (!passwordValida) {
            console.log("Auth: Contraseña incorrecta.");
            return null; // Contraseña incorrecta
          }

          // 4. Retornar el objeto usuario (sin la contraseña)
          // Estos datos se pasan al callback 'jwt'
          return {
            id: usuario.id,
            email: usuario.email,
            name: usuario.nombre_completo,
            rol: usuario.rol,
          };
        } catch (error) {
          console.error("Error en authorize:", error);
          return null; // Fallo en la validación o error de BD
        }
      },
    }),
  ],
  callbacks: {
    // El 'jwt' callback se usa para añadir datos al token (JWT)
    async jwt({ token, user }) {
      if (user) {
        // Al iniciar sesión, 'user' contiene los datos de 'authorize'
        token.id = user.id;
        token.rol = (user as any).rol; // 'user' puede no tener 'rol' por defecto
      }
      return token;
    },
    // El 'session' callback se usa para pasar datos del token a la sesión del cliente
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.rol = token.rol as Usuario["rol"]; // Usamos nuestro tipo 'Rol'
      }
      return session;
    },
  },
  pages: {
    signIn: "/", // Página de inicio de sesión (tu app/page.tsx)
  },
  session: {
    strategy: "jwt", // Usamos JWTs para la sesión
  },
});
