// /app/dashboard/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ActividadesService } from "@/services/actividades.service";
// Importamos el componente (que crearemos en el sig. paso)
import { PanelDeControl } from "@/components/dashboard/panel-control";

export default async function DashboardPage() {
  const session = await auth();

  // 1. Verificación de Sesión
  if (!session?.user?.name) {
    redirect("/");
  }

  // 2. Obtener los datos para el Dashboard (¡Usando nuestra nueva función!)
  const dashboardData = await ActividadesService.obtenerDatosDashboard();

  return (
    <div className="flex flex-col gap-6">
      {/* Saludo al usuario */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          ¡Bienvenido, {session.user.name.split(" ")[0]}!
        </h1>
        <p className="text-lg text-muted-foreground">
          Aquí tienes un resumen global del estado de las actividades.
        </p>
      </div>

      {/* 3. Renderizar el panel de control (componente cliente) */}
      <PanelDeControl data={dashboardData} />
    </div>
  );
}
