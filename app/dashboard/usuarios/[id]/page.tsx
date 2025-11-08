// /app/dashboard/usuarios/[id]/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DepartamentosService } from "@/services/departamentos.service";
import { UsuariosService } from "@/services/usuarios.service";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { FormularioEditarUsuario } from "@/components/formulario-editar-usuario";

// --- ¡CORRECCIÓN 1! ---
// Los 'params' ahora se tipan como una Promise, como dijiste.
type EditarUsuarioPageProps = {
  params: Promise<{
    id: string; // El ID del usuario desde la URL
  }>;
};

export default async function EditarUsuarioPage({
  params,
}: EditarUsuarioPageProps) {
  const session = await auth();

  // 1. Verificación de Seguridad
  if (!session?.user || session.user.rol !== "superusuario") {
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

  // --- ¡CORRECCIÓN 2! ---
  // Hacemos 'await' de los params para obtener el 'id'
  const { id: idParaEditar } = await params;
  console.log(`[DEBUG] Intentando editar usuario con ID: ${idParaEditar}`); // Esto AHORA sí mostrará el ID

  // 2. Obtener los datos del usuario específico y los departamentos
  const [usuario, departamentos] = await Promise.all([
    UsuariosService.obtenerUsuarioPorId(idParaEditar),
    DepartamentosService.obtenerTodos(),
  ]);

  // 3. Si el usuario no existe
  if (!usuario) {
    console.error(
      `[DEBUG] No se encontró ningún usuario con el ID: ${idParaEditar}`
    );
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Usuario no Encontrado</AlertTitle>
        <AlertDescription>
          No se pudo encontrar el usuario que intentas editar (ID:{" "}
          {idParaEditar}).
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Editar Usuario</h1>
        <p className="text-lg text-muted-foreground">
          Modificar los datos de{" "}
          <span className="font-semibold">{usuario.nombre_completo}</span>.
        </p>
      </div>

      {/* 4. Renderizar el formulario de edición */}
      <FormularioEditarUsuario
        usuario={usuario}
        departamentos={departamentos}
      />
    </div>
  );
}
