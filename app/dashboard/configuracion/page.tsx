// /app/dashboard/configuracion/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuditoriaService } from "@/services/auditoria.service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { TablaAuditoria } from "@/components/configuracion/tabla-auditoria";
import { TabsContent } from "@/components/ui/tabs";
import { TabsConfiguracion } from "@/components/configuracion/tabs-configuracion";
import { Paginacion } from "@/components/paginacion";
import { FiltroFechaRango } from "@/components/configuracion/filtro-fecha-rango"; // <-- Nuevo componente
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type PageProps = {
  searchParams: Promise<{
    page?: string;
    tab?: string;
    from?: string; // Fecha inicio YYYY-MM-DD
    to?: string; // Fecha fin YYYY-MM-DD
  }>;
};

export default async function PaginaConfiguracion({ searchParams }: PageProps) {
  const session = await auth();

  // 1. Seguridad
  if (!session?.user || session.user.rol !== "superusuario") {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Acceso restringido</AlertTitle>
        <AlertDescription>
          Esta sección es exclusiva para administradores del sistema.
        </AlertDescription>
      </Alert>
    );
  }

  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  const currentTab = params.tab || "notificaciones";
  const dateFrom = params.from;
  const dateTo = params.to;

  // 2. Obtener datos con filtros de fecha
  const [logsCambios, logsNotificaciones] = await Promise.all([
    AuditoriaService.obtenerCambiosPaginados(
      currentTab === "cambios" ? currentPage : 1,
      15,
      dateFrom,
      dateTo
    ),
    AuditoriaService.obtenerNotificacionesPaginadas(
      currentTab === "notificaciones" ? currentPage : 1,
      15,
      dateFrom,
      dateTo
    ),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Auditoría y sistema
          </h1>
          <p className="text-lg text-muted-foreground">
            Monitoreo de actividad y registros del sistema.
          </p>
        </div>

        {/* Selector de Fechas Global para ambas pestañas */}
        <FiltroFechaRango />
      </div>

      <TabsConfiguracion defaultTab={currentTab}>
        {/* Pestaña 1: Notificaciones */}
        <TabsContent value="notificaciones">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Historial de envíos</CardTitle>
              <CardDescription>
                Registro de notificaciones enviadas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TablaAuditoria
                tipo="notificaciones"
                datos={logsNotificaciones.datos}
              />
              <div className="flex justify-end">
                <Paginacion totalPaginas={logsNotificaciones.paginas} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña 2: Cambios */}
        <TabsContent value="cambios">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Registro de cambios</CardTitle>
              <CardDescription>
                Auditoría detallada de modificaciones en actividades.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <TablaAuditoria tipo="cambios" datos={logsCambios.datos} />
              <div className="flex justify-end">
                <Paginacion totalPaginas={logsCambios.paginas} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </TabsConfiguracion>
    </div>
  );
}
