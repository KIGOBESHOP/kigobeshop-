"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Order = {
  id: string | number;
  customer_name?: string;
  customer_surname?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_address?: string;
  customer_city?: string;
  customer_provincia?: string;
  customer_postal_code?: string;
  total?: number | string;
  payment_status?: string;
  gls_status?: string | null;
  shipping_barcode?: string | null;
  shipping_method?: string;
  created_at?: string;
  items?: Array<{
    name?: string;
    product_name?: string;
    quantity?: number;
    price?: number | string;
    size?: string;
    color?: string;
  }>;
};

export default function EnviosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [glsTesting, setGlsTesting] = useState(false);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "No se pudieron cargar los pedidos.");
      }

      setOrders(Array.isArray(data.orders) ? data.orders : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cargar los pedidos."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function testGLS() {
    if (
      !window.confirm(
        "Se enviará a GLS una solicitud de prueba con datos ficticios. ¿Confirmas que GLS ha autorizado este uso del entorno de pruebas?"
      )
    ) {
      return;
    }

    setGlsTesting(true);
    setMessage("");
    setError("");

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        throw new Error("Tu sesión ha caducado. Vuelve a iniciar sesión.");
      }

      const response = await fetch("/api/gls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ action: "shipment-test" }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        const diagnostic = [
          data.message || "GLS no ha confirmado la prueba.",
          data.httpStatus ? `HTTP: ${data.httpStatus}` : "",
          data.glsReturnCode ? `Código GLS: ${data.glsReturnCode}` : "",
          data.responseExcerpt ? `Respuesta: ${data.responseExcerpt}` : "",
        ].filter(Boolean).join("\\n");

        throw new Error(diagnostic);
      }

      setMessage(
        `GLS ha aceptado la solicitud de prueba. Código: ${data.glsReturnCode ?? "No indicado"}. Código de barras: ${data.barcode || "No recibido"}.`
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo completar la prueba GLS."
      );
    } finally {
      setGlsTesting(false);
    }
  }

  const paidOrders = orders.filter(
    (order) => order.payment_status === "paid"
  );

  const pendingOrders = paidOrders.filter(
    (order) => !order.shipping_barcode && order.gls_status !== "generado"
  );

  const generatedOrders = paidOrders.filter(
    (order) => Boolean(order.shipping_barcode) || order.gls_status === "generado"
  );

  function formatDate(value?: string) {
    if (!value) return "Fecha no disponible";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? "Fecha no disponible"
      : date.toLocaleString("es-ES");
  }

  function formatPrice(value?: number | string) {
    const amount = Number(value);

    return Number.isFinite(amount)
      ? amount.toLocaleString("es-ES", {
          style: "currency",
          currency: "EUR",
        })
      : "—";
  }

  function customerName(order: Order) {
    return `${order.customer_name || ""} ${order.customer_surname || ""}`.trim() || "Cliente";
  }

  function OrderCard({
    order,
    generated,
  }: {
    order: Order;
    generated: boolean;
  }) {
    const id = String(order.id);

    return (
      <article style={styles.card}>
        <div style={styles.cardTop}>
          <div>
            <h3 style={styles.customer}>{customerName(order)}</h3>
            <p style={styles.muted}>Pedido #{id}</p>
          </div>
          <span style={generated ? styles.generatedBadge : styles.pendingBadge}>
            {generated ? "Envío generado" : "Pendiente de envío"}
          </span>
        </div>

        <p style={styles.date}>Realizado: {formatDate(order.created_at)}</p>

        <div style={styles.details}>
          <p><strong>Dirección:</strong> {order.customer_address || "No indicada"}</p>
          <p>
            <strong>Localidad:</strong>{" "}
            {[order.customer_postal_code, order.customer_city, order.customer_provincia]
              .filter(Boolean)
              .join(", ") || "No indicada"}
          </p>
          <p><strong>Teléfono:</strong> {order.customer_phone || "No indicado"}</p>
          <p><strong>Email:</strong> {order.customer_email || "No indicado"}</p>
          <p><strong>Total:</strong> {formatPrice(order.total)}</p>
        </div>

        {order.items && order.items.length > 0 && (
          <div style={styles.items}>
            <strong>Productos:</strong>
            {order.items.map((item, index) => (
              <p key={index} style={styles.itemLine}>
                {item.quantity || 1} × {item.name || item.product_name || "Producto"}
                {item.size ? ` · Talla ${item.size}` : ""}
                {item.color ? ` · ${item.color}` : ""}
              </p>
            ))}
          </div>
        )}

        {generated && (
          <div style={styles.barcodeBox}>
            <strong>Código de barras GLS</strong>
            <p style={styles.barcode}>
              {order.shipping_barcode || "GLS marcado como generado, sin código guardado"}
            </p>
          </div>
        )}

      </article>
    );
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Envíos GLS</h1>
          <p style={styles.subtitle}>
            Gestiona los envíos de los pedidos pagados de KigobeShop.
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            type="button"
            style={styles.refreshButton}
            onClick={loadOrders}
            disabled={loading}
          >
            {loading ? "Cargando..." : "Actualizar"}
          </button>

          <button
            type="button"
            style={{ ...styles.button, width: "auto", marginTop: 0, padding: "11px 18px" }}
            onClick={testGLS}
            disabled={glsTesting}
          >
            {glsTesting ? "Probando GLS..." : "Probar envío GLS"}
          </button>
        </div>
      </header>

      <div style={styles.stats}>
        <div style={styles.statCard}>
          <span style={styles.statNumber}>{pendingOrders.length}</span>
          <span style={styles.statLabel}>Pendientes de envío</span>
        </div>

        <div style={styles.statCard}>
          <span style={styles.statNumber}>{generatedOrders.length}</span>
          <span style={styles.statLabel}>Envíos generados</span>
        </div>
      </div>

      {message && <div style={styles.success}>{message}</div>}
      {error && <div style={styles.error}>{error}</div>}

      {loading ? (
        <p style={styles.empty}>Cargando pedidos...</p>
      ) : (
        <>
          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Pendientes de envío</h2>
            {pendingOrders.length === 0 ? (
              <p style={styles.empty}>No hay pedidos pendientes de envío.</p>
            ) : (
              <div style={styles.grid}>
                {pendingOrders.map((order) => (
                  <OrderCard key={String(order.id)} order={order} generated={false} />
                ))}
              </div>
            )}
          </section>

          <section style={styles.section}>
            <h2 style={styles.sectionTitle}>Envíos generados</h2>
            {generatedOrders.length === 0 ? (
              <p style={styles.empty}>Todavía no hay envíos GLS generados.</p>
            ) : (
              <div style={styles.grid}>
                {generatedOrders.map((order) => (
                  <OrderCard key={String(order.id)} order={order} generated={true} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <a href="/admin" style={styles.backLink}>
        ← Volver al administrador
      </a>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "#f7f5fa",
    padding: "32px",
    color: "#292333",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "16px",
    flexWrap: "wrap",
    marginBottom: "28px",
  },
  title: { fontSize: "30px", margin: 0, fontWeight: 800 },
  subtitle: { color: "#777080", marginTop: "8px" },
  refreshButton: {
    border: "1px solid #ded7e8",
    background: "#fff",
    padding: "11px 18px",
    borderRadius: "10px",
    cursor: "pointer",
    fontWeight: 700,
  },
  stats: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "16px",
    marginBottom: "30px",
  },
  statCard: {
    background: "#fff",
    border: "1px solid #eee8f4",
    borderRadius: "14px",
    padding: "22px",
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },
  statNumber: { fontSize: "30px", fontWeight: 800, color: "#7138a5" },
  statLabel: { color: "#777080", fontSize: "14px" },
  section: { marginBottom: "34px" },
  sectionTitle: { fontSize: "21px", marginBottom: "16px" },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "18px",
  },
  card: {
    background: "#fff",
    border: "1px solid #eee8f4",
    borderRadius: "15px",
    padding: "20px",
    boxShadow: "0 3px 12px rgba(40, 20, 60, 0.04)",
  },
  cardTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "12px",
  },
  customer: { fontSize: "18px", margin: 0 },
  muted: { color: "#8a8492", fontSize: "13px", margin: "5px 0" },
  date: { color: "#777080", fontSize: "13px", margin: "12px 0" },
  pendingBadge: {
    background: "#fff2d9",
    color: "#946000",
    borderRadius: "20px",
    padding: "6px 10px",
    fontSize: "11px",
    fontWeight: 700,
  },
  generatedBadge: {
    background: "#e8f7ed",
    color: "#247442",
    borderRadius: "20px",
    padding: "6px 10px",
    fontSize: "11px",
    fontWeight: 700,
  },
  details: {
    borderTop: "1px solid #eeeaf2",
    paddingTop: "10px",
    fontSize: "13px",
    lineHeight: 1.6,
    overflowWrap: "anywhere",
  },
  items: {
    borderTop: "1px solid #eeeaf2",
    paddingTop: "12px",
    fontSize: "13px",
  },
  itemLine: { margin: "7px 0", color: "#625b6b" },
  barcodeBox: {
    background: "#f3eef8",
    borderRadius: "10px",
    padding: "12px",
    marginTop: "14px",
    fontSize: "13px",
  },
  barcode: { fontWeight: 800, overflowWrap: "anywhere", marginBottom: 0 },
  button: {
    width: "100%",
    marginTop: "16px",
    padding: "13px",
    border: 0,
    borderRadius: "10px",
    background: "#7138a5",
    color: "#fff",
    fontWeight: 700,
    cursor: "pointer",
  },
  success: {
    background: "#e8f7ed",
    color: "#247442",
    borderRadius: "10px",
    padding: "13px 16px",
    marginBottom: "18px",
  },
  error: {
    background: "#fff0f0",
    color: "#a12b2b",
    borderRadius: "10px",
    padding: "13px 16px",
    marginBottom: "18px",
  },
  empty: {
    background: "#fff",
    borderRadius: "12px",
    padding: "20px",
    color: "#777080",
  },
  backLink: {
    display: "inline-block",
    marginTop: "10px",
    color: "#7138a5",
    fontWeight: 700,
    textDecoration: "none",
  },
};
