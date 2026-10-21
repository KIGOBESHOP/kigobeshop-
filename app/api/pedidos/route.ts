
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

    if (!supabaseUrl || !anonKey || !serviceKey || !adminEmail) {
      return NextResponse.json(
        { error: "Falta configurar el acceso al administrador." },
        { status: 503 }
      );
    }

    const authorization = request.headers.get("authorization");
    const token = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";

    if (!token) {
      return NextResponse.json(
        { error: "Debes iniciar sesión." },
        { status: 401 }
      );
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: authData, error: authError } =
      await authClient.auth.getUser(token);

    if (
      authError ||
      !authData.user ||
      authData.user.email?.trim().toLowerCase() !== adminEmail
    ) {
      return NextResponse.json(
        { error: "No tienes permiso para consultar los pedidos." },
        { status: 403 }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: orders, error: ordersError } = await adminClient
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (ordersError) {
      console.error("Error consultando pedidos:", ordersError);
      return NextResponse.json(
        { error: "No se han podido cargar los pedidos." },
        { status: 500 }
      );
    }

    const orderIds = (orders ?? []).map((order) => order.id);

    let items: any[] = [];

    if (orderIds.length > 0) {
      const { data, error: itemsError } = await adminClient
        .from("order_items")
        .select("*")
        .in("order_id", orderIds);

      if (itemsError) {
        console.error("Error consultando productos de pedidos:", itemsError);
        return NextResponse.json(
          { error: "No se han podido cargar los productos de los pedidos." },
          { status: 500 }
        );
      }

      items = data ?? [];
    }

    const result = (orders ?? []).map((order) => ({
      ...order,
      items: items.filter((item) => item.order_id === order.id),
    }));

    return NextResponse.json({ orders: result });
  } catch (error) {
    console.error("Error en la ruta de pedidos:", error);

    return NextResponse.json(
      { error: "Ha ocurrido un error al consultar los pedidos." },
      { status: 500 }
    );
  }
}
