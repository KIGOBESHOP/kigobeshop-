"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type Item = {
  id: string | number;
  product_name?: string | null;
  quantity?: number | null;
  selected_size?: string | null;
  selected_color?: string | null;
  unit_price_cents?: number | null;
};
type Order = {
  id: string | number;
  created_at?: string | null;
  customer_name?: string | null;
  customer_surname?: string | null;
  customer_email?: string | null;
  customer_phone?: string | null;
  customer_address?: string | null;
  customer_postal_code?: string | null;
  customer_city?: string | null;
  total_cents?: number | null;
  payment_status?: string | null;
  pickup_status?: "pending" | "delivered" | null;
  delivered_at?: string | null;
  items?: Item[];
};
type Filter = "all" | "pending" | "delivered";

export default function PedidosPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [glsLoading, setGlsLoading] = useState(false);
  const [glsMessage, setGlsMessage] = useState("");
  const [updatingId, setUpdatingId] = useState<string | number | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

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

  async function token() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session) throw new Error("Tu sesión ha caducado. Vuelve a iniciar sesión.");
    return session.access_token;
  }

  async function loadOrders() {
    setLoading(true); setMessage("");
    try {
      const accessToken = await token();
      const response = await fetch("/api/pedidos", {
        headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se han podido cargar los pedidos.");
      setOrders(result.orders ?? []);
    } catch (error) {
      console.error("Error cargando pedidos:", error);
      setMessage(error instanceof Error ? error.message : "No se han podido cargar los pedidos.");
    } finally { setLoading(false); }
  }

  async function changePickupStatus(order: Order) {
    const next = order.pickup_status === "delivered" ? "pending" : "delivered";
    const question = next === "delivered"
      ? `¿Confirmas que el pedido #${String(order.id).slice(0, 8)} ya se ha entregado?`
      : `¿Quieres devolver el pedido #${String(order.id).slice(0, 8)} a pendiente de recogida?`;
    if (!window.confirm(question)) return;
    setUpdatingId(order.id); setMessage("");
    try {
      const accessToken = await token();
      const response = await fetch("/api/pedidos", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id, pickup_status: next }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No se ha podido actualizar el pedido.");
      setOrders((current) => current.map((item) => item.id === order.id ? { ...item, ...result.order } : item));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Error al actualizar la entrega.");
    } finally { setUpdatingId(null); }
  }

  async function testGLS() {
    if (!window.confirm("Vas a enviar una expedición de prueba a GLS con datos ficticios. ¿GLS ha confirmado que no generará cargos ni recogidas reales?")) return;
    setGlsLoading(true); setGlsMessage("");
    try {
      const accessToken = await token();
      const response = await fetch("/api/gls", {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ action: "shipment-test" }),
      });
      const result = await response.json();
      setGlsMessage(result.ok
        ? `GLS ha aceptado la prueba. Código: ${result.glsReturnCode}. Código de barras: ${result.barcode || "No recibido"}.`
        : result.message || "GLS no ha confirmado la prueba.");
    } catch (error) {
      setGlsMessage(error instanceof Error ? error.message : "Error al probar GLS.");
    } finally { setGlsLoading(false); }
  }

  function printLabel(order: Order) {
    const popup = window.open("", "_blank", "width=700,height=900");
    if (!popup) { setMessage("Permite las ventanas emergentes para imprimir la etiqueta."); return; }
    const esc = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
    );
    const number = String(order.id).slice(0, 8).toUpperCase();
    const name = `${order.customer_name ?? ""} ${order.customer_surname ?? ""}`.trim() || "Cliente";
    const delivered = order.pickup_status === "delivered";
    const rows = (order.items ?? []).map((item) => `
      <div class="item">
        <strong>${esc(item.product_name || "Producto")} × ${esc(item.quantity ?? 1)}</strong>
        <div class="muted">${[
          item.selected_size ? `Talla: ${esc(item.selected_size)}` : "",
          item.selected_color ? `Color: ${esc(item.selected_color)}` : "",
        ].filter(Boolean).join(" · ")}</div>
        <div class="muted">${(Number(item.unit_price_cents ?? 0) / 100).toFixed(2).replace(".", ",")} € / unidad</div>
      </div>`).join("");

    popup.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>Etiqueta KigobeShop ${number}</title>
