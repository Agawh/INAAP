// /app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ActividadesService } from "@/services/actividades.service";
import { PanelDeControl } from "@/components/dashboard/panel-control";
// Importamos el tipo Rol para asegurarnos (opcional en JS, buena práctica en TS)
import type { Rol } from "@/types";

export default async function DashboardPage() {
  const session = await auth();

  // 1. Verificación de Sesión
  if (!session?.user?.name) {
    redirect("/");
  }

  // 2. Obtener los datos
  const dashboardData = await ActividadesService.obtenerDatosDashboard();

  // 3. Obtener el rol
  const rolUsuario = session.user.rol as Rol;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          ¡Bienvenido, {session.user.name.split(" ")[0]}!
        </h1>
        <p className="text-lg text-muted-foreground">
          Aquí tienes un resumen global del estado de las actividades.
        </p>
      </div>

      {/* 4. Pasamos el rol al componente cliente */}
      <PanelDeControl data={dashboardData} rolUsuario={rolUsuario} />
    </div>
  );
}
