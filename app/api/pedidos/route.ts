import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function clients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (!url || !anon || !service || !adminEmail) throw new Error("Falta configurar el acceso al administrador.");
  return {
    adminEmail,
    auth: createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } }),
    db: createClient(url, service, { auth: { persistSession: false, autoRefreshToken: false } }),
  };
}

async function authorize(request: Request) {
  const { adminEmail, auth, db } = clients();
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return { response: NextResponse.json({ error: "Debes iniciar sesión." }, { status: 401 }) };
  const { data, error } = await auth.auth.getUser(token);
  if (error || !data.user || data.user.email?.trim().toLowerCase() !== adminEmail) {
    return { response: NextResponse.json({ error: "No tienes permiso para gestionar los pedidos." }, { status: 403 }) };
  }
  return { db };
}

export async function GET(request: Request) {
  try {
    const access = await authorize(request);
    if ("response" in access) return access.response;
    const { data: orders, error } = await access.db.from("orders").select("*").order("created_at", { ascending: false });
    if (error) {
      console.error("Error consultando pedidos:", error);
      return NextResponse.json({ error: "No se han podido cargar los pedidos." }, { status: 500 });
    }
    const ids = (orders ?? []).map((order) => order.id);
    let items: any[] = [];
    if (ids.length) {
      const result = await access.db.from("order_items").select("*").in("order_id", ids);
      if (result.error) {
        console.error("Error consultando productos de pedidos:", result.error);
        return NextResponse.json({ error: "No se han podido cargar los productos de los pedidos." }, { status: 500 });
      }
      items = result.data ?? [];
    }
    return NextResponse.json({ orders: (orders ?? []).map((order) => ({ ...order, items: items.filter((item) => item.order_id === order.id) })) });
  } catch (error) {
    console.error("Error en la ruta de pedidos:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Ha ocurrido un error al consultar los pedidos." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const access = await authorize(request);
    if ("response" in access) return access.response;
    const body = await request.json();
    const orderId = body?.orderId;
    const status = body?.pickup_status;
    if ((typeof orderId !== "string" && typeof orderId !== "number") || !["pending", "delivered"].includes(status)) {
      return NextResponse.json({ error: "Datos de actualización no válidos." }, { status: 400 });
    }
    const values = status === "delivered"
      ? { pickup_status: "delivered", delivered_at: new Date().toISOString() }
      : { pickup_status: "pending", delivered_at: null };
    const { data, error } = await access.db.from("orders").update(values).eq("id", orderId).select("*").single();
    if (error) {
      console.error("Error actualizando entrega:", error);
      return NextResponse.json({ error: "No se ha podido actualizar la entrega. Comprueba que las columnas pickup_status y delivered_at existan en Supabase." }, { status: 500 });
    }
    return NextResponse.json({ order: data });
  } catch (error) {
    console.error("Error actualizando pedido:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Ha ocurrido un error al actualizar el pedido." }, { status: 500 });
  }
}
