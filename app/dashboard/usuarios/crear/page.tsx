import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DepartamentosService } from "@/services/departamentos.service"; //
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; //
import { AlertTriangle } from "lucide-react";
import { FormularioCrearUsuario } from "@/components/formulario-crear-usuario";

export default async function CrearUsuarioPage() {
  const session = await auth();

  // 1. Verificación de Seguridad
  if (!session?.user || session.user.rol !== "superusuario") {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Acceso denegado</AlertTitle>
        <AlertDescription>
          No tienes permisos para acceder a esta sección.
        </AlertDescription>
      </Alert>
    );
  }

  // 2. Obtener datos para los <Select> del formulario
  const departamentos = await DepartamentosService.obtenerTodos();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Crear Nuevo Usuario
        </h1>
        <p className="text-lg text-muted-foreground">
          Complete los campos para registrar un nuevo usuario en el sistema.
        </p>
      </div>

      {/* 3. Renderizar el formulario (componente cliente) */}
      <FormularioCrearUsuario departamentos={departamentos} />
    </div>
  );
}
