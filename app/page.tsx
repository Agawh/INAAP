// /app/page.tsx
"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, type Variants } from "framer-motion";
import { Loader2, Lock, Mail, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import { iniciarSesion } from "@/app/actions/autenticacion.actions";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  email: z
    .string()
    .min(1, { message: "El correo es requerido." })
    .email({ message: "Debe ser un correo electrónico válido." }),
  password: z.string().min(1, { message: "La contraseña es requerida." }),
});

export default function LoginPage() {
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    const formData = new FormData();
    formData.append("email", values.email);
    formData.append("password", values.password);

    try {
      const resultado = await iniciarSesion(formData);

      if (resultado?.success) {
        // --- ÉXITO ---
        toast({
          title: "Acceso autorizado",
          description: "Redirigiendo al panel de control...",
          className: "border-l-4 border-green-500 bg-white dark:bg-slate-900",
          duration: 3000,
        });

        router.push("/dashboard");
        return;
      }

      // --- ERROR DE CREDENCIALES (Estilo Mejorado) ---
      if (resultado && !resultado.success) {
        toast({
          // Quitamos 'variant: destructive' para usar nuestro propio estilo limpio
          title: "Credenciales no válidas",
          description:
            "El correo o la contraseña son incorrectos. Por favor, verifica e intenta de nuevo.",
          className: "border-l-4 border-red-500 bg-white dark:bg-slate-900", // Fondo blanco, borde rojo
        });
      }
    } catch (error) {
      // --- ERROR DE CONEXIÓN ---
      toast({
        variant: "destructive",
        title: "Error de conexión",
        description: "No se pudo contactar con el servidor.",
      });
    } finally {
      if (!isLoading) setIsLoading(false);
      else {
        setIsLoading(false);
      }
    }
  }

  const fadeIn: Variants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center p-4 overflow-hidden">
      {/* --- 1. IMAGEN DE FONDO --- */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/placeholder.jpg"
          alt="Fondo Institucional"
          fill
          className="object-cover"
          priority
        />
      </div>

      {/* --- 2. OVERLAY --- */}
      <div className="absolute inset-0 z-0 bg-[#1a2a5a]/90 mix-blend-multiply" />
      <div className="absolute inset-0 z-0 bg-gradient-to-t from-[#0d1b3a] via-transparent to-transparent opacity-80" />

      {/* --- CONTENIDO --- */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="border-none shadow-2xl bg-white/95 backdrop-blur-sm dark:bg-card">
          <CardHeader className="space-y-4 pb-6 text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="mx-auto flex h-24 w-auto items-center justify-center"
            >
              <img
                src="/Inaturlogo.png"
                alt="Logo INATUR"
                className="h-full w-full object-contain"
              />
            </motion.div>

            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-[#1a2a5a] dark:text-white">
                Bienvenido
              </CardTitle>
              <CardDescription className="text-slate-500">
                Ingrese sus credenciales para acceder al sistema
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#1a2a5a] font-semibold dark:text-slate-200">
                        Correo electrónico
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                          <Input
                            placeholder="usuario@inatur.gob.ve"
                            {...field}
                            disabled={isLoading}
                            className="pl-10 h-11 border-slate-200 focus-visible:ring-[#1a2a5a] focus-visible:border-[#1a2a5a] transition-all"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#1a2a5a] font-semibold dark:text-slate-200">
                        Contraseña
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                          <Input
                            type="password"
                            placeholder="••••••••"
                            {...field}
                            disabled={isLoading}
                            className="pl-10 h-11 border-slate-200 focus-visible:ring-[#1a2a5a] focus-visible:border-[#1a2a5a] transition-all"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full h-11 text-base font-medium mt-2 bg-[#1a2a5a] hover:bg-[#0d1b3a] text-white transition-colors shadow-lg shadow-blue-900/10"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      Ingresar
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>

          <div className="h-1.5 w-full bg-[#d4af37] rounded-b-xl" />
        </Card>

        <p className="mt-6 text-center text-xs text-white/80 font-medium drop-shadow-md">
          Sistema de Gestión de Actividades - INATUR Táchira
        </p>
      </motion.div>
    </div>
  );
}
