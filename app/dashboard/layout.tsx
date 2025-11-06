// /app/dashboard/layout.tsx
import * as React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { obtenerUsuarioPorId } from "@/lib/auth"; //
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

  // 3. Obtener los datos completos del usuario desde la BD
  // La sesión solo tiene id, email, name, rol.
  // Usamos obtenerUsuarioPorId para cargar el resto de datos si es necesario.
  const usuario = await obtenerUsuarioPorId(session.user.id);

  if (!usuario) {
    // Si el usuario fue borrado de la BD pero la sesión aún existe
    redirect("/");
  }

  // 4. Pasar el usuario al layout de cliente
  return (
    <LayoutDashboard usuario={usuario as Usuario}>{children}</LayoutDashboard>
  );
}
