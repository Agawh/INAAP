// /hooks/use-mobile.ts
import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // 1. Iniciar el estado como 'false'
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    // 2. En el cliente, después de que todo se haya cargado,
    //    revisar el tamaño real y actualizar el estado.
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const onChange = () => {
      setIsMobile(mql.matches);
    };

    // Comprobar el estado inicial en el cliente
    onChange();

    mql.addEventListener("change", onChange);

    return () => mql.removeEventListener("change", onChange);
  }, []); // El array vacío asegura que esto solo se ejecute en el cliente

  // Devuelve 'false' en el servidor y 'false' en la primera carga del cliente.
  // Luego se actualiza al valor real.
  return isMobile;
}
