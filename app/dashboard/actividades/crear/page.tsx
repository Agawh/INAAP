// /app/dashboard/actividades/crear/page.tsx
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { DepartamentosService } from "@/services/departamentos.service";
// --- CAMBIO: Ya no importamos UsuariosService ---
// import { UsuariosService } from "@/services/usuarios.service";
import { FormularioCrearActividad } from "@/components/actividades/formulario-crear-actividad";

export default async function CrearActividadPage() {
  const session = await auth();

  // 1. Verificación de Seguridad
  if (!session?.user) {
    redirect("/");
  }

  // 2. Obtener datos para los <Checkbox> del formulario
  // --- CAMBIO: Solo cargamos departamentos ---
  const departamentos = await DepartamentosService.obtenerTodos();

  // const [departamentos, usuarios] = await Promise.all([
  //   DepartamentosService.obtenerTodos(),
  //   UsuariosService.obtenerTodos(),
  // ]); // <-- ELIMINADO

  // 3. Renderizar la página y el formulario
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Crear Nueva Actividad
        </h1>
        <p className="text-lg text-muted-foreground">
          Complete los campos para registrar una nueva efeméride o actividad
          operativa.
        </p>
      </div>

      <FormularioCrearActividad
        departamentos={departamentos}
        // --- CAMBIO: Ya no pasamos usuarios ---
        // usuarios={usuarios} // <-- ELIMINADO
      />
    </div>
  );
}
