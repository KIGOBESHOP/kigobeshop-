
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type StockView = "all" | "available" | "soldout";

export default function StockPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stockView, setStockView] = useState<StockView>("all");

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
    if (user) void loadProducts();
  }, [user]);

  async function loadProducts() {
    setLoading(true);

    const { data, error } = await supabase
      .from("products")
      .select("id, name, image, variants, sizes, stock")
      .order("name", { ascending: true });

    if (error) {
      console.error(error);
      alert("No se ha podido cargar el inventario.");
    } else {
      setProducts(data ?? []);
    }

    setLoading(false);
  }

  const inventoryRows = products.flatMap((product) => {
    const variants = Array.isArray(product.variants)
      ? product.variants.filter((variant: any) => variant.color)
      : [];

    const rows = variants.length
      ? variants.flatMap((variant: any) => {
          const sizes =
            Array.isArray(variant.sizes) && variant.sizes.length > 0
              ? variant.sizes
              : Array.isArray(product.sizes) && product.sizes.length > 0
                ? product.sizes
                : ["Única"];

          return sizes.map((size: string) => ({
            color: variant.color,
            size,
          }));
        })
      : (
          Array.isArray(product.sizes) && product.sizes.length > 0
            ? product.sizes
            : ["Única"]
        ).map((size: string) => ({
          color: "Único",
          size,
        }));

    return rows.map(({ color, size }: { color: string; size: string }, rowIndex: number) => ({
  id: `${product.id}-${rowIndex}-${color}-${size}`,
      name: product.name,
      image: product.image,
      color,
      size,
      quantity: Number(product.stock?.[color]?.[size] ?? 0),
    }));
  });

  const availableRows = inventoryRows.filter((item) => item.quantity > 0);
  const soldOutRows = inventoryRows.filter((item) => item.quantity === 0);

  const filteredRows =
    stockView === "available"
      ? availableRows
      : stockView === "soldout"
        ? soldOutRows
        : inventoryRows;

  if (checking) {
    return <main style={{ padding: 24 }}>Comprobando sesión...</main>;
  }

  if (!user) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Inventario</h1>
        <p>Inicia sesión desde el administrador principal.</p>
        <button onClick={() => router.push("/admin")}>
          Ir al administrador
        </button>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1100, margin: "30px auto", padding: 24 }}>
      <button onClick={() => router.push("/admin")} style={buttonStyle}>
        ← Volver al administrador
      </button>

      <h1 style={{ color: "#7e22ce", marginTop: 28 }}>
        Inventario y stock 💜
      </h1>

      <p>Consulta las unidades disponibles de cada prenda por color y talla.</p>

      <button onClick={loadProducts} disabled={loading} style={buttonStyle}>
        {loading ? "Actualizando..." : "Actualizar inventario"}
      </button>

      <div style={tabsContainer}>
        <button
          onClick={() => setStockView("all")}
          style={tabStyle(stockView === "all")}
        >
          Todo ({inventoryRows.length})
        </button>

        <button
          onClick={() => setStockView("available")}
          style={tabStyle(stockView === "available")}
        >
          Disponible ({availableRows.length})
        </button>

        <button
          onClick={() => setStockView("soldout")}
          style={tabStyle(stockView === "soldout")}
        >
          🚨 Agotado ({soldOutRows.length})
        </button>
      </div>

      <h2 style={{ marginTop: 24, color: "#6b21a8" }}>
        {stockView === "all"
          ? "Todo el inventario"
          : stockView === "available"
            ? "Stock disponible"
            : "Productos y variantes agotados"}
      </h2>

      <div style={{ overflowX: "auto", marginTop: 16 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f3e8ff", textAlign: "left" }}>
              <th style={cellStyle}>Producto</th>
              <th style={cellStyle}>Color</th>
              <th style={cellStyle}>Talla</th>
              <th style={cellStyle}>Unidades</th>
              <th style={cellStyle}>Estado</th>
            </tr>
          </thead>

          <tbody>
            {filteredRows.map((item) => (
              <tr key={item.id}>
                <td style={cellStyle}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{
                          width: 45,
                          height: 55,
                          objectFit: "cover",
                          borderRadius: 6,
                        }}
                      />
                    )}
                    {item.name}
                  </div>
                </td>

                <td style={cellStyle}>{item.color}</td>
                <td style={cellStyle}>{item.size}</td>

                <td
                  style={{
                    ...cellStyle,
                    fontWeight: "bold",
                    color: item.quantity === 0 ? "#dc2626" : "#166534",
                  }}
                >
                  {item.quantity}
                </td>

                <td style={cellStyle}>
                  <span
                    style={{
                      padding: "5px 9px",
                      borderRadius: 20,
                      fontSize: 12,
                      fontWeight: "bold",
                      color: item.quantity === 0 ? "#b91c1c" : "#166534",
                      background: item.quantity === 0 ? "#fee2e2" : "#dcfce7",
                    }}
                  >
                    {item.quantity === 0 ? "AGOTADO" : "DISPONIBLE"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredRows.length === 0 && !loading && (
        <p style={{ marginTop: 24, textAlign: "center", color: "#777" }}>
          {stockView === "soldout"
            ? "¡Genial! No tienes variantes agotadas."
            : stockView === "available"
              ? "No hay unidades disponibles."
              : "No hay productos para mostrar."}
        </p>
      )}

      <p style={{ color: "#666", marginTop: 20, fontSize: 14 }}>
        Para modificar cantidades, utiliza el botón «Gestionar stock» de cada
        producto en el administrador.
      </p>
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

const tabsContainer = {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: 10,
  marginTop: 24,
};

const tabStyle = (active: boolean) => ({
  padding: "12px 16px",
  border: active ? "2px solid #7e22ce" : "1px solid #ddd",
  borderRadius: 10,
  background: active ? "#f3e8ff" : "white",
  color: active ? "#6b21a8" : "#444",
  fontWeight: "bold" as const,
  cursor: "pointer",
});

const cellStyle = {
  padding: 12,
  borderBottom: "1px solid #e5e7eb",
};
