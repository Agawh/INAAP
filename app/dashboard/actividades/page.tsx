// /app/dashboard/actividades/page.tsx
import { ActividadesService } from "@/services/actividades.service";
import { CronogramaActividades } from "@/components/actividades/cronograma-actividades";
// --- ¡CAMBIO! Importamos el servicio de departamentos ---
import { DepartamentosService } from "@/services/departamentos.service";

// Hacemos que la página se revalide dinámicamente
export const revalidate = 0;

export default async function PaginaCronograma() {
  // --- ¡CAMBIO! Obtenemos actividades Y departamentos ---
  const [actividades, departamentos] = await Promise.all([
    ActividadesService.obtenerTodas(),
    DepartamentosService.obtenerTodos(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Cronograma de Actividades
        </h1>
        <p className="text-lg text-muted-foreground">
          Calendario de efemérides y actividades operativas.
        </p>
      </div>

      {/* --- ¡CAMBIO! Pasamos los departamentos como prop --- */}
      <CronogramaActividades
        actividades={actividades}
        departamentos={departamentos}
      />
    </div>
  );
}
