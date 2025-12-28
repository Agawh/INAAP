// /proxy.ts
import { auth } from "@/auth";

// ---- ¡ESTA ES LA LÍNEA CLAVE DE LA CORRECCIÓN! ----
// Forzamos al middleware a ejecutarse en el runtime de Node.js

export default auth((req) => {
  // El middleware 'auth' (ahora proxy) protege automáticamente
  // todas las rutas que no estén definidas como públicas.
});

// Configuración del proxy (antes middleware)
export const config = {
  // El 'matcher' define qué rutas serán procesadas
  matcher: [
    // Proteger todas las rutas excepto las públicas
    "/((?!api/|_next/|_static/|_vercel/|favicon.ico|.*\\..*).*)",
    // Excluir rutas que empiezan con /api/ (excepto /api/auth)
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
