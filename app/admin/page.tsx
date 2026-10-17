
"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Ropa");
  const [collection, setCollection] = useState("Mujer");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

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

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setBusy(false);
    if (error) setMessage("No se ha podido iniciar sesión. Revisa tus datos.");
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setMessage("Selecciona una foto del producto.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("productos")
        .upload(path, file, { upsert: false });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage
        .from("productos")
        .getPublicUrl(path);

      const { error: insertError } = await supabase
        .from("products")
        .insert({
          name: name.trim(),
          price: Number(price),
          category,
          collection,
          description: description.trim(),
          image: publicData.publicUrl,
        });

      if (insertError) {
        await supabase.storage.from("productos").remove([path]);
        throw insertError;
      }

      setMessage("¡Producto guardado en Supabase!");
      setName("");
      setPrice("");
      setDescription("");
      setFile(null);
      const form = document.getElementById("product-form") as HTMLFormElement;
      form?.reset();
      setCategory("Ropa");
      setCollection("Mujer");
    } catch (error) {
      console.error(error);
      setMessage(
        "No se ha podido guardar. Comprueba los permisos y los campos de Supabase."
      );
    } finally {
      setBusy(false);
    }
  }

  const fieldStyle = {
    display: "block",
    width: "100%",
    padding: 12,
    margin: "8px 0 18px",
    border: "1px solid #d8b4fe",
    borderRadius: 8,
    boxSizing: "border-box" as const,
  };

  const buttonStyle = {
    padding: "14px 22px",
    background: "#7e22ce",
    color: "white",
    border: "none",
    borderRadius: 10,
    cursor: "pointer",
  };

  if (checking) {
    return <main style={{ padding: 24 }}>Comprobando sesión...</main>;
  }

  if (!user) {
    return (
      <main style={{ maxWidth: 450, margin: "50px auto", padding: 24 }}>
        <h1>Panel de KIGOBESHOP 💜</h1>
        <p>Inicia sesión para gestionar tu catálogo.</p>

        <form onSubmit={login}>
          <label>Correo electrónico</label>
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={fieldStyle}
          />

          <label>Contraseña</label>
          <input
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={fieldStyle}
          />

          <button disabled={busy} type="submit" style={buttonStyle}>
            {busy ? "Entrando..." : "Iniciar sesión"}
          </button>
        </form>

        {message && <p>{message}</p>}
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 650, margin: "40px auto", padding: 24 }}>
      <h1>Panel de KIGOBESHOP 💜</h1>
      <p>Sesión iniciada: {user.email}</p>

      <button
        type="button"
        style={buttonStyle}
        onClick={() => supabase.auth.signOut()}
      >
        Cerrar sesión
      </button>

      <h2>Añadir producto</h2>

      <form id="product-form" onSubmit={saveProduct}>
        <label>Nombre del producto</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej. Bolso elegante"
          style={fieldStyle}
        />

        <label>Precio en euros</label>
        <input
          required
          type="number"
          min="0.01"
          step="0.01"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="25"
          style={fieldStyle}
        />

        <label>Categoría</label>
        <select
          value={category}
          onChange={(e) => {
            setCategory(e.target.value);
            setCollection(e.target.value === "Bolsos" ? "Bolsos" : "Mujer");
          }}
          style={fieldStyle}
        >
          <option value="Ropa">Ropa</option>
          <option value="Bolsos">Bolsos</option>
        </select>

        <label>Colección</label>
        <select
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
          style={fieldStyle}
        >
          {category === "Ropa" ? (
            <>
              <option value="Mujer">Mujer</option>
              <option value="Hombre">Hombre</option>
              <option value="Tallas grandes">Tallas grandes</option>
            </>
          ) : (
            <option value="Bolsos">Bolsos</option>
          )}
        </select>

        <label>Descripción</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe el producto..."
          style={fieldStyle}
        />

        <label>Foto del producto</label>
        <input
          required
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          style={fieldStyle}
        />

        <button disabled={busy} type="submit" style={buttonStyle}>
          {busy ? "Guardando..." : "Guardar producto"}
        </button>

        {message && <p>{message}</p>}
      </form>
    </main>
  );
}


