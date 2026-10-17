
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function prepare() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          setMessage("El enlace ha caducado o no es válido. Solicita otro correo de recuperación.");
          return;
        }
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setReady(true);
      } else {
        setMessage("No se ha encontrado una sesión de recuperación válida. Solicita un nuevo enlace.");
      }
    }

    prepare();
  }, []);

  async function savePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessage("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Las contraseñas no coinciden.");
      return;
    }

    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);

    if (error) {
      setMessage("No se ha podido cambiar la contraseña. Solicita un nuevo enlace.");
      return;
    }

    setMessage("¡Contraseña actualizada! Ya puedes entrar en el panel de administración.");
    setPassword("");
    setConfirmPassword("");
  }

  const inputStyle = {
    display: "block",
    width: "100%",
    padding: 12,
    margin: "8px 0 18px",
    border: "1px solid #d8b4fe",
    borderRadius: 8,
    boxSizing: "border-box" as const,
  };

  return (
    <main style={{ maxWidth: 450, margin: "50px auto", padding: 24 }}>
      <h1>Recuperar contraseña 💜</h1>

      {!ready ? (
        <p>{message || "Comprobando el enlace de recuperación..."}</p>
      ) : (
        <form onSubmit={savePassword}>
          <label>Nueva contraseña</label>
          <input
            required
            type="password"
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={inputStyle}
          />

          <label>Repite la contraseña</label>
          <input
            required
            type="password"
            minLength={8}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={inputStyle}
          />

          <button
            type="submit"
            disabled={busy}
            style={{
              padding: "14px 22px",
              background: "#7e22ce",
              color: "white",
              border: "none",
              borderRadius: 10,
              cursor: "pointer",
            }}
          >
            {busy ? "Guardando..." : "Guardar nueva contraseña"}
          </button>

          {message && <p>{message}</p>}
        </form>
      )}
    </main>
  );
}
