
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type Variant = { color: string; files: File[] };
type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  collection: string;
  description?: string;
  image?: string;
  variants?: { color: string; images?: string[] }[];
  sizes?: string[];
  tag?: string | null;
};

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
  padding: "12px 18px",
  background: "#7e22ce",
  color: "white",
  border: 0,
  borderRadius: 10,
  cursor: "pointer",
};

export default function ProductosPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("Ropa");
  const [collection, setCollection] = useState("Mujer");
  const [description, setDescription] = useState("");
  const [tag, setTag] = useState("");
  const [sizes, setSizes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [variants, setVariants] = useState<Variant[]>([]);

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

  useEffect(() => {
    if (user) void loadProducts();
  }, [user]);

  async function loadProducts() {
    setLoadingProducts(true);

    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("name", { ascending: true });

    if (error) {
      console.error(error);
      setMessage("No se han podido cargar los productos.");
    } else {
      setProducts((data ?? []) as Product[]);
    }

    setLoadingProducts(false);
  }

  async function uploadImage(selectedFile: File): Promise<string> {
    const extension =
      selectedFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from("productos")
      .upload(path, selectedFile, { upsert: false });

    if (error) throw error;

    return supabase.storage.from("productos").getPublicUrl(path)
      .data.publicUrl;
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setMessage("Selecciona una foto principal del producto.");
      return;
    }

    if (
      variants.some(
        (variant) => !variant.color.trim() || variant.files.length === 0
      )
    ) {
      setMessage("Cada color debe tener un nombre y al menos una foto.");
      return;
    }

    const parsedPrice = Number(price.replace(",", "."));
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setMessage("Introduce un precio válido.");
      return;
    }

    setBusy(true);
    setMessage("");
    const uploadedPaths: string[] = [];

    try {
      const uploadTracked = async (selectedFile: File) => {
        const extension =
          selectedFile.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

        const { error } = await supabase.storage
          .from("productos")
          .upload(path, selectedFile, { upsert: false });

        if (error) throw error;
        uploadedPaths.push(path);

        return supabase.storage.from("productos").getPublicUrl(path)
          .data.publicUrl;
      };

      const mainImage = await uploadTracked(file);
      const savedVariants: { color: string; images: string[] }[] = [];

      for (const variant of variants) {
        const images: string[] = [];
        for (const variantFile of variant.files) {
          images.push(await uploadTracked(variantFile));
        }
        savedVariants.push({ color: variant.color.trim(), images });
      }

      const { error } = await supabase.from("products").insert({
        name: name.trim(),
        price: parsedPrice,
        category,
        collection,
        description: description.trim(),
        tag: tag || null,
        sizes: sizes.split(",").map((s) => s.trim()).filter(Boolean),
        image: mainImage,
        variants: savedVariants,
      });

      if (error) throw error;

      setMessage("¡Producto guardado con sus colores y fotos!");
      setName("");
      setPrice("");
      setCategory("Ropa");
      setCollection("Mujer");
      setDescription("");
      setTag("");
      setSizes("");
      setFile(null);
      setVariants([]);
      (document.getElementById("product-form") as HTMLFormElement)?.reset();
      await loadProducts();
    } catch (error) {
      console.error(error);

      if (uploadedPaths.length > 0) {
        const { error: cleanupError } = await supabase.storage
          .from("productos")
          .remove(uploadedPaths);
        if (cleanupError) console.error(cleanupError);
      }

      setMessage(
        "No se ha podido guardar el producto. Revisa los campos y los permisos de Supabase."
      );
    } finally {
      setBusy(false);
    }
  }

  async function editProduct(product: Product) {
    const newName = window.prompt("Nombre del producto:", product.name);
    if (newName === null || !newName.trim()) return;

    const newSizes = window.prompt(
      "Tallas disponibles, separadas por comas:",
      Array.isArray(product.sizes) ? product.sizes.join(", ") : ""
    );
    if (newSizes === null) return;

    const newPrice = window.prompt("Precio en euros:", String(product.price));
    if (newPrice === null || !newPrice.trim()) return;

    const parsedPrice = Number(newPrice.replace(",", "."));
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setMessage("Introduce un precio válido.");
      return;
    }

    const newDescription = window.prompt(
      "Descripción del producto:",
      product.description || ""
    );
    if (newDescription === null) return;

    const newTag = window.prompt(
      "Etiqueta: vacío, NUEVO, OFERTA o TRENDING",
      product.tag || ""
    );
    if (newTag === null) return;

    const tagValue = newTag.trim().toUpperCase();
    if (
      tagValue !== "" &&
      !["NUEVO", "OFERTA", "TRENDING"].includes(tagValue)
    ) {
      setMessage("La etiqueta no es válida.");
      return;
    }

    const newCategory = window.prompt(
      "Categoría: Ropa o Bolsos",
      product.category || "Ropa"
    );
    if (newCategory === null) return;

    const categoryValue = newCategory.trim();
    if (!["Ropa", "Bolsos"].includes(categoryValue)) {
      setMessage("La categoría debe ser Ropa o Bolsos.");
      return;
    }

    let newCollection = "Bolsos";

    if (categoryValue === "Ropa") {
      const collectionValue = window.prompt(
        "Colección: Mujer, Hombre o Tallas grandes",
        product.category === "Ropa" ? product.collection : "Mujer"
      );
      if (collectionValue === null) return;

      if (
        !["Mujer", "Hombre", "Tallas grandes"].includes(
          collectionValue.trim()
        )
      ) {
        setMessage("La colección no es válida.");
        return;
      }
      newCollection = collectionValue.trim();
    }

    setBusy(true);
    setMessage("");

    try {
      const { error } = await supabase
        .from("products")
        .update({
          name: newName.trim(),
          price: parsedPrice,
          description: newDescription.trim(),
          sizes: newSizes.split(",").map((s) => s.trim()).filter(Boolean),
          category: categoryValue,
          collection: newCollection,
          tag: tagValue || null,
        })
        .eq("id", product.id);

      if (error) throw error;
      setMessage("Producto actualizado correctamente.");
      await loadProducts();
    } catch (error) {
      console.error(error);
      setMessage("No se han podido guardar los cambios.");
    } finally {
      setBusy(false);
    }
  }

  async function changeProductImage(product: Product, selectedFile: File) {
    setBusy(true);
    setMessage("");

    try {
      const image = await uploadImage(selectedFile);
      const { error } = await supabase
        .from("products")
        .update({ image })
        .eq("id", product.id);

      if (error) throw error;
      setMessage("¡Foto actualizada correctamente!");
      await loadProducts();
    } catch (error) {
      console.error(error);
      setMessage("No se ha podido cambiar la foto.");
    } finally {
      setBusy(false);
    }
  }

  async function deleteProduct(id: string) {
    if (!window.confirm("¿Seguro que quieres eliminar este producto?")) return;

    setBusy(true);
    setMessage("");

    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      setMessage("Producto eliminado correctamente.");
      await loadProducts();
    } catch (error) {
      console.error(error);
      setMessage("No se ha podido eliminar el producto.");
    } finally {
      setBusy(false);
    }
  }

  if (checking) {
    return <main style={{ padding: 24 }}>Comprobando sesión...</main>;
  }

  if (!user) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Productos 💜</h1>
        <p>Inicia sesión desde el administrador principal.</p>
        <button style={buttonStyle} onClick={() => router.push("/admin")}>
          Ir al administrador
        </button>
      </main>
    );
  }

  return (
    <main
      style={{
        maxWidth: 900,
        margin: "30px auto",
        padding: 24,
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Productos 💜</h1>
      <p>Sesión iniciada: {user.email}</p>

      <button
        style={buttonStyle}
        onClick={() => router.push("/admin")}
      >
        Volver al menú del administrador
      </button>

      {message && (
        <p role="status" style={{ margin: "18px 0", color: "#6b21a8" }}>
          {message}
        </p>
      )}

      <h2>Añadir producto</h2>

      <form
        id="product-form"
        onSubmit={saveProduct}
        style={{ border: "1px solid #d8b4fe", borderRadius: 12, padding: 18 }}
      >
        <label>Nombre del producto</label>
        <input required value={name} onChange={(e) => setName(e.target.value)} style={fieldStyle} />

        <label>Precio en euros</label>
        <input required type="number" min="0.01" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} style={fieldStyle} />

        <label>Categoría</label>
        <select value={category} onChange={(e) => {
          setCategory(e.target.value);
          setCollection(e.target.value === "Bolsos" ? "Bolsos" : "Mujer");
        }} style={fieldStyle}>
          <option value="Ropa">Ropa</option>
          <option value="Bolsos">Bolsos</option>
        </select>

        <label>Colección</label>
        <select value={collection} onChange={(e) => setCollection(e.target.value)} style={fieldStyle}>
          {category === "Ropa" ? (
            <>
              <option value="Mujer">Mujer</option>
              <option value="Hombre">Hombre</option>
              <option value="Tallas grandes">Tallas grandes</option>
            </>
          ) : <option value="Bolsos">Bolsos</option>}
        </select>

        <label>Tallas disponibles</label>
        <input value={sizes} onChange={(e) => setSizes(e.target.value)} placeholder="S, M, L, XL o Talla única" style={fieldStyle} />

        <label>Descripción</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={fieldStyle} />

        <label>Etiqueta</label>
        <select value={tag} onChange={(e) => setTag(e.target.value)} style={fieldStyle}>
          <option value="">Sin etiqueta</option>
          <option value="NUEVO">NUEVO</option>
          <option value="OFERTA">OFERTA</option>
          <option value="TRENDING">TRENDING</option>
        </select>

        <div style={{ border: "1px solid #d8b4fe", borderRadius: 10, padding: 14, marginBottom: 20 }}>
          <h3>Colores y fotos de cada variante</h3>

          {variants.map((variant, index) => (
            <div key={index} style={{ border: "1px solid #d8b4fe", borderRadius: 10, padding: 12, marginBottom: 14 }}>
              <label>Nombre del color</label>
              <input value={variant.color} onChange={(e) => setVariants((prev) => prev.map((v, i) => i === index ? { ...v, color: e.target.value } : v))} placeholder="Negro, Beige, Rosa..." style={fieldStyle} />

              <label>Fotos de este color</label>
              <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => setVariants((prev) => prev.map((v, i) => i === index ? { ...v, files: Array.from(e.target.files ?? []) } : v))} style={fieldStyle} />

              <p>{variant.files.length} foto(s) seleccionada(s)</p>
              <button type="button" style={buttonStyle} onClick={() => setVariants((prev) => prev.filter((_, i) => i !== index))}>Eliminar este color</button>
            </div>
          ))}

          <button type="button" style={buttonStyle} onClick={() => setVariants((prev) => [...prev, { color: "", files: [] }])}>
            + Añadir color
          </button>
        </div>

        <label>Foto principal del producto</label>
        <input required type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} style={fieldStyle} />

        <button disabled={busy} type="submit" style={buttonStyle}>
          {busy ? "Guardando..." : "Guardar producto"}
        </button>
      </form>

      <h2 style={{ marginTop: 32 }}>Mis productos</h2>
      <button type="button" style={buttonStyle} onClick={() => void loadProducts()} disabled={loadingProducts}>
        {loadingProducts ? "Cargando..." : "Actualizar lista"}
      </button>

      {products.map((product) => (
        <article key={product.id} style={{ border: "1px solid #d8b4fe", borderRadius: 12, padding: 16, marginTop: 16 }}>
          {product.image && <img src={product.image} alt={product.name} style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8 }} />}
          <h3>{product.name}</h3>
          <p>Precio: {Number(product.price).toFixed(2)} €</p>
          <p>Categoría: {product.category} · Colección: {product.collection}</p>
          <p>Tallas: {product.sizes?.length ? product.sizes.join(", ") : "Sin tallas"}</p>
          <p>Etiqueta: {product.tag || "Sin etiqueta"}</p>
          <p>{product.description}</p>
          <p>Colores: {product.variants?.length ? product.variants.map((v) => v.color).join(", ") : "Sin variantes"}</p>

          <label style={{ display: "block", margin: "12px 0", color: "#7e22ce", fontWeight: "bold" }}>
            Cambiar foto principal
            <input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} style={{ display: "block", marginTop: 8 }} onChange={(event) => {
              const selectedFile = event.target.files?.[0];
              if (selectedFile) void changeProductImage(product, selectedFile);
              event.target.value = "";
            }} />
          </label>

          <button type="button" style={{ ...buttonStyle, marginRight: 8 }} disabled={busy} onClick={() => void editProduct(product)}>Editar producto</button>
          <button type="button" style={{ ...buttonStyle, background: "#dc2626" }} disabled={busy} onClick={() => void deleteProduct(product.id)}>Eliminar producto</button>
        </article>
      ))}
    </main>
  );
}
