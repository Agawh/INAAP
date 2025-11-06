import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"; //
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; //
import { Users, CalendarCheck, Activity } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const usuario = session.user;

  // const stats = await obtenerEstadisticas();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          ¡Bienvenido, {usuario.name}!
        </h1>
        <p className="text-lg text-muted-foreground">
          Resumen general del sistema de actividades.
        </p>
      </div>

      {/* --- Contenido Específico por Rol (Diseño mejorado) --- */}
      {usuario.rol === "superusuario" && (
        <Alert
          variant="default"
          className="border-primary/20 bg-primary/5 text-primary dark:border-primary dark:bg-primary/10 dark:text-primary-foreground [&>svg]:text-primary dark:[&>svg]:text-primary-foreground"
        >
          <Activity className="size-4" />
          <AlertTitle className="font-semibold text-lg">
            Modo Superusuario
          </AlertTitle>
          <AlertDescription>
            Tienes acceso completo a la gestión de usuarios y configuración del
            sistema.
          </AlertDescription>
        </Alert>
      )}

      {usuario.rol === "jefe_departamento" && ( //
        <Alert>
          <Activity className="size-4" />
          <AlertTitle>Modo Jefe de Departamento</AlertTitle>
          <AlertDescription>
            Puedes crear y asignar actividades a tu departamento.
          </AlertDescription>
        </Alert>
      )}

      {/* --- Sección de Estadísticas (Ejemplo) --- */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Usuarios Activos
            </CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">(Simulado)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Actividades Pendientes
            </CardTitle>
            <CalendarCheck className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-muted-foreground">(Simulado)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
