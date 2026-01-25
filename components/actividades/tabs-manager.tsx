// /components/actividades/tabs-manager.tsx
"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CalendarIcon, ListFilter } from "lucide-react";

type TabsManagerProps = {
  defaultTab: string;
  children: React.ReactNode;
};

export function TabsManager({ defaultTab, children }: TabsManagerProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const onTabChange = (value: string) => {
    // Crear nuevos parámetros manteniendo los actuales (ej. paginación, búsqueda)
    const params = new URLSearchParams(searchParams);
    params.set("tab", value);

    // Si cambiamos de tab, quizás quieras resetear la página a 1, o no.
    // Por ahora lo dejamos simple: solo cambia el tab en la URL.
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
          <TabsTrigger value="cronograma">
            <CalendarIcon className="mr-2 h-4 w-4" />
            Cronograma
          </TabsTrigger>
          <TabsTrigger value="lista">
            <ListFilter className="mr-2 h-4 w-4" />
            Listado y búsqueda
          </TabsTrigger>
        </TabsList>
      </div>
      {children}
    </Tabs>
  );
}
