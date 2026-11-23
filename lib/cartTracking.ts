"use client";

const SESSION_KEY = "kigobeshop-cart-session";

function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export async function syncAnonymousCart(cart: any[]): Promise<void> {
  if (typeof window === "undefined") return;
  // Solo registrar si el visitante aceptó las cookies opcionales.
  if (localStorage.getItem("kigobeshop-cookies") !== "accepted-all") return;

  try {
    const sessionId = getSessionId();
    if (!Array.isArray(cart) || cart.length === 0) {
      await fetch("/api/carritos", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
        keepalive: true,
      });
      return;
    }
    const items = cart.map((item) => ({
      product_id: String(item.product?.id ?? ""),
      product_name: String(item.product?.name ?? "Producto"),
      image: String(item.selectedImage || item.product?.image || ""),
      unit_price: Number(item.product?.price ?? 0),
      quantity: Math.max(1, Math.min(99, Number(item.qty ?? 1))),
      color: item.selectedColor ? String(item.selectedColor) : null,
      size: item.selectedSize ? String(item.selectedSize) : null,
    })).filter((item) => item.product_id);
    if (!items.length) return;
    await fetch("/api/carritos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, items }),
      keepalive: true,
    });
  } catch (error) {
    console.warn("No se ha podido sincronizar el carrito anónimo.", error);
  }
}
