// /services/departamentos.service.ts
import { sql } from "@/lib/db";
import type { Departamento } from "@/types";

export class DepartamentosService {
  static async obtenerTodos(): Promise<Departamento[]> {
    try {
      // ---- Sintaxis SQL corregida ----
      const query = `
        SELECT id, nombre, descripcion
        FROM departamentos
        ORDER BY nombre ASC
      `;
      const result = await sql(query);
      return result.rows as Departamento[];
    } catch (error) {
      console.error("[v0] Error obteniendo departamentos:", error);
      throw error;
    }
  }

  static async obtenerPorId(id: string): Promise<Departamento | null> {
    try {
      // ---- Sintaxis SQL corregida ----
      const query = `
        SELECT id, nombre, descripcion
        FROM departamentos
        WHERE id = $1
        LIMIT 1
      `;
      const result = await sql(query, [id]);
      return result.rows.length > 0 ? (result.rows[0] as Departamento) : null;
    } catch (error) {
      console.error("[v0] Error obteniendo departamento:", error);
      throw error;
    }
  }
}
