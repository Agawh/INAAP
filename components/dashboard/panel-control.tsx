// /components/dashboard/panel-control.tsx
"use client";

import * as React from "react";
import { useTransition, useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  CalendarCheck,
  ClipboardList,
  Loader2,
  MoreVertical,
  CheckCircle2,
  CircleDashed,
} from "lucide-react";
import type { DashboardData } from "@/services/actividades.service";
import type { ChartConfig } from "@/components/ui/chart";
import type { EstadoActividad, Rol } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { accionActualizarEstadoActividad } from "@/app/actions/actividades.actions";

const chartConfig = {
  pendiente: { label: "Pendiente", color: "hsl(var(--chart-2))" },
  en_progreso: { label: "En Progreso", color: "hsl(var(--chart-4))" },
  completada: { label: "Completada", color: "hsl(var(--chart-5))" },
  cancelada: { label: "Cancelada", color: "hsl(var(--chart-3))" },
  suspendido: { label: "Suspendido", color: "hsl(32 95% 44%)" },
} satisfies ChartConfig;

function traducirEstado(estado: string | EstadoActividad) {
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

export function PanelDeControl({
  data,
  rolUsuario,
}: {
  data: DashboardData;
  rolUsuario: Rol;
}) {
  const { kpis, proximasActividades, chartData } = data;
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const totalActividadesMes = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.total, 0);
  }, [chartData]);

  // --- FIX FECHA DASHBOARD ---
  // Reemplazamos la conversión directa por construcción manual local
  const formatDate = (date: Date | string) => {
    // 1. Aseguramos formato ISO String
    const fechaStr = new Date(date).toISOString().split("T")[0];
    // 2. Extraemos [Año, Mes, Día]
    const [anio, mes, dia] = fechaStr.split("-").map(Number);
    // 3. Creamos fecha local (Mes es base 0 en JS)
    const fechaVisual = new Date(anio, mes - 1, dia);

    return fechaVisual.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
    });
  };

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

  const esSoloLectura = rolUsuario === "miembro_departamento";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* KPIs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total mes</CardTitle>
          <CalendarCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.totalMes}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.pendientes}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">En progreso</CardTitle>
          <Loader2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.enProgreso}</div>
        </CardContent>
      </Card>

      {/* Lista de Próximas Actividades */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Próximas actividades del mes</CardTitle>
          <CardDescription>
            Las 5 actividades del mes más cercanas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Actividad</TableHead>
                <TableHead>Fecha</TableHead>
                {!esSoloLectura && (
                  <TableHead className="text-right">Acciones</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {proximasActividades.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={esSoloLectura ? 2 : 3}
                    className="h-24 text-center"
                  >
                    No hay actividades pendientes.
                  </TableCell>
                </TableRow>
              ) : (
                proximasActividades.map((act) => (
                  <TableRow key={act.id}>
                    <TableCell className="font-medium">
                      <Link
                        href={`/dashboard/actividades/${act.id}`}
                        className="hover:underline"
                      >
                        {act.titulo}
                      </Link>
                    </TableCell>
                    {/* Usamos la función corregida */}
                    <TableCell className="capitalize">
                      {formatDate(act.fecha_inicio)}
                    </TableCell>

                    {!esSoloLectura && (
                      <TableCell className="text-right">
                        <DropdownMenu modal={false}>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              disabled={isPending}
                              onSelect={() =>
                                handleEstadoChange(
                                  act.id,
                                  act.titulo,
                                  "en_progreso"
                                )
                              }
                            >
                              {isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <CircleDashed className="mr-2 h-4 w-4" />
                              )}{" "}
                              Marcar "En Progreso"
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={isPending}
                              onSelect={() =>
                                handleEstadoChange(
                                  act.id,
                                  act.titulo,
                                  "completada"
                                )
                              }
                            >
                              {isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                              )}{" "}
                              Marcar "Completada"
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Gráfico */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Estado del actual mes</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center">
          {!isMounted ? (
            <div className="flex h-[250px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : totalActividadesMes === 0 ? (
            <div className="flex h-[250px] items-center justify-center text-muted-foreground">
              Sin datos.
            </div>
          ) : (
            <div className="h-[250px] w-full max-w-[250px]">
              <ChartContainer
                config={chartConfig}
                className="mx-auto aspect-square h-full w-full"
              >
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent hideLabel />}
                  />
                  <Pie
                    data={chartData}
                    dataKey="total"
                    nameKey="estado"
                    innerRadius={60}
                    strokeWidth={5}
                  >
                    {chartData.map((entry) => (
                      <Cell
                        key={entry.estado}
                        fill={
                          chartConfig[entry.estado as keyof typeof chartConfig]
                            ?.color || "gray"
                        }
                      />
                    ))}
                  </Pie>
                  <text
                    x="50%"
                    y="50%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-foreground text-2xl font-bold"
                  >
                    {totalActividadesMes}
                  </text>
                  <text
                    x="50%"
                    y="60%"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="fill-muted-foreground text-xs"
                  >
                    Total
                  </text>
                </PieChart>
              </ChartContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
