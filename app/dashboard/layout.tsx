// /app/dashboard/layout.tsx
import * as React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
// --- ¡ESTA ES LA CORRECCIÓN! ---
// La función ahora se importa desde el servicio de usuarios, no de lib/auth
import { UsuariosService } from "@/services/usuarios.service"; //
import { LayoutDashboard } from "@/components/layout-dashboard";
import type { Usuario } from "@/types"; //

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 1. Obtener la sesión del servidor
  const session = await auth();

  // 2. Si no hay sesión, redirigir al login
  if (!session?.user?.id) {
    redirect("/");
  }

  // --- ¡Y AQUÍ SE USA LA IMPORTACIÓN CORRECTA! ---
  // 3. Obtener los datos completos del usuario desde el servicio
  const usuario = await UsuariosService.obtenerUsuarioPorId(session.user.id);

  if (!usuario) {
    // Si el usuario fue borrado de la BD pero la sesión aún existe
    // Forzamos un cierre de sesión redirigiendo
    redirect("/api/auth/signout");
  }

  // 4. Pasar el usuario al layout de cliente
  return (
    <LayoutDashboard usuario={usuario as Usuario}>{children}</LayoutDashboard>
  );
}
