// /components/actividades/tabla-actividades.tsx
"use client";

import Link from "next/link";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, CalendarClock } from "lucide-react";
import type { Actividad, Departamento, Rol } from "@/types";
import { BotonEliminarActividad } from "./boton-eliminar-actividad";

type TablaActividadesProps = {
  actividades: Actividad[];
  departamentos: Departamento[];
  rolUsuario: Rol;
};

const estadoMap: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  pendiente: { label: "Pendiente", variant: "outline" },
  en_progreso: { label: "En progreso", variant: "secondary" },
  completada: { label: "Completada", variant: "default" },
  cancelada: { label: "Cancelada", variant: "destructive" },
  suspendido: { label: "Suspendido", variant: "destructive" },
};

export function TablaActividades({
  actividades,
  departamentos,
  rolUsuario,
}: TablaActividadesProps) {
  const deptMap = new Map(departamentos.map((d) => [d.id, d.nombre]));
  const esSoloLectura = rolUsuario === "miembro_departamento";

  return (
    <div className="rounded-md border overflow-hidden">
      {/* 'table-fixed' fuerza el respeto de anchos y permite truncate */}
      <Table className="table-fixed w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[110px]">Fecha</TableHead>
            <TableHead className="w-auto">Título</TableHead>
            <TableHead className="w-[100px]">Tipo</TableHead>
            <TableHead className="w-[110px]">Estado</TableHead>
            <TableHead className="w-[180px]">Departamentos</TableHead>
            {!esSoloLectura && (
              <TableHead className="w-[70px] text-right">Acciones</TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {actividades.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={esSoloLectura ? 5 : 6}
                className="h-24 text-center"
              >
                No se encontraron actividades.
              </TableCell>
            </TableRow>
          )}
          {actividades.map((act) => {
            // --- FIX UTC PARA LECTURA ---
            // Leemos la fecha ignorando la zona horaria del navegador
            const fechaObj = new Date(act.fecha_inicio);

            // Extraemos los componentes UTC (Dato crudo de la BD)
            const dia = fechaObj.getUTCDate().toString().padStart(2, "0");
            const mes = (fechaObj.getUTCMonth() + 1)
              .toString()
              .padStart(2, "0");
            const anio = fechaObj.getUTCFullYear();

            // Formato DD/MM/YYYY manual
            const fechaFormateada = `${dia}/${mes}/${anio}`;

            const configEstado = estadoMap[act.estado] || {
              label: act.estado,
              variant: "outline",
            };
            const deptsIds = (act.departamentos || []).filter(Boolean);

            return (
              <TableRow key={act.id}>
                {/* Mostramos la fecha formateada manualmente */}
                <TableCell className="font-medium whitespace-nowrap overflow-hidden text-ellipsis">
                  {fechaFormateada}
                </TableCell>

                <TableCell className="truncate pr-4" title={act.titulo}>
                  <Link
                    href={`/dashboard/actividades/${act.id}`}
                    className="hover:underline font-medium"
                  >
                    {act.titulo}
                  </Link>
                </TableCell>

                <TableCell>
                  <Badge
                    variant={act.tipo === "efemeride" ? "outline" : "secondary"}
                    className="capitalize"
                  >
                    {act.tipo}
                  </Badge>
                </TableCell>

                <TableCell>
                  <Badge variant={configEstado.variant}>
                    {configEstado.label}
                  </Badge>
                </TableCell>

                <TableCell>
                  <div className="flex flex-wrap gap-1 max-h-[40px] overflow-hidden">
                    {deptsIds.slice(0, 2).map((id) => (
                      <span
                        key={id}
                        className="inline-flex items-center rounded-sm bg-muted px-1.5 py-0.5 text-[10px] font-medium ring-1 ring-inset ring-gray-500/10 whitespace-nowrap"
                      >
                        {deptMap.get(id)?.substring(0, 15) || "Desc."}
                      </span>
                    ))}
                    {deptsIds.length > 2 && (
                      <span className="text-[10px] text-muted-foreground self-center">
                        +{deptsIds.length - 2}
                      </span>
                    )}
                  </div>
                </TableCell>

                {!esSoloLectura && (
                  <TableCell className="text-right">
                    <DropdownMenu modal={false}>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dashboard/actividades/${act.id}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar / Detalles
                          </Link>
                        </DropdownMenuItem>
                        {act.estado === "suspendido" && (
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/actividades/${act.id}`}>
                              <CalendarClock className="mr-2 h-4 w-4" />
                              Reprogramar
                            </Link>
                          </DropdownMenuItem>
                        )}
                        <BotonEliminarActividad
                          actividadId={act.id}
                          tituloActividad={act.titulo}
                        />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
