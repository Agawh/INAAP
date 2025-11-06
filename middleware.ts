// /middleware.ts
import { auth } from "@/auth";

export default auth((req) => {
  // El middleware 'auth' protege automáticamente todas las rutas
  // que no estén definidas como públicas.
});

// Configuración del middleware
export const config = {
  // El 'matcher' define qué rutas serán procesadas por el middleware
  matcher: [
    // Proteger todas las rutas excepto las públicas
    "/((?!api/|_next/|_static/|_vercel/|favicon.ico|.*\\..*).*)",
    // Excluir rutas que empiezan con /api/ (excepto /api/auth)
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
