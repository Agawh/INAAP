// /app/dashboard/perfil/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { UsuariosService } from "@/services/usuarios.service";
import type { Usuario, ConfiguracionNotificaciones } from "@/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
// Importamos el formulario que crearemos en el sig. paso
import { FormularioPerfil } from "@/components/perfil/formulario-perfil";

// Creamos una configuración por defecto por si el usuario
// (por alguna razón) no la tiene en la BD.
const configPorDefecto: ConfiguracionNotificaciones = {
  id: "",
  usuario_id: "",
  telegram_habilitado: true,
  email_habilitado: true,
  calendario_habilitado: true,
  dias_anticipacion: 3,
};

export default async function PaginaPerfil() {
  const session = await auth();

  // 1. Verificación de Seguridad
  if (!session?.user?.id) {
    redirect("/");
  }

  const usuarioId = session.user.id;

  // 2. Obtener datos del usuario y sus configuraciones
  const [usuario, configuracion] = await Promise.all([
    UsuariosService.obtenerUsuarioPorId(usuarioId),
    UsuariosService.obtenerConfiguracionNotificaciones(usuarioId),
  ]);

  // 3. Verificar que el usuario exista
  if (!usuario) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error de Usuario</AlertTitle>
        <AlertDescription>
          No se pudieron cargar los datos de tu perfil.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mi Perfil</h1>
        <p className="text-lg text-muted-foreground">
          Gestiona tu información personal y tus preferencias.
        </p>
      </div>

      {/* 4. Renderizar el formulario de cliente */}
      <FormularioPerfil
        usuario={usuario}
        // Pasamos la configuración o la de por defecto
        configuracion={
          configuracion || { ...configPorDefecto, usuario_id: usuarioId }
        }
      />
    </div>
  );
}
