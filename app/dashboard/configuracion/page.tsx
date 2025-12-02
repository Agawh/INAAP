// /app/dashboard/configuracion/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuditoriaService } from "@/services/auditoria.service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, ShieldCheck, Activity } from "lucide-react";
import { TablaAuditoria } from "@/components/configuracion/tabla-auditoria";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function PaginaConfiguracion() {
  const session = await auth();

  // 1. Seguridad: Solo Superusuarios
  if (!session?.user || session.user.rol !== "superusuario") {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Acceso Restringido</AlertTitle>
        <AlertDescription>
          Esta sección es exclusiva para administradores del sistema.
        </AlertDescription>
      </Alert>
    );
  }

  // 2. Obtener datos de auditoría
  const [logsCambios, logsNotificaciones] = await Promise.all([
    AuditoriaService.obtenerUltimosCambios(50),
    AuditoriaService.obtenerHistorialNotificaciones(50),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Auditoría y Sistema
        </h1>
        <p className="text-lg text-muted-foreground">
          Monitoreo de actividad y registros del sistema.
        </p>
      </div>

      <Tabs defaultValue="notificaciones" className="w-full">
        <TabsList>
          <TabsTrigger value="notificaciones">
            <Activity className="mr-2 h-4 w-4" />
            Historial de Notificaciones
          </TabsTrigger>
          <TabsTrigger value="cambios">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Auditoría de Cambios
          </TabsTrigger>
        </TabsList>

        {/* Pestaña 1: Notificaciones */}
        <TabsContent value="notificaciones">
          <Card>
            <CardHeader>
              <CardTitle>Envíos Recientes</CardTitle>
              <CardDescription>
                Registro de alertas enviadas por Telegram, Correo y Calendario.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TablaAuditoria
                tipo="notificaciones"
                datos={logsNotificaciones}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña 2: Cambios */}
        <TabsContent value="cambios">
          <Card>
            <CardHeader>
              <CardTitle>Movimientos en Actividades</CardTitle>
              <CardDescription>
                Registro de creación, edición y eliminación de actividades.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TablaAuditoria tipo="cambios" datos={logsCambios} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
