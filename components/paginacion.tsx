// /components/paginacion.tsx
"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

export function Paginacion({ totalPaginas }: { totalPaginas: number }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPage = Number(searchParams.get("page")) || 1;

  const createPageURL = (pageNumber: number | string) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  if (totalPaginas <= 1) return null;

  return (
    <Pagination className="justify-end">
      <PaginationContent>
        {/* Botón Anterior */}
        <PaginationItem>
          <PaginationPrevious
            href={currentPage > 1 ? createPageURL(currentPage - 1) : "#"}
            aria-disabled={currentPage <= 1}
            className={currentPage <= 1 ? "pointer-events-none opacity-50" : ""}
          />
        </PaginationItem>

        {/* Números de Página (Lógica simplificada para mostrar actual) */}
        {/* Si hay muchas páginas, aquí podríamos añadir lógica de Ellipsis (...) */}
        {Array.from({ length: totalPaginas }, (_, i) => i + 1)
          .filter(
            (p) =>
              p === 1 ||
              p === totalPaginas ||
              (p >= currentPage - 1 && p <= currentPage + 1)
          )
          .map((page, index, array) => {
            // Lógica para añadir "..."
            const showEllipsis = index > 0 && page !== array[index - 1] + 1;

            return (
              <React.Fragment key={page}>
                {showEllipsis && (
                  <PaginationItem>
                    <PaginationEllipsis />
                  </PaginationItem>
                )}
                <PaginationItem>
                  <PaginationLink
                    href={createPageURL(page)}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              </React.Fragment>
            );
          })}

        {/* Botón Siguiente */}
        <PaginationItem>
          <PaginationNext
            href={
              currentPage < totalPaginas ? createPageURL(currentPage + 1) : "#"
            }
            aria-disabled={currentPage >= totalPaginas}
            className={
              currentPage >= totalPaginas
                ? "pointer-events-none opacity-50"
                : ""
            }
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

import React from "react";
