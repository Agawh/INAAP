// /lib/db.ts
import { Pool, types, type QueryResult, type QueryResultRow } from "pg";

// --- FIX DEFINITIVO DE FECHAS (CRÍTICO) ---
// El OID 1082 es el tipo DATE en Postgres.
// Le decimos al driver: "Devuelve la fecha como texto plano (YYYY-MM-DD), no la conviertas a Date".
// Esto evita que el servidor aplique zonas horarias incorrectas.
types.setTypeParser(1082, (str) => str);

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL no está definida en las variables de entorno");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Configuración SSL recomendada para Neon/Vercel
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("error", (err) => {
  console.error("[v0] Error en pool de conexiones:", err);
});

// --- Función SQL base (Devuelve el objeto completo QueryResult) ---
export async function sql<T extends QueryResultRow = any>(
  query: string,
  params?: any[]
): Promise<QueryResult<T>> {
  return pool.query<T>(query, params);
}

// --- Helper para obtener array de filas directamente ---
export async function executeQuery<T extends QueryResultRow>(
  query: string,
  params?: any[]
): Promise<T[]> {
  try {
    // console.log("[v0] Ejecutando query:", query.substring(0, 50) + "...");
    const result = await pool.query<T>(query, params);
    return result.rows;
  } catch (error) {
    console.error("[v0] Error ejecutando query:", error);
    throw error;
  }
}

// --- Helper para obtener una sola fila (o null) ---
export async function executeQuerySingle<T extends QueryResultRow>(
  query: string,
  params?: any[]
): Promise<T | null> {
  const results = await executeQuery<T>(query, params);
  return results.length > 0 ? results[0] : null;
}

// --- Helper para probar conexión ---
export async function testConnection(): Promise<boolean> {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("[v0] Conexión a BD exitosa:", result.rows[0]);
    return true;
  } catch (error) {
    console.error("[v0] Error conectando a BD:", error);
    return false;
  }
}

export { pool };
