// /components/actividades/formulario-editar-actividad.tsx
"use client";

import * as React from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { AlertTriangle, Save, Eye } from "lucide-react"; // Añadí icono Eye

import type { Departamento, TipoActividad, Actividad } from "@/types";
import {
  type EstadoFormularioActividad,
  accionEditarActividad,
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

// --- Actualización de Props ---
type FormularioEditarActividadProps = {
  actividad: Actividad;
  departamentos: Departamento[];
  soloLectura?: boolean; // Nueva prop opcional
};

export function FormularioEditarActividad({
  actividad,
  departamentos,
  soloLectura = false, // Valor por defecto false
}: FormularioEditarActividadProps) {
  const router = useRouter();
  const estadoInicial: EstadoFormularioActividad = { mensaje: "", errores: {} };

  const accionEditarConId = accionEditarActividad.bind(null, actividad.id);
  const [estado, dispatch] = useActionState(accionEditarConId, estadoInicial);

  const fechaInicioFormato = new Date(actividad.fecha_inicio)
    .toISOString()
    .split("T")[0];

  return (
    <form action={soloLectura ? undefined : dispatch}>
      {" "}
      {/* Si es solo lectura, no hay action */}
      <Card>
        <CardContent className="grid grid-cols-1 gap-6 pt-6 md:grid-cols-2">
          {/* Mensaje Informativo de Solo Lectura */}
          {soloLectura && (
            <div className="md:col-span-2 flex items-center gap-2 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground border border-blue-200 dark:border-blue-900">
              <Eye className="h-4 w-4" />
              <span>
                Modo de solo lectura. No tienes permisos para editar esta
                actividad.
              </span>
            </div>
          )}

          {/* Alerta de Error (Solo si no es solo lectura y hay error) */}
          {!soloLectura && estado?.mensaje && !estado.errores && (
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
              defaultValue={actividad.titulo}
              disabled={soloLectura} // Deshabilitado
              className={soloLectura ? "bg-muted/50 text-foreground" : ""}
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
              defaultValue={actividad.tipo}
              disabled={soloLectura} // Deshabilitado
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
          </div>

          {/* Fecha de Inicio */}
          <div className="grid gap-2">
            <Label htmlFor="fecha_inicio">Fecha de Inicio</Label>
            <Input
              id="fecha_inicio"
              name="fecha_inicio"
              type="date"
              aria-invalid={!!estado?.errores?.fecha_inicio}
              defaultValue={fechaInicioFormato}
              disabled={soloLectura} // Deshabilitado
              className={soloLectura ? "bg-muted/50 text-foreground" : ""}
            />
          </div>

          {/* Descripción */}
          <div className="grid gap-2 md:col-span-2">
            <Label htmlFor="descripcion">Descripción (Opcional)</Label>
            <Textarea
              id="descripcion"
              name="descripcion"
              placeholder="Añade detalles sobre la actividad..."
              className={
                soloLectura
                  ? "min-h-[100px] bg-muted/50 text-foreground"
                  : "min-h-[100px]"
              }
              defaultValue={actividad.descripcion || ""}
              disabled={soloLectura} // Deshabilitado
            />
          </div>

          {/* Departamentos */}
          <div className="grid gap-2 md:col-span-2">
            <Label>Departamentos Involucrados</Label>
            <ScrollArea
              className={
                soloLectura
                  ? "h-[150px] w-full rounded-md border p-4 bg-muted/30"
                  : "h-[150px] w-full rounded-md border p-4"
              }
            >
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {departamentos.map((depto) => (
                  <div key={depto.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`depto-${depto.id}`}
                      name="departamento_ids"
                      value={depto.id}
                      defaultChecked={(actividad.departamentos || []).includes(
                        depto.id
                      )}
                      disabled={soloLectura} // Deshabilitado
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
          </div>
        </CardContent>

        {/* Footer */}
        <CardFooter className="flex justify-end gap-2 border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            {soloLectura ? "Volver" : "Cancelar"}
          </Button>

          {/* Si NO es solo lectura, mostramos el botón de actualizar */}
          {!soloLectura && <BotonActualizar />}
        </CardFooter>
      </Card>
    </form>
  );
}
