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
} from "@/components/ui/alert-dialog"; //
import { Button } from "@/components/ui/button"; //
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"; //
import { useToast } from "@/hooks/use-toast"; //
import { accionEliminarUsuario } from "@/app/actions/usuarios.actions";
import { Spinner } from "@/components/ui/spinner"; //

type BotonEliminarUsuarioProps = {
  usuarioId: string;
  nombreUsuario: string;
  // ID del usuario que está logueado, para evitar que se borre a sí mismo
  idUsuarioLogueado: string;
};

export function BotonEliminarUsuario({
  usuarioId,
  nombreUsuario,
  idUsuarioLogueado,
}: BotonEliminarUsuarioProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = React.useTransition();
  const [isOpen, setIsOpen] = React.useState(false);

  // Evitar que el superusuario se borre a sí mismo
  const esUsuarioActual = usuarioId === idUsuarioLogueado;

  const handleEliminar = () => {
    startTransition(async () => {
      const resultado = await accionEliminarUsuario(usuarioId);

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
          onSelect={(e) => e.preventDefault()} // Evita que el dropdown se cierre al hacer clic
          disabled={esUsuarioActual} // Deshabilitar si es el usuario actual
        >
          Eliminar
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente al
            usuario <span className="font-medium">{nombreUsuario}</span> de la
            base de datos.
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
            Sí, eliminar usuario
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
