"use client";

import { useEffect } from "react";

export default function PagoOkPage() {
  useEffect(() => {
    try {
      // 1. Limpieza radical de almacenes locales comunes del navegador
      localStorage.removeItem("cart");
      localStorage.removeItem("cart-storage");
      localStorage.removeItem("kigobeshop-cart");
      sessionStorage.removeItem("cart");

      // 2. Limpieza de cookies por si acaso tu plantilla las usa
      document.cookie = "cart=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "kigobeshop-cart=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";

      // 3. Lanzar un evento global para avisar a la barra de navegación de que se vacíe
      window.dispatchEvent(new Event("storage"));
    } catch (error) {
      console.error("Error al vaciar el carrito:", error);
    }
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
        textAlign: "center",
        fontFamily: "Arial, sans-serif",
        color: "#30213c",
      }}
    >
      <div style={{ fontSize: "56px" }}>💜</div>
      <h1>¡Gracias por tu compra!</h1>
      <p>Estamos comprobando el estado de tu pago.</p>
      <p>Recibirás la confirmación de tu pedido cuando se verifique el pago.</p>
      <a
        href="/"
        style={{
          marginTop: "20px",
          padding: "12px 24px",
          borderRadius: "10px",
          background: "#6b3fa0",
          color: "#fff",
          textDecoration: "none",
        }}
      >
        Volver a KigobeShop
      </a>
    </main>
  );
}
