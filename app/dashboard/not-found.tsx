// /app/dashboard/not-found.tsx
import Link from "next/link";
import { FileQuestion, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="flex h-[70vh] w-full items-center justify-center p-4">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader className="pb-2">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <FileQuestion className="h-8 w-8 text-muted-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Página no encontrada
          </CardTitle>
        </CardHeader>

        <CardContent className="text-muted-foreground">
          <p>
            El recurso que estás buscando no existe, ha sido movido o no tienes
            permisos para verlo.
          </p>
        </CardContent>

        <CardFooter className="flex justify-center gap-4 pt-2">
          {/* Botón para volver atrás (usando navegación del navegador en el cliente o link relativo) */}
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>

          <Button asChild>
            <Link href="/dashboard">
              <Home className="mr-2 h-4 w-4" />
              Ir al Inicio
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
