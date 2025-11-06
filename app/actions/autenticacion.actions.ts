// /app/actions/autenticacion.actions.ts
"use server";

// ---- ¡LA CORRECCIÓN ESTÁ AQUÍ! ----
// Nos aseguramos de importar tanto 'signIn' como 'signOut'
import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";

/**
 * Autentica a un usuario
 */
export async function iniciarSesion(data: FormData) {
  try {
    const email = data.get("email") as string;
    const password = data.get("password") as string;

    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "Credenciales inválidas." };
        default:
          return { success: false, error: "Ocurrió un error inesperado." };
      }
    }

    throw error;
  }
}

/**
 * Cierra la sesión del usuario actual
 */
export async function cerrarSesion() {
  // Esta línea ahora funcionará porque 'signOut' está importado
  await signOut({ redirectTo: "/" });
}