<style>
@page{size:100mm 150mm;margin:0}*{box-sizing:border-box}body{margin:0;color:#17121b;font-family:Arial,sans-serif}
.label{width:100mm;min-height:150mm;padding:5mm;border:1.5mm solid #7620a5;display:flex;flex-direction:column;gap:3mm}
.brand{background:#f3e5fa;border-radius:4mm;padding:5mm 3mm;text-align:center;color:#42115d}
.brand h1{font: bold 21pt Georgia,serif;letter-spacing:1px;margin:0}.brand p{font-size:8pt;letter-spacing:2px;margin:1mm 0 0}
.banner{background:#641080;color:white;border-radius:3mm;text-align:center;padding:4mm 2mm;font-weight:bold;font-size:15pt}
.order{background:#f2e3f9;border-radius:3mm;padding:3mm;font-size:20pt;font-weight:800}
.section{border-bottom:1px solid #7620a5;padding:2mm 1mm}.label-title{color:#68128b;font-size:9pt;font-weight:bold;margin-bottom:1mm}
.customer{font-size:17pt;font-weight:800}.phone{font-size:10pt;margin-top:1mm}.item{padding:2mm 0;border-bottom:1px solid #ddd;font-size:10pt}
.muted{font-size:8pt;color:#65576a;margin-top:1mm}.summary{display:flex;justify-content:space-between;align-items:center;gap:3mm;padding:3mm 1mm}
.status{background:${delivered ? "#e5f5e9" : "#f1e2f8"};color:${delivered ? "#176b35" : "#5d147d"};padding:3mm;border-radius:3mm;font-weight:bold;font-size:9pt}
.total{text-align:right;font-size:22pt;font-weight:800;white-space:nowrap}.thanks{margin-top:auto;background:#f3e5fa;text-align:center;padding:4mm;border-radius:3mm;color:#4d155f;font:italic 12pt Georgia,serif}
@media screen{body{padding:10px;background:#eee}.label{margin:auto;box-shadow:0 2px 12px #aaa}}
</style></head><body><main class="label">
<header class="brand"><h1>KIGOBESHOP</h1><p>ROPA · BOLSOS · ESTILO</p></header>
<div class="banner">RECOGIDA EN TIENDA</div><div class="order">PEDIDO Nº ${esc(number)}</div>
<section class="section"><div class="label-title">CLIENTA</div><div class="customer">${esc(name)}</div><div class="phone">TELÉFONO: ${esc(order.customer_phone || "No disponible")}</div></section>
<section class="section"><div class="label-title">ARTÍCULOS (${(order.items ?? []).length})</div>${rows || "Sin detalle de artículos"}</section>
<div class="summary"><div><div class="label-title">ESTADO</div><div class="status">${delivered ? "ENTREGADO" : "PENDIENTE DE RECOGIDA"}</div>${delivered && order.delivered_at ? `<div class="muted">Entregado: ${esc(new Date(order.delivered_at).toLocaleString("es-ES"))}</div>` : ""}</div>
<div><div class="label-title">TOTAL</div><div class="total">${(Number(order.total_cents ?? 0) / 100).toFixed(2).replace(".", ",")} €</div></div></div>
<footer class="thanks">Gracias por confiar en KigobeShop ♡</footer></main><script>window.onload=()=>{window.focus();window.print();};</script></body></html>`);
    popup.document.close();
  }

  const counts = useMemo(() => ({
    pending: orders.filter((o) => o.pickup_status !== "delivered").length,
    delivered: orders.filter((o) => o.pickup_status === "delivered").length,
  }), [orders]);
  const filtered = orders.filter((o) =>
    filter === "all" ? true : filter === "pending" ? o.pickup_status !== "delivered" : o.pickup_status === "delivered"
  );

  if (checking) return <main style={{ padding: 24 }}>Comprobando sesión...</main>;
  if (!user) return <main style={{ padding: 24 }}><h1>Pedidos</h1><p>Inicia sesión desde el administrador principal.</p><button onClick={() => router.push("/admin")}>Ir al administrador</button></main>;

  return <main style={{ maxWidth: 1100, margin: "30px auto", padding: 24, fontFamily: "Arial,sans-serif", color: "#24152b" }}>
    <button onClick={() => router.push("/admin")} style={buttonStyle}>← Volver al administrador</button>
    <h1 style={{ color: "#7e22ce", marginTop: 28 }}>Pedidos KigobeShop</h1>
    <p>Consulta pedidos, imprime etiquetas y controla las recogidas en tienda.</p>
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "18px 0" }}>
      <button onClick={loadOrders} disabled={loading} style={buttonStyle}>{loading ? "Cargando pedidos..." : "Actualizar pedidos"}</button>
      <button onClick={testGLS} disabled={glsLoading} style={{ ...buttonStyle, background: "#16a34a" }}>{glsLoading ? "Comprobando GLS..." : "Probar envío GLS"}</button>
    </div>
    {glsMessage && <p role="status">{glsMessage}</p>}
    {message && <p role="alert" style={{ color: "#b42318" }}>{message}</p>}

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 12, margin: "20px 0" }}>
      <div style={statStyle}><strong>{orders.length}</strong><span>Todos los pedidos</span></div>
      <div style={statStyle}><strong>{counts.pending}</strong><span>Pendientes de recogida</span></div>
      <div style={statStyle}><strong>{counts.delivered}</strong><span>Entregados</span></div>
    </div>
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
      {([["all","Todos"],["pending",`Pendientes (${counts.pending})`],["delivered",`Entregados (${counts.delivered})`]] as [Filter,string][]).map(([value,label]) =>
        <button key={value} onClick={() => setFilter(value)} style={{ ...filterStyle, ...(filter === value ? activeFilterStyle : {}) }}>{label}</button>
      )}
    </div>

    {!message && filtered.length === 0 && !loading && <p>No hay pedidos en este apartado.</p>}
    <div style={{ display: "grid", gap: 18 }}>
      {filtered.map((order) => {
        const delivered = order.pickup_status === "delivered";
        const number = String(order.id).slice(0, 8).toUpperCase();
        return <article key={order.id} style={cardStyle}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <h2 style={{ margin: 0 }}>Pedido #{number}</h2>
            <span style={{ ...statusStyle, background: delivered ? "#e5f5e9" : "#f3e8ff", color: delivered ? "#176b35" : "#6b21a8" }}>{delivered ? "ENTREGADO" : "PENDIENTE DE RECOGIDA"}</span>
          </div>
          <p><strong>Fecha:</strong> {order.created_at ? new Date(order.created_at).toLocaleString("es-ES") : "No disponible"}</p>
          <p><strong>Cliente:</strong> {order.customer_name} {order.customer_surname ?? ""}</p>
          <p><strong>Correo:</strong> {order.customer_email || "No disponible"}</p>
          <p><strong>Teléfono:</strong> {order.customer_phone || "No disponible"}</p>
          <p><strong>Dirección:</strong> {[order.customer_address,order.customer_postal_code,order.customer_city].filter(Boolean).join(", ") || "No disponible"}</p>
          <p><strong>Total:</strong> {(Number(order.total_cents ?? 0) / 100).toFixed(2)} €</p>
          <p><strong>Estado del pago:</strong> {order.payment_status || "No disponible"}</p>
          {delivered && order.delivered_at && <p><strong>Entregado el:</strong> {new Date(order.delivered_at).toLocaleString("es-ES")}</p>}
          <h3>Productos del pedido</h3>
          {order.items?.length ? order.items.map((item) => <div key={item.id} style={{ borderTop: "1px solid #e5e7eb", padding: "10px 0" }}>
            <p>{item.product_name} × {item.quantity}</p>
            {item.selected_size && <p>Talla: {item.selected_size}</p>}
            {item.selected_color && <p>Color: {item.selected_color}</p>}
            <p>Precio por unidad: {(Number(item.unit_price_cents ?? 0) / 100).toFixed(2)} €</p>
          </div>) : <p>No hay detalles de productos disponibles.</p>}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
            <button onClick={() => printLabel(order)} style={buttonStyle}>Imprimir etiqueta 10 × 15 cm</button>
            <button onClick={() => changePickupStatus(order)} disabled={updatingId === order.id} style={{ ...buttonStyle, background: delivered ? "#64748b" : "#16834a" }}>
              {updatingId === order.id ? "Guardando..." : delivered ? "Volver a pendiente" : "Marcar como entregado"}
            </button>
          </div>
        </article>;
      })}
    </div>
  </main>;
}

const buttonStyle: React.CSSProperties = { padding: "12px 18px", background: "#7e22ce", color: "white", border: 0, borderRadius: 8, cursor: "pointer", fontWeight: 700 };
const cardStyle: React.CSSProperties = { border: "1px solid #d8b4fe", borderRadius: 12, padding: 20, background: "white", color: "#222" };
const statStyle: React.CSSProperties = { background: "#f8f0fc", border: "1px solid #ead5f5", borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 5 };
const filterStyle: React.CSSProperties = { padding: "10px 14px", border: "1px solid #d8b4fe", borderRadius: 20, background: "white", color: "#5b216f", cursor: "pointer", fontWeight: 600 };
const activeFilterStyle: React.CSSProperties = { background: "#7620a5", color: "white", borderColor: "#7620a5" };
const statusStyle: React.CSSProperties = { borderRadius: 20, padding: "7px 12px", fontSize: 12, fontWeight: 800 };
