"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth"; // Importamos AuthError

export async function iniciarSesion(
  prevState: string | undefined,
  formData: FormData
) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirect: true, // Dejamos que NextAuth maneje la redirección
      redirectTo: "/dashboard", // Forzamos la ruta de destino
    });
  } catch (error) {
    // 1. Si el error es una redirección exitosa, lo relanzamos
    // para que Next.js pueda redirigir al usuario.
    if ((error as Error).message.includes("NEXT_REDIRECT")) {
      throw error;
    }

    // 2. Si es un error de autenticación conocido (contraseña mal, usuario no existe)
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Credenciales inválidas. Verifique su correo y contraseña.";
        case "CallbackRouteError":
          return "Error de conexión con la base de datos o credenciales inválidas.";
        default:
          return "Ocurrió un error inesperado. Intente nuevamente.";
      }
    }

    // 3. Cualquier otro error no manejado
    console.error("Error de login desconocido:", error);
    return "Error del sistema. Contacte a soporte.";
  }
}

export async function cerrarSesion() {
  await signOut({ redirectTo: "/" });
}
