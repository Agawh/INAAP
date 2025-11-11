// /components/actividades/formulario-editar-actividad.tsx
"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { AlertTriangle, Save } from "lucide-react";

import type { Departamento, TipoActividad, Actividad } from "@/types";
// --- ¡CAMBIO! Importamos la nueva acción ---
import {
  type EstadoFormularioActividad,
  accionEditarActividad,
} from "@/app/actions/actividades.actions";

// Componentes UI (sin cambios)
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

// --- ¡CAMBIO! Botón "Actualizar" ---
function BotonActualizar() {
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
          Actualizar Actividad
        </>
      )}
    </Button>
  );
}

// --- ¡CAMBIO! Props del Formulario ---
type FormularioEditarActividadProps = {
  actividad: Actividad; // <-- Recibe la actividad a editar
  departamentos: Departamento[];
};

export function FormularioEditarActividad({
  actividad,
  departamentos,
}: FormularioEditarActividadProps) {
  const router = useRouter();
  const estadoInicial: EstadoFormularioActividad = { mensaje: "", errores: {} };

  // --- ¡CAMBIO! Usamos la acción de editar, vinculada al ID ---
  const accionEditarConId = accionEditarActividad.bind(null, actividad.id);
  const [estado, dispatch] = useActionState(accionEditarConId, estadoInicial);

  // --- ¡CAMBIO! Formatear fecha para el input ---
  const fechaInicioFormato = new Date(actividad.fecha_inicio)
    .toISOString()
    .split("T")[0];

  return (
    <form action={dispatch}>
      <Card>
        <CardContent className="grid grid-cols-1 gap-6 pt-6 md:grid-cols-2">
          {/* Alerta de Error General */}
          {estado?.mensaje && !estado.errores && (
            <Alert variant="destructive" className="md:col-span-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{estado.mensaje}</AlertDescription>
            </Alert>
          )}

          {/* Título */}
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="titulo">Título de la Actividad</Label>
            <Input
              id="titulo"
              name="titulo"
              aria-invalid={!!estado?.errores?.titulo}
              defaultValue={actividad.titulo} // <-- VALOR POR DEFECTO
            />
            {estado?.errores?.titulo && (
              <p className="text-sm text-destructive">
                {estado.errores.titulo[0]}
              </p>
            )}
          </div>

          {/* Tipo de Actividad */}
          <div className="grid gap-2">
            <Label htmlFor="tipo">Tipo de Actividad</Label>
            <RadioGroup
              name="tipo"
              className="flex gap-4"
              aria-invalid={!!estado?.errores?.tipo}
              defaultValue={actividad.tipo} // <-- VALOR POR DEFECTO
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

          {/* Fecha de Inicio */}
          <div className="grid gap-2">
            <Label htmlFor="fecha_inicio">Fecha de Inicio</Label>
            <Input
              id="fecha_inicio"
              name="fecha_inicio"
              type="date"
              aria-invalid={!!estado?.errores?.fecha_inicio}
              defaultValue={fechaInicioFormato} // <-- VALOR POR DEFECTO
            />
            {estado?.errores?.fecha_inicio && (
              <p className="text-sm text-destructive">
                {estado.errores.fecha_inicio[0]}
              </p>
            )}
          </div>

          {/* Descripción (Opcional) */}
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="descripcion">Descripción (Opcional)</Label>
            <Textarea
              id="descripcion"
              name="descripcion"
              placeholder="Añade detalles sobre la actividad..."
              aria-invalid={!!estado?.errores?.descripcion}
              className="min-h-[100px]"
              defaultValue={actividad.descripcion || ""} // <-- VALOR POR DEFECTO
            />
            {estado?.errores?.descripcion && (
              <p className="text-sm text-destructive">
                {estado.errores.descripcion[0]}
              </p>
            )}
          </div>

          {/* Departamentos (Requerido) */}
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
                      // --- ¡CAMBIO! Marcar los que ya están ---
                      defaultChecked={(actividad.departamentos || []).includes(
                        depto.id
                      )}
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

        {/* Footer con Botones */}
        <CardFooter className="flex justify-end gap-2 border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <BotonActualizar /> {/* <-- ¡CAMBIO! */}
        </CardFooter>
      </Card>
    </form>
  );
}
