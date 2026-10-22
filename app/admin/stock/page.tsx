"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export default function StockPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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

  if (checking) return <main style={{ padding: 24 }}>Comprobando sesión...</main>;

  if (!user) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Inventario</h1>
        <p>Inicia sesión desde el administrador principal.</p>
        <button onClick={() => router.push("/admin")}>Ir al administrador</button>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 1100, margin: "30px auto", padding: 24 }}>
      <button onClick={() => router.push("/admin")} style={buttonStyle}>
        ← Volver al administrador
      </button>

      <h1 style={{ color: "#7e22ce", marginTop: 28 }}>Inventario y stock</h1>
      <p>Consulta las unidades disponibles de cada prenda por color y talla.</p>

      <button onClick={loadProducts} disabled={loading} style={buttonStyle}>
        {loading ? "Actualizando..." : "Actualizar inventario"}
      </button>

      <div style={{ overflowX: "auto", marginTop: 24 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f3e8ff", textAlign: "left" }}>
              <th style={cellStyle}>Producto</th>
              <th style={cellStyle}>Color</th>
              <th style={cellStyle}>Talla</th>
              <th style={cellStyle}>Unidades</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const colors = Array.isArray(product.variants)
                ? product.variants.map((variant: any) => variant.color).filter(Boolean)
                : [];
              const productColors = colors.length ? colors : ["Único"];
              const sizes =
                Array.isArray(product.sizes) && product.sizes.length
                  ? product.sizes
                  : ["Única"];

              return productColors.flatMap((color: string) =>
                sizes.map((size: string) => {
                  const quantity = product.stock?.[color]?.[size] ?? 0;

                  return (
                    <tr key={`${product.id}-${color}-${size}`}>
                      <td style={cellStyle}>{product.name}</td>
                      <td style={cellStyle}>{color}</td>
                      <td style={cellStyle}>{size}</td>
                      <td
                        style={{
                          ...cellStyle,
                          color: quantity === 0 ? "#dc2626" : "#166534",
                          fontWeight: "bold",
                        }}
                      >
                        {quantity}
                      </td>
                    </tr>
                  );
                })
              );
            })}
          </tbody>
        </table>
      </div>

      {products.length === 0 && !loading && (
        <p style={{ marginTop: 20 }}>No hay productos para mostrar.</p>
      )}

      <p style={{ color: "#666", marginTop: 20, fontSize: 14 }}>
        Esta página muestra el stock guardado. Para modificar cantidades, utiliza
        por ahora el botón «Gestionar stock» de cada producto en el administrador.
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

const cellStyle = {
  padding: 12,
  borderBottom: "1px solid #e5e7eb",
};
