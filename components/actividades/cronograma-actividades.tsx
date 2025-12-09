// /components/actividades/cronograma-actividades.tsx
"use client";

import * as React from "react";
import { useTransition } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  MoreVertical,
  CalendarPlus,
  Edit,
  CheckCircle2,
  CircleDashed,
  Undo2,
  Loader2,
  PauseCircle,
  CalendarClock,
} from "lucide-react";
import type { Actividad, Departamento, EstadoActividad, Rol } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { BotonEliminarActividad } from "./boton-eliminar-actividad";
import { accionActualizarEstadoActividad } from "@/app/actions/actividades.actions";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

// Funciones auxiliares de fecha (MODIFICADAS PARA USAR LÓGICA LOCAL SEGURA)
// Nota: Ya no comparamos objetos Date directamente porque tienen timezones.
// Comparamos los componentes día/mes/año extraídos manualmente.

function esElMismoDia(fecha1: Date, fecha2: Date) {
  return (
    fecha1.getDate() === fecha2.getDate() &&
    fecha1.getMonth() === fecha2.getMonth() &&
    fecha1.getFullYear() === fecha2.getFullYear()
  );
}

function estaEnElMes(fechaActividad: Date, mesMostrado: Date) {
  return (
    fechaActividad.getMonth() === mesMostrado.getMonth() &&
    fechaActividad.getFullYear() === mesMostrado.getFullYear()
  );
}

function traducirEstado(estado: EstadoActividad | string) {
  switch (estado) {
    case "pendiente":
      return "Pendiente";
    case "en_progreso":
      return "En Progreso";
    case "completada":
      return "Completada";
    case "cancelada":
      return "Cancelada";
    case "suspendido":
      return "Suspendido";
    default:
      return estado;
  }
}

type CronogramaProps = {
  actividades: Actividad[];
  departamentos: Departamento[];
  rolUsuario: Rol;
};

