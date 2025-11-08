// /components/actividades/cronograma-actividades.tsx
"use client";

import * as React from "react";
import Link from "next/link";
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
import { MoreVertical, CalendarPlus, Edit } from "lucide-react";
import type { Actividad, Departamento } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BotonEliminarActividad } from "./boton-eliminar-actividad";

// (Funciones de fecha y estado sin cambios)
function estaEnElMes(fechaActividad: Date, mesMostrado: Date) {
  return (
    fechaActividad.getMonth() === mesMostrado.getMonth() &&
    fechaActividad.getFullYear() === mesMostrado.getFullYear()
  );
}
function esElMismoDia(fecha1: Date, fecha2: Date) {
  return (
    fecha1.getDate() === fecha2.getDate() &&
    fecha1.getMonth() === fecha2.getMonth() &&
    fecha1.getFullYear() === fecha2.getFullYear()
  );
}
function traducirEstado(estado: Actividad["estado"]) {
  switch (estado) {
    case "pendiente":
      return "Pendiente";
    case "en_progreso":
      return "En Progreso";
    case "completada":
      return "Completada";
    case "cancelada":
      return "Cancelada";
    default:
      return estado;
  }
}

type CronogramaProps = {
  actividades: Actividad[];
  departamentos: Departamento[];
};

export function CronogramaActividades({
  actividades,
  departamentos,
}: CronogramaProps) {
  const [fecha, setFecha] = React.useState<Date | undefined>(new Date());
  const [mesMostrado, setMesMostrado] = React.useState<Date>(new Date());

  const deptMap = React.useMemo(() => {
    return new Map(departamentos.map((d) => [d.id, d.nombre]));
  }, [departamentos]);

  const actividadesConFechas = React.useMemo(() => {
    return actividades.map((act) => ({
      ...act,
      fecha_inicio: new Date(act.fecha_inicio),
      departamentos: (act.departamentos || []).filter(Boolean) as string[],
    }));
  }, [actividades]);

  const diasConActividad = React.useMemo(() => {
    return actividadesConFechas.map((act) => act.fecha_inicio);
  }, [actividadesConFechas]);

  const actividadesMostradas = React.useMemo(() => {
    if (fecha) {
      return actividadesConFechas.filter((act) =>
        esElMismoDia(act.fecha_inicio, fecha)
      );
    } else {
      return actividadesConFechas.filter((act) =>
        estaEnElMes(act.fecha_inicio, mesMostrado)
      );
    }
  }, [fecha, mesMostrado, actividadesConFechas]);

  // (Manejadores handleSelectFecha, handleMonthChange, useEffect... sin cambios)
  const handleSelectFecha = (dia: Date | undefined) => {
    setFecha(dia);
    if (dia) {
      setMesMostrado(dia);
    }
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
    if (fecha) {
      return fecha.toLocaleDateString("es-ES", { dateStyle: "long" });
    }
    return mesMostrado.toLocaleDateString("es-ES", {
      month: "long",
      year: "numeric",
    });
  }, [fecha, mesMostrado]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Columna Izquierda: Calendario */}
      <div className="lg:col-span-2">
        <Card>
          {/* --- ¡LA CORRECCIÓN ESTÁ AQUÍ! --- */}
          {/* 1. Añadimos 'flex justify-center' al contenedor */}
          <CardContent className="p-0 flex justify-center">
            <Calendar
              mode="single"
              selected={fecha}
              onSelect={handleSelectFecha}
              month={mesMostrado}
              onMonthChange={handleMonthChange}
              // 2. Quitamos 'w-full' del calendario
              className="" // <-- 'w-full' eliminado
              modifiers={{ diasConActividad: diasConActividad }}
              modifiersClassNames={{
                diasConActividad:
                  "bg-primary/20 text-primary-foreground rounded-full",
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Columna Derecha: Lista de Actividades (Sin cambios) */}
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
            <Button size="icon" variant="outline" asChild>
              <Link href="/dashboard/actividades/crear">
                <CalendarPlus className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[450px]">
              <div className="flex flex-col gap-4">
                {actividadesMostradas.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No hay actividades para {fecha ? "este día" : "este mes"}.
                  </p>
                ) : (
                  actividadesMostradas.map((act) => {
                    const primerDeptoId = act.departamentos[0];
                    const nombrePrimerDepto = deptMap.get(primerDeptoId);
                    const numDeptosExtra = act.departamentos.length - 1;

                    return (
                      <div
                        key={act.id}
                        className="flex items-start gap-3 rounded-lg border p-3"
                      >
                        <div className="flex-1">
                          <p className="font-medium">{act.titulo}</p>
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
                            <Badge
                              variant={
                                act.tipo === "efemeride" ? "outline" : "default"
                              }
                            >
                              {act.tipo === "efemeride"
                                ? "Efeméride"
                                : "Operativa"}
                            </Badge>
                            {nombrePrimerDepto && (
                              <Badge variant="secondary">
                                {nombrePrimerDepto}
                              </Badge>
                            )}
                            {numDeptosExtra > 0 && (
                              <Badge variant="secondary">
                                +{numDeptosExtra}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="shrink-0"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar (Próximamente)
                            </DropdownMenuItem>
                            <BotonEliminarActividad
                              actividadId={act.id}
                              tituloActividad={act.titulo}
                            />
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
