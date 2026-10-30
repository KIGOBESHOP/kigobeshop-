"use client";

import { useEffect } from "react";

export default function PagoOkPage() {
  useEffect(() => {
    try {
      // 1. BOMBA ATÓMICA: Borra ABSOLUTAMENTE TODO el almacenamiento local, se llame como se llame
      localStorage.clear();
      sessionStorage.clear();

      // 2. Borra también todas las cookies por si acaso
      const cookies = document.cookie.split(";");
      for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name.trim() + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
      }
    } catch (error) {
      console.error("Error en la limpieza:", error);
    }
  }, []);

  const manejarVolver = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (err) {}
    
    // 3. REDIRECCIÓN MANUAL: Rompe la memoria de React y fuerza a la Home a cargar de cero
    window.location.href = "/";
  };

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
        onClick={manejarVolver}
        style={{
          marginTop: "20px",
          padding: "12px 24px",
          borderRadius: "10px",
          background: "#6b3fa0",
          color: "#fff",
          textDecoration: "none",
          fontWeight: "bold",
          cursor: "pointer"
        }}
      >
        Volver a KigobeShop
      </a>
    </main>
  );
}
