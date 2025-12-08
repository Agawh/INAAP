// /app/dashboard/actividades/[id]/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DepartamentosService } from "@/services/departamentos.service";
import { ActividadesService } from "@/services/actividades.service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { FormularioEditarActividad } from "@/components/actividades/formulario-editar-actividad";
import type { Rol } from "@/types"; // Importamos el tipo Rol

type EditarActividadPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function EditarActividadPage({
  params,
}: EditarActividadPageProps) {
  const session = await auth();
  const { id } = await params;

  // 1. Verificación de Seguridad
  if (!session?.user) {
    redirect("/");
  }

  // 2. Obtener datos
  const [actividad, departamentos] = await Promise.all([
    ActividadesService.obtenerPorId(id),
    DepartamentosService.obtenerTodos(),
  ]);

  // 3. Validar existencia
  if (!actividad) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Actividad no Encontrada</AlertTitle>
        <AlertDescription>
          No se pudo encontrar la actividad que intentas editar (ID: {id}).
        </AlertDescription>
      </Alert>
    );
  }

  // --- NUEVA LÓGICA DE SOLO LECTURA ---
  // Un miembro del departamento solo puede VER, no editar.
  const rolUsuario = session.user.rol as Rol;
  const esSoloLectura = rolUsuario === "miembro_departamento";

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {esSoloLectura ? "Detalles de la Actividad" : "Editar Actividad"}
        </h1>
        <p className="text-lg text-muted-foreground">
          {esSoloLectura
            ? "Visualización de los detalles de la actividad."
            : `Modificar los datos de: ${actividad.titulo}.`}
        </p>
      </div>

      {/* 4. Pasar la propiedad 'soloLectura' al formulario */}
      <FormularioEditarActividad
        actividad={actividad}
        departamentos={departamentos}
        soloLectura={esSoloLectura}
      />
    </div>
  );
}
