// /types/next-auth.d.ts
import type { DefaultSession, User } from "next-auth";
import type { Rol } from "@/types"; // Importamos tu tipo Rol

// Extendemos los tipos de NextAuth para incluir nuestro 'rol' e 'id'
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      rol: Rol;
    } & DefaultSession["user"];
  }

  interface User {
    rol: Rol;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    rol: Rol;
  }
}
