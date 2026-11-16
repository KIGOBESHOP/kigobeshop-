import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const RUNWAY_URL = "https://api.dev.runwayml.com/v1";
const RUNWAY_VERSION = "2024-11-06";

function runwayHeaders() {
  const key = process.env.RUNWAY_API_KEY;
  if (!key) throw new Error("Falta configurar RUNWAY_API_KEY en Vercel.");
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    "X-Runway-Version": RUNWAY_VERSION,
  };
}

async function authorize(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!token || !supabaseUrl || !supabaseAnonKey) return false;

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store",
  });

  return response.ok;
}

export async function POST(request: NextRequest) {
  try {
    if (!(await authorize(request))) {
      return NextResponse.json({ error: "Debes iniciar sesión en Admin." }, { status: 401 });
    }

    const { frontUrl, backUrl } = await request.json();
    if (
      typeof frontUrl !== "string" ||
      typeof backUrl !== "string" ||
      !frontUrl.startsWith("https://") ||
      !backUrl.startsWith("https://")
    ) {
      return NextResponse.json(
        { error: "Sube una foto delantera y otra trasera válidas." },
        { status: 400 },
      );
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
          "Create a clean ecommerce product video of this exact garment. Keep the garment's color, fabric, cut, seams and details consistent with the reference images. Show the garment alone, centered, against a plain clean light background. Make a smooth, slow product turn from the front view toward the back view. No person, mannequin, text, logos, extra objects or scene cuts.",
        duration: 5,
        audio: false,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Runway create task error:", data);
      return NextResponse.json(
        { error: data?.error || data?.message || "Runway no pudo iniciar la generación." },
        { status: response.status },
      );
    }

    return NextResponse.json({ taskId: data.id, estimatedCost: data.estimatedCost });
  } catch (error) {
    console.error("Generate 360 error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno al iniciar la generación." },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!(await authorize(request))) {
      return NextResponse.json({ error: "Debes iniciar sesión en Admin." }, { status: 401 });
    }

    const taskId = request.nextUrl.searchParams.get("taskId");
    if (!taskId || !/^[0-9a-f-]{36}$/i.test(taskId)) {
      return NextResponse.json({ error: "Identificador de tarea no válido." }, { status: 400 });
    }

    const response = await fetch(`${RUNWAY_URL}/tasks/${taskId}`, {
      method: "GET",
      headers: runwayHeaders(),
      cache: "no-store",
    });
    const data = await response.json();

    if (!response.ok) {
      console.error("Runway task status error:", data);
      return NextResponse.json(
        { error: data?.error || data?.message || "No se pudo consultar la generación." },
        { status: response.status },
      );
    }

    return NextResponse.json({
      taskId: data.id,
      status: data.status,
      output: data.status === "SUCCEEDED" ? data.output?.[0] : undefined,
      failure: data.failure,
    });
  } catch (error) {
    console.error("Check 360 task error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno al consultar la generación." },
      { status: 500 },
    );
  }
}
