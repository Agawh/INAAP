// /hooks/use-mobile.ts
import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    const onChange = () => {
      setIsMobile(mql.matches);
    };

    onChange(); // Comprobar el estado inicial en el cliente
    mql.addEventListener("change", onChange);

    return () => mql.removeEventListener("change", onChange);
  }, []); // El array vacío asegura que solo se ejecute en el cliente

  return isMobile;
}
