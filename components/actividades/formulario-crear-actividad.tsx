// /components/actividades/formulario-crear-actividad.tsx
"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { AlertTriangle, Save } from "lucide-react";

// --- CAMBIO: Ya no importamos 'Usuario' ni 'Prioridad' ---
import type { Departamento, TipoActividad } from "@/types";
import {
  type EstadoFormularioActividad,
  accionCrearActividad,
} from "@/app/actions/actividades.actions";

// Componentes UI de Shadcn
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
// --- CAMBIO: Ya no importamos 'Select' ---
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { ScrollArea } from "@/components/ui/scroll-area";

// --- Opciones para los Radio Buttons ---
const tipoOptions: { value: TipoActividad; label: string }[] = [
  { value: "operativa", label: "Operativa" },
  { value: "efemeride", label: "Efeméride" },
];

// --- CAMBIO: 'prioridadOptions' eliminado ---
// const prioridadOptions: { value: Prioridad; label: string }[] = [ ... ];

// --- Componente del Botón de Envío (sin cambios) ---
function BotonGuardar() {
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
          Guardar Actividad
        </>
      )}
    </Button>
  );
}

// --- Props del Formulario ---
type FormularioCrearActividadProps = {
  departamentos: Departamento[];
  // --- CAMBIO: Ya no recibimos 'usuarios' ---
  // usuarios: Usuario[];
};

// --- Componente Principal del Formulario ---
export function FormularioCrearActividad({
  departamentos,
}: // usuarios, // <-- ELIMINADO
FormularioCrearActividadProps) {
  const router = useRouter();
  const estadoInicial: EstadoFormularioActividad = { mensaje: "", errores: {} };

  const [estado, dispatch] = useActionState(
    accionCrearActividad,
    estadoInicial
  );

  return (
    <form action={dispatch}>
      <Card>
        <CardContent className="grid grid-cols-1 gap-6 pt-6 md:grid-cols-2">
          {/* Alerta de Error General (sin cambios) */}
          {estado?.mensaje && !estado.errores && (
            <Alert variant="destructive" className="md:col-span-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{estado.mensaje}</AlertDescription>
            </Alert>
          )}

          {/* Título (sin cambios) */}
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="titulo">Título de la Actividad</Label>
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

          {/* Tipo de Actividad (sin cambios) */}
          <div className="grid gap-2">
            <Label htmlFor="tipo">Tipo de Actividad</Label>
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

          {/* Fecha de Inicio (Cambiado a col-span-1) */}
          <div className="grid gap-2">
            <Label htmlFor="fecha_inicio">Fecha de Inicio</Label>
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

          {/* --- CAMPO 'PRIORIDAD' ELIMINADO --- */}
          {/* --- CAMPO 'FECHA DE FIN' ELIMINADO --- */}
          {/* --- CAMPO 'ASIGNADO A' ELIMINADO --- */}

          {/* Descripción (Opcional) (sin cambios) */}
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

          {/* Departamentos (Requerido) (sin cambios) */}
          <div className="grid gap-2 md:col-span-2">
            <Label>Departamentos Involucrados</Label>
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
            {estado?.errores?.departamento_ids && (
              <p className="text-sm text-destructive">
                {estado.errores.departamento_ids[0]}
              </p>
            )}
          </div>
        </CardContent>

        {/* Footer con Botones (sin cambios) */}
        <CardFooter className="flex justify-end gap-2 border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <BotonGuardar />
        </CardFooter>
      </Card>
    </form>
  );
}
