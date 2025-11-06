import { Pool, type QueryResultRow } from "pg"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL no está definida en las variables de entorno")
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

pool.on("error", (err) => {
  console.error("[v0] Error en pool de conexiones:", err)
})

export async function sql(query: string, params?: any[]) {
  return pool.query(query, params)
}

export async function executeQuery<T extends QueryResultRow>(query: string, params?: any[]): Promise<T[]> {
  try {
    console.log("[v0] Ejecutando query:", query.substring(0, 50) + "...")
    const result = await pool.query(query, params)
    return result.rows as T[]
  } catch (error) {
    console.error("[v0] Error ejecutando query:", error)
    throw error
  }
}

export async function executeQuerySingle<T extends QueryResultRow>(query: string, params?: any[]): Promise<T | null> {
  const results = await executeQuery<T>(query, params)
  return results.length > 0 ? results[0] : null
}

export async function testConnection(): Promise<boolean> {
  try {
    const result = await pool.query("SELECT NOW()")
    console.log("[v0] Conexión a BD exitosa:", result.rows[0])
    return true
  } catch (error) {
    console.error("[v0] Error conectando a BD:", error)
    return false
  }
}

export { pool }
