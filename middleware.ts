// /middleware.ts
import { auth } from "@/auth"; // Importamos tu configuración de Auth.js
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth; // ¿El usuario tiene sesión activa?
  const { nextUrl } = req;

  // Definimos qué rutas son privadas y cuál es la de login
  const isProtectedRoute = nextUrl.pathname.startsWith("/dashboard");
  const isLoginPage = nextUrl.pathname === "/";

  // CASO 1: Usuario NO logueado intenta entrar a zona privada
  // Acción: Lo pateamos al Login
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/", nextUrl));
  }

  // CASO 2: Usuario YA logueado intenta entrar al Login
  // Acción: Lo mandamos directo a su Dashboard (para que no se loguee dos veces)
  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // CASO 3: Cualquier otra cosa (API, manual en PDF, imágenes)
  // Acción: Dejar pasar
  return NextResponse.next();
});

// Configuración técnica:
// Le decimos a Next.js que este "portero" vigile todas las rutas,
// EXCEPTO las que son puramente técnicas (api, imágenes, archivos estáticos)
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
