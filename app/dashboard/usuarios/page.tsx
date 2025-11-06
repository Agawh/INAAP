import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card"; //
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"; //
import { Button } from "@/components/ui/button"; //
import { Badge } from "@/components/ui/badge"; //
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"; //
import { AlertTriangle, PlusCircle, MoreHorizontal } from "lucide-react";
import { DepartamentosService } from "@/services/departamentos.service"; //
import { UsuariosService } from "@/services/usuarios.service"; //
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; //

// Función para traducir roles
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

export default async function GestionUsuariosPage() {
  const session = await auth();

  // 1. Verificación de Seguridad
  if (!session?.user || session.user.rol !== "superusuario") {
    // Si no es superusuario, mostrar un error de acceso
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Acceso Denegado</AlertTitle>
        <AlertDescription>
          No tienes permisos para acceder a esta sección.
        </AlertDescription>
      </Alert>
    );
  }

  // 2. Obtener Datos
  const [usuarios, departamentos] = await Promise.all([
    UsuariosService.obtenerTodos(),
    DepartamentosService.obtenerTodos(),
  ]);

  // Crear un mapa para buscar nombres de departamentos fácilmente
  const deptMap = new Map(departamentos.map((d) => [d.id, d.nombre]));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Gestión de Usuarios
          </h1>
          <p className="text-lg text-muted-foreground">
            Crear, editar y administrar usuarios del sistema.
          </p>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Crear Usuario
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios Registrados</CardTitle>
          <CardDescription>
            Un total de {usuarios.length} usuarios encontrados.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {usuarios.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell className="font-medium">
                    {usuario.nombre_completo}
                  </TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        usuario.rol === "superusuario" ? "default" : "secondary"
                      }
                    >
                      {traducirRol(usuario.rol)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {deptMap.get(usuario.departamento_id) || "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Editar</DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
