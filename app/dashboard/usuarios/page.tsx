import Link from "next/link";
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, PlusCircle, MoreHorizontal } from "lucide-react";
import { DepartamentosService } from "@/services/departamentos.service";
import { UsuariosService } from "@/services/usuarios.service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { BusquedaUsuarios } from "@/components/busqueda-usuarios";
import { BotonEliminarUsuario } from "@/components/boton-eliminar-usuario";

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

// Definición correcta de tipos para Next.js 15+
type PageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function GestionUsuariosPage({ searchParams }: PageProps) {
  const session = await auth();

  // Esperamos los parámetros de búsqueda
  const params = await searchParams;
  const filtro = typeof params.q === "string" ? params.q : "";

  // 1. Verificación de Sesión
  if (!session?.user) {
    redirect("/");
  }

  // 2. Verificación de Rol
  if (session.user.rol !== "superusuario") {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Acceso denegado</AlertTitle>
        <AlertDescription>
          No tienes permisos para acceder a esta sección.
        </AlertDescription>
      </Alert>
    );
  }

  const idUsuarioLogueado = session.user.id;

  // 4. Obtener Datos
  const [usuarios, departamentos] = await Promise.all([
    UsuariosService.obtenerTodos(filtro),
    DepartamentosService.obtenerTodos(),
  ]);

  const deptMap = new Map(departamentos.map((d) => [d.id, d.nombre]));

  return (
    // CONTENEDOR PRINCIPAL: Limitamos el ancho máximo para evitar desbordes globales
    <div className="flex flex-col gap-6 w-full max-w-[90vw] md:max-w-full mx-auto">
      {/* Cabecera de la página */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Gestión de usuarios
          </h1>
          <p className="text-sm sm:text-lg text-muted-foreground">
            Crear, editar y administrar usuarios del sistema.
          </p>
        </div>
        <Button asChild className="w-full sm:w-auto">
          <Link href="/dashboard/usuarios/crear">
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear usuario
          </Link>
        </Button>
      </div>

      {/* TARJETA: overflow-hidden evita que el contenido rompa los bordes redondeados */}
      <Card className="w-full overflow-hidden">
        <CardHeader>
          <CardTitle>Usuarios registrados</CardTitle>
          <CardDescription>
            <div className="mt-4 max-w-sm">
              <BusquedaUsuarios />
            </div>
          </CardDescription>
        </CardHeader>

        {/* CARD CONTENT: Aquí es donde ocurre la magia del scroll */}
        <CardContent className="p-0 sm:p-6 overflow-hidden">
          <div className="w-full overflow-x-auto pb-4">
            {/* TABLE: min-w asegura que no se aplaste. 
                Si la pantalla es pequeña, aparecerá el scroll horizontal */}
            <Table className="min-w-[800px] lg:min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Nombre completo</TableHead>
                  <TableHead>Cédula</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      No se encontraron usuarios con ese filtro.
                    </TableCell>
                  </TableRow>
                )}
                {usuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span>{usuario.nombre_completo}</span>
                        {/* En móvil mostramos el email debajo del nombre para ahorrar espacio */}
                        <span className="text-xs text-muted-foreground sm:hidden">
                          {usuario.email}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{usuario.cedula}</TableCell>
                    <TableCell>{usuario.telefono || "N/A"}</TableCell>
                    {/* Ocultamos email en columnas pequeñas porque ya lo pusimos bajo el nombre */}
                    <TableCell className="hidden sm:table-cell">
                      {usuario.email}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          usuario.rol === "superusuario"
                            ? "default"
                            : "secondary"
                        }
                        className="whitespace-nowrap"
                      >
                        {traducirRol(usuario.rol)}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="max-w-[150px] truncate"
                      title={deptMap.get(usuario.departamento_id)}
                    >
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
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/usuarios/${usuario.id}`}>
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          <BotonEliminarUsuario
                            usuarioId={usuario.id}
                            nombreUsuario={usuario.nombre_completo}
                            idUsuarioLogueado={idUsuarioLogueado}
                          />
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
