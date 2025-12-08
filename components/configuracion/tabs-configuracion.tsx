// /components/configuracion/tabs-configuracion.tsx
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Activity, ShieldCheck } from "lucide-react";

type TabsConfigProps = {
  defaultTab: string;
  children: React.ReactNode;
};

export function TabsConfiguracion({ defaultTab, children }: TabsConfigProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", value);
    params.set("page", "1"); // Reiniciamos paginación al cambiar de tab
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <Tabs
      defaultValue={defaultTab}
      onValueChange={onTabChange}
      className="w-full"
    >
      <div className="flex items-center justify-between mb-4">
        <TabsList>
          <TabsTrigger value="notificaciones">
            <Activity className="mr-2 h-4 w-4" />
            Historial de notificaciones
          </TabsTrigger>
          <TabsTrigger value="cambios">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Auditoría de cambios
          </TabsTrigger>
        </TabsList>
      </div>
      {children}
    </Tabs>
  );
}
