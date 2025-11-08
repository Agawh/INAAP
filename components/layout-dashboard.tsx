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
  UserPlus, // Para "Crear Usuario"
  List, // Para "Ver Todos"
  CalendarPlus,
  CalendarClock,
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
} from "@/components/ui/sidebar"; //
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"; //
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
import { cn } from "@/lib/utils";

// (Función getInitials sin cambios)
function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

// Componente para el botón del menú desplegable
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
      {/* --- ¡CAMBIO DE TAMAÑO! --- */}
      <SidebarMenuButton
        tooltip={tooltip}
        className="h-11 group/menu-button w-full justify-between" // Aumentado a h-11
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
          {/* --- ¡CAMBIO DE TAMAÑO DEL LOGO! --- */}
          <div className="flex h-14 items-center justify-center">
            {" "}
            {/* Aumentado a h-14 */}
            <img
              src="/Inaturlogo.png" //
              alt="Logo INATUR"
              className="h-14 w-auto object-contain" // Aumentado a h-14
            />
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
              {/* --- ¡CAMBIO DE TAMAÑO! --- */}
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

            {/* --- Menú Desplegable: Actividades --- */}
            <Collapsible asChild>
              <SidebarMenuItem>
                <MenuCollapsibleTrigger
                  label="Gestión de Actividades"
                  tooltip="Actividades"
                  icon={<Calendar className="size-4" />}
                />
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      {/* --- ¡CAMBIO DE TAMAÑO! --- */}
                      <SidebarMenuSubButton
                        href="/dashboard/actividades/crear"
                        className="h-11"
                      >
                        <CalendarPlus className="size-4" />
                        <span>Crear actividad</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      {/* --- ¡CAMBIO DE TAMAÑO! --- */}
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

            {/* --- ¡MENÚ CONSOLIDADO! --- */}
            {usuario.rol === "superusuario" && (
              <Collapsible asChild>
                <SidebarMenuItem>
                  <MenuCollapsibleTrigger
                    label="Gestión de Usuarios"
                    tooltip="Usuarios"
                    icon={<Users className="size-4" />}
                  />
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {/* 1. Ver todos */}
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          href="/dashboard/usuarios"
                          className="h-11"
                        >
                          <List className="size-4" />
                          <span>Ver todos</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      {/* 2. Solo un botón de Crear */}
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton
                          href="/dashboard/usuarios/crear"
                          className="h-11"
                        >
                          <UserPlus className="size-4" />
                          <span>Crear Usuario</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            )}

            {/* Menú de Configuración (solo Superusuario) */}
            {usuario.rol === "superusuario" && (
              <SidebarMenuItem>
                {/* --- ¡CAMBIO DE TAMAÑO! --- */}
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
        {/* --- Header Principal --- */}
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
            {/* Espacio para título de página o breadcrumbs */}
          </div>

          {/* --- Menú de Usuario --- */}
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
              <DropdownMenuItem>
                <Settings className="mr-2 size-4" />
                <span>Mi Perfil</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={handleCerrarSesion}
                disabled={isPending}
                className="text-destructive focus:text-destructive"
              >
                <LogOut className="mr-2 size-4" />
                <span>{isPending ? "Cerrando..." : "Cerrar Sesión"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* --- Contenido de la Página --- */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/30 dark:bg-muted/10">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
