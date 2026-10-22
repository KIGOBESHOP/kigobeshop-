"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export default function ProductosPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  if (checking) {
    return <main style={{ padding: 24 }}>Comprobando sesión...</main>;
  }

  if (!user) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Productos 💜</h1>
        <p>Inicia sesión desde el administrador principal.</p>
        <button onClick={() => router.push("/admin")}>
          Ir al administrador
        </button>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: 1100,
        margin: "40px auto",
        padding: 24,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Productos</h1>
      <p>Gestiona aquí el catálogo de KigobeShop.</p>

      <button
        onClick={() => router.push("/admin")}
        style={{
          padding: "12px 18px",
          background: "#7e22ce",
          color: "white",
          border: 0,
          borderRadius: 8,
          cursor: "pointer",
        }}
      >
        Volver al administrador
      </button>

      <p style={{ marginTop: 24 }}>
        Esta sección está preparada. En el siguiente paso trasladaremos aquí
        la gestión de productos existente, conservando sus funciones.
      </p>
    </main>
  );
}
