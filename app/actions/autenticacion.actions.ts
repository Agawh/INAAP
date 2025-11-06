// /app/actions/autenticacion.actions.ts
"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

// Esta función será llamada por nuestro formulario de login.
// 'data' contendrá el email y la contraseña.
export async function iniciarSesion(data: FormData) {
  try {
    // Extraemos email y password de los datos del formulario
    const email = data.get("email") as string;
    const password = data.get("password") as string;

    // Llamamos a la función signIn de Auth.js
    // 'credentials' coincide con el provider que configuramos en auth.ts
    // Si tiene éxito, redirigirá automáticamente al dashboard
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard", // La página a la que iremos si el login es exitoso
    });

    return { success: true };
  } catch (error) {
    // Si Auth.js falla (ej. contraseña incorrecta), lanzará un error
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { success: false, error: "Credenciales inválidas." };
        default:
          return { success: false, error: "Ocurrió un error inesperado." };
      }
    }

    // Si el error no es de Auth.js, lo lanzamos para depuración
    throw error;
  }
}
