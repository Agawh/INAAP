// /app/dashboard/error.tsx
"use client"; // Los Error Components deben ser Client Components

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Aquí podrías registrar el error en un servicio de logs como Sentry
    console.error("Error en el Dashboard:", error);
  }, [error]);

  return (
    <div className="flex h-[70vh] w-full items-center justify-center p-4">
      <Card className="w-full max-w-md border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/10">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-xl font-bold text-red-900 dark:text-red-100">
            ¡Ups! Algo salió mal
          </CardTitle>
        </CardHeader>

        <CardContent className="text-center text-sm text-red-800/80 dark:text-red-200/70">
          <p>No pudimos cargar la información solicitada.</p>
          <div className="mt-4 rounded bg-white/50 p-2 font-mono text-xs text-red-700 dark:bg-black/20">
            {error.message || "Error desconocido del sistema"}
          </div>
        </CardContent>

        <CardFooter className="flex justify-center pb-6">
          <Button
            onClick={() => reset()}
            variant="outline"
            className="border-red-200 hover:bg-red-100 hover:text-red-900 dark:border-red-800 dark:hover:bg-red-900/50"
          >
            <RefreshCcw className="mr-2 h-4 w-4" />
            Intentar nuevamente
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