export function CronogramaActividades({
  actividades,
  departamentos,
  rolUsuario,
}: CronogramaProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [fecha, setFecha] = React.useState<Date | undefined>(new Date());
  const [mesMostrado, setMesMostrado] = React.useState<Date>(new Date());

  const esSoloLectura = rolUsuario === "miembro_departamento";

  const deptMap = React.useMemo(() => {
    return new Map(departamentos.map((d) => [d.id, d.nombre]));
  }, [departamentos]);

  // --- CORRECCIÓN FECHAS: Transformación de Datos ---
  // Convertimos las fechas crudas de la BD a objetos Date locales
  // usando la técnica de parsing manual para evitar el timezone del navegador.
  const actividadesConFechas = React.useMemo(() => {
    return actividades.map((act) => {
      let fechaVisual = new Date();

      if (act.fecha_inicio) {
        // 1. Obtener string ISO original ("2025-12-12...")
        const fechaString = new Date(act.fecha_inicio)
          .toISOString()
          .split("T")[0];
        // 2. Parsear manualmente [2025, 12, 12]
        const [anio, mes, dia] = fechaString.split("-").map(Number);
        // 3. Crear fecha local (Mes es base 0)
        fechaVisual = new Date(anio, mes - 1, dia);
      }

      return {
        ...act,
        fecha_inicio: fechaVisual, // Usamos esta fecha corregida para todo el componente
        departamentos: (act.departamentos || []).filter(Boolean) as string[],
      };
    });
  }, [actividades]);

  const diasConActividad = React.useMemo(() => {
    return actividadesConFechas.map((act) => act.fecha_inicio);
  }, [actividadesConFechas]);

  const actividadesMostradas = React.useMemo(() => {
    let filtered: typeof actividadesConFechas;
    if (fecha) {
      filtered = actividadesConFechas.filter((act) =>
        esElMismoDia(act.fecha_inicio, fecha)
      );
    } else {
      filtered = actividadesConFechas.filter((act) =>
        estaEnElMes(act.fecha_inicio, mesMostrado)
      );
    }
    return filtered.sort(
      (a, b) => a.fecha_inicio.getTime() - b.fecha_inicio.getTime()
    );
  }, [fecha, mesMostrado, actividadesConFechas]);

  const actividadesPendientes = React.useMemo(() => {
    return actividadesMostradas.filter(
      (act) =>
        act.estado === "pendiente" ||
        act.estado === "en_progreso" ||
        act.estado === "suspendido"
    );
  }, [actividadesMostradas]);

  const actividadesFinalizadas = React.useMemo(() => {
    return actividadesMostradas.filter(
      (act) => act.estado === "completada" || act.estado === "cancelada"
    );
  }, [actividadesMostradas]);

  const handleSelectFecha = (dia: Date | undefined) => {
    setFecha(dia);
    if (dia) setMesMostrado(dia);
  };
  const handleMonthChange = (month: Date) => {
    setMesMostrado(month);
    setFecha(undefined);
  };
  React.useEffect(() => {
    const hoy = new Date();
    setFecha(hoy);
    setMesMostrado(hoy);
  }, []);

  const descripcionTitulo = React.useMemo(() => {
    if (fecha) return fecha.toLocaleDateString("es-ES", { dateStyle: "long" });
    return mesMostrado.toLocaleDateString("es-ES", {
      month: "long",
      year: "numeric",
    });
  }, [fecha, mesMostrado]);

  const handleEstadoChange = (
    actividadId: string,
    titulo: string,
    nuevoEstado: EstadoActividad
  ) => {
    startTransition(async () => {
      const resultado = await accionActualizarEstadoActividad(
        actividadId,
        nuevoEstado
      );
      if (resultado.success && resultado.nuevoEstado) {
        toast({
          title: `¡Actualizado!`,
          description: `La actividad "${titulo}" se marcó como "${traducirEstado(
            resultado.nuevoEstado
          )}".`,
        });
      } else {
        toast({
          title: "Error al actualizar",
          description: resultado.message,
          variant: "destructive",
        });
      }
    });
  };

  const renderActividadItem = (act: (typeof actividadesConFechas)[number]) => {
    const primerDeptoId = act.departamentos[0];
    const nombrePrimerDepto = deptMap.get(primerDeptoId);
    const numDeptosExtra = act.departamentos.length - 1;
    const estadoClasses = {
      pendiente: "border-l-gray-400 dark:border-l-gray-600",
      en_progreso: "border-l-yellow-500 dark:border-l-yellow-600",
      completada: "border-l-green-500 dark:border-l-green-600",
      cancelada: "border-l-red-500 dark:border-l-red-600 opacity-70",
      suspendido:
        "border-l-orange-500 dark:border-l-orange-600 bg-orange-50/50 dark:bg-orange-950/10",
    }[act.estado];

    return (
      <div
        key={act.id}
        className={cn(
          "flex items-start gap-3 rounded-lg border p-3 transition-colors",
          "border-l-4",
          estadoClasses
        )}
      >
        <div className="flex-1">
          <p
            className={cn(
              "font-medium",
              act.estado === "cancelada" && "line-through"
            )}
          >
            {act.titulo}
          </p>
          <p className="text-sm text-muted-foreground">
            {!fecha && (
              <span className="font-medium text-primary">
                {act.fecha_inicio.toLocaleDateString("es-ES", {
                  day: "2-digit",
                })}
                :{" "}
              </span>
            )}
            {traducirEstado(act.estado)}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            <Badge variant={act.tipo === "efemeride" ? "outline" : "default"}>
              {act.tipo === "efemeride" ? "Efeméride" : "Operativa"}
            </Badge>
            {nombrePrimerDepto && (
              <Badge variant="secondary">{nombrePrimerDepto}</Badge>
            )}
            {numDeptosExtra > 0 && (
              <Badge variant="secondary">+{numDeptosExtra}</Badge>
            )}
          </div>
        </div>

        {!esSoloLectura && (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="shrink-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {act.estado === "suspendido" ? (
                <DropdownMenuItem asChild className="text-primary font-medium">
                  <Link href={`/dashboard/actividades/${act.id}`}>
                    <CalendarClock className="mr-2 h-4 w-4" />
                    Reprogramar Actividad
                  </Link>
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/actividades/${act.id}`}>
                    <Edit className="mr-2 h-4 w-4" />
                    Editar Actividad
                  </Link>
                </DropdownMenuItem>
              )}

              <BotonEliminarActividad
                actividadId={act.id}
                tituloActividad={act.titulo}
              />
              <DropdownMenuSeparator />

              {act.estado !== "en_progreso" && act.estado !== "suspendido" && (
                <DropdownMenuItem
                  disabled={isPending}
                  onSelect={() =>
                    handleEstadoChange(act.id, act.titulo, "en_progreso")
                  }
                >
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CircleDashed className="mr-2 h-4 w-4" />
                  )}{" "}
                  Marcar "En Progreso"
                </DropdownMenuItem>
              )}
              {act.estado !== "completada" && act.estado !== "suspendido" && (
                <DropdownMenuItem
                  disabled={isPending}
                  onSelect={() =>
                    handleEstadoChange(act.id, act.titulo, "completada")
                  }
                >
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                  )}{" "}
                  Marcar "Completada"
                </DropdownMenuItem>
              )}
              {act.estado !== "suspendido" &&
                act.estado !== "completada" &&
                act.estado !== "cancelada" && (
                  <DropdownMenuItem
                    disabled={isPending}
                    onSelect={() =>
                      handleEstadoChange(act.id, act.titulo, "suspendido")
                    }
                    className="text-orange-600 focus:text-orange-700"
                  >
                    {isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <PauseCircle className="mr-2 h-4 w-4" />
                    )}{" "}
                    Suspender Actividad
                  </DropdownMenuItem>
                )}
              {act.estado !== "pendiente" && (
                <DropdownMenuItem
                  disabled={isPending}
                  onSelect={() =>
                    handleEstadoChange(act.id, act.titulo, "pendiente")
                  }
                >
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Undo2 className="mr-2 h-4 w-4" />
                  )}{" "}
                  Revertir a "Pendiente"
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <Card>
          <CardContent className="p-0 flex justify-center">
            <Calendar
              mode="single"
              selected={fecha}
              onSelect={handleSelectFecha}
              month={mesMostrado}
              onMonthChange={handleMonthChange}
              className=""
              modifiers={{ diasConActividad: diasConActividad }}
              modifiersClassNames={{
                diasConActividad:
                  "bg-primary/20 text-primary-foreground rounded-full",
              }}
            />
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-1">
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>
                {fecha ? "Actividades del día" : "Actividades del Mes"}
              </CardTitle>
              <CardDescription className="capitalize">
                {descripcionTitulo}
              </CardDescription>
            </div>
            {!esSoloLectura && (
              <Button size="icon" variant="outline" asChild>
                <Link href="/dashboard/actividades/crear">
                  <CalendarPlus className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[450px]">
              <div className="flex flex-col gap-4">
                {actividadesPendientes.length === 0 &&
                actividadesFinalizadas.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No hay actividades para {fecha ? "este día" : "este mes"}.
                  </p>
                ) : (
                  <>
                    {actividadesPendientes.length > 0 && (
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase text-muted-foreground">
                            Pendientes y Suspendidas
                          </span>
                          <Separator className="flex-1" />
                        </div>
                        {actividadesPendientes.map(renderActividadItem)}
                      </div>
                    )}
                    {actividadesFinalizadas.length > 0 && (
                      <div className="flex flex-col gap-4 mt-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase text-muted-foreground">
                            Finalizadas
                          </span>
                          <Separator className="flex-1" />
                        </div>
                        {actividadesFinalizadas.map(renderActividadItem)}
                      </div>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
