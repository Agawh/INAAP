// /app/dashboard/actividades/crear/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DepartamentosService } from "@/services/departamentos.service";
import { FormularioCrearActividad } from "@/components/actividades/formulario-crear-actividad";
// --- ¡CAMBIO! Importamos el servicio de usuarios para obtener el departamento del Jefe ---
import { UsuariosService } from "@/services/usuarios.service";
import type { Departamento } from "@/types"; // Importamos el tipo

export default async function CrearActividadPage() {
  const session = await auth();

  // 1. Verificación de Seguridad
  if (!session?.user?.id) {
    redirect("/");
  }

  // --- ¡CAMBIO! Lógica de carga de departamentos basada en ROL ---
  let departamentos: Departamento[] = [];
  let departamentoJefe: Departamento | null = null;

  if (session.user.rol === "superusuario") {
    // El Superusuario ve todos los departamentos
    departamentos = await DepartamentosService.obtenerTodos();
  } else if (session.user.rol === "jefe_departamento") {
    // El Jefe de Departamento solo puede asignar a su propio departamento
    const usuario = await UsuariosService.obtenerUsuarioPorId(session.user.id);
    if (usuario?.departamento_id) {
      departamentoJefe = await DepartamentosService.obtenerPorId(
        usuario.departamento_id
      );
      if (departamentoJefe) {
        departamentos = [departamentoJefe]; // La lista solo contiene un item
      }
    }
  }
  // (Si es 'miembro_departamento', la lista 'departamentos' quedará vacía)
  // --- FIN DEL CAMBIO ---

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Crear nueva actividad
        </h1>
        <p className="text-lg text-muted-foreground">
          Complete los campos para registrar una nueva efeméride o actividad
          operativa.
        </p>
      </div>

      <FormularioCrearActividad
        departamentos={departamentos}
        // Pasamos el rol para que el formulario sepa cómo renderizarse
        rolUsuario={session.user.rol}
      />
    </div>
  );
}
