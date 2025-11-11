// /app/dashboard/actividades/[id]/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DepartamentosService } from "@/services/departamentos.service";
import { ActividadesService } from "@/services/actividades.service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { FormularioEditarActividad } from "@/components/actividades/formulario-editar-actividad";

// --- ¡CORRECCIÓN 1! ---
// Tipamos 'params' como una Promise que resuelve al objeto
type EditarActividadPageProps = {
  params: Promise<{
    id: string; // El ID de la actividad desde la URL
  }>;
};

export default async function EditarActividadPage({
  params, // 'params' es una Promise
}: EditarActividadPageProps) {
  const session = await auth();

  // --- ¡CORRECCIÓN 2! ---
  // Hacemos 'await' de los params para obtener el 'id'
  const { id } = await params;

  // 1. Verificación de Seguridad
  if (!session?.user) {
    redirect("/");
  }

  // 2. Obtener los datos de la actividad específica y los departamentos
  const [actividad, departamentos] = await Promise.all([
    ActividadesService.obtenerPorId(id), // Ahora 'id' es un string
    DepartamentosService.obtenerTodos(),
  ]);

  // 3. Si la actividad no existe
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

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editar Actividad</h1>
        <p className="text-lg text-muted-foreground">
          Modificar los datos de:{" "}
          <span className="font-semibold">{actividad.titulo}</span>.
        </p>
      </div>

      {/* 4. Renderizar el formulario de edición */}
      <FormularioEditarActividad
        actividad={actividad}
        departamentos={departamentos}
      />
    </div>
  );
}
