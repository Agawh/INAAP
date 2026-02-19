// /components/formulario-editar-usuario.tsx
"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { AlertTriangle, Save } from "lucide-react";

import type { Departamento, Rol, Usuario } from "@/types";
import {
  type EstadoFormulario,
  accionEditarUsuario,
} from "@/app/actions/usuarios.actions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";

const roles: { value: Rol; label: string }[] = [
  { value: "jefe_departamento", label: "Jefe de Departamento" },
  { value: "miembro_departamento", label: "Miembro de Departamento" },
  { value: "superusuario", label: "Superusuario" },
];

function BotonEditar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Spinner className="mr-2 h-4 w-4" />
          Actualizando...
        </>
      ) : (
        <>
          <Save className="mr-2 h-4 w-4" />
          Actualizar usuario
        </>
      )}
    </Button>
  );
}

type FormularioEditarUsuarioProps = {
  departamentos: Departamento[];
  usuario: Usuario;
};

export function FormularioEditarUsuario({
  departamentos,
  usuario,
}: FormularioEditarUsuarioProps) {
  const router = useRouter();
  const estadoInicial: EstadoFormulario = { mensaje: "", errores: {} };
  const accionEditarConId = accionEditarUsuario.bind(null, usuario.id);
  const [estado, dispatch] = useActionState(accionEditarConId, estadoInicial);

  return (
    <form action={dispatch}>
      <Card>
        <CardContent className="grid grid-cols-1 gap-6 pt-6 md:grid-cols-2">
          {estado?.mensaje &&
            estado.errores &&
            Object.keys(estado.errores).length === 0 && (
              <Alert variant="destructive" className="md:col-span-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{estado.mensaje}</AlertDescription>
              </Alert>
            )}

          {/* Nombre Completo */}
          <div className="grid gap-2">
            <Label htmlFor="nombre_completo">Nombre Completo</Label>
            <Input
              id="nombre_completo"
              name="nombre_completo"
              defaultValue={usuario.nombre_completo}
              aria-invalid={!!estado?.errores?.nombre_completo}
              pattern="[a-zA-Z\sñÑáéíóúÁÉÍÓÚ]*"
              title="Solo letras y espacios"
            />
            {estado?.errores?.nombre_completo && (
              <p className="text-sm text-destructive">
                {estado.errores.nombre_completo[0]}
              </p>
            )}
          </div>

          {/* Cédula */}
          <div className="grid gap-2">
            <Label htmlFor="cedula">Cédula</Label>
            <Input
              id="cedula"
              name="cedula"
              defaultValue={usuario.cedula}
              aria-invalid={!!estado?.errores?.cedula}
              type="text"
              pattern="[0-9]*"
              inputMode="numeric"
              title="Solo números"
            />
            {estado?.errores?.cedula && (
              <p className="text-sm text-destructive">
                {estado.errores.cedula[0]}
              </p>
            )}
          </div>

          {/* Email */}
          <div className="grid gap-2">
            <Label htmlFor="email">Correo Electrónico</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={usuario.email}
              aria-invalid={!!estado?.errores?.email}
            />
            {estado?.errores?.email && (
              <p className="text-sm text-destructive">
                {estado.errores.email[0]}
              </p>
            )}
          </div>

          {/* Contraseña */}
          <div className="grid gap-2">
            <Label htmlFor="password">Nueva Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="Dejar en blanco para no cambiar"
              aria-invalid={!!estado?.errores?.password}
            />
            {estado?.errores?.password && (
              <p className="text-sm text-destructive">
                {estado.errores.password[0]}
              </p>
            )}
          </div>

          {/* Teléfono */}
          <div className="grid gap-2">
            <Label htmlFor="telefono">Teléfono</Label>
            <Input
              id="telefono"
              name="telefono"
              type="tel"
              defaultValue={usuario.telefono || ""}
              aria-invalid={!!estado?.errores?.telefono}
              pattern="[0-9]*"
              inputMode="numeric"
              title="Solo números"
            />
            {estado?.errores?.telefono && (
              <p className="text-sm text-destructive">
                {estado.errores.telefono[0]}
              </p>
            )}
          </div>

          {/* --- ¡NUEVO CAMPO! Telegram ID --- */}
          <div className="grid gap-2">
            <Label htmlFor="telegram_chat_id">ID de Telegram</Label>
            <Input
              id="telegram_chat_id"
              name="telegram_chat_id"
              type="text"
              defaultValue={usuario.telegram_chat_id || ""}
              placeholder="Ej. 123456789"
              pattern="[0-9]*"
              title="El ID de Telegram es numérico"
            />
            <p className="text-xs text-muted-foreground">
              Obtenlo enviando un mensaje al bot y revisando la API.
            </p>
          </div>

          {/* Rol */}
          <div className="grid gap-2">
            <Label htmlFor="rol">Rol</Label>
            <Select name="rol" defaultValue={usuario.rol}>
              <SelectTrigger id="rol" aria-invalid={!!estado?.errores?.rol}>
                <SelectValue placeholder="Seleccione un rol" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((rol) => (
                  <SelectItem key={rol.value} value={rol.value}>
                    {rol.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {estado?.errores?.rol && (
              <p className="text-sm text-destructive">
                {estado.errores.rol[0]}
              </p>
            )}
          </div>

          {/* Departamento */}
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="departamento_id">Departamento</Label>
            <Select
              name="departamento_id"
              defaultValue={usuario.departamento_id}
            >
              <SelectTrigger
                id="departamento_id"
                aria-invalid={!!estado?.errores?.departamento_id}
              >
                <SelectValue placeholder="Seleccione un departamento" />
              </SelectTrigger>
              <SelectContent>
                {departamentos.map((depto) => (
                  <SelectItem key={depto.id} value={depto.id}>
                    {depto.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {estado?.errores?.departamento_id && (
              <p className="text-sm text-destructive">
                {estado.errores.departamento_id[0]}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2 border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <BotonEditar />
        </CardFooter>
      </Card>
    </form>
  );
}
