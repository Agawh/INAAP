// /app/dashboard/actividades/page.tsx
import { ActividadesService } from "@/services/actividades.service"; //
import { CronogramaActividades } from "@/components/actividades/cronograma-actividades";

// Hacemos que la página se revalide dinámicamente
export const revalidate = 0;

export default async function PaginaCronograma() {
  // 1. Obtenemos los datos en el servidor
  // Usamos la función que ya existe en tu servicio
  const actividades = await ActividadesService.obtenerTodas();

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

      {/* 2. Pasamos los datos al componente de cliente */}
      <CronogramaActividades actividades={actividades} />
    </div>
  );
}
