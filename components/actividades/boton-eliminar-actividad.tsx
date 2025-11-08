// /components/actividades/boton-eliminar-actividad.tsx
"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
// Importamos la nueva acción que acabamos de crear
import { accionEliminarActividad } from "@/app/actions/actividades.actions";

type BotonEliminarActividadProps = {
  actividadId: string;
  tituloActividad: string;
};

export function BotonEliminarActividad({
  actividadId,
  tituloActividad,
}: BotonEliminarActividadProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [isOpen, setIsOpen] = React.useState(false);

  const handleEliminar = () => {
    startTransition(async () => {
      const resultado = await accionEliminarActividad(actividadId);

      if (resultado.success) {
        toast({
          title: "Éxito",
          description: resultado.message,
        });
        setIsOpen(false); // Cierra el diálogo
      } else {
        toast({
          title: "Error",
          description: resultado.message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem
          className="text-destructive"
          onSelect={(e) => e.preventDefault()} // Evita que el dropdown se cierre
        >
          Eliminar
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente la
            actividad: <span className="font-medium">{tituloActividad}</span>.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={handleEliminar}
            disabled={isPending}
          >
            {isPending && <Spinner className="mr-2 h-4 w-4" />}
            Sí, eliminar actividad
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
