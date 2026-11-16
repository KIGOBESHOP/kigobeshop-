import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RUNWAY_URL = "https://api.dev.runwayml.com/v1";
const RUNWAY_VERSION = "2024-11-06";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

async function requireAdminSession(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7).trim()
    : "";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Faltan las variables públicas de Supabase en Vercel.");
  }
  if (!token) return false;

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await supabase.auth.getUser(token);
  return !error && Boolean(data.user);
}

function runwayHeaders() {
  const key = process.env.RUNWAY_API_KEY;
  if (!key) throw new Error("Falta configurar RUNWAY_API_KEY en Vercel.");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    "X-Runway-Version": RUNWAY_VERSION,
  };
}

function isAllowedSupabaseImage(value: unknown) {
  if (typeof value !== "string" || value.length > 2048) return false;
  try {
    const parsed = new URL(value);
    const configured = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!configured || parsed.protocol !== "https:") return false;
    const expectedHost = new URL(configured).host;
    return parsed.host === expectedHost && parsed.pathname.includes("/storage/v1/object/public/productos/");
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await requireAdminSession(request))) {
      return jsonError("Inicia sesión en el administrador para generar una animación.", 401);
    }

    const body = await request.json();
    const { frontUrl, backUrl } = body ?? {};
    if (!isAllowedSupabaseImage(frontUrl) || !isAllowedSupabaseImage(backUrl)) {
      return jsonError("Sube las dos fotos al almacenamiento público de productos antes de generar el giro.");
    }

    const response = await fetch(`${RUNWAY_URL}/image_to_video`, {
      method: "POST",
      headers: runwayHeaders(),
      body: JSON.stringify({
        model: "kling3.0_standard",
        promptImage: [
          { uri: frontUrl, position: "first" },
          { uri: backUrl, position: "last" },
        ],
        promptText:
          "Create a smooth ecommerce product video showing the exact same garment from the supplied front view to the supplied back view. Keep its color, fabric, cut, seams, pattern and details faithful to the reference images. Show only the garment, centered, against a clean neutral studio background. Smooth continuous camera movement, no person, no mannequin, no text, no logos, no extra objects, no scene cuts.",
        duration: 5,
        audio: false,
      }),
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      console.error("Runway create task error:", data);
      return jsonError(data?.error || data?.message || "Runway no pudo iniciar la generación.", response.status);
    }

    if (typeof data?.id !== "string") {
      console.error("Unexpected Runway create response:", data);
      return jsonError("Runway no devolvió un identificador de generación válido.", 502);
    }

    return NextResponse.json({ taskId: data.id });
  } catch (error) {
    console.error("Generate 360 error:", error);
    return jsonError(error instanceof Error ? error.message : "Error interno al iniciar la generación.", 500);
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!(await requireAdminSession(request))) {
      return jsonError("Inicia sesión en el administrador para consultar la generación.", 401);
    }

    const taskId = request.nextUrl.searchParams.get("taskId");
    if (!taskId || !/^[0-9a-f-]{36}$/i.test(taskId)) {
      return jsonError("Identificador de tarea no válido.");
    }

    const response = await fetch(`${RUNWAY_URL}/tasks/${taskId}`, {
      method: "GET",
      headers: runwayHeaders(),
      cache: "no-store",
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      console.error("Runway task status error:", data);
      return jsonError(data?.error || data?.message || "No se pudo consultar la generación.", response.status);
    }

    return NextResponse.json({
      taskId: data?.id,
      status: data?.status,
      output: data?.status === "SUCCEEDED" && Array.isArray(data?.output) ? data.output[0] : undefined,
      failure: data?.failure,
    });
  } catch (error) {
    console.error("Check 360 task error:", error);
    return jsonError(error instanceof Error ? error.message : "Error interno al consultar la generación.", 500);
  }
}
