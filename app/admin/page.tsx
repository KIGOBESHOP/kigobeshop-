
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
  const [variants, setVariants] = useState<
  { color: string; files: File[] }[]
>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);


  const [products, setProducts] = useState<any[]>([]);
const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
  loadProducts();
}
      setChecking(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
     (_event, session) => {
  setUser(session?.user ?? null);
}
    );

    return () => listener.subscription.unsubscribe();
  }, []);
async function loadProducts() {
  setLoadingProducts(true);

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    setMessage("No se han podido cargar los productos.");
    console.error(error);
  } else {
    setProducts(data ?? []);
  }

  setLoadingProducts(false);
}


async function editProduct(product: any) {
  const newName = window.prompt(
    "Nombre del producto:",
    product.name
  );
  if (newName === null || !newName.trim()) return;

  const newPrice = window.prompt(
    "Precio en euros:",
    String(product.price)
  );
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

  const newCategory = window.prompt(
    "Categoría: escribe Ropa o Bolsos",
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
      product.category === "Ropa"
        ? product.collection
        : "Mujer"
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
        category: categoryValue,
        collection: newCollection,
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

async function changeProductImage(product: any, file: File) {
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

    const { error: updateError } = await supabase
      .from("products")
      .update({ image: publicData.publicUrl })
      .eq("id", product.id);

    if (updateError) throw updateError;

    setMessage("¡Foto actualizada correctamente!");
    await loadProducts();
  } catch (error) {
    console.error(error);
    setMessage("No se ha podido cambiar la foto.");
  } finally {
    setBusy(false);
  }
}
function addVariant() {
  setVariants((prev) => [...prev, { color: "", files: [] }]);
}

function updateVariantColor(index: number, color: string) {
  setVariants((prev) =>
    prev.map((variant, i) =>
      i === index ? { ...variant, color } : variant
    )
  );
}

function updateVariantFiles(index: number, files: File[]) {
  setVariants((prev) =>
    prev.map((variant, i) =>
      i === index ? { ...variant, files } : variant
    )
  );
}

function removeVariant(index: number) {
  setVariants((prev) => prev.filter((_, i) => i !== index));
}
async function deleteProduct(id: string) {
  const confirmed = window.confirm(
    "¿Seguro que quieres eliminar este producto?"
  );

  if (!confirmed) return;

  setBusy(true);
  setMessage("");

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    setMessage("No se ha podido eliminar el producto.");
  } else {
    setMessage("Producto eliminado correctamente.");
    await loadProducts();
  }

  setBusy(false);
}

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
async function recoverPassword() {
  setMessage("");

  if (!email) {
    setMessage("Escribe primero tu correo electrónico.");
    return;
  }

  setBusy(true);

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
 
redirectTo: "https://www.kigobeshop.com/auth/reset-password",

  });

  setBusy(false);

 if (error) {
  console.error("Error de recuperación:", error);
  setMessage(`Error: ${error.message}`);
} else {
    setMessage("Te hemos enviado un correo para cambiar la contraseña.");
  }
}

