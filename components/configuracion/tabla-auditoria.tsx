// /components/configuracion/tabla-auditoria.tsx
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type {
  LogAuditoria,
  LogNotificacion,
} from "@/services/auditoria.service";
import { Clock, User, FileText, Activity, ArrowRight } from "lucide-react";

type TablaAuditoriaProps =
  | { tipo: "cambios"; datos: LogAuditoria[] }
  | { tipo: "notificaciones"; datos: LogNotificacion[] };

const campoLabels: Record<string, string> = {
  titulo: "Título",
  descripcion: "Descripción",
  fecha_inicio: "Inicio",
  tipo: "Tipo",
  estado: "Estado",
  prioridad: "Prioridad",
  departamento_ids: "Deptos",
  asignado_a: "Asignado",
  telegram_chat_id: "Telegram",
  email: "Correo",
  password_hash: "Password",
};

function formatearValor(key: string, value: any): string {
  if (value === null || value === undefined || value === "") return "Vacío";
  if (key === "estado" || key === "tipo" || key === "prioridad") {
    const texto = String(value).replace(/_/g, " ");
    return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
  }
  if (key === "password_hash") return "***";
  if (key === "departamento_ids" && Array.isArray(value)) {
    return `${value.length}`;
  }
  // Recortar textos muy largos para la vista compacta
  const strValue = String(value);
  return strValue.length > 30 ? strValue.substring(0, 30) + "..." : strValue;
}

// --- Renderizado Compacto (Horizontal) ---
function RenderDetalles({ detalles }: { detalles: any }) {
  if (!detalles || Object.keys(detalles).length === 0)
    return <span className="text-muted-foreground text-[10px] italic">-</span>;

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {Object.entries(detalles).map(([key, value]) => (
        <div
          key={key}
          className="inline-flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded text-[11px] border border-border/50"
        >
          <span className="font-semibold text-muted-foreground">
            {campoLabels[key] || key}:
          </span>
          <span className="text-foreground font-medium">
            {formatearValor(key, value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function TablaAuditoria(props: TablaAuditoriaProps) {
  const formatDate = (date: Date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // --- TABLA DE NOTIFICACIONES ---
  if (props.tipo === "notificaciones") {
    return (
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[130px] text-xs">Fecha</TableHead>
              <TableHead className="w-[100px] text-xs">Canal</TableHead>
              <TableHead className="text-xs">Detalles del envío</TableHead>
              <TableHead className="w-[100px] text-xs text-right">
                Estado
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.datos.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center h-24 text-muted-foreground text-sm"
                >
                  Sin registros en este periodo.
                </TableCell>
              </TableRow>
            )}
            {props.datos.map((log) => (
              <TableRow key={log.id} className="h-10">
                <TableCell className="text-xs font-mono text-muted-foreground py-2">
                  {formatDate(log.fecha)}
                </TableCell>
                <TableCell className="py-2">
                  <Badge
                    variant="outline"
                    className="text-[10px] px-1.5 py-0 capitalize h-5"
                  >
                    {log.canal}
                  </Badge>
                </TableCell>
                <TableCell className="py-2">
                  <div className="flex flex-col text-xs">
                    <span className="font-medium text-foreground">
                      {log.usuario}
                    </span>
                    <span className="text-muted-foreground truncate max-w-[300px]">
                      {log.actividad}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right py-2">
                  <div className="flex flex-col items-end gap-0.5">
                    <Badge
                      variant={
                        log.estado === "enviada" ? "default" : "destructive"
                      }
                      className="text-[10px] px-1.5 py-0 h-5 capitalize"
                    >
                      {log.estado}
                    </Badge>
                    {log.error && (
                      <span
                        className="text-[9px] text-red-500 truncate max-w-[80px]"
                        title={log.error}
                      >
                        Error
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  // --- TABLA DE CAMBIOS (AUDITORÍA COMPACTA) ---
  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-[130px] text-xs">Fecha</TableHead>
            <TableHead className="w-[150px] text-xs">Usuario</TableHead>
            <TableHead className="w-[120px] text-xs">Acción</TableHead>
            <TableHead className="text-xs">Detalles del cambio</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.datos.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center h-24 text-muted-foreground text-sm"
              >
                Sin registros en este periodo.
              </TableCell>
            </TableRow>
          )}
          {props.datos.map((log) => (
            <TableRow key={log.id} className="h-12 hover:bg-muted/5">
              {/* Fecha */}
              <TableCell className="text-xs font-mono text-muted-foreground py-2 align-middle">
                {formatDate(log.fecha)}
              </TableCell>

              {/* Usuario */}
              <TableCell className="py-2 align-middle">
                <div className="flex items-center gap-1.5">
                  <User className="h-3 w-3 text-muted-foreground/70" />
                  <span
                    className="text-xs font-medium truncate max-w-[120px]"
                    title={log.usuario}
                  >
                    {log.usuario.split(" ")[0]}{" "}
                    {/* Solo primer nombre para compactar */}
                  </span>
                </div>
              </TableCell>

              {/* Acción y Actividad (Agrupados verticalmente para ahorrar ancho) */}
              <TableCell className="py-2 align-middle">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs font-semibold capitalize text-foreground">
                    {log.accion.replace("_", " ")}
                  </span>
                  <span
                    className="text-[10px] text-muted-foreground truncate max-w-[120px]"
                    title={log.actividad}
                  >
                    {log.actividad}
                  </span>
                </div>
              </TableCell>

              {/* Detalles (Horizontal) */}
              <TableCell className="py-2 align-middle">
                <RenderDetalles detalles={log.detalles} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
