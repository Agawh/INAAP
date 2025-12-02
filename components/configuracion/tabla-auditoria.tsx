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
import { ScrollArea } from "@/components/ui/scroll-area";
import type {
  LogAuditoria,
  LogNotificacion,
} from "@/services/auditoria.service";

type TablaAuditoriaProps =
  | { tipo: "cambios"; datos: LogAuditoria[] }
  | { tipo: "notificaciones"; datos: LogNotificacion[] };

// --- 1. Diccionario de Traducción de Campos ---
const campoLabels: Record<string, string> = {
  titulo: "Título",
  descripcion: "Descripción",
  fecha_inicio: "Fecha de Inicio",
  tipo: "Tipo",
  estado: "Estado",
  prioridad: "Prioridad",
  departamento_ids: "Departamentos",
  asignado_a: "Asignado a",
  telegram_chat_id: "ID Telegram",
  email: "Correo",
  password_hash: "Contraseña", // Por si acaso
};

// --- 2. Función para formatear el valor ---
function formatearValor(key: string, value: any): string {
  if (value === null || value === undefined || value === "") return "Vacío";

  if (key === "estado" || key === "tipo" || key === "prioridad") {
    // Reemplaza guiones bajos por espacios y capitaliza
    return String(value)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  }

  if (key === "password_hash") return "********"; // Seguridad visual

  if (key === "departamento_ids" && Array.isArray(value)) {
    return `${value.length} departamento(s)`;
  }

  // Si parece una fecha ISO, intentamos formatearla
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    // Si es solo fecha YYYY-MM-DD, la dejamos tal cual o la formateamos bonito
    return value;
  }

  return String(value);
}

// --- Componente para renderizar los cambios ---
function RenderDetalles({ detalles }: { detalles: any }) {
  if (!detalles || Object.keys(detalles).length === 0)
    return <span className="text-muted-foreground">-</span>;

  return (
    <div className="flex flex-col gap-1">
      {Object.entries(detalles).map(([key, value]) => (
        <div key={key} className="text-xs">
          <span className="font-semibold text-foreground/80">
            {campoLabels[key] || key}:
          </span>{" "}
          <span className="text-muted-foreground">
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
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // --- TABLA DE NOTIFICACIONES (Sin Cambios) ---
  if (props.tipo === "notificaciones") {
    return (
      <ScrollArea className="h-[500px] rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fecha</TableHead>
              <TableHead>Canal</TableHead>
              <TableHead>Usuario Destino</TableHead>
              <TableHead>Actividad</TableHead>
              <TableHead>Estado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {props.datos.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center h-24">
                  No hay registros.
                </TableCell>
              </TableRow>
            )}
            {props.datos.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="text-xs text-muted-foreground">
                  {formatDate(log.fecha)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="capitalize">
                    {log.canal}
                  </Badge>
                </TableCell>
                <TableCell>{log.usuario}</TableCell>
                <TableCell
                  className="max-w-[200px] truncate"
                  title={log.actividad}
                >
                  {log.actividad}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      log.estado === "enviada" ? "default" : "destructive"
                    }
                  >
                    {log.estado}
                  </Badge>
                  {log.error && (
                    <div
                      className="text-[10px] text-red-500 mt-1 max-w-[150px] truncate"
                      title={log.error}
                    >
                      {log.error}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    );
  }

  // --- TABLA DE CAMBIOS (MEJORADA) ---
  return (
    <ScrollArea className="h-[500px] rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Usuario Responsable</TableHead>
            <TableHead>Acción</TableHead>
            <TableHead>Actividad Afectada</TableHead>
            <TableHead>Cambios Realizados</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.datos.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="text-center h-24">
                No hay registros de auditoría.
              </TableCell>
            </TableRow>
          )}
          {props.datos.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-medium">{log.usuario}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="capitalize">
                  {log.accion.replace("_", " ")}
                </Badge>
              </TableCell>
              <TableCell
                className="max-w-[200px] truncate"
                title={log.actividad}
              >
                {log.actividad}
              </TableCell>

              {/* Usamos el nuevo componente de renderizado */}
              <TableCell>
                <RenderDetalles detalles={log.detalles} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
