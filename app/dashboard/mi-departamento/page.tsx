// /app/dashboard/mi-departamento/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Users } from "lucide-react";
import { DepartamentosService } from "@/services/departamentos.service";
import { UsuariosService } from "@/services/usuarios.service";

// Función auxiliar (copiada de /usuarios/page.tsx)
function traducirRol(rol: string) {
  switch (rol) {
    case "superusuario":
      return "Superusuario";
    case "jefe_departamento":
      return "Jefe de Departamento";
    case "miembro_departamento":
      return "Miembro";
    default:
      return rol;
  }
}

export default async function PaginaMiDepartamento() {
  const session = await auth();

  // 1. Verificación de Sesión y Rol
  if (!session?.user) {
    redirect("/");
  }

  if (session.user.rol !== "jefe_departamento") {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Acceso Denegado</AlertTitle>
        <AlertDescription>
          Esta sección es solo para Jefes de Departamento.
        </AlertDescription>
      </Alert>
    );
  }

  // 2. Obtener el departamento del Jefe
  const usuario = await UsuariosService.obtenerUsuarioPorId(session.user.id);

  if (!usuario?.departamento_id) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error de Configuración</AlertTitle>
        <AlertDescription>
          No estás asignado a ningún departamento. Contacta al administrador.
        </AlertDescription>
      </Alert>
    );
  }

  const departamentoId = usuario.departamento_id;

  // 3. Obtener Datos
  const [usuarios, departamento] = await Promise.all([
    UsuariosService.obtenerUsuariosPorDepartamentoId(departamentoId),
    DepartamentosService.obtenerPorId(departamentoId),
  ]);

  const nombreDepartamento = departamento?.nombre || "Departamento Desconocido";

  return (
    <div className="flex flex-col gap-6">
      {/* Cabecera de la página */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Mi departamento 👩‍👧‍👦
          </h1>
          <p className="text-lg text-muted-foreground">
            Miembros de: {nombreDepartamento}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Miembros registrados</CardTitle>
          <CardDescription>
            Usuarios asignados a tu departamento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>Cédula</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                {/* Columna de Acciones ELIMINADA */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    No se encontraron usuarios en tu departamento.
                  </TableCell>
                </TableRow>
              )}
              {usuarios.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell className="font-medium">
                    {usuario.nombre_completo}
                  </TableCell>
                  <TableCell>{usuario.cedula}</TableCell>
                  <TableCell>{usuario.telefono || "N/A"}</TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        usuario.rol === "jefe_departamento"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {traducirRol(usuario.rol)}
                    </Badge>
                  </TableCell>
                  {/* Celda de Acciones ELIMINADA */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
