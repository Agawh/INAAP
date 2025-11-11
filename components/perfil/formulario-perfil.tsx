// /components/perfil/formulario-perfil.tsx
"use client";

// --- ¡CAMBIO! Quitado 'useEffect'
import * as React from "react";
import { useActionState, useRef, useEffect } from "react";
import { useFormStatus } from "react-dom";
import type { Usuario, ConfiguracionNotificaciones } from "@/types";

// --- ¡CAMBIO! 'accionActualizarNotificaciones' ya no se importa
import {
  accionActualizarPassword,
  type EstadoFormularioPerfil,
} from "@/app/actions/configuracion.actions";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
// 'Separator' ya no es necesario
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react"; // 'CheckCircle' ya no es necesario

// --- ¡CAMBIO! 'BotonGuardarPreferencias' eliminado ---

// --- Botón de Guardar para Contraseña (sin cambios) ---
function BotonGuardarPassword() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Spinner className="mr-2 h-4 w-4" /> : null}
      Cambiar Contraseña
    </Button>
  );
}

// --- Props del Formulario (sin cambios) ---
type FormularioPerfilProps = {
  usuario: Usuario;
  configuracion: ConfiguracionNotificaciones;
};

export function FormularioPerfil({
  usuario,
  configuracion,
}: FormularioPerfilProps) {
  const { toast } = useToast();

  // --- ¡CAMBIO! Estado para Notificaciones eliminado ---

  // --- Estado para el formulario de Contraseña (sin cambios) ---
  const estadoPasswordInicial: EstadoFormularioPerfil = {
    mensaje: "",
    tipo: "exito",
  };
  const [estadoPass, dispatchPass] = useActionState(
    accionActualizarPassword,
    estadoPasswordInicial
  );

  const formPassRef = useRef<HTMLFormElement>(null);

  // --- ¡CAMBIO! useEffect para Notificaciones eliminado ---

  // Efecto para mostrar Toasts de contraseña (sin cambios)
  useEffect(() => {
    if (estadoPass.mensaje) {
      toast({
        title: estadoPass.tipo === "exito" ? "Éxito" : "Error",
        description: estadoPass.mensaje,
        variant: estadoPass.tipo === "error" ? "destructive" : "default",
      });

      if (estadoPass.resetPasswordFields) {
        formPassRef.current?.reset();
      }
    }
  }, [estadoPass, toast]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Columna Izquierda: Información Personal */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            {/* --- ¡CAMBIO! '(Solo lectura)' eliminado --- */}
            <CardDescription>Tus datos de usuario.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-1.5">
              <Label>Nombre Completo</Label>
              <Input value={usuario.nombre_completo} readOnly disabled />
            </div>
            <div className="grid gap-1.5">
              <Label>Cédula</Label>
              <Input value={usuario.cedula} readOnly disabled />
            </div>
            <div className="grid gap-1.5">
              <Label>Correo Electrónico</Label>
              <Input value={usuario.email} readOnly disabled />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Columna Derecha: Formularios de Configuración */}
      <div className="lg:col-span-2 space-y-6">
        {/* --- ¡CAMBIO! Tarjeta de Notificaciones (ya no es un <form>) --- */}
        <Card>
          <CardHeader>
            <CardTitle>Preferencias de Notificación</CardTitle>
            <CardDescription>
              Canales habilitados para recibir alertas sobre las actividades.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="email_habilitado" className="text-base">
                  Notificaciones por Email
                </Label>
              </div>
              <Switch
                id="email_habilitado"
                name="email_habilitado"
                defaultChecked={true} // <-- CAMBIO
                disabled // <-- CAMBIO
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="telegram_habilitado" className="text-base">
                  Notificaciones por Telegram
                </Label>
              </div>
              <Switch
                id="telegram_habilitado"
                name="telegram_habilitado"
                defaultChecked={true} // <-- CAMBIO
                disabled // <-- CAMBIO
              />
            </div>
            {/* --- ¡NUEVO! Switch de Google Calendar --- */}
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="calendario_habilitado" className="text-base">
                  Sincronización con Google Calendar
                </Label>
              </div>
              <Switch
                id="calendario_habilitado"
                name="calendario_habilitado"
                defaultChecked={true} // <-- CAMBIO
                disabled // <-- CAMBIO
              />
            </div>
          </CardContent>
          {/* --- ¡CAMBIO! CardFooter eliminado, ya no es un formulario --- */}
        </Card>

        {/* Formulario de Contraseña (sin cambios) */}
        <form ref={formPassRef} action={dispatchPass}>
          <Card>
            <CardHeader>
              <CardTitle>Cambiar Contraseña</CardTitle>
              <CardDescription>
                Actualiza tu contraseña de acceso.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Alerta de Error Específica */}
              {estadoPass.mensaje &&
                estadoPass.tipo === "error" &&
                !estadoPass.errores && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{estadoPass.mensaje}</AlertDescription>
                  </Alert>
                )}

              <div className="grid gap-2">
                <Label htmlFor="password_actual">Contraseña Actual</Label>
                <Input
                  id="password_actual"
                  name="password_actual"
                  type="password"
                  aria-invalid={!!estadoPass?.errores?.password_actual}
                />
                {estadoPass?.errores?.password_actual && (
                  <p className="text-sm text-destructive">
                    {estadoPass.errores.password_actual[0]}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password_nueva">Nueva Contraseña</Label>
                <Input
                  id="password_nueva"
                  name="password_nueva"
                  type="password"
                  aria-invalid={!!estadoPass?.errores?.password_nueva}
                />
                {estadoPass?.errores?.password_nueva && (
                  <p className="text-sm text-destructive">
                    {estadoPass.errores.password_nueva[0]}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4 flex justify-end">
              <BotonGuardarPassword />
            </CardFooter>
          </Card>
        </form>
      </div>
    </div>
  );
}
