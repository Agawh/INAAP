// /components/perfil/formulario-perfil.tsx
"use client";

import * as React from "react";
import { useActionState, useRef, useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import type { Usuario, ConfiguracionNotificaciones } from "@/types";

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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, Calendar, Copy } from "lucide-react"; // <-- Iconos nuevos

function BotonGuardarPassword() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Spinner className="mr-2 h-4 w-4" /> : null}
      Cambiar Contraseña
    </Button>
  );
}

type FormularioPerfilProps = {
  usuario: Usuario;
  configuracion: ConfiguracionNotificaciones;
};

export function FormularioPerfil({
  usuario,
  configuracion,
}: FormularioPerfilProps) {
  const { toast } = useToast();

  const estadoPasswordInicial: EstadoFormularioPerfil = {
    mensaje: "",
    tipo: "exito",
  };
  const [estadoPass, dispatchPass] = useActionState(
    accionActualizarPassword,
    estadoPasswordInicial
  );

  const formPassRef = useRef<HTMLFormElement>(null);

  // --- Lógica del Enlace de Calendario ---
  const [calendarUrl, setCalendarUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      // Generamos la URL usando el dominio actual del navegador
      setCalendarUrl(`${window.location.origin}/api/calendario/${usuario.id}`);
    }
  }, [usuario.id]);

  const copiarAlPortapapeles = () => {
    navigator.clipboard.writeText(calendarUrl);
    toast({
      title: "Enlace copiado",
      description: "Pégalo en Google Calendar > Agregar desde URL",
    });
  };
  // -------------------------------------

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
      {/* Columna Izquierda */}
      <div className="lg:col-span-1 space-y-6">
        {/* Tarjeta Info Personal */}
        <Card>
          <CardHeader>
            <CardTitle>Información personal</CardTitle>
            <CardDescription>Tus datos de usuario.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-1.5">
              <Label>Nombre completo</Label>
              <Input value={usuario.nombre_completo} readOnly disabled />
            </div>
            <div className="grid gap-1.5">
              <Label>Cédula</Label>
              <Input value={usuario.cedula} readOnly disabled />
            </div>
            <div className="grid gap-1.5">
              <Label>Correo electrónico</Label>
              <Input value={usuario.email} readOnly disabled />
            </div>
          </CardContent>
        </Card>

        {/* --- ¡NUEVA TARJETA DE CALENDARIO! --- */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-blue-800 dark:text-blue-300">
              <Calendar className="h-4 w-4" /> Sincronizar calendario
            </CardTitle>
            <CardDescription className="text-xs">
              Copia este enlace y agrégalo a tu Google Calendar u Outlook para
              ver las actividades automáticamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                readOnly
                value={calendarUrl}
                className="bg-white dark:bg-black text-xs font-mono h-8"
              />
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8 shrink-0"
                onClick={copiarAlPortapapeles}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2">
              * Las actualizaciones pueden tardar unas horas en aparecer en
              Google.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Columna Derecha */}
      <div className="lg:col-span-2 space-y-6">
        {/* Tarjeta Notificaciones (Solo lectura) */}
        <Card>
          <CardHeader>
            <CardTitle>Preferencias de notificación</CardTitle>
            <CardDescription>
              Canales habilitados para recibir alertas sobre las actividades.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Notificaciones por Email</Label>
              </div>
              <Switch checked={true} disabled />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Notificaciones por Telegram</Label>
              </div>
              <Switch checked={true} disabled />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">
                  Sincronización con Google Calendar
                </Label>
                <p className="text-sm text-muted-foreground">
                  Usa el enlace de la izquierda para conectar.
                </p>
              </div>
              <Switch checked={true} disabled />
            </div>
          </CardContent>
        </Card>

        {/* Formulario de Contraseña */}
        <form ref={formPassRef} action={dispatchPass}>
          <Card>
            <CardHeader>
              <CardTitle>Cambiar contraseña</CardTitle>
              <CardDescription>
                Actualiza tu contraseña de acceso.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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
                <Label htmlFor="password_actual">Contraseña actual</Label>
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
                <Label htmlFor="password_nueva">Nueva contraseña</Label>
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
