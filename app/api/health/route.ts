import { testConnection } from "@/lib/db";

export async function GET() {
  try {
    const isConnected = await testConnection();

    if (isConnected) {
      return Response.json(
        { status: "ok", message: "Conexión a BD exitosa" },
        { status: 200 }
      );
    } else {
      return Response.json(
        { status: "error", message: "No se pudo conectar a la BD" },
        { status: 500 }
      );
    }
  } catch (error) {
    return Response.json(
      { status: "error", message: String(error) },
      { status: 500 }
    );
  }
}
