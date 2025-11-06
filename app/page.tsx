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
import { iniciarSesion } from "@/app/actions/autenticacion.actions";
import { repararHashAdmin } from "@/app/actions/reparar.actions.ts"; // 1. Importamos la acción de reparación

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

  // 2. Estado para el botón de reparación
  const [repararMsg, setRepararMsg] = React.useState<string | null>(null);

  // Configuración del formulario
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "admin@inatur.gob.ve",
      password: "inatur123", // La contraseña que funcionará
    },
  });

  // Lógica de envío (sin cambios)
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("email", values.email);
    formData.append("password", values.password);

    try {
      const resultado = await iniciarSesion(formData);
      if (!resultado?.success) {
        setError(resultado?.error || "Credenciales inválidas.");
      }
    } catch (apiError) {
      setError("Ocurrió un error. Por favor intente de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }

  // 3. Función para el botón de reparación
  const handleReparar = async () => {
    setRepararMsg("Reparando...");
    const resultado = await repararHashAdmin();
    setRepararMsg(resultado.message);
  };

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-center bg-gradient-to-b from-background to-muted p-4">
      {/* 4. Botón de Reparación Temporal */}
      <Card className="mb-4 w-full max-w-md bg-destructive/20 p-4">
        <div className="flex flex-col items-center gap-2">
          <p className="text-sm font-medium text-center">
            Si el login falla, haz clic aquí UNA VEZ para reparar el hash del
            admin:
          </p>
          <Button variant="destructive" onClick={handleReparar}>
            Forzar Reparación de Hash
          </Button>
          {repararMsg && (
            <p className="text-sm font-bold text-center">{repararMsg}</p>
          )}
        </div>
      </Card>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-xl">
          <CardHeader className="text-center">
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
