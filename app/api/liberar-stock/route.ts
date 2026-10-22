
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { error: "Configuración incompleta." },
        { status: 503 }
      );
    }

    // Esta ruta no se activa desde la página pública.
    // No liberar stock sin verificar el estado real del pago.
    return NextResponse.json(
      {
        error:
          "Liberación desactivada: hay que verificar el estado del pago CECA antes de devolver el stock.",
      },
      { status: 409 }
    );
  } catch (error) {
    console.error("Error en liberación de stock:", error);

    return NextResponse.json(
      { error: "Error interno." },
      { status: 500 }
    );
  }
}
