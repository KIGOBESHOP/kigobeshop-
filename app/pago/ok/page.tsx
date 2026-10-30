"use client";

import { useEffect } from "react";

export default function PagoOkPage() {
  useEffect(() => {
    try {
      // 1. Limpieza absoluta de toda la memoria local del navegador
      localStorage.clear(); 
      sessionStorage.clear();

      // 2. Limpieza de todas las cookies existentes
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name.trim() + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      }

      // 3. Forzar un refresco controlado de los componentes para vaciar el estado de React
      window.dispatchEvent(new Event("storage"));
    } catch (error) {
      console.error("Error al limpiar el carro:", error);
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
      
      {/* CORREGIDO: Usamos un enlace normal con refresh completo para limpiar la barra de navegación */}
      <a
        href="/"
        style={{
          marginTop: "20px",
          padding: "12px 24px",
          borderRadius: "10px",
          background: "#6b3fa0",
          color: "#fff",
          textDecoration: "none",
          fontWeight: "bold"
        }}
      >
        Volver a KigobeShop
      </a>
    </main>
  );
}
