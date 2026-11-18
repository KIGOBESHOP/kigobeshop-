"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { products, type Product } from "@/lib/products";

type CartItem = {
  cartKey: string;
  product: Product;
  qty: number;
  selectedColor?: string;
  selectedImage?: string;
  selectedSize?: string;
};

type Variant = {
  color: string;
  images?: string[];
  sizes?: string[];
  spinUrl?: string;
};

const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "XXXXL"];

function sortSizes(sizes: string[]) {
  return [...sizes].sort((a, b) => {
    const ai = SIZE_ORDER.indexOf(a.trim().toUpperCase());
    const bi = SIZE_ORDER.indexOf(b.trim().toUpperCase());
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const routeId = String(params.id ?? "");
  const numericId = Number(routeId);

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [activeImage, setActiveImage] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadProduct() {
      setLoading(true);
      try {
        // Los productos de Supabase usan el identificador interno + 1.000.000
        // en la tienda, para distinguirlos de los productos de demostración.
        if (Number.isFinite(numericId) && numericId >= 1000000) {
          const databaseId = numericId - 1000000;
          const { data, error } = await supabase
            .from("products")
            .select("*")
            .eq("id", databaseId)
            .maybeSingle();

          if (error) throw error;
          if (data) {
            const loaded: Product = {
              id: 1000000 + Number(data.id),
              name: data.name,
              category: data.category,
              collection: data.collection,
              subcategory: data.subcategory ?? undefined,
              price: Number(data.price),
              ...(data.old_price != null ? { oldPrice: Number(data.old_price) } : {}),
              image: data.image,
              tag: ["NUEVO", "OFERTA", "TRENDING"].includes(data.tag) ? data.tag : undefined,
              description: data.description ?? "",
              sizes: Array.isArray(data.sizes) ? data.sizes : [],
              variants: Array.isArray(data.variants) ? data.variants : [],
              stock: data.stock && typeof data.stock === "object" ? data.stock : {},
            };
            if (!cancelled) setProduct(loaded);
          }
        } else {
          const localProduct = products.find((item) => item.id === numericId);
          if (!cancelled && localProduct) setProduct(localProduct);
        }
      } catch (error) {
        console.error("Error cargando la ficha del producto:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadProduct();
    return () => { cancelled = true; };
  }, [numericId]);

  const variants = (product?.variants ?? []) as Variant[];
  const currentVariant = variants.find((variant) => variant.color === selectedColor);
  const gallery = useMemo(() => {
    if (!product) return [];
    const items = [
      { url: product.image, color: variants.find((v) => v.images?.includes(product.image))?.color ?? "" },
      ...variants.flatMap((variant) =>
        (variant.images ?? []).map((url) => ({ url, color: variant.color }))
      ),
    ];
    return Array.from(new Map(items.filter((item) => item.url).map((item) => [item.url, item])).values());
  }, [product, variants]);

  useEffect(() => {
    if (!product) return;
    setSelectedColor(variants[0]?.color ?? "");
    setActiveImage(product.image);
  }, [product]);

  const sizesForColor = useMemo(() => {
    if (!product) return [];
    const stockForColor = product.stock?.[selectedColor || "Único"];
    const hasStock = !!stockForColor && Object.keys(stockForColor).length > 0;
    const base = currentVariant?.sizes?.length ? currentVariant.sizes : (product.sizes ?? []);
    const available = hasStock
      ? Object.entries(stockForColor).filter(([, qty]) => Number(qty) > 0).map(([size]) => size)
      : base;
    return sortSizes(available);
  }, [product, selectedColor, currentVariant]);

  const selectedSpinUrl = currentVariant?.spinUrl;
  const shownImage = selectedSpinUrl || activeImage || product?.image || "";

  function chooseColor(color: string) {
    setSelectedColor(color);
    setSelectedSize("");
    const firstForColor = gallery.find((item) => item.color === color);
    if (firstForColor) setActiveImage(firstForColor.url);
  }

  function addToCart() {
    if (!product) return;
    if (sizesForColor.length > 0 && !selectedSize) {
      setMessage("Selecciona una talla antes de continuar.");
      return;
    }

    const variant = variants.find((item) => item.color === selectedColor);
    const cartKey = `${product.id}::${variant?.color ?? ""}::${selectedSize ?? ""}`;
    const saved = localStorage.getItem("kigobeshop-cart");
    let cart: CartItem[] = [];

    try {
      cart = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(cart)) cart = [];
    } catch {
      cart = [];
    }

    const existing = cart.find((item) => item.cartKey === cartKey);
    if (existing) {
      cart = cart.map((item) => item.cartKey === cartKey ? { ...item, qty: item.qty + 1 } : item);
    } else {
      cart.push({
        cartKey,
        product,
        qty: 1,
        ...(variant ? { selectedColor: variant.color, selectedImage: activeImage || product.image } : {}),
        ...(selectedSize ? { selectedSize } : {}),
      });
    }

    localStorage.setItem("kigobeshop-cart", JSON.stringify(cart));
    router.push("/");
  }

  if (loading) {
    return <main style={{ minHeight: "60vh", display: "grid", placeItems: "center", color: "#6b21a8" }}>Cargando producto...</main>;
  }

  if (!product) {
    return (
      <main style={{ minHeight: "60vh", padding: 28, textAlign: "center", color: "#35213f" }}>
        <h1>Producto no encontrado</h1>
        <p>Puede que esta prenda ya no esté disponible.</p>
        <Link href="/" style={{ color: "#7e22ce" }}>Volver a KigobeShop</Link>
      </main>
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "#fff", color: "#27212d" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "22px 18px 64px" }}>
        <Link href="/" style={{ display: "inline-block", marginBottom: 22, color: "#6b21a8", textDecoration: "none", fontSize: 14 }}>
          ← Volver a la tienda
        </Link>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 36, alignItems: "start" }}>
          <section>
            <div style={{ position: "relative", background: "#f7f5f8", borderRadius: 16, overflow: "hidden", aspectRatio: "3 / 4" }}>
              {product.tag && (
                <span style={{ position: "absolute", zIndex: 2, top: 14, left: 14, background: "#fff", padding: "6px 11px", borderRadius: 5, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
                  {product.tag}
                </span>
              )}
              <img src={shownImage} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              {selectedSpinUrl && <span style={{ position: "absolute", bottom: 14, left: 14, background: "#34233d", color: "#fff", borderRadius: 20, padding: "6px 10px", fontSize: 11 }}>Vista 360°</span>}
            </div>
            {gallery.length > 1 && (
              <div style={{ display: "flex", gap: 10, overflowX: "auto", paddingTop: 12 }}>
                {gallery.map((item) => (
                  <button key={item.url} type="button" onClick={() => { setActiveImage(item.url); if (item.color) setSelectedColor(item.color); }} style={{ flex: "0 0 76px", width: 76, height: 96, padding: 0, borderRadius: 9, overflow: "hidden", border: activeImage === item.url ? "2px solid #7e22ce" : "1px solid #e7e1eb", background: "#fafafa" }}>
                    <img src={item.url} alt={`Vista de ${product.name}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section style={{ paddingTop: 6 }}>
            <p style={{ margin: "0 0 8px", color: "#9772aa", fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase" }}>KIGOBESHOP</p>
            <h1 style={{ margin: "0 0 12px", fontSize: "clamp(27px, 4vw, 38px)", lineHeight: 1.15, fontWeight: 600 }}>{product.name}</h1>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 22 }}>
              {product.oldPrice != null && product.oldPrice > product.price && <span style={{ color: "#999", textDecoration: "line-through", fontSize: 16 }}>{product.oldPrice.toFixed(2)} €</span>}
              <strong style={{ fontSize: 25, color: product.oldPrice != null && product.oldPrice > product.price ? "#7e22ce" : "#29232d" }}>{product.price.toFixed(2)} €</strong>
              {product.oldPrice != null && product.oldPrice > product.price && <span style={{ color: "#7e22ce", fontWeight: 700, fontSize: 12 }}>-{Math.round((1 - product.price / product.oldPrice) * 100)}%</span>}
            </div>

            {product.description && <p style={{ color: "#6f6873", lineHeight: 1.75, margin: "0 0 24px", whiteSpace: "pre-line" }}>{product.description}</p>}

            {variants.length > 0 && (
              <div style={{ marginBottom: 22 }}>
                <h2 style={{ fontSize: 13, margin: "0 0 10px", fontWeight: 700 }}>COLOR: <span style={{ fontWeight: 400, color: "#756b7b" }}>{selectedColor}</span></h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
                  {variants.map((variant) => (
                    <button key={variant.color} type="button" onClick={() => chooseColor(variant.color)} style={{ border: selectedColor === variant.color ? "1.5px solid #7e22ce" : "1px solid #ddd5e2", background: selectedColor === variant.color ? "#f7effc" : "#fff", color: "#332b38", borderRadius: 8, padding: "9px 13px", cursor: "pointer" }}>
                      {variant.color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {sizesForColor.length > 0 && (
              <div style={{ marginBottom: 22 }}>
                <h2 style={{ fontSize: 13, margin: "0 0 10px", fontWeight: 700 }}>ELIGE TU TALLA</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 9 }}>
                  {sizesForColor.map((size) => (
                    <button key={size} type="button" onClick={() => { setSelectedSize(size); setMessage(""); }} style={{ minWidth: 46, padding: "11px 12px", borderRadius: 8, border: selectedSize === size ? "1.5px solid #7e22ce" : "1px solid #ded8e2", background: selectedSize === size ? "#7e22ce" : "#fff", color: selectedSize === size ? "#fff" : "#302936", cursor: "pointer" }}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {sizesForColor.length === 0 && <p style={{ color: "#6b21a8", fontSize: 13, margin: "0 0 22px" }}>Talla única</p>}

            {message && <p role="alert" style={{ color: "#b42318", fontSize: 13 }}>{message}</p>}
            <button type="button" onClick={addToCart} style={{ width: "100%", minHeight: 52, border: 0, borderRadius: 9, background: "#7e22ce", color: "#fff", fontSize: 13, fontWeight: 700, letterSpacing: 0.6, cursor: "pointer" }}>
              AÑADIR AL CARRITO
            </button>
            <p style={{ marginTop: 14, color: "#89818d", fontSize: 12, lineHeight: 1.6 }}>Envíos y condiciones disponibles durante el proceso de compra.</p>
          </section>
        </div>
      </div>
    </main>
  );
}
