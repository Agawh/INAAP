// /app/page.tsx
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { iniciarSesion } from "@/app/actions/autenticacion.actions"; // Importamos la acción

// Esquema de validación
const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: "El correo es requerido." })
    .email({ message: "Debe ser un correo electrónico válido." }),
  password: z.string().min(1, { message: "La contraseña es requerida." }),
});

export default function LoginPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Configuración del formulario
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      // ---- ¡Valores por defecto actualizados al usuario temporal! ----
      email: "temp@inatur.gob.ve",
      password: "inatur123",
    },
  });

  // Lógica de envío que llama a la Server Action
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);

    // Creamos un FormData para pasarlo a la Server Action
    const formData = new FormData();
    formData.append("email", values.email);
    formData.append("password", values.password);

    try {
      // Llamamos a nuestra acción de servidor
      const resultado = await iniciarSesion(formData);

      if (!resultado?.success) {
        // Si la acción devuelve un error (ej. credenciales inválidas)
        setError(resultado?.error || "Credenciales inválidas.");
      }
      // Si el inicio de sesión es exitoso, la acción (iniciarSesion)
      // se encargará de redirigir al usuario al "/dashboard".
    } catch (apiError) {
      // Captura de error general
      setError("Ocurrió un error. Por favor intente de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            {/* Logo de Inatur */}
            <img
              src="/Inaturlogo.png"
              alt="Logo INATUR"
              className="mx-auto mb-4 h-20 w-auto"
            />
            <CardTitle className="text-2xl font-bold text-primary">
              Bienvenido
            </CardTitle>
            <CardDescription>Sistema de Gestión de Actividades</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Correo Electrónico</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="usuario@inatur.gob.ve"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Contraseña */}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contraseña</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          {...field}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Error General */}
                {error && (
                  <p className="text-sm font-medium text-destructive">
                    {error}
                  </p>
                )}

                {/* Botón */}
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? <Spinner className="mr-2" /> : "Iniciar Sesión"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </main>
  );
}
