"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import { Input } from "@/components/ui/input";

export function BusquedaUsuarios() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // Evita que la búsqueda se ejecute en cada tecla presionada
  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("q", term);
    } else {
      params.delete("q");
    }
    // Actualiza la URL
    replace(`${pathname}?${params.toString()}`);
  }, 300); // Espera 300ms después de que el usuario deja de escribir

  return (
    <Input
      placeholder="Buscar por nombre, email, cédula o departamento..."
      onChange={(e) => handleSearch(e.target.value)}
      defaultValue={searchParams.get("q")?.toString()}
    />
  );
}
