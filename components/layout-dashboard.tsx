// /components/layout-dashboard.tsx
"use client";

import * as React from "react";
import Link from "next/link";
import {
  Home,
  Users,
  Calendar,
  Settings,
  LogOut,
  ChevronDown,
  ChevronRight,
  UserPlus,
  List,
  CalendarPlus,
  CalendarClock,
  BookOpen,
  FileText, // <--- 1. NUEVO ICONO IMPORTADO
} from "lucide-react";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  SidebarRail,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cerrarSesion } from "@/app/actions/autenticacion.actions";
import type { Usuario } from "@/types";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

function MenuCollapsibleTrigger({
  label,
  icon,
  tooltip,
}: {
  label: string;
  icon: React.ReactNode;
  tooltip: string;
}) {
  return (
    <CollapsibleTrigger asChild>
      <SidebarMenuButton
        tooltip={tooltip}
        className="h-11 group/menu-button w-full justify-between"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span>{label}</span>
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]/menu-button:rotate-90" />
      </SidebarMenuButton>
    </CollapsibleTrigger>
  );
}

export function LayoutDashboard({
  usuario,
  children,
}: {
  usuario: Usuario;
  children: React.ReactNode;
}) {
  const [isPending, startTransition] = React.useTransition();

  const handleCerrarSesion = () => {
    startTransition(async () => {
      await cerrarSesion();
    });
  };

  return (
    <SidebarProvider defaultOpen>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarRail />
        <SidebarHeader>
          <div className="flex h-14 items-center justify-center">
            {/* Asegúrate que esta imagen exista en /public o cambia el src */}
            <img
              src="/Inaturlogo.png"
              alt="Logo INATUR"
              className="h-14 w-auto object-contain"
            />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                asChild
                isActive
                tooltip="Inicio"
                className="h-11"
              >
                <Link href="/dashboard">
                  <Home className="size-4" />
                  <span>Inicio</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Menú de Actividades */}
            <Collapsible asChild>
              <SidebarMenuItem>
                <MenuCollapsibleTrigger
                  label="Gestión de actividades"
                  tooltip="Actividades"
                  icon={<Calendar className="size-4" />}
                />
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {(usuario.rol === "superusuario" ||
                      usuario.rol === "jefe_departamento") && (
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          href="/dashboard/actividades/crear"
                          className="h-11"
                        >
                          <CalendarPlus className="size-4" />
                          <span>Crear actividad</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    )}
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        href="/dashboard/actividades"
                        className="h-11"
                      >
                        <CalendarClock className="size-4" />
                        <span>Ver cronograma</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            {/* Menú de Usuarios */}
            {usuario.rol === "superusuario" && (
              <Collapsible asChild>
                <SidebarMenuItem>
                  <MenuCollapsibleTrigger
                    label="Gestión de usuarios"
                    tooltip="Usuarios"
                    icon={<Users className="size-4" />}
                  />
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          href="/dashboard/usuarios"
                          className="h-11"
                        >
                          <List className="size-4" />
                          <span>Ver todos</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          href="/dashboard/usuarios/crear"
                          className="h-11"
                        >
                          <UserPlus className="size-4" />
                          <span>Crear usuario</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )}

            {/* Menú de Jefe de Departamento */}
            {usuario.rol === "jefe_departamento" && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Mi departamento"
                  className="h-11"
                >
                  <Link href="/dashboard/mi-departamento">
                    <Users className="size-4" />
                    <span>Mi departamento</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}

            {/* --- 2. AQUÍ AGREGAMOS LA NUEVA OPCIÓN REPORTES --- */}
            <SidebarMenuItem>
              <SidebarMenuButton asChild tooltip="Reportes" className="h-11">
                <Link href="/dashboard/reportes">
                  <FileText className="size-4" />
                  <span>Reportes</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            {/* -------------------------------------------------- */}

            {/* Configuración */}
            {usuario.rol === "superusuario" && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  tooltip="Configuración"
                  className="h-11"
                >
                  <Link href="/dashboard/configuracion">
                    <Settings className="size-4" />
                    <span>Configuración</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter />
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1"></div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 rounded-full p-1 pr-3"
              >
                <Avatar className="size-8">
                  <AvatarImage
                    src="/placeholder-user.jpg"
                    alt={usuario.nombre_completo}
                  />
                  <AvatarFallback>
                    {getInitials(usuario.nombre_completo)}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden flex-col items-start text-left sm:flex">
                  <span className="text-sm font-medium">
                    {usuario.nombre_completo}
                  </span>
                  <span className="text-xs text-muted-foreground capitalize">
                    {usuario.rol.replace("_", " ")}
                  </span>
                </div>
                <ChevronDown className="size-4 text-muted-foreground sm:ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <span className="block text-sm font-medium">
                  {usuario.nombre_completo}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {usuario.email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href="/dashboard/perfil">
                  <Settings className="mr-2 size-4" />
                  <span>Mi perfil</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <a
                  href="/manual-usuario.pdf"
                  download="Manual_Usuario_INATUR.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="cursor-pointer"
                >
                  <BookOpen className="mr-2 size-4" />
                  <span>Manual de usuario</span>
                </a>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={handleCerrarSesion}
                disabled={isPending}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 size-4" />
                <span>{isPending ? "Cerrando..." : "Cerrar sesión"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/30 dark:bg-muted/10">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
