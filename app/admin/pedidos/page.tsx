"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export default function PedidosPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [glsLoading, setGlsLoading] = useState(false);
const [glsMessage, setGlsMessage] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) void loadOrders();
  }, [user]);

  async function loadOrders() {
    setLoading(true);
    setMessage("");

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error("Tu sesión ha caducado. Vuelve a iniciar sesión.");
      }

      const response = await fetch("/api/pedidos", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "No se han podido cargar los pedidos.");
      }

      setOrders(result.orders ?? []);
    } catch (error) {
      console.error("Error cargando pedidos:", error);
      setMessage(
        error instanceof Error
          ? error.message
          : "No se han podido cargar los pedidos."
      );
    } finally {
      setLoading(false);
    }
  }
async function testGLS() {
  const confirmed = window.confirm(
    "Vas a enviar una expedición de prueba a GLS con datos ficticios. ¿GLS ha confirmado que no generará cargos ni recogidas reales?"
  );

  if (!confirmed) return;

  setGlsLoading(true);
  setGlsMessage("");

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error || !session) {
      throw new Error("Tu sesión ha caducado. Vuelve a iniciar sesión.");
    }

    const response = await fetch("/api/gls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ action: "shipment-test" }),
    });

    const result = await response.json();

    setGlsMessage(
      result.ok
        ? `GLS ha aceptado la prueba. Código: ${result.glsReturnCode}. Código de barras: ${result.barcode || "No recibido"}.`
        : result.message || "GLS no ha confirmado la prueba."
    );
  } catch (error) {
    setGlsMessage(
      error instanceof Error ? error.message : "Error al probar GLS."
    );
  } finally {
    setGlsLoading(false);
  }
}
  
  if (checking) {
    return <main style={{ padding: 24 }}>Comprobando sesión...</main>;
  }

  if (!user) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Pedidos</h1>
        <p>Inicia sesión desde el administrador principal.</p>
        <button onClick={() => router.push("/admin")}>
          Ir al administrador
        </button>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "30px auto",
        padding: 24,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <button onClick={() => router.push("/admin")} style={buttonStyle}>
        ← Volver al administrador
      </button>

      <h1 style={{ color: "#7e22ce", marginTop: 28 }}>Pedidos</h1>
      <p>Consulta las compras y prepara los envíos de KigobeShop.</p>

      <button onClick={loadOrders} disabled={loading} style={buttonStyle}>
        {loading ? "Cargando pedidos..." : "Actualizar pedidos"}
      </button>

      <button
  onClick={testGLS}
  disabled={glsLoading}
  style={{ ...buttonStyle, marginLeft: 10, background: "#16a34a" }}
>
  {glsLoading ? "Comprobando GLS..." : "Probar envío GLS"}
</button>

{glsMessage && (
  <p role="status" style={{ marginTop: 12 }}>
    {glsMessage}
  </p>
)}
      {message && <p role="alert">{message}</p>}

      {!message && orders.length === 0 && !loading && (
        <p style={{ marginTop: 24 }}>
          No hay pedidos para mostrar todavía.
        </p>
      )}

      <div style={{ display: "grid", gap: 18, marginTop: 24 }}>
        {orders.map((order) => (
          <article key={order.id} style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>
              Pedido #{String(order.id).slice(0, 8)}
            </h2>

            <p>
              <strong>Fecha:</strong>{" "}
              {order.created_at
                ? new Date(order.created_at).toLocaleString("es-ES")
                : "No disponible"}
            </p>

            <p>
              <strong>Cliente:</strong> {order.customer_name}{" "}
              {order.customer_surname ?? ""}
            </p>
            <p>
              <strong>Correo:</strong> {order.customer_email || "No disponible"}
            </p>
            <p>
              <strong>Teléfono:</strong> {order.customer_phone || "No disponible"}
            </p>
            <p>
              <strong>Dirección:</strong>{" "}
              {[
                order.customer_address,
                order.customer_postal_code,
                order.customer_city,
              ]
                .filter(Boolean)
                .join(", ") || "No disponible"}
            </p>

            <p>
              <strong>Total:</strong>{" "}
              {(Number(order.total_cents) / 100).toFixed(2)} €
            </p>
            <p>
              <strong>Estado del pago:</strong>{" "}
              {order.payment_status || "No disponible"}
            </p>

            <h3>Productos del pedido</h3>
            {order.items?.length ? (
              order.items.map((item: any) => (
                <div
                  key={item.id}
                  style={{
                    borderTop: "1px solid #e5e7eb",
                    padding: "10px 0",
                  }}
                >
                  <p>
                    {item.product_name} × {item.quantity}
                  </p>
                  {item.selected_size && <p>Talla: {item.selected_size}</p>}
                  {item.selected_color && <p>Color: {item.selected_color}</p>}
                  <p>
                    Precio por unidad:{" "}
                    {(Number(item.unit_price_cents) / 100).toFixed(2)} €
                  </p>
                </div>
              ))
            ) : (
              <p>No hay detalles de productos disponibles.</p>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}

const buttonStyle = {
  padding: "12px 18px",
  background: "#7e22ce",
  color: "white",
  border: 0,
  borderRadius: 8,
  cursor: "pointer",
};

const cardStyle = {
  border: "1px solid #d8b4fe",
  borderRadius: 12,
  padding: 20,
  background: "white",
  color: "#222",
};
