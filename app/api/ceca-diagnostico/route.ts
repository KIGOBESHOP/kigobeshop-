
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "crypto";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.CECA_DIAGNOSTIC_SECRET;
  const supplied = request.headers.get("x-diagnostic-secret") ?? "";

  if (!secret || supplied.length !== secret.length) {
    return new Response("No autorizado", { status: 401 });
  }

  const a = Buffer.from(secret);
  const b = Buffer.from(supplied);

  if (!timingSafeEqual(a, b)) {
    return new Response("No autorizado", { status: 401 });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return new Response("Configuración incompleta", { status: 500 });
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error } = await supabase
    .from("ceca_notification_logs")
    .insert({
      step: "prueba_conexion_web",
      operation: null,
      details: { origen: "ruta diagnostico", pago_realizado: false },
    });

  if (error) {
    return new Response("Error guardando diagnóstico", { status: 500 });
  }

  return new Response("Diagnóstico guardado correctamente", {
    status: 200,
  });
}
