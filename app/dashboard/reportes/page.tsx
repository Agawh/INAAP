"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, Loader2, Filter, Info } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  obtenerActividadesReporte,
  obtenerDepartamentos,
} from "@/app/actions/actividades.actions";

export default function ReportesPage() {
  const [loading, setLoading] = useState(false);
  const [departamentos, setDepartamentos] = useState<
    { id: string; nombre: string }[]
  >([]);

  // Fechas por defecto
  const hoy = new Date();
  const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const diaActual = hoy.toISOString().split("T")[0];

  const [fechaInicio, setFechaInicio] = useState(primerDiaMes);
  const [fechaFin, setFechaFin] = useState(diaActual);
  const [departamentoId, setDepartamentoId] = useState("todos");

  // Nombre del departamento seleccionado (para mostrar en el resumen)
  const nombreDeptoSeleccionado =
    departamentoId === "todos"
      ? "Todos (Institucional)"
      : departamentos.find((d) => d.id === departamentoId)?.nombre ||
        "Desconocido";

  useEffect(() => {
    const cargarDeptos = async () => {
      const data = await obtenerDepartamentos();
      setDepartamentos(data);
    };
    cargarDeptos();
  }, []);

  const generarPDF = async () => {
    setLoading(true);
    try {
      const datos = await obtenerActividadesReporte(
        fechaInicio,
        fechaFin,
        departamentoId
      );

      if (!datos || datos.length === 0) {
        toast.warning("No se encontraron actividades en este rango.");
        setLoading(false);
        return;
      }

      const doc = new jsPDF();
      doc.setFont("times", "normal");

      // --- LOGO ---
      try {
        const img = new Image();
        img.src = "/Inaturlogo.png";
        doc.addImage(img, "PNG", 14, 10, 22, 22);
      } catch (e) {
        console.warn("Logo no cargado");
      }

      // --- ENCABEZADO OFICIAL (Mejorado) ---
      // Texto institucional en tamaño 9 (uniforme)
      doc.setFontSize(9);
      doc.setTextColor(40); // Gris oscuro elegante
      doc.text("REPÚBLICA BOLIVARIANA DE VENEZUELA", 105, 16, {
        align: "center",
      });
      doc.text("MINISTERIO DEL PODER POPULAR PARA EL TURISMO", 105, 21, {
        align: "center",
      });

      // Nombre de la unidad un poco más destacado pero sutil
      doc.setFont("times", "bold");
      doc.text("INATUR - UNIDAD ESTADAL TÁCHIRA", 105, 26, { align: "center" });

      // Línea separadora fina
      doc.setDrawColor(200);
      doc.setLineWidth(0.1);
      doc.line(14, 32, 196, 32);

      // --- TÍTULO Y SUBTÍTULO ---
      doc.setFontSize(14); // Tamaño título principal
      doc.setTextColor(0); // Negro

      const titulo =
        departamentoId === "todos"
          ? "Reporte de gestión institucional"
          : `Reporte de gestión: ${nombreDeptoSeleccionado}`;

      doc.text(titulo, 14, 45);

      // Rango de fechas (subtítulo)
      doc.setFontSize(11);
      doc.setFont("times", "normal");
      doc.setTextColor(60);
      const rango = `Desde el ${format(new Date(fechaInicio), "dd 'de' MMMM", {
        locale: es,
      })} al ${format(new Date(fechaFin), "dd 'de' MMMM 'de' yyyy", {
        locale: es,
      })}`;
      doc.text(rango, 14, 52);

      // --- TABLA DE DATOS ---
      const filas = datos.map((act: any) => [
        format(new Date(act.fecha_inicio), "dd/MM/yy"),
        act.titulo,
        act.tipo === "operativa" ? "Operativa" : "Efeméride",
        act.departamentos || "General",
        // Capitalizamos solo la primera letra del estado
        act.estado.charAt(0).toUpperCase() + act.estado.slice(1).toLowerCase(),
      ]);

      autoTable(doc, {
        startY: 60,
        // Encabezados en mayúsculas sostenidas estándar
        head: [["FECHA", "ACTIVIDAD", "TIPO", "RESPONSABLE", "ESTADO"]],
        body: filas,
        theme: "plain",
        styles: {
          font: "times",
          fontSize: 10,
          cellPadding: 3,
          valign: "top",
          textColor: 40,
          lineWidth: 0,
        },
        headStyles: {
          fontStyle: "bold",
          textColor: 0,
          fillColor: false,
          lineWidth: 0,
          valign: "bottom",
          fontSize: 9,
        },
        columnStyles: {
          0: { cellWidth: 20, fontStyle: "bold" }, // Fecha
          1: { cellWidth: "auto" }, // Actividad
          2: { cellWidth: 25 }, // Tipo
          3: { cellWidth: 40 }, // Responsable (más ancho)
          4: { cellWidth: 25 }, // Estado
        },
        didDrawCell: (data) => {
          // Líneas horizontales grises finas para separar filas
          if (data.section === "head" || data.section === "body") {
            doc.setDrawColor(220);
            doc.setLineWidth(0.1);
            doc.line(
              data.cell.x,
              data.cell.y + data.cell.height,
              data.cell.x + data.cell.width,
              data.cell.y + data.cell.height
            );
          }
        },
        margin: { top: 60, bottom: 20, left: 14, right: 14 },
      });

      // --- PIE DE PÁGINA ---
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Página ${i} de ${pageCount}`, 196, 285, { align: "right" });
        doc.text(
          `Generado el ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
          14,
          285,
          { align: "left" }
        );
      }

      const nombreArchivo = `Reporte_${departamentoId}_${fechaFin}.pdf`;
      doc.save(nombreArchivo);
      toast.success("Reporte descargado correctamente");
    } catch (error) {
      console.error(error);
      toast.error("Error al generar el PDF");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Reportes
        </h1>
        <p className="text-slate-500 mt-2">
          Generar documentos en formato PDF de las actividades realizadas.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-12">
        {/* PANEL IZQUIERDO: CONFIGURACIÓN */}
        <Card className="md:col-span-5 shadow-lg !bg-white border border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Filter className="h-5 w-5" />
              Filtros del reporte
            </CardTitle>
            <CardDescription className="text-slate-500">
              Seleccione los parámetros
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-700">Departamento</Label>
                <Select
                  value={departamentoId}
                  onValueChange={setDepartamentoId}
                >
                  <SelectTrigger className="!bg-white border-slate-300 text-slate-800">
                    <SelectValue placeholder="Seleccione..." />
                  </SelectTrigger>
                  <SelectContent className="!bg-white">
                    <SelectItem value="todos">Todos (Institucional)</SelectItem>
                    {departamentos.map((depto) => (
                      <SelectItem key={depto.id} value={depto.id}>
                        {depto.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-700">Desde</Label>
                  <Input
                    type="date"
                    className="!bg-white border-slate-300 text-slate-800"
                    value={fechaInicio}
                    onChange={(e) => setFechaInicio(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-700">Hasta</Label>
                  <Input
                    type="date"
                    className="!bg-white border-slate-300 text-slate-800"
                    value={fechaFin}
                    onChange={(e) => setFechaFin(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <Button
              className="w-full bg-slate-900 hover:bg-slate-800 text-white mt-4"
              onClick={generarPDF}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generando...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" /> Descargar PDF
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* PANEL DERECHO: RESUMEN (Antes "Vista Previa") */}
        {/* Ahora muestra información útil en tiempo real */}
        <Card className="md:col-span-7 !bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2 text-slate-700">
              <Info className="h-5 w-5" />
              Resumen del documento
            </CardTitle>
            <CardDescription>
              Detalles del archivo que se va a generar
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col justify-center gap-6 py-6 px-8">
            {/* Visualización simulada del reporte */}
            <div className="border border-slate-100 rounded-lg p-6 bg-slate-50/50 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-xs font-semibold uppercase text-slate-400">
                  Tipo de formato
                </span>
                <span className="text-sm font-medium text-slate-800">PDF</span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-xs font-semibold uppercase text-slate-400">
                  Alcance
                </span>
                <span className="text-sm font-bold text-blue-900 truncate max-w-[200px]">
                  {nombreDeptoSeleccionado}
                </span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                <span className="text-xs font-semibold uppercase text-slate-400">
                  Período
                </span>
                <span className="text-sm text-slate-600">
                  {format(new Date(fechaInicio), "dd/MM/yy")} —{" "}
                  {format(new Date(fechaFin), "dd/MM/yy")}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold uppercase text-slate-400">
                  Formato
                </span>
                <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded">
                  A4 / Times New Roman
                </span>
              </div>
            </div>

            <p className="text-center text-xs text-slate-400 mt-2">
              El documento incluirá encabezado institucional y tabla de
              actividades detallada.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
