
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function adminDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Falta configurar Supabase.");
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function validSession(value: unknown): value is string {
  return typeof value === "string" &&
    /^[a-zA-Z0-9-]{16,80}$/.test(value);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (
      !validSession(body?.sessionId) ||
      !Array.isArray(body?.items) ||
      body.items.length > 50
    ) {
      return NextResponse.json(
        { error: "Datos no válidos." },
        { status: 400 }
      );
    }

    const items = body.items.map((item: any) => ({
      product_id: String(item.product_id ?? "").slice(0, 80),
      product_name: String(item.product_name ?? "Producto").slice(0, 160),
      image: String(item.image ?? "").slice(0, 1000),
      unit_price: Math.max(0, Number(item.unit_price) || 0),
      quantity: Math.max(1, Math.min(99, Math.floor(Number(item.quantity) || 1))),
      color: item.color ? String(item.color).slice(0, 80) : null,
      size: item.size ? String(item.size).slice(0, 40) : null,
    })).filter((item: any) => item.product_id);

    if (!items.length) {
      return NextResponse.json({ ok: true });
    }

    const totalCents = Math.round(
      items.reduce(
        (sum: number, item: any) =>
          sum + item.unit_price * item.quantity,
        0
      ) * 100
    );

    const { error } = await adminDb()
      .from("abandoned_carts")
      .upsert({
        session_id: body.sessionId,
        items,
        total_cents: totalCents,
        status: "active",
        updated_at: new Date().toISOString(),
      }, { onConflict: "session_id" });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error guardando carrito:", error);
    return NextResponse.json(
      { error: "No se ha podido guardar el carrito." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();

    if (!validSession(body?.sessionId)) {
      return NextResponse.json(
        { error: "Sesión no válida." },
        { status: 400 }
      );
    }

    const { error } = await adminDb()
      .from("abandoned_carts")
      .delete()
      .eq("session_id", body.sessionId);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error actualizando carrito:", error);
    return NextResponse.json(
      { error: "No se ha podido actualizar el carrito." },
      { status: 500 }
    );
  }
}

async function authorize(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  if (!url || !anon || !adminEmail) {
    throw new Error("Falta configurar el acceso al administrador.");
  }

  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ")
    ? header.slice(7)
    : "";

  if (!token) {
    return NextResponse.json(
      { error: "Debes iniciar sesión." },
      { status: 401 }
    );
  }

  const auth = createClient(url, anon, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data, error } = await auth.auth.getUser(token);

  if (
    error ||
    !data.user ||
    data.user.email?.trim().toLowerCase() !== adminEmail
  ) {
    return NextResponse.json(
      { error: "No tienes permiso." },
      { status: 403 }
    );
  }

  return adminDb();
}

export async function GET(request: Request) {
  try {
    const access = await authorize(request);

    if (access instanceof Response) return access;

    const { data, error } = await access
      .from("abandoned_carts")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(200);

    if (error) throw error;

    return NextResponse.json({ carts: data ?? [] });
  } catch (error) {
    console.error("Error consultando carritos:", error);
    return NextResponse.json(
      { error: "No se han podido cargar los carritos." },
      { status: 500 }
    );
  }
}
