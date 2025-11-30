// /app/dashboard/actividades/page.tsx
import { ActividadesService } from "@/services/actividades.service";
import { CronogramaActividades } from "@/components/actividades/cronograma-actividades";
import { DepartamentosService } from "@/services/departamentos.service";
// --- ¡CAMBIO! Importar auth y tipos ---
import { auth } from "@/auth";
import type { Rol } from "@/types";

export const revalidate = 0;

export default async function PaginaCronograma() {
  // --- ¡CAMBIO! Obtener sesión para el rol ---
  const session = await auth();
  const rolUsuario = session?.user?.rol as Rol;

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

      <CronogramaActividades
        actividades={actividades}
        departamentos={departamentos}
        // --- ¡CAMBIO! Pasamos el rol ---
        rolUsuario={rolUsuario}
      />
    </div>
  );
}
