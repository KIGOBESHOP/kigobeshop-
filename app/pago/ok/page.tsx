"use client";

import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

export default function PagoOkPage() {
  useEffect(() => {
    async function limpiarCarritoBaseDatos() {
      try {
        // 1. Limpieza absoluta preventiva en el navegador
        localStorage.clear();
        sessionStorage.clear();

        // 2. Conexión rápida a Supabase para borrar el carro del servidor
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (supabaseUrl && supabaseAnonKey) {
          const supabase = createClient(supabaseUrl, supabaseAnonKey);
          
          // Obtenemos el usuario que tiene la sesión abierta
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user) {
            // Borramos las filas del carrito vinculadas a tu ID de usuario en Supabase
            // (Ajusta el nombre de la tabla 'cart' o 'cart_items' si da error de compilación)
            await supabase
              .from("cart")
              .delete()
              .eq("user_id", user.id);
          }
        }
      } catch (error) {
        console.error("Error al limpiar el carrito en el servidor:", error);
      }
    }

    limpiarCarritoBaseDatos();
  }, []);

  const manejarVolver = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (err) {}
    // Fuerza una recarga completa destruyendo la sesión intermedia
    window.location.href = "/?clear=true";
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
