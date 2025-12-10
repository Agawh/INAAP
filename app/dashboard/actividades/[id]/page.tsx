import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { ActividadesService } from "@/services/actividades.service";
import { DepartamentosService } from "@/services/departamentos.service";
import { FormularioEditarActividad } from "@/components/actividades/formulario-editar-actividad"; // Asegúrate que este sea el nombre de tu componente
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin } from "lucide-react";
import type { Rol } from "@/types";

// Helper para traducir estados visualmente
const estadoMap: Record<string, { label: string; className: string }> = {
  pendiente: {
    label: "Pendiente",
    className: "bg-gray-100 text-gray-800 border-gray-200",
  },
  en_progreso: {
    label: "En Progreso",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  completada: {
    label: "Completada",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  cancelada: {
    label: "Cancelada",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  suspendido: {
    label: "Suspendido",
    className: "bg-orange-100 text-orange-800 border-orange-200",
  },
};

export default async function PaginaDetalleActividad({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  // En Next.js 15/16 params es una promesa, hay que esperarla
  const { id } = await params;

  // 1. Buscamos la actividad y los departamentos
  const [actividad, departamentos] = await Promise.all([
    ActividadesService.obtenerPorId(id),
    DepartamentosService.obtenerTodos(),
  ]);

  // Si no existe, mandamos al 404
  if (!actividad) {
    notFound();
  }

  // --- FIX DE FECHA (El corazón del arreglo) ---
  // Como ahora 'fecha_inicio' es un string "YYYY-MM-DD", no usamos new Date().
  // Lo partimos manualmente para mostrarlo DD/MM/YYYY sin errores de zona horaria.
  let fechaVisual = "Fecha no definida";
  if (actividad.fecha_inicio) {
    const fechaStr = String(actividad.fecha_inicio); // Aseguramos que sea string
    // Si viene con hora (ISO), quitamos la hora. Si es simple, lo dejamos.
    const soloFecha = fechaStr.includes("T")
      ? fechaStr.split("T")[0]
      : fechaStr;
    const [anio, mes, dia] = soloFecha.split("-");
    fechaVisual = `${dia}/${mes}/${anio}`;
  }

  const estadoInfo = estadoMap[actividad.estado] || estadoMap["pendiente"];
  const rolUsuario = session.user.rol as Rol;
  const esSoloLectura = rolUsuario === "miembro_departamento";

  return (
    <div className="space-y-6">
      {/* Encabezado de Detalles (Solo lectura bonita) */}
      <div className="flex flex-col gap-4 border-b pb-6 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">
              {actividad.tipo}
            </Badge>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium border ${estadoInfo.className}`}
            >
              {estadoInfo.label}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            {actividad.titulo}
          </h1>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              {/* Aquí usamos la fecha visual corregida */}
              <span>{fechaVisual}</span>
            </div>
            {/* Si tuvieras ubicación o departamentos, podrías mostrarlos aquí */}
            {actividad.departamentos && actividad.departamentos.length > 0 && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{actividad.departamentos.length} Depto(s)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Formulario de Edición (Oculto si es solo lectura estricta, o en modo 'readOnly') */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
        <div className="p-6">
          {esSoloLectura ? (
            <div className="prose max-w-none">
              <h3 className="text-lg font-semibold mb-2">Descripción</h3>
              <p className="text-gray-600 whitespace-pre-wrap">
                {actividad.descripcion || "Sin descripción detallada."}
              </p>
            </div>
          ) : (
            /* Aquí cargamos tu componente de formulario existente */
            <FormularioEditarActividad
              actividad={actividad}
              departamentos={departamentos}
            />
          )}
        </div>
      </div>
    </div>
  );
}
