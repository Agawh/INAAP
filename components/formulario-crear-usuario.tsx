"use client";

// --- ¡CAMBIO 1: Importaciones corregidas para React 19! ---
import * as React from "react";
import { useActionState } from "react"; // useActionState viene de 'react'
import { useFormStatus } from "react-dom"; // useFormStatus viene de 'react-dom'
import { useRouter } from "next/navigation";
import { AlertTriangle, Save } from "lucide-react";

import type { Departamento, Rol } from "@/types"; //
import {
  type EstadoFormulario,
  accionCrearUsuario,
} from "@/app/actions/usuarios.actions";
import { cn } from "@/lib/utils"; //
import { Button } from "@/components/ui/button"; //
import { Card, CardContent, CardFooter } from "@/components/ui/card"; //
import { Input } from "@/components/ui/input"; //
import { Label } from "@/components/ui/label"; //
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; //
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; //
import { Spinner } from "@/components/ui/spinner"; //

// Opciones de Roles (basado en types/index.ts)
const roles: { value: Rol; label: string }[] = [
  { value: "jefe_departamento", label: "Jefe de Departamento" },
  { value: "miembro_departamento", label: "Miembro de Departamento" },
  { value: "superusuario", label: "Superusuario" },
];

// Componente para el botón de envío
function BotonCrear() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? (
        <>
          <Spinner className="mr-2 h-4 w-4" />
          Guardando...
        </>
      ) : (
        <>
          <Save className="mr-2 h-4 w-4" />
          Guardar Usuario
        </>
      )}
    </Button>
  );
}

// Props que el formulario recibirá
type FormularioCrearUsuarioProps = {
  departamentos: Departamento[];
};

export function FormularioCrearUsuario({
  departamentos,
}: FormularioCrearUsuarioProps) {
  const router = useRouter();
  const estadoInicial: EstadoFormulario = { mensaje: "", errores: {} };

  // Hook corregido
  const [estado, dispatch] = useActionState(accionCrearUsuario, estadoInicial);

  return (
    <form action={dispatch}>
      <Card>
        <CardContent className="grid grid-cols-1 gap-6 pt-6 md:grid-cols-2">
          {/* Alerta de Error General */}
          {estado.mensaje &&
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
              aria-invalid={!!estado.errores?.nombre_completo}
            />
            {estado.errores?.nombre_completo && (
              <p className="text-sm text-destructive">
                {estado.errores.nombre_completo[0]}
              </p>
            )}
          </div>

          {/* Cédula */}
          <div className="grid gap-2">
            <Label htmlFor="cedula">Cédula (V / E / P)</Label>
            <Input
              id="cedula"
              name="cedula"
              placeholder="Ej: V-12345678"
              aria-invalid={!!estado.errores?.cedula}
            />
            {estado.errores?.cedula && (
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
              placeholder="usuario@inatur.gob.ve"
              aria-invalid={!!estado.errores?.email}
            />
            {estado.errores?.email && (
              <p className="text-sm text-destructive">
                {estado.errores.email[0]}
              </p>
            )}
          </div>

          {/* Contraseña */}
          <div className="grid gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              aria-invalid={!!estado.errores?.password}
            />
            {estado.errores?.password && (
              <p className="text-sm text-destructive">
                {estado.errores.password[0]}
              </p>
            )}
          </div>

          {/* Rol */}
          <div className="grid gap-2">
            <Label htmlFor="rol">Rol</Label>
            <Select name="rol" defaultValue="">
              <SelectTrigger id="rol" aria-invalid={!!estado.errores?.rol}>
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
            {estado.errores?.rol && (
              <p className="text-sm text-destructive">
                {estado.errores.rol[0]}
              </p>
            )}
          </div>

          {/* Departamento */}
          <div className="grid gap-2">
            <Label htmlFor="departamento_id">Departamento</Label>
            <Select name="departamento_id" defaultValue="">
              <SelectTrigger
                id="departamento_id"
                aria-invalid={!!estado.errores?.departamento_id}
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
            {estado.errores?.departamento_id && (
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
          <BotonCrear />
        </CardFooter>
      </Card>
    </form>
  );
}
