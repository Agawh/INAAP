// /app/actions/autenticacion.actions.ts
"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";

export async function iniciarSesion(formData: FormData) {
  try {
    // --- CAMBIO CLAVE ---
    // Usamos redirect: false para que NO lance el error NEXT_REDIRECT aquí.
    // Esto nos permite devolver un objeto limpio al cliente.
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: false,
    });

    // Si llegamos aquí, el login fue exitoso (no hubo error)
    return { success: true };
  } catch (error) {
    // Manejo de errores de Auth.js
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return {
            success: false,
            error: "Credenciales inválidas. Verifique su correo y contraseña.",
          };
        case "CallbackRouteError":
          return {
            success: false,
            error:
              "Error de conexión con la base de datos o credenciales inválidas.",
          };
        default:
          return {
            success: false,
            error: "Ocurrió un error inesperado. Intente nuevamente.",
          };
      }
    }

    // Cualquier otro error no controlado
    console.error("Error de login desconocido:", error);
    return { success: false, error: "Error del sistema. Contacte a soporte." };
  }
}

export async function cerrarSesion() {
  await signOut({ redirectTo: "/" });
}
