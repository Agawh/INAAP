"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion"; // Para la animación

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

// Esquema de validación de Zod (sin cambios)
const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: "El correo es requerido." })
    .email({ message: "Debe ser un correo electrónico válido." }),
  password: z.string().min(1, { message: "La contraseña es requerida." }),
});

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Configuración del formulario (sin cambios)
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "admin@inatur.gob.ve",
      password: "Admin1G23!", // Corrección basada en el README, la 'G' debe ser '1'
    },
  });

  // Lógica de envío (sin cambios)
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push("/dashboard");
    } catch (apiError) {
      setError("Credenciales inválidas. Por favor intente de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      {/*
        Contenedor de Animación:
        Hará que la tarjeta aparezca desde abajo (y: 50) y se desvanezca (opacity: 0)
      */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl">
          {" "}
          {/* Añadimos una sombra más pronunciada */}
          <CardHeader className="text-center">
            {/* Aquí es donde pones el logo de tu empresa.
              Asegúrate de que la imagen esté en INAAPP/public/logo-inatur.png
            */}
            <img
              src="/placeholder-logo.svg" // <-- CAMBIA ESTO por "/logo-inatur.png"
              alt="Logo INATUR"
              className="mx-auto mb-4 h-20 w-auto" // Puedes ajustar el tamaño
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
