// /components/dashboard/panel-control.tsx
"use client";

import * as React from "react";
import { useTransition } from "react"; // <-- Añadido
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
import { Badge } from "@/components/ui/badge";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import {
  Activity,
  CalendarCheck,
  ClipboardList,
  Loader2,
  MoreVertical, // <-- Añadido
  CheckCircle2, // <-- Añadido
  CircleDashed, // <-- Añadido
  Undo2, // <-- Añadido
} from "lucide-react";
import type {
  DashboardData,
  DashboardChartData,
} from "@/services/actividades.service";
import type { ChartConfig } from "@/components/ui/chart";
import type { EstadoActividad } from "@/types"; // <-- Añadido
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"; // <-- Añadido
import { Button } from "@/components/ui/button"; // <-- Añadido
import { useToast } from "@/hooks/use-toast"; // <-- Añadido
import { accionActualizarEstadoActividad } from "@/app/actions/actividades.actions"; // <-- Añadido

// --- Configuración del Gráfico ---
const chartConfig = {
  pendiente: {
    label: "Pendiente",
    color: "hsl(var(--chart-2))", // Azul
  },
  en_progreso: {
    label: "En Progreso",
    color: "hsl(var(--chart-4))", // Amarillo
  },
  completada: {
    label: "Completada",
    color: "hsl(var(--chart-5))", // Verde
  },
  cancelada: {
    label: "Cancelada",
    color: "hsl(var(--chart-3))", // Rojo/Violeta
  },
} satisfies ChartConfig;

// --- Función para traducir el estado ---
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
    default:
      return estado;
  }
}

export function PanelDeControl({ data }: { data: DashboardData }) {
  const { kpis, proximasActividades, chartData } = data;

  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const totalActividadesMes = React.useMemo(() => {
    return chartData.reduce((acc, curr) => acc + curr.total, 0);
  }, [chartData]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
    });
  };

  // --- Lógica para el cambio de estado ---
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
        // La actualización de la lista se verá la próxima vez que cargue la página
        // (lo cual es suficiente para un dashboard)
      } else {
        toast({
          title: "Error al actualizar",
          description: resultado.message,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* --- KPIs (Tarjetas de Resumen) --- */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total de Actividades (Mes Actual)
          </CardTitle>
          <CalendarCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.totalMes}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Actividades Pendientes (Global)
          </CardTitle>
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.pendientes}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Actividades "En Progreso" (Global)
          </CardTitle>
          <Loader2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{kpis.enProgreso}</div>
        </CardContent>
      </Card>

      {/* --- Lista de Próximas Actividades (Accionable) --- */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Próximas Actividades Pendientes</CardTitle>
          <CardDescription>
            Las 5 actividades pendientes más cercanas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Actividad</TableHead>
                <TableHead>Fecha de Inicio</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proximasActividades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No hay actividades pendientes próximas.
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
                    <TableCell>{formatDate(act.fecha_inicio)}</TableCell>

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
                            )}
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
                            )}
                            Marcar "Completada"
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* --- Gráfico de Estados (Dona) --- */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Estado de Actividades (Mes Actual)</CardTitle>
          <CardDescription>
            Distribución de las {totalActividadesMes} actividades del mes.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          {totalActividadesMes === 0 ? (
            <div className="flex h-[250px] items-center justify-center text-muted-foreground">
              No hay datos este mes.
            </div>
          ) : (
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square h-[250px]"
            >
              <PieChart>
                <ChartTooltip
                  cursor={false}
                  content={
                    <ChartTooltipContent
                      hideLabel
                      formatter={(value, name) => (
                        <div className="flex items-center gap-2">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{
                              backgroundColor:
                                chartConfig[name as keyof typeof chartConfig]
                                  ?.color,
                            }}
                          />
                          <div className="flex flex-col">
                            <span className="text-muted-foreground">
                              {traducirEstado(name as string)}
                            </span>
                            <span className="font-bold">{value}</span>
                          </div>
                        </div>
                      )}
                    />
                  }
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
                          ?.color || "hsl(var(--foreground))"
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
                  className="fill-muted-foreground text-sm"
                >
                  Total
                </text>
              </PieChart>
            </ChartContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
