// /app/dashboard/loading.tsx
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 p-2">
      {" "}
      {/* Padding ajustado para coincidir */}
      {/* 1. Header: Título y Bienvenida */}
      <div className="space-y-2">
        <Skeleton className="h-9 w-64 rounded-md bg-primary/10" />
        <Skeleton className="h-5 w-96 rounded-md bg-muted" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 2. KPIs: 3 Tarjetas Superiores */}
        {/* Usamos un array para generar las 3 idénticas */}
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24 bg-muted" />
              <Skeleton className="h-4 w-4 rounded-full bg-muted" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 bg-primary/10" />
            </CardContent>
          </Card>
        ))}

        {/* 3. Tabla de Próximas Actividades (Ocupa 2 columnas) */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="space-y-2">
            <Skeleton className="h-6 w-48 bg-primary/10" />
            <Skeleton className="h-4 w-72 bg-muted" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Header de la Tabla */}
              <div className="flex justify-between py-2">
                <Skeleton className="h-4 w-24 bg-muted" />
                <Skeleton className="h-4 w-24 bg-muted" />
                <Skeleton className="h-4 w-24 bg-muted" />
              </div>
              {/* Filas simuladas */}
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between py-3 border-b border-border/50 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full bg-muted/50" />{" "}
                    {/* Avatar/Icono */}
                    <div className="space-y-1">
                      <Skeleton className="h-4 w-32 bg-muted" />
                      <Skeleton className="h-3 w-20 bg-muted/60" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full bg-muted/40" />{" "}
                  {/* Badge Estado */}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 4. Gráfico Circular (Ocupa 1 columna) */}
        <Card className="lg:col-span-1 shadow-sm">
          <CardHeader>
            <Skeleton className="h-6 w-32 bg-primary/10" />
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8 gap-6">
            {/* El Donut Chart */}
            <div className="relative flex items-center justify-center">
              <Skeleton className="h-48 w-48 rounded-full border-8 border-muted/20 bg-transparent" />
            </div>
            {/* Leyenda del gráfico */}
            <div className="flex gap-4">
              <Skeleton className="h-3 w-16 rounded-full bg-muted" />
              <Skeleton className="h-3 w-16 rounded-full bg-muted" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
