// /app/dashboard/actividades/page.tsx
import Link from "next/link";
import { auth } from "@/auth";
import type { Rol } from "@/types";
import { ActividadesService } from "@/services/actividades.service";
import { DepartamentosService } from "@/services/departamentos.service";

import { CronogramaActividades } from "@/components/actividades/cronograma-actividades";
import { TablaActividades } from "@/components/actividades/tabla-actividades";
import { Busqueda } from "@/components/busqueda";
import { Paginacion } from "@/components/paginacion";
import { TabsManager } from "@/components/actividades/tabs-manager";

import { Button } from "@/components/ui/button";
import { CalendarPlus } from "lucide-react";
import { TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export const revalidate = 0;

type PageProps = {
  searchParams: Promise<{
    q?: string;
    page?: string;
    tab?: string;
  }>;
};

export default async function PaginaCronograma({ searchParams }: PageProps) {
  const session = await auth();
  const rolUsuario = session?.user?.rol as Rol;
  const esSoloLectura = rolUsuario === "miembro_departamento";

  const params = await searchParams;
  const query = params.q || "";
  const currentPage = Number(params.page) || 1;
  const currentTab = params.tab || "cronograma";

  const [actividadesCalendario, datosTabla, departamentos] = await Promise.all([
    ActividadesService.obtenerTodas(),
    ActividadesService.obtenerPaginadas(currentPage, 10, query),
    DepartamentosService.obtenerTodos(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header General */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {/* CAMBIO: Capitalización corregida */}
          <h1 className="text-3xl font-bold tracking-tight">
            Gestión de actividades
          </h1>
          <p className="text-lg text-muted-foreground">
            Visualiza el cronograma o gestiona el listado completo.
          </p>
        </div>
        {!esSoloLectura && (
          <Button asChild>
            <Link href="/dashboard/actividades/crear">
              <CalendarPlus className="mr-2 h-4 w-4" />
              {/* CAMBIO: Capitalización corregida */}
              Nueva actividad
            </Link>
          </Button>
        )}
      </div>

      {/* Gestor de Pestañas */}
      <TabsManager defaultTab={currentTab}>
        <TabsContent value="cronograma">
          <CronogramaActividades
            actividades={actividadesCalendario}
            departamentos={departamentos}
            rolUsuario={rolUsuario}
          />
        </TabsContent>

        <TabsContent value="lista">
          <Card>
            <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between space-y-0 pb-4">
              <div className="space-y-1">
                {/* CAMBIO: Capitalización corregida */}
                <CardTitle>Listado general</CardTitle>
                <CardDescription>
                  Administra, busca y filtra todas las actividades.
                </CardDescription>
              </div>
              <div className="w-full sm:w-[300px]">
                <Busqueda placeholder="Buscar por título, tipo..." />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <TablaActividades
                  actividades={datosTabla.datos}
                  departamentos={departamentos}
                  rolUsuario={rolUsuario}
                />

                <div className="flex justify-end">
                  <Paginacion totalPaginas={datosTabla.paginas} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </TabsManager>
    </div>
  );
}
