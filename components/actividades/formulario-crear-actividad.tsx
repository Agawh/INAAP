// /components/actividades/formulario-crear-actividad.tsx
"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { AlertTriangle, Save, Lock } from "lucide-react";

import type { Departamento, TipoActividad, Rol } from "@/types";
import {
  type EstadoFormularioActividad,
  accionCrearActividad,
} from "@/app/actions/actividades.actions";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { ScrollArea } from "@/components/ui/scroll-area";

const tipoOptions: { value: TipoActividad; label: string }[] = [
  { value: "operativa", label: "Operativa" },
  { value: "efemeride", label: "Efeméride" },
];

// --- ¡CORRECCIÓN 3! ---
// El botón ahora recibe 'disabled' como prop
// y lo pasa al <Button> interno.
function BotonGuardar({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending || disabled}>
      {pending ? (
        <>
          <Spinner className="mr-2 h-4 w-4" />
          Guardando...
        </>
      ) : (
        <>
          <Save className="mr-2 h-4 w-4" />
          Guardar Actividad
        </>
      )}
    </Button>
  );
}

type FormularioCrearActividadProps = {
  departamentos: Departamento[];
  rolUsuario: Rol;
};

export function FormularioCrearActividad({
  departamentos,
  rolUsuario,
}: FormularioCrearActividadProps) {
  const router = useRouter();
  const estadoInicial: EstadoFormularioActividad = { mensaje: "", errores: {} };

  const [estado, dispatch] = useActionState(
    accionCrearActividad,
    estadoInicial
  );

  const esSuperusuario = rolUsuario === "superusuario";
  const esJefeDeDepartamento =
    rolUsuario === "jefe_departamento" && departamentos.length === 1;

  return (
    <form action={dispatch}>
      <Card>
        <CardContent className="grid grid-cols-1 gap-6 pt-6 md:grid-cols-2">
          {/* (Alerta, Título, Tipo, Fechas, Descripción... sin cambios) */}
          {estado?.mensaje && !estado.errores && (
            <Alert variant="destructive" className="md:col-span-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{estado.mensaje}</AlertDescription>
            </Alert>
          )}
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="titulo">Título de la actividad</Label>
            <Input
              id="titulo"
              name="titulo"
              aria-invalid={!!estado?.errores?.titulo}
            />
            {estado?.errores?.titulo && (
              <p className="text-sm text-destructive">
                {estado.errores.titulo[0]}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tipo">Tipo de actividad</Label>
            <RadioGroup
              name="tipo"
              className="flex gap-4"
              aria-invalid={!!estado?.errores?.tipo}
            >
              {tipoOptions.map((opcion) => (
                <div key={opcion.value} className="flex items-center space-x-2">
                  <RadioGroupItem
                    value={opcion.value}
                    id={`tipo-${opcion.value}`}
                  />
                  <Label htmlFor={`tipo-${opcion.value}`}>{opcion.label}</Label>
                </div>
              ))}
            </RadioGroup>
            {estado?.errores?.tipo && (
              <p className="text-sm text-destructive">
                {estado.errores.tipo[0]}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="fecha_inicio">Fecha de inicio</Label>
            <Input
              id="fecha_inicio"
              name="fecha_inicio"
              type="date"
              aria-invalid={!!estado?.errores?.fecha_inicio}
            />
            {estado?.errores?.fecha_inicio && (
              <p className="text-sm text-destructive">
                {estado.errores.fecha_inicio[0]}
              </p>
            )}
          </div>
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="descripcion">Descripción (Opcional)</Label>
            <Textarea
              id="descripcion"
              name="descripcion"
              placeholder="Añade detalles sobre la actividad..."
              aria-invalid={!!estado?.errores?.descripcion}
              className="min-h-[100px]"
            />
            {estado?.errores?.descripcion && (
              <p className="text-sm text-destructive">
                {estado.errores.descripcion[0]}
              </p>
            )}
          </div>

          <div className="grid gap-2 md:col-span-2">
            <Label>Departamentos involucrados</Label>

            {esSuperusuario && (
              <ScrollArea className="h-[150px] w-full rounded-md border p-4">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {departamentos.map((depto) => (
                    <div key={depto.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`depto-${depto.id}`}
                        name="departamento_ids"
                        value={depto.id}
                      />
                      <Label
                        htmlFor={`depto-${depto.id}`}
                        className="font-normal"
                      >
                        {depto.nombre}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}

            {esJefeDeDepartamento && (
              <div className="flex items-center gap-2 rounded-md border p-4 text-muted-foreground">
                <Lock className="h-4 w-4" />
                <span>
                  La actividad se asignará automáticamente a tu departamento:
                  <strong className="ml-1 font-semibold text-foreground">
                    {departamentos[0].nombre}
                  </strong>
                </span>
                <input
                  type="hidden"
                  name="departamento_ids"
                  value={departamentos[0].id}
                />
              </div>
            )}

            {!esSuperusuario && !esJefeDeDepartamento && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error de permisos</AlertTitle>
                <AlertDescription>
                  No tienes un departamento asignado. No puedes crear
                  actividades.
                </AlertDescription>
              </Alert>
            )}

            {estado?.errores?.departamento_ids && (
              <p className="text-sm text-destructive">
                {estado.errores.departamento_ids[0]}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2 border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          {/* --- ¡CORRECCIÓN 3! --- */}
          {/* Volvemos a pasar la prop 'disabled' correctamente */}
          <BotonGuardar disabled={!esSuperusuario && !esJefeDeDepartamento} />
        </CardFooter>
      </Card>
    </form>
  );
}
