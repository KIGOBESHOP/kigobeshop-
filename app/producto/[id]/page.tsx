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
    <main className="product-detail-page">
      <div className="detail-shell">
        <Link href="/" className="back-link">← Volver a KigobeShop</Link>

        <div className="detail-layout">
          <section className="gallery-column" aria-label="Imágenes del producto">
            <div className="main-photo">
              {product.tag && <span className="product-tag">{product.tag}</span>}
              <img src={shownImage} alt={`${product.name}${selectedColor ? ` - ${selectedColor}` : ""}`} />
              {selectedSpinUrl && <span className="spin-label">Vista 360°</span>}
            </div>

            {gallery.length > 1 && (
              <div className="thumbnail-list">
                {gallery.map((item, index) => (
                  <button
                    key={`${item.url}-${index}`}
                    type="button"
                    className={`thumbnail ${activeImage === item.url ? "thumbnail-active" : ""}`}
                    onClick={() => {
                      setActiveImage(item.url);
                      if (item.color) setSelectedColor(item.color);
                    }}
                    aria-label={`Ver imagen ${index + 1}`}
                  >
                    <img src={item.url} alt={`${product.name}, imagen ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="product-info">
            <p className="brand-eyebrow">KIGOBESHOP <span>·</span> {product.collection}</p>
            <h1>{product.name}</h1>

            <div className="price-line">
              <strong>{product.price.toFixed(2)} €</strong>
              {product.oldPrice != null && product.oldPrice > product.price && (
                <>
                  <span className="old-price">{product.oldPrice.toFixed(2)} €</span>
                  <span className="discount-pill">
                    -{Math.round((1 - product.price / product.oldPrice) * 100)}%
                  </span>
                </>
              )}
            </div>

            {product.description && <p className="product-description">{product.description}</p>}

            <div className="detail-divider" />

            {variants.length > 0 && (
              <div className="option-group">
                <div className="option-heading">
                  <span>Color</span>
                  <strong>{selectedColor || "Selecciona un color"}</strong>
                </div>
                <div className="color-options">
                  {variants.map((variant) => (
                    <button
                      key={variant.color}
                      type="button"
                      onClick={() => chooseColor(variant.color)}
                      className={`color-option ${selectedColor === variant.color ? "option-selected" : ""}`}
                    >
                      {variant.color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="option-group">
              <div className="option-heading">
                <span>Talla</span>
                <strong>{selectedSize || (sizesForColor.length === 0 ? "Talla única" : "Selecciona tu talla")}</strong>
              </div>
              {sizesForColor.length > 0 ? (
                <div className="size-options">
                  {sizesForColor.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => { setSelectedSize(size); setMessage(""); }}
                      className={`size-option ${selectedSize === size ? "size-selected" : ""}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="one-size-note">Esta prenda está disponible en talla única.</p>
              )}
            </div>

            {message && <p className="validation-message" role="alert">{message}</p>}

            <button type="button" onClick={addToCart} className="add-cart-button">
              AÑADIR AL CARRITO
            </button>

            <div className="purchase-notes">
              <p><span>✓</span> Compra segura</p>
              <p><span>✓</span> Envíos disponibles durante el proceso de compra</p>
            </div>
          </section>
        </div>
      </div>

      <style jsx>{`
        .product-detail-page {
          min-height: 100vh;
          background: #fff;
          color: #302638;
          padding: 0 24px 80px;
        }
        .detail-shell { max-width: 1280px; margin: 0 auto; }
        .back-link {
          display: inline-flex; align-items: center; margin: 28px 0 24px;
          color: #75677e; text-decoration: none; font-size: 13px;
          transition: color .2s ease;
        }
        .back-link:hover { color: #7e22ce; }
        .detail-layout {
          display: grid; grid-template-columns: minmax(0, 1.08fr) minmax(360px, .82fr);
          gap: clamp(38px, 6vw, 88px); align-items: start;
        }
        .gallery-column { min-width: 0; }
        .main-photo {
          position: relative; width: 100%; aspect-ratio: 4 / 5;
          max-height: 760px; overflow: hidden; border-radius: 3px;
          background: #f8f6f8; display: flex; align-items: center; justify-content: center;
        }
        .main-photo img { width: 100%; height: 100%; object-fit: contain; display: block; }
        .product-tag {
          position: absolute; z-index: 2; top: 18px; left: 18px;
          padding: 7px 12px; border-radius: 2px; background: #fff;
          color: #4b3b52; font-size: 10px; font-weight: 700; letter-spacing: 1.4px;
        }
        .spin-label {
          position: absolute; bottom: 16px; left: 16px; padding: 7px 12px;
          border-radius: 30px; background: rgba(48, 38, 56, .82);
          color: #fff; font-size: 11px;
        }
        .thumbnail-list {
          display: flex; gap: 12px; overflow-x: auto; padding: 14px 2px 4px;
          scrollbar-width: thin;
        }
        .thumbnail {
          flex: 0 0 88px; width: 88px; height: 108px; padding: 0;
          border: 1px solid #e9e2ec; border-radius: 5px; overflow: hidden;
          background: #faf9fb; cursor: pointer; transition: border-color .2s ease;
        }
        .thumbnail-active { border: 2px solid #8426c8; }
        .thumbnail img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .product-info { padding: 30px 0 0; position: sticky; top: 28px; }
        .brand-eyebrow {
          margin: 0 0 14px; color: #9970ad; font-size: 10px; font-weight: 700;
          letter-spacing: 2.3px; text-transform: uppercase;
        }
        .brand-eyebrow span { padding: 0 5px; color: #c8b5d2; }
        h1 {
          margin: 0 0 20px; color: #302638; font-size: clamp(29px, 3vw, 43px);
          line-height: 1.12; letter-spacing: -.8px; font-weight: 600;
        }
        .price-line { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 22px; }
        .price-line strong { font-size: 25px; font-weight: 650; color: #302638; }
        .old-price { color: #a49aa9; font-size: 15px; text-decoration: line-through; }
        .discount-pill {
          padding: 5px 8px; border-radius: 3px; background: #f4eafa;
          color: #7e22ce; font-size: 11px; font-weight: 700;
        }
        .product-description { margin: 0 0 25px; color: #766d7b; font-size: 14px; line-height: 1.8; white-space: pre-line; }
        .detail-divider { height: 1px; background: #eee9f0; margin: 24px 0; }
        .option-group { margin: 0 0 27px; }
        .option-heading {
          display: flex; align-items: baseline; gap: 8px; margin-bottom: 13px;
          color: #302638; font-size: 12px; text-transform: uppercase; letter-spacing: .7px;
        }
        .option-heading span { font-weight: 750; }
        .option-heading strong { color: #827787; font-weight: 400; text-transform: none; letter-spacing: 0; }
        .color-options, .size-options { display: flex; flex-wrap: wrap; gap: 9px; }
        .color-option, .size-option {
          min-height: 43px; padding: 0 16px; border: 1px solid #e4dce8;
          border-radius: 5px; background: #fff; color: #45394c;
          font: inherit; font-size: 13px; cursor: pointer;
          transition: all .18s ease;
        }
        .color-option:hover, .size-option:hover { border-color: #9b58c5; }
        .option-selected { border: 1.5px solid #8426c8; background: #f8f0fc; color: #7020ad; }
        .size-option { min-width: 48px; padding: 0 13px; }
        .size-selected { border-color: #8426c8; background: #8426c8; color: #fff; }
        .one-size-note { margin: 0; color: #817687; font-size: 13px; }
        .validation-message { margin: -10px 0 14px; color: #b42318; font-size: 13px; }
        .add-cart-button {
          width: 100%; min-height: 56px; border: 0; border-radius: 5px;
          background: #8426c8; color: #fff; font-size: 12px; font-weight: 750;
          letter-spacing: 1px; cursor: pointer; transition: background .2s ease, transform .2s ease;
        }
        .add-cart-button:hover { background: #6f1eaa; transform: translateY(-1px); }
        .purchase-notes { display: flex; flex-direction: column; gap: 8px; margin-top: 20px; }
        .purchase-notes p { margin: 0; color: #8a808f; font-size: 11px; }
        .purchase-notes span { color: #8a55aa; margin-right: 7px; }
        @media (max-width: 800px) {
          .product-detail-page { padding: 0 16px 54px; }
          .back-link { margin: 18px 0 16px; }
          .detail-layout { grid-template-columns: minmax(0, 1fr); gap: 20px; }
          .main-photo { aspect-ratio: 4 / 4.7; max-height: none; }
          .product-info { position: static; padding-top: 14px; }
          h1 { font-size: 30px; }
          .price-line strong { font-size: 23px; }
          .thumbnail { flex-basis: 72px; width: 72px; height: 88px; }
        }
      `}</style>
    </main>
  );
}
