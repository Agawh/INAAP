// /components/configuracion/filtro-fecha-rango.tsx
"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { DateRange } from "react-day-picker";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export function FiltroFechaRango({
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Estado inicial basado en URL
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const [date, setDate] = React.useState<DateRange | undefined>({
    from: fromParam ? new Date(fromParam) : undefined,
    to: toParam ? new Date(toParam) : undefined,
  });

  // Efecto para actualizar URL cuando cambia la fecha
  const aplicarFiltro = (newDate: DateRange | undefined) => {
    setDate(newDate);
    const params = new URLSearchParams(searchParams);

    // Siempre reiniciamos a página 1 al filtrar
    params.set("page", "1");

    if (newDate?.from) {
      params.set("from", format(newDate.from, "yyyy-MM-dd"));
    } else {
      params.delete("from");
    }

    if (newDate?.to) {
      params.set("to", format(newDate.to, "yyyy-MM-dd"));
    } else {
      params.delete("to");
    }

    router.replace(`${pathname}?${params.toString()}`);
  };

  const limpiarFiltro = (e: React.MouseEvent) => {
    e.stopPropagation();
    aplicarFiltro(undefined);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[260px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "LLL dd, y", { locale: es })} -{" "}
                  {format(date.to, "LLL dd, y", { locale: es })}
                </>
              ) : (
                format(date.from, "LLL dd, y", { locale: es })
              )
            ) : (
              <span>Filtrar por fechas</span>
            )}
            {/* Botón de limpiar dentro del trigger si hay fecha seleccionada */}
            {date?.from && (
              <div
                className="ml-auto rounded-full hover:bg-muted p-1"
                onClick={limpiarFiltro}
                role="button"
              >
                <X className="h-3 w-3 opacity-50" />
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={aplicarFiltro}
            numberOfMonths={2}
            locale={es}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