async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
  event.preventDefault();

  if (!file) {
    setMessage("Selecciona una foto principal del producto.");
    return;
  }

  if (
    variants.some(
      (variant) =>
        !variant.color.trim() || variant.files.length === 0
    )
  ) {
    setMessage("Cada color debe tener un nombre y al menos una foto.");
    return;
  }

  setBusy(true);
  setMessage("");

  const uploadedPaths: string[] = [];

  try {
   const uploadImage = async (selectedFile: File): Promise<string> => {
      const extension =
        selectedFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${Date.now()}-${crypto.randomUUID()}.${extension}`;

      const { error } = await supabase.storage
        .from("productos")
        .upload(path, selectedFile, { upsert: false });

      if (error) throw error;

      uploadedPaths.push(path);

      const { data } = supabase.storage
        .from("productos")
        .getPublicUrl(path);

          return data.publicUrl;
    };

    const mainImage = await uploadImage(file);

    const savedVariants = [];

    for (const variant of variants) {
      const images: string[] = [];

      for (const variantFile of variant.files) {
        images.push(await uploadImage(variantFile));
      }

      savedVariants.push({
        color: variant.color.trim(),
        images,
      });
    }

    const { error: insertError } = await supabase
      .from("products")
      .insert({
        name: name.trim(),
        price: Number(price),
        category,
        collection,
        description: description.trim(),
        image: mainImage,
        variants: savedVariants,
      });

    if (insertError) throw insertError;

    setMessage("¡Producto guardado con sus colores y fotos!");
    await loadProducts();

    setName("");
    setPrice("");
    setDescription("");
    setFile(null);
    setVariants([]);

    const form = document.getElementById(
      "product-form"
    ) as HTMLFormElement;

    form?.reset();
    setCategory("Ropa");
    setCollection("Mujer");
  } catch (error) {
    console.error(error);

    if (uploadedPaths.length > 0) {
      const { error: cleanupError } = await supabase.storage
        .from("productos")
        .remove(uploadedPaths);

      if (cleanupError) {
        console.error("No se pudieron limpiar algunas fotos:", cleanupError);
      }
    }

    setMessage(
      "No se ha podido guardar el producto. Revisa los campos y los permisos de Supabase."
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

          <button
            type="button"
            onClick={recoverPassword}
            disabled={busy}
            style={{ ...buttonStyle, marginTop: 12 }}
          >
            Recuperar contraseña
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

<div style={{ border: "1px solid #d8b4fe", borderRadius: 10, padding: 14, marginBottom: 20 }}>
  <h3>Colores y fotos de cada variante</h3>

  {variants.map((variant, index) => (
    <div
      key={index}
      style={{
        border: "1px solid #d8b4fe",
        borderRadius: 10,
        padding: 12,
        marginBottom: 14,
      }}
    >
      <label>Nombre del color</label>
      <input
        value={variant.color}
        onChange={(e) => updateVariantColor(index, e.target.value)}
        placeholder="Ej. Negro, Beige, Rosa"
        style={fieldStyle}
      />

      <label>Fotos de este color</label>
      <input
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={(e) =>
          updateVariantFiles(index, Array.from(e.target.files ?? []))
        }
        style={fieldStyle}
      />

      <p>{variant.files.length} foto(s) seleccionada(s)</p>

      <button
        type="button"
        onClick={() => removeVariant(index)}
        style={buttonStyle}
      >
        Eliminar este color
      </button>
    </div>
  ))}

  <button type="button" onClick={addVariant} style={buttonStyle}>
    + Añadir color
  </button>
</div>

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
      
      <h2>Mis productos</h2>

      <button
        type="button"
        style={buttonStyle}
        onClick={loadProducts}
        disabled={loadingProducts}
      >
        {loadingProducts ? "Cargando..." : "Ver mis productos"}
      </button>

      {products.map((product) => (
        <div
          key={product.id}
          style={{
            border: "1px solid #d8b4fe",
            borderRadius: 10,
            padding: 14,
            marginTop: 14,
          }}
        >
          {product.image && (
            <img
              src={product.image}
              alt={product.name}
              style={{
                width: 100,
                height: 100,
                objectFit: "cover",
                borderRadius: 8,
              }}
            />
          )}

          <h3>{product.name}</h3>
          
          <label
            style={{
              display: "block",
              margin: "12px 0",
              color: "#7e22ce",
              fontWeight: "bold",
            }}
          >
            Cambiar foto del producto
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              disabled={busy}
              style={{ display: "block", marginTop: 8 }}
              onChange={(event) => {
                const selectedFile = event.target.files?.[0];
                if (selectedFile) {
                  void changeProductImage(product, selectedFile);
                }
                event.target.value = "";
              }}
            />
          </label>

          <button
            type="button"
            style={{ ...buttonStyle, marginRight: 8 }}
            disabled={busy}
            onClick={() => editProduct(product)}
          >
          Editar producto
          </button>

          <p>Precio: {Number(product.price).toFixed(2)} €</p>
          <p>Categoría: {product.category}</p>
          <p>Colección: {product.collection}</p>
          <p>{product.description}</p>

          <button
            type="button"
            style={{ ...buttonStyle, background: "#dc2626" }}
            disabled={busy}
            onClick={() => deleteProduct(product.id)}
          >
            Eliminar producto
          </button>
        </div>
      ))}

    </main>
  );
}


