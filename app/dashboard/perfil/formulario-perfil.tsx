// /components/perfil/formulario-perfil.tsx
"use client";

import * as React from "react";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import type { Usuario, ConfiguracionNotificaciones } from "@/types";

import {
  accionActualizarNotificaciones,
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
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, CheckCircle } from "lucide-react";

// --- Botón de Guardar para Notificaciones ---
function BotonGuardarPreferencias() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Spinner className="mr-2 h-4 w-4" /> : null}
      Guardar Preferencias
    </Button>
  );
}

// --- Botón de Guardar para Contraseña ---
function BotonGuardarPassword() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Spinner className="mr-2 h-4 w-4" /> : null}
      Cambiar Contraseña
    </Button>
  );
}

// --- Props del Formulario ---
type FormularioPerfilProps = {
  usuario: Usuario;
  configuracion: ConfiguracionNotificaciones;
};

export function FormularioPerfil({
  usuario,
  configuracion,
}: FormularioPerfilProps) {
  const { toast } = useToast();

  // --- Estado para el formulario de Notificaciones ---
  const estadoNotificacionesInicial: EstadoFormularioPerfil = {
    mensaje: "",
    tipo: "exito",
  };
  const [estadoNotif, dispatchNotif] = useActionState(
    accionActualizarNotificaciones,
    estadoNotificacionesInicial
  );

  // --- Estado para el formulario de Contraseña ---
  const estadoPasswordInicial: EstadoFormularioPerfil = {
    mensaje: "",
    tipo: "exito",
  };
  const [estadoPass, dispatchPass] = useActionState(
    accionActualizarPassword,
    estadoPasswordInicial
  );

  // Referencia al formulario de contraseña para poder limpiarlo
  const formPassRef = useRef<HTMLFormElement>(null);

  // Efecto para mostrar Toasts de notificación
  useEffect(() => {
    if (estadoNotif.mensaje) {
      toast({
        title: estadoNotif.tipo === "exito" ? "Éxito" : "Error",
        description: estadoNotif.mensaje,
        variant: estadoNotif.tipo === "error" ? "destructive" : "default",
      });
    }
  }, [estadoNotif, toast]);

  // Efecto para mostrar Toasts de contraseña y limpiar el form
  useEffect(() => {
    if (estadoPass.mensaje) {
      toast({
        title: estadoPass.tipo === "exito" ? "Éxito" : "Error",
        description: estadoPass.mensaje,
        variant: estadoPass.tipo === "error" ? "destructive" : "default",
      });

      // Si fue exitoso, limpiamos los inputs
      if (estadoPass.resetPasswordFields) {
        formPassRef.current?.reset();
      }
    }
  }, [estadoPass, toast]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Columna Izquierda: Información Personal (Solo lectura) */}
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>
              Tus datos de usuario. (Solo lectura)
            </CardDescription>
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
        {/* Formulario de Notificaciones */}
        <form action={dispatchNotif}>
          <Card>
            <CardHeader>
              <CardTitle>Preferencias de Notificación</CardTitle>
              <CardDescription>
                Elige cómo quieres recibir alertas sobre las actividades.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* (Aquí podríamos mostrar un Alert si el estadoNotif tiene error) */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="email_habilitado" className="text-base">
                    Notificaciones por Email
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Recibir alertas en tu correo electrónico.
                  </p>
                </div>
                <Switch
                  id="email_habilitado"
                  name="email_habilitado"
                  defaultChecked={configuracion.email_habilitado}
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="telegram_habilitado" className="text-base">
                    Notificaciones por Telegram
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Recibir alertas en tu chat de Telegram. (Próximamente)
                  </p>
                </div>
                <Switch
                  id="telegram_habilitado"
                  name="telegram_habilitado"
                  defaultChecked={configuracion.telegram_habilitado}
                  disabled // Deshabilitado hasta que implementemos el bot
                />
              </div>
            </CardContent>
            <CardFooter className="border-t px-6 py-4 flex justify-end">
              <BotonGuardarPreferencias />
            </CardFooter>
          </Card>
        </form>

        {/* Formulario de Contraseña */}
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
