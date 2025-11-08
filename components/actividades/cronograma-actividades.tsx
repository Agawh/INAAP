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
import type { Actividad } from "@/types";
import { MoreVertical, CalendarPlus } from "lucide-react";

// Función para verificar si dos fechas son el mismo día
function esElMismoDia(fecha1: Date, fecha2: Date) {
  return (
    fecha1.getDate() === fecha2.getDate() &&
    fecha1.getMonth() === fecha2.getMonth() &&
    fecha1.getFullYear() === fecha2.getFullYear()
  );
}

// Función para traducir el estado
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

// Props que recibirá nuestro componente
type CronogramaProps = {
  // Las actividades vienen del servidor (de page.tsx)
  actividades: Actividad[];
};

export function CronogramaActividades({ actividades }: CronogramaProps) {
  const [fecha, setFecha] = React.useState<Date | undefined>(new Date());
  const [actividadesSeleccionadas, setActividadesSeleccionadas] =
    React.useState<Actividad[]>([]);

  // 1. Obtenemos todas las fechas que tienen actividades para resaltarlas
  // Usamos useMemo para que esto no se recalcule en cada render
  const diasConActividad = React.useMemo(() => {
    // Aseguramos que las fechas sean objetos Date válidos
    return actividades.map((act) => new Date(act.fecha_inicio));
  }, [actividades]);

  // 2. Función para manejar la selección de fecha
  const handleSelectFecha = (dia: Date | undefined) => {
    setFecha(dia);
    if (!dia) {
      setActividadesSeleccionadas([]);
      return;
    }

    // Filtramos las actividades que coinciden con el día seleccionado
    const actividadesDelDia = actividades.filter((act) =>
      esElMismoDia(new Date(act.fecha_inicio), dia)
    );
    setActividadesSeleccionadas(actividadesDelDia);
  };

  // 3. Efecto para seleccionar las actividades del día actual al cargar
  React.useEffect(() => {
    handleSelectFecha(new Date());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actividades]); // Se ejecuta solo al inicio y si las actividades cambian

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Columna Izquierda: Calendario */}
      <div className="lg:col-span-2">
        <Card>
          <CardContent className="p-0">
            <Calendar
              mode="single"
              selected={fecha}
              onSelect={handleSelectFecha}
              className="w-full"
              // Modificador para resaltar los días
              modifiers={{ diasConActividad: diasConActividad }}
              modifiersClassNames={{
                // Estilo para los días con actividades
                diasConActividad:
                  "bg-primary/20 text-primary-foreground rounded-full",
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Columna Derecha: Lista de Actividades */}
      <div className="lg:col-span-1">
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Actividades del día</CardTitle>
              <CardDescription>
                {fecha
                  ? fecha.toLocaleDateString("es-ES", { dateStyle: "long" })
                  : "Ninguna fecha seleccionada"}
              </CardDescription>
            </div>
            {/* Botón para ir a 'Crear Actividad' */}
            <Button size="icon" variant="outline" asChild>
              <Link href="/dashboard/actividades/crear">
                <CalendarPlus className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[450px]">
              <div className="flex flex-col gap-4">
                {actividadesSeleccionadas.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No hay actividades para este día.
                  </p>
                ) : (
                  actividadesSeleccionadas.map((act) => (
                    <div
                      key={act.id}
                      className="flex items-center gap-3 rounded-lg border p-3"
                    >
                      <div className="flex-1">
                        <p className="font-medium">{act.titulo}</p>
                        <p className="text-sm text-muted-foreground">
                          {traducirEstado(act.estado)}
                        </p>
                      </div>
                      <Badge
                        variant={
                          act.tipo === "efemeride" ? "outline" : "default"
                        }
                      >
                        {act.tipo === "efemeride" ? "Efeméride" : "Operativa"}
                      </Badge>
                      <Button variant="ghost" size="icon" className="shrink-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
