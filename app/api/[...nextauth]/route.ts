// /app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth";

// Exporta los manejadores GET y POST de Auth.js
export const { GET, POST } = handlers;
