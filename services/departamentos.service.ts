import { sql } from "@/lib/db"
import type { Departamento } from "@/types"

export class DepartamentosService {
  static async obtenerTodos(): Promise<Departamento[]> {
    try {
      const result = await sql`
        SELECT id, nombre, descripcion
        FROM departamentos
        ORDER BY nombre ASC
      `

      return result as Departamento[]
    } catch (error) {
      console.error("[v0] Error obteniendo departamentos:", error)
      throw error
    }
  }

  static async obtenerPorId(id: string): Promise<Departamento | null> {
    try {
      const result = await sql`
        SELECT id, nombre, descripcion
        FROM departamentos
        WHERE id = ${id}
        LIMIT 1
      `

      return result.length > 0 ? (result[0] as Departamento) : null
    } catch (error) {
      console.error("[v0] Error obteniendo departamento:", error)
      throw error
    }
  }
}
