import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card"; //
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; //
import { Button } from "@/components/ui/button"; //
import { Avatar, AvatarFallback } from "@/components/ui/avatar"; //
import {
  Users,
  CalendarCheck,
  Activity,
  PlusCircle,
  UserPlus,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/badge"; //

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

      {/* --- Alerta de Rol --- */}
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

      {/* --- Sección de Estadísticas (3 Columnas) --- */}
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Reportes Generados
            </CardTitle>
            <FileText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">(Simulado)</p>
          </CardContent>
        </Card>
      </div>

      {/* --- Sección de Acciones y Actividad Reciente --- */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Columna de Acciones Rápidas (Con Colores) */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button className="w-full justify-start">
              <PlusCircle className="mr-2 size-4" />
              Crear Nueva Actividad
            </Button>
            {usuario.rol === "superusuario" && (
              <Button variant="secondary" className="w-full justify-start">
                <UserPlus className="mr-2 size-4" />
                Añadir Nuevo Usuario
              </Button>
            )}
            <Button variant="outline" className="w-full justify-start">
              <FileText className="mr-2 size-4" />
              Generar Reporte
            </Button>
          </CardContent>
        </Card>

        {/* Columna de Actividad Reciente (Con Colores) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>
              Últimos cambios y actualizaciones en el sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarFallback className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground">
                  AD
                </AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p className="font-medium">Admin</p>
                <p className="text-muted-foreground">
                  Creó la actividad: "Feria de Turismo 2025".
                </p>
              </div>
              <time className="ml-auto text-xs text-muted-foreground">
                Hace 5m
              </time>
            </div>
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarFallback className="bg-accent/10 text-accent-foreground dark:bg-accent/20 dark:text-accent">
                  JP
                </AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p className="font-medium">Jefe de Promoción</p>
                <p className="text-muted-foreground">
                  Completó la actividad: "Diseño de Folletos".
                </p>
              </div>
              <Badge variant="outline" className="ml-auto">
                Completada
              </Badge>
            </div>
            <div className="flex items-center gap-3">
              <Avatar className="size-9">
                <AvatarFallback className="bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-foreground">
                  AD
                </AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p className="font-medium">Admin</p>
                <p className="text-muted-foreground">
                  Añadió un nuevo usuario: "Analista de Redes".
                </p>
              </div>
              <time className="ml-auto text-xs text-muted-foreground">
                Hace 3h
              </time>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
