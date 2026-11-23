
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type CartItem = {
  product_id: string;
  product_name: string;
  image?: string;
  unit_price: number;
  quantity: number;
  color?: string | null;
  size?: string | null;
};

type AbandonedCart = {
  session_id: string;
  items: CartItem[];
  total_cents: number;
  status: string;
  updated_at: string;
};

export default function AbandonedCartsPage() {
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function loadCarts() {
    setLoading(true);
    setMessage("");

    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error("Inicia sesión en el administrador.");
      }

      const response = await fetch("/api/carritos", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "No se pudieron cargar los carritos.");
      }

      setCarts(result.carts || []);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Error al cargar los carritos."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCarts();
  }, []);

  const buttonStyle = {
    padding: "12px 18px",
    background: "#7e22ce",
    color: "white",
    border: "none",
    borderRadius: 9,
    cursor: "pointer",
    fontWeight: "bold" as const,
  };

  return (
    <main style={{
      maxWidth: 1100,
      margin: "30px auto",
      padding: 20,
      fontFamily: "Arial, sans-serif",
    }}>
      <h1 style={{ color: "#6b21a8" }}>🛒 Carritos abandonados</h1>
      <p>Visitantes que han añadido productos a su carrito.</p>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", margin: "20px 0" }}>
        <button style={buttonStyle} onClick={() => window.location.href = "/admin"}>
          ← Volver al administrador
        </button>
        <button style={buttonStyle} onClick={loadCarts}>
          Actualizar carritos
        </button>
      </div>

      {message && (
        <p style={{ color: "#b91c1c" }}>{message}</p>
      )}

      {loading ? (
        <p>Cargando carritos...</p>
      ) : carts.length === 0 ? (
        <p>No hay carritos guardados todavía.</p>
      ) : (
        <>
          <h2>{carts.length} carritos registrados</h2>

          {carts.map((cart) => (
            <section
              key={cart.session_id}
              style={{
                border: "1px solid #e9d5ff",
                borderRadius: 14,
                padding: 18,
                marginBottom: 18,
                background: "#fff",
              }}
            >
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}>
                <strong style={{ color: "#6b21a8" }}>
                  Carrito · {cart.status}
                </strong>
                <strong>
                  {(cart.total_cents / 100).toFixed(2).replace(".", ",")} €
                </strong>
              </div>

              <p style={{ color: "#666", fontSize: 13 }}>
                Última actualización: {new Date(cart.updated_at).toLocaleString("es-ES")}
              </p>

              {(cart.items || []).map((item, index) => (
                <div
                  key={`${item.product_id}-${index}`}
                  style={{
                    display: "flex",
                    gap: 14,
                    alignItems: "center",
                    borderTop: "1px solid #eee",
                    padding: "14px 0",
                  }}
                >
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.product_name}
                      style={{
                        width: 76,
                        height: 90,
                        objectFit: "cover",
                        borderRadius: 9,
                      }}
                    />
                  )}

                  <div>
                    <strong>{item.product_name}</strong>
                    <p style={{ margin: "5px 0", fontSize: 14 }}>
                      Talla: {item.size || "No indicada"} · Color: {item.color || "No indicado"}
                    </p>
                    <p style={{ margin: 0, fontSize: 14 }}>
                      Cantidad: {item.quantity} · Precio: {Number(item.unit_price).toFixed(2)} €
                    </p>
                  </div>
                </div>
              ))}
            </section>
          ))}
        </>
      )}
    </main>
  );
}
