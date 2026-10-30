"use client";

import { useState, useEffect } from "react";

export default function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Comprobamos si el usuario ya aceptó o rechazó las cookies en el pasado
    const cookieConsent = localStorage.getItem("kigobeshop-cookies");
    if (!cookieConsent) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem("kigobeshop-cookies", "accepted-all");
    setShowBanner(false);
    // Aquí puedes activar tus scripts de seguimiento (Google Analytics, Píxel de Meta, etc.)
    window.location.reload(); 
  };

  const handleRejectAll = () => {
    localStorage.setItem("kigobeshop-cookies", "rejected-all");
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div style={{
      position: "fixed",
      bottom: "20px",
      left: "20px",
      right: "20px",
      maxWidth: "500px",
      background: "#ffffff",
      color: "#333333",
      boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.15)",
      borderRadius: "16px",
      padding: "20px",
      zIndex: 9999,
      fontFamily: "sans-serif",
      border: "1px solid #eaeaea"
    }}>
      <h3 style={{ margin: "0 0 10px 0", fontSize: "16px", fontWeight: "bold", color: "#000" }}>
        🍪 Control de Cookies en KigobeShop
      </h3>
      <p style={{ margin: "0 0 15px 0", fontSize: "13px", lineHeight: "1.5", color: "#666" }}>
        Utilizamos cookies propias y de terceros para analizar el tráfico de la web, recordar tu carrito y mejorar tu experiencia urbana. Puedes aceptar todas las cookies o rechazar su uso. Consulta nuestra <a href="/legal" target="_blank" style={{ color: "#000", fontWeight: "bold", textDecoration: "underline" }}>Política de Privacidad y Cookies</a>.
      </p>
      <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
        <button 
          onClick={handleRejectAll}
          style={{
            background: "#f3f3f3",
            color: "#333",
            border: "0",
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "13px",
            cursor: "pointer",
            fontWeight: "500"
          }}
        >
          Rechazar todo
        </button>
        <button 
          onClick={handleAcceptAll}
          style={{
            background: "#000000",
            color: "#ffffff",
            border: "0",
            padding: "8px 16px",
            borderRadius: "8px",
            fontSize: "13px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Aceptar todas
        </button>
      </div>
    </div>
  );
}
