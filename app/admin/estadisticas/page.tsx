
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type OrderItem = {
  product_name: string;
  quantity: number;
  unit_price_cents: number;
  selected_size?: string | null;
  selected_color?: string | null;
};

type Order = {
  id: string;
  total_cents: number;
  payment_status: string;
  created_at: string;
  items: OrderItem[];
};

type Product = {
  id: number;
  name: string | null;
  stock: Record<string, Record<string, number>> | null;
  variants: { color?: string; sizes?: string[] }[] | null;
  sizes: string[] | null;
};

const euro = (cents: number) =>
  (cents / 100).toLocaleString("es-ES", {
    style: "currency",
    currency: "EUR",
  });

const cardStyle: React.CSSProperties = {
  background: "#fff",
  border: "1px solid #eadcf5",
  borderRadius: 16,
  padding: 20,
  boxShadow: "0 3px 12px rgba(80, 30, 100, 0.05)",
};

const purple = "#7e22ce";

export default function EstadisticasPage() {
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdate, setLastUpdate] = useState("");

  const loadStatistics = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        router.replace("/admin");
        return;
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
        throw new Error(
          result.error || "No se han podido cargar los pedidos."
        );
      }

      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("id, name, stock, variants, sizes")
        .order("name", { ascending: true });

      if (productError) throw productError;

      setOrders(result.orders ?? []);
      setProducts(productData ?? []);
      setLastUpdate(
        new Date().toLocaleString("es-ES", {
          dateStyle: "short",
          timeStyle: "short",
        })
      );
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Ha ocurrido un error al cargar las estadísticas."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  const paidOrders = useMemo(
    () => orders.filter((order) => order.payment_status === "paid"),
    [orders]
  );

  const pendingOrders = orders.filter(
    (order) => order.payment_status === "pending"
  );

  const failedOrders = orders.filter(
    (order) => order.payment_status === "failed"
  );

  const cancelledOrders = orders.filter(
    (order) => order.payment_status === "cancelled"
  );

  const totalRevenue = paidOrders.reduce(
    (sum, order) => sum + Number(order.total_cents || 0),
    0
  );

  const averageOrder = paidOrders.length
    ? totalRevenue / paidOrders.length
    : 0;

  const monthlySales = useMemo(() => {
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - i);

      const year = date.getFullYear();
      const month = date.getMonth();

      const amount = paidOrders
        .filter((order) => {
          const orderDate = new Date(order.created_at);
          return (
            orderDate.getFullYear() === year &&
            orderDate.getMonth() === month
          );
        })
        .reduce((sum, order) => sum + Number(order.total_cents || 0), 0);

      months.push({
        label: date.toLocaleDateString("es-ES", { month: "short" }),
        amount,
      });
    }

    return months;
  }, [paidOrders]);

  const maxMonthlySales = Math.max(
    ...monthlySales.map((month) => month.amount),
    1
  );

  const bestSellers = useMemo(() => {
    const sales: Record<
      string,
      { quantity: number; revenue: number }
    > = {};

    paidOrders.forEach((order) => {
      (order.items ?? []).forEach((item) => {
        const name = item.product_name || "Producto sin nombre";

        if (!sales[name]) {
          sales[name] = { quantity: 0, revenue: 0 };
        }

        sales[name].quantity += Number(item.quantity || 0);
        sales[name].revenue +=
          Number(item.unit_price_cents || 0) *
          Number(item.quantity || 0);
      });
    });

    return Object.entries(sales)
      .map(([name, values]) => ({ name, ...values }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }, [paidOrders]);

  const lowStock = useMemo(() => {
    const rows: {
      id: string;
      product: string;
      color: string;
      size: string;
      quantity: number;
    }[] = [];

    products.forEach((product) => {
      const stock = product.stock;

      if (!stock || typeof stock !== "object") return;

      Object.entries(stock).forEach(([color, sizes]) => {
        if (!sizes || typeof sizes !== "object") return;

        Object.entries(sizes).forEach(([size, quantity]) => {
          const units = Number(quantity);

          if (Number.isFinite(units) && units <= 2) {
            rows.push({
              id: `${product.id}-${color}-${size}`,
              product: product.name || "Producto sin nombre",
              color,
              size,
              quantity: units,
            });
          }
        });
      });
    });

    return rows.sort((a, b) => a.quantity - b.quantity);
  }, [products]);

  const totalUnitsSold = paidOrders.reduce(
    (sum, order) =>
      sum +
      (order.items ?? []).reduce(
        (itemSum, item) => itemSum + Number(item.quantity || 0),
        0
      ),
    0
  );

  const buttonStyle: React.CSSProperties = {
    background: purple,
    color: "white",
    border: "none",
    borderRadius: 10,
    padding: "12px 18px",
    fontWeight: 700,
    cursor: "pointer",
  };

  if (loading) {
    return (
      <main style={{ padding: 30, textAlign: "center" }}>
        Cargando estadísticas de KigobeShop...
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: 1150,
        margin: "0 auto",
        padding: "28px 18px 60px",
        color: "#30213a",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ margin: 0, color: "#6b21a8" }}>
            📊 Estadísticas
          </h1>
          <p style={{ color: "#777", marginBottom: 0 }}>
            Resumen de ventas y rendimiento de KigobeShop
          </p>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            style={{
              ...buttonStyle,
              background: "#f3e8ff",
              color: "#6b21a8",
              border: "1px solid #d8b4fe",
            }}
            onClick={() => router.push("/admin")}
          >
            ← Administrador
          </button>

          <button style={buttonStyle} onClick={loadStatistics}>
            ↻ Actualizar
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            ...cardStyle,
            borderColor: "#fca5a5",
            color: "#b91c1c",
            marginBottom: 20,
          }}
        >
          {error}
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <div style={cardStyle}>
          <p style={{ color: "#777", margin: 0 }}>Facturación total</p>
          <h2 style={{ color: purple, margin: "10px 0" }}>
            {euro(totalRevenue)}
          </h2>
          <small>Solo pedidos pagados</small>
        </div>

        <div style={cardStyle}>
          <p style={{ color: "#777", margin: 0 }}>Pedidos totales</p>
          <h2 style={{ margin: "10px 0" }}>{orders.length}</h2>
          <small>{paidOrders.length} pedidos pagados</small>
        </div>

        <div style={cardStyle}>
          <p style={{ color: "#777", margin: 0 }}>Pendientes de pago</p>
          <h2 style={{ color: "#d97706", margin: "10px 0" }}>
            {pendingOrders.length}
          </h2>
          <small>No incluidos en facturación</small>
        </div>

        <div style={cardStyle}>
          <p style={{ color: "#777", margin: 0 }}>Ticket medio</p>
          <h2 style={{ margin: "10px 0" }}>{euro(averageOrder)}</h2>
          <small>Por pedido pagado</small>
        </div>

        <div style={cardStyle}>
          <p style={{ color: "#777", margin: 0 }}>Unidades vendidas</p>
          <h2 style={{ margin: "10px 0" }}>{totalUnitsSold}</h2>
          <small>En pedidos pagados</small>
        </div>

        <div style={cardStyle}>
          <p style={{ color: "#777", margin: 0 }}>Avisos de poco stock</p>
          <h2
            style={{
              color: lowStock.length ? "#dc2626" : "#16a34a",
              margin: "10px 0",
            }}
          >
            {lowStock.length}
          </h2>
          <small>2 unidades o menos</small>
        </div>
      </div>

      <section style={{ ...cardStyle, marginBottom: 22 }}>
        <h2 style={{ marginTop: 0 }}>Ventas de los últimos 6 meses</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, minmax(0, 1fr))",
            gap: 12,
            alignItems: "end",
            minHeight: 210,
            paddingTop: 12,
          }}
        >
          {monthlySales.map((month) => (
            <div
              key={month.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                minWidth: 0,
              }}
            >
              <strong style={{ fontSize: 12, textAlign: "center" }}>
                {euro(month.amount)}
              </strong>

              <div
                style={{
                  height: 135,
                  width: "100%",
                  display: "flex",
                  alignItems: "end",
                  background: "#faf5ff",
                  borderRadius: 8,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: `${Math.max(
                      month.amount > 0 ? 4 : 0,
                      (month.amount / maxMonthlySales) * 100
                    )}%`,
                    background: purple,
                    borderRadius: "7px 7px 0 0",
                  }}
                />
              </div>

              <span style={{ textTransform: "capitalize", color: "#666" }}>
                {month.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section style={{ ...cardStyle, marginBottom: 22 }}>
        <h2 style={{ marginTop: 0 }}>🏆 Productos más vendidos</h2>

        {bestSellers.length === 0 ? (
          <p>Aún no hay ventas pagadas registradas.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "#777" }}>
                  <th style={{ padding: 10 }}>Producto</th>
                  <th style={{ padding: 10 }}>Unidades</th>
                  <th style={{ padding: 10 }}>Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {bestSellers.map((item, index) => (
                  <tr key={item.name} style={{ borderTop: "1px solid #eee" }}>
                    <td style={{ padding: 12 }}>
                      {index + 1}. {item.name}
                    </td>
                    <td style={{ padding: 12, fontWeight: 700 }}>
                      {item.quantity}
                    </td>
                    <td style={{ padding: 12 }}>{euro(item.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section style={{ ...cardStyle, marginBottom: 22 }}>
        <h2 style={{ marginTop: 0 }}>📦 Estado de los pedidos</h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
            gap: 12,
          }}
        >
          {[
            ["Pagados", paidOrders.length, "#16a34a"],
            ["Pendientes", pendingOrders.length, "#d97706"],
            ["Fallidos", failedOrders.length, "#dc2626"],
            ["Cancelados", cancelledOrders.length, "#777"],
          ].map(([label, count, color]) => (
            <div
              key={String(label)}
              style={{
                background: "#fafafa",
                borderRadius: 10,
                padding: 16,
              }}
            >
              <div style={{ color: "#777" }}>{label}</div>
              <strong style={{ color: String(color), fontSize: 25 }}>
                {count}
              </strong>
            </div>
          ))}
        </div>
      </section>

      <section style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>⚠️ Productos con poco stock</h2>
        <p style={{ color: "#777" }}>
          Se muestran las combinaciones de color y talla con 2 unidades o menos.
        </p>

        {lowStock.length === 0 ? (
          <p style={{ color: "#16a34a" }}>
            No hay combinaciones con poco stock registrado.
          </p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", color: "#777" }}>
                  <th style={{ padding: 10 }}>Producto</th>
                  <th style={{ padding: 10 }}>Color</th>
                  <th style={{ padding: 10 }}>Talla</th>
                  <th style={{ padding: 10 }}>Unidades</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((item) => (
                  <tr key={item.id} style={{ borderTop: "1px solid #eee" }}>
                    <td style={{ padding: 12 }}>{item.product}</td>
                    <td style={{ padding: 12 }}>{item.color}</td>
                    <td style={{ padding: 12 }}>{item.size}</td>
                    <td
                      style={{
                        padding: 12,
                        color: item.quantity === 0 ? "#dc2626" : "#d97706",
                        fontWeight: 700,
                      }}
                    >
                      {item.quantity}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p style={{ color: "#999", fontSize: 12, marginTop: 20 }}>
        Última actualización: {lastUpdate || "—"}
      </p>
    </main>
  );
}
