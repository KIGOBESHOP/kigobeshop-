
"use client";

import { useState } from "react";

type Product = {
  name: string;
  price: string;
  category: string;
  description: string;
  image: string;
};

export default function AdminPage() {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Ropa");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [message, setMessage] = useState("");

  function handleImage(file?: File) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result || ""));
    reader.readAsDataURL(file);
  }

  function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const product: Product = {
      name,
      price,
      category,
      description,
      image,
    };

    const saved = JSON.parse(
      localStorage.getItem("kigobeshop-products") || "[]"
    ) as Product[];

    localStorage.setItem(
      "kigobeshop-products",
      JSON.stringify([...saved, product])
    );

    setMessage("¡Producto guardado en este navegador!");
    setName("");
    setPrice("");
    setDescription("");
    setImage("");
  }

  return (
    <main style={{ maxWidth: 650, margin: "40px auto", padding: 24 }}>
      <h1>Panel de KIGOBESHOP 💜</h1>
      <p>Añade productos a tu catálogo.</p>

      <form onSubmit={saveProduct}>
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
          onChange={(e) => setCategory(e.target.value)}
          style={fieldStyle}
        >
          <option>Ropa</option>
          <option>Bolsos</option>
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
          type="file"
          accept="image/*"
          required
          onChange={(e) => handleImage(e.target.files?.[0])}
          style={fieldStyle}
        />

        {image && (
          <img
            src={image}
            alt="Vista previa del producto"
            style={{ width: 180, borderRadius: 12, margin: "12px 0" }}
          />
        )}

        <button type="submit" style={buttonStyle}>
          Guardar producto
        </button>

        {message && <p>{message}</p>}
      </form>
    </main>
  );
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
