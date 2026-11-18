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
  const [zoomOpen, setZoomOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [shippingOpen, setShippingOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

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

  useEffect(() => {
    if (!product) return;
    try {
      const saved = JSON.parse(localStorage.getItem("kigobeshop-favorites") || "[]");
      setIsFavorite(Array.isArray(saved) && saved.includes(product.id));
    } catch {
      setIsFavorite(false);
    }
  }, [product]);

  useEffect(() => {
    if (!product) return;
    let cancelled = false;
    async function loadRelated() {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("collection", product!.collection)
        .neq("id", product!.id - 1000000)
        .limit(8);
      if (error) {
        console.error("No se pudieron cargar productos relacionados:", error);
        return;
      }
      const mapped: Product[] = (data ?? []).slice(0, 4).map((item: any) => ({
        id: 1000000 + Number(item.id),
        name: item.name,
        category: item.category,
        collection: item.collection,
        subcategory: item.subcategory ?? undefined,
        price: Number(item.price),
        ...(item.old_price != null ? { oldPrice: Number(item.old_price) } : {}),
        image: item.image,
        description: item.description ?? "",
        ...(item.tag ? { tag: item.tag } : {}),
        sizes: Array.isArray(item.sizes) ? item.sizes : [],
        variants: Array.isArray(item.variants) ? item.variants : [],
        stock: item.stock && typeof item.stock === "object" ? item.stock : {},
      }));
      if (!cancelled) setRelatedProducts(mapped);
    }
    loadRelated();
    return () => { cancelled = true; };
  }, [product]);

  function toggleFavorite() {
    if (!product) return;
    try {
      const saved = JSON.parse(localStorage.getItem("kigobeshop-favorites") || "[]");
      const favorites: number[] = Array.isArray(saved) ? saved : [];
      const updated = favorites.includes(product.id)
        ? favorites.filter((id) => id !== product.id)
        : [...favorites, product.id];
      localStorage.setItem("kigobeshop-favorites", JSON.stringify(updated));
      setIsFavorite(updated.includes(product.id));
    } catch (error) {
      console.error("No se pudieron actualizar los favoritos:", error);
    }
  }

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
    const base = currentVariant?.sizes?.length ? currentVariant.sizes : (product.sizes ?? []);
    return sortSizes(base);
  }, [product, selectedColor, currentVariant]);

  const stockForColor = product?.stock?.[selectedColor || "Único"];
  const hasStockInfo = !!stockForColor && Object.keys(stockForColor).length > 0;
  const isSizeAvailable = (size: string) => !hasStockInfo || Number(stockForColor?.[size] ?? 0) > 0;
  const hasAnyAvailableSize = sizesForColor.some(isSizeAvailable);
  const selectedSpinUrl = currentVariant?.spinUrl;
  const shownImage = selectedSpinUrl || activeImage || product?.image || "";

  function chooseColor(color: string) {
    setSelectedColor(color);
    setSelectedSize("");
    setMessage("");
    const firstForColor = gallery.find((item) => item.color === color);
    if (firstForColor) setActiveImage(firstForColor.url);
  }

  function addToCart() {
    if (!product) return;
    if (hasStockInfo && !hasAnyAvailableSize) {
      setMessage("Esta combinación está agotada. Prueba con otro color.");
      return;
    }
    if (sizesForColor.length > 0 && !selectedSize) {
      setMessage("Selecciona una talla antes de continuar.");
      return;
    }
    if (selectedSize && !isSizeAvailable(selectedSize)) {
      setMessage("Esa talla está agotada. Selecciona otra.");
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
        <div className="topbar">
          <Link href="/" className="back-link"><span aria-hidden="true">←</span> Volver a la tienda</Link>
          <span className="topbar-brand">KIGOBESHOP</span>
          <span className="topbar-caption">MODA PARA TODOS LOS ESTILOS</span>
        </div>

        <div className="detail-layout">
          <section className="gallery-column" aria-label="Imágenes del producto">
            <div className="main-photo">
              {product.tag && <span className="product-tag">{product.tag}</span>}
              <button type="button" className="favorite-button" onClick={toggleFavorite} aria-label={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}>
                {isFavorite ? "♥" : "♡"}
              </button>
              <button type="button" className="zoom-trigger" onClick={() => setZoomOpen(true)} aria-label="Ampliar fotografía">
                <img src={shownImage} alt={`${product.name}${selectedColor ? ` - ${selectedColor}` : ""}`} />
                <span className="zoom-hint">⌕ Ampliar</span>
              </button>
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
            <p className="brand-eyebrow">{product.collection} <span> / </span> NUEVA COLECCIÓN</p>
            <h1>{product.name}</h1>
            <p className="product-subtitle">Una prenda especial para completar tu estilo.</p>

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
                <strong>{sizesForColor.length === 0 ? "Talla única" : (selectedSize || "Selecciona tu talla")}</strong>
              </div>
              {sizesForColor.length > 0 ? (
                <div className="size-options">
                  {sizesForColor.map((size) => {
                    const available = isSizeAvailable(size);
                    return (
                      <button
                        key={size}
                        type="button"
                        disabled={!available}
                        aria-label={available ? `Talla ${size}` : `Talla ${size}, agotada`}
                        onClick={() => { if (available) { setSelectedSize(size); setMessage(""); } }}
                        className={`size-option ${selectedSize === size ? "size-selected" : ""} ${!available ? "size-unavailable" : ""}`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="one-size-note">
                  {hasStockInfo && !hasAnyAvailableSize
                    ? "Esta combinación está agotada."
                    : "Esta prenda está disponible en talla única."}
                </p>
              )}
              {hasStockInfo && hasAnyAvailableSize && (
                <p className="stock-note">✓ Tallas disponibles para este color</p>
              )}
              <button type="button" className="text-link" onClick={() => setSizeGuideOpen(true)}>¿Necesitas ayuda con tu talla?</button>
            </div>

            {message && <p className="validation-message" role="alert">{message}</p>}

            <button type="button" onClick={addToCart} className="add-cart-button">
              AÑADIR AL CARRITO
            </button>

            <div className="purchase-notes">
              <p><span>✓</span> Compra segura</p>
              <p><span>✓</span> Envíos disponibles</p>
              <button type="button" className="text-link" onClick={() => setShippingOpen(true)}>Información de envíos y devoluciones</button>
            </div>
          </section>
        </div>

        {relatedProducts.length > 0 && (
          <section className="related-section">
            <div className="related-heading">
              <p>COMPLETA TU LOOK</p>
              <h2>También te puede gustar</h2>
            </div>
            <div className="related-grid">
              {relatedProducts.map((item) => (
                <Link href={`/producto/${item.id}`} key={item.id} className="related-card">
                  <div className="related-image"><img src={item.image} alt={item.name} /></div>
                  <span>{item.name}</span>
                  <strong>{item.price.toFixed(2)} €</strong>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {zoomOpen && (
        <div className="modal-overlay zoom-overlay" role="dialog" aria-modal="true" onClick={() => setZoomOpen(false)}>
          <button type="button" className="modal-close" onClick={() => setZoomOpen(false)} aria-label="Cerrar">×</button>
          <img src={shownImage} alt={product.name} onClick={(event) => event.stopPropagation()} />
        </div>
      )}

      {sizeGuideOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setSizeGuideOpen(false)}>
          <div className="info-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="info-close" onClick={() => setSizeGuideOpen(false)}>×</button>
            <p className="modal-eyebrow">KIGOBESHOP</p>
            <h2>Guía de tallas</h2>
            <p>Las medidas y el ajuste pueden variar según el diseño de cada prenda. Revisa la descripción del producto para conocer sus indicaciones específicas.</p>
            <p>Si tienes dudas sobre el ajuste o las medidas, consúltanos antes de realizar tu pedido y te ayudaremos a elegir.</p>
            <button type="button" className="modal-action" onClick={() => setSizeGuideOpen(false)}>Entendido</button>
          </div>
        </div>
      )}

      {shippingOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" onClick={() => setShippingOpen(false)}>
          <div className="info-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="info-close" onClick={() => setShippingOpen(false)}>×</button>
            <p className="modal-eyebrow">KIGOBESHOP</p>
            <h2>Envíos y devoluciones</h2>
            <p>Durante el proceso de compra podrás consultar las opciones de envío disponibles para tu pedido.</p>
            <p>Dispones de 14 días para solicitar una devolución, según las condiciones aplicables publicadas en nuestra tienda.</p>
            <p className="modal-policy-link">Consulta las condiciones completas en los apartados legales de la tienda.</p>
            <button type="button" className="modal-action" onClick={() => setShippingOpen(false)}>Cerrar</button>
          </div>
        </div>
      )}

      <div className="mobile-buy-bar">
        <div>
          <strong>{product.price.toFixed(2)} €</strong>
          <span>{[selectedColor, selectedSize].filter(Boolean).join(" · ") || "Elige tus opciones"}</span>
        </div>
        <button type="button" onClick={addToCart} disabled={hasStockInfo && !hasAnyAvailableSize}>AÑADIR</button>
      </div>

      <style jsx>{`
        .product-detail-page {
          min-height: 100vh;
          background: linear-gradient(180deg, #fbf9fc 0%, #fff 420px);
          color: #302638;
          padding: 0 28px 88px;
        }
        .detail-shell { max-width: 1360px; margin: 0 auto; }
        .topbar {
          min-height: 76px; display: grid; grid-template-columns: 1fr auto 1fr;
          align-items: center; border-bottom: 1px solid #eee8f1; margin-bottom: 34px;
        }
        .back-link {
          display: inline-flex; align-items: center; gap: 9px; justify-self: start;
          color: #75677e; text-decoration: none; font-size: 12px; letter-spacing: .2px;
          transition: color .2s ease;
        }
        .back-link span { font-size: 18px; }
        .back-link:hover { color: #7e22ce; }
        .topbar-brand { color: #6f3b8d; font-size: 13px; font-weight: 800; letter-spacing: 3px; }
        .topbar-caption { justify-self: end; color: #a69baa; font-size: 9px; letter-spacing: 1.8px; }
        .detail-layout {
          display: grid; grid-template-columns: minmax(0, 1.12fr) minmax(380px, .78fr);
          gap: clamp(44px, 7vw, 104px); align-items: start;
        }
        .gallery-column { min-width: 0; }
        .main-photo {
          position: relative; width: 100%; aspect-ratio: 4 / 4.8;
          max-height: 790px; overflow: hidden; border-radius: 8px;
          background: #f4f1f5; display: flex; align-items: center; justify-content: center;
          box-shadow: 0 16px 42px rgba(54, 35, 65, .055);
        }
        .zoom-trigger {
          width: 100%; height: 100%; padding: 0; border: 0; background: transparent;
          cursor: zoom-in; display: block; position: relative;
        }
        .zoom-trigger img { width: 100%; height: 100%; object-fit: contain; display: block; }
        .zoom-hint {
          position: absolute; right: 16px; bottom: 16px; padding: 7px 11px;
          border-radius: 30px; background: rgba(255,255,255,.9); color: #55465e;
          font-size: 10px; letter-spacing: .4px;
        }
        .favorite-button {
          position: absolute; z-index: 4; top: 16px; right: 16px; width: 40px; height: 40px;
          border: 1px solid #eee6f0; border-radius: 50%; background: rgba(255,255,255,.94);
          color: #7e22ce; font-size: 23px; cursor: pointer;
        }
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
          flex: 0 0 86px; width: 86px; height: 106px; padding: 0;
          border: 1px solid #e9e2ec; border-radius: 7px; overflow: hidden;
          background: #f8f6f9; cursor: pointer; transition: border-color .2s ease, transform .2s ease;
        }
        .thumbnail:hover { transform: translateY(-2px); }
        .thumbnail-active { border: 2px solid #8426c8; }
        .thumbnail img { width: 100%; height: 100%; object-fit: cover; display: block; }
        .product-info {
          padding: 34px 0 0; position: sticky; top: 28px;
          max-width: 560px;
        }
        .brand-eyebrow {
          margin: 0 0 16px; color: #9466aa; font-size: 10px; font-weight: 750;
          letter-spacing: 2px; text-transform: uppercase;
        }
        .brand-eyebrow span { padding: 0 7px; color: #c8b5d2; }
        h1 {
          margin: 0 0 10px; color: #2d2433; font-size: clamp(32px, 3.3vw, 48px);
          line-height: 1.08; letter-spacing: -1.3px; font-weight: 650;
          text-transform: uppercase;
        }
        .product-subtitle { margin: 0 0 22px; color: #8b808f; font-size: 13px; line-height: 1.6; }
        .price-line { display: flex; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 22px; }
        .price-line strong { font-size: 27px; font-weight: 700; color: #302638; letter-spacing: -.4px; }
        .old-price { color: #a49aa9; font-size: 15px; text-decoration: line-through; }
        .discount-pill {
          padding: 5px 8px; border-radius: 3px; background: #f4eafa;
          color: #7e22ce; font-size: 11px; font-weight: 700;
        }
        .product-description { margin: 0 0 25px; color: #766d7b; font-size: 14px; line-height: 1.8; white-space: pre-line; }
        .detail-divider { height: 1px; background: #ece6ef; margin: 28px 0; }
        .option-group { margin: 0 0 27px; }
        .option-heading {
          display: flex; align-items: baseline; gap: 8px; margin-bottom: 13px;
          color: #302638; font-size: 12px; text-transform: uppercase; letter-spacing: .7px;
        }
        .option-heading span { font-weight: 750; }
        .option-heading strong { color: #827787; font-weight: 400; text-transform: none; letter-spacing: 0; }
        .color-options, .size-options { display: flex; flex-wrap: wrap; gap: 9px; }
        .color-option, .size-option {
          min-height: 44px; padding: 0 17px; border: 1px solid #e4dce8;
          border-radius: 6px; background: #fff; color: #45394c;
          font: inherit; font-size: 13px; cursor: pointer;
          transition: all .18s ease;
        }
        .color-option:hover, .size-option:hover { border-color: #9b58c5; }
        .option-selected { border: 1.5px solid #8426c8; background: #f8f0fc; color: #7020ad; }
        .size-option { min-width: 48px; padding: 0 13px; }
        .size-selected { border-color: #8426c8; background: #8426c8; color: #fff; }
        .size-option:disabled, .size-unavailable {
          color: #b9b1bd; background: #f5f3f6; border-color: #eeeaf0;
          text-decoration: line-through; cursor: not-allowed; opacity: .8;
        }
        .stock-note { margin: 10px 0 0; color: #547b5d; font-size: 12px; }
        .one-size-note { margin: 0; color: #817687; font-size: 13px; }
        .validation-message { margin: -10px 0 14px; color: #b42318; font-size: 13px; }
        .add-cart-button {
          width: 100%; min-height: 59px; border: 0; border-radius: 6px;
          background: linear-gradient(100deg, #8426c8 0%, #7020ad 100%);
          color: #fff; font-size: 12px; font-weight: 800;
          letter-spacing: 1.2px; cursor: pointer;
          box-shadow: 0 9px 20px rgba(126, 34, 206, .16);
          transition: background .2s ease, transform .2s ease, box-shadow .2s ease;
        }
        .add-cart-button:hover {
          background: linear-gradient(100deg, #7620b7 0%, #611a99 100%);
          transform: translateY(-2px); box-shadow: 0 12px 24px rgba(126, 34, 206, .22);
        }
        .purchase-notes { display: flex; flex-direction: column; gap: 8px; margin-top: 20px; }
        .purchase-notes p { margin: 0; color: #8a808f; font-size: 11px; }
        .purchase-notes span { color: #8a55aa; margin-right: 7px; }
        .text-link {
          display: inline-block; padding: 0; border: 0; background: transparent;
          color: #7e22ce; text-decoration: underline; text-underline-offset: 3px;
          font: inherit; font-size: 11px; cursor: pointer; text-align: left;
        }
        .related-section { margin: 92px 0 20px; }
        .related-heading { text-align: center; margin-bottom: 28px; }
        .related-heading p { margin: 0 0 8px; color: #986bb0; font-size: 9px; font-weight: 800; letter-spacing: 2px; }
        .related-heading h2 { margin: 0; color: #302638; font-size: 26px; font-weight: 600; }
        .related-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; }
        .related-card { color: #302638; text-decoration: none; display: flex; flex-direction: column; gap: 7px; font-size: 12px; }
        .related-image { aspect-ratio: 3 / 4; overflow: hidden; border-radius: 6px; background: #f6f3f7; }
        .related-image img { width: 100%; height: 100%; object-fit: cover; transition: transform .3s ease; }
        .related-card:hover .related-image img { transform: scale(1.04); }
        .related-card strong { font-size: 13px; }
        .modal-overlay {
          position: fixed; inset: 0; z-index: 10000; display: flex; align-items: center;
          justify-content: center; padding: 20px; background: rgba(25, 16, 31, .66);
        }
        .zoom-overlay img { max-width: 92vw; max-height: 90vh; object-fit: contain; border-radius: 6px; background: #fff; }
        .modal-close {
          position: absolute; top: 20px; right: 24px; width: 42px; height: 42px;
          border: 0; border-radius: 50%; background: #fff; color: #442d50; font-size: 27px; cursor: pointer;
        }
        .info-modal {
          position: relative; width: min(100%, 470px); padding: 36px; border-radius: 10px;
          background: #fff; color: #4c4053; box-shadow: 0 20px 70px rgba(0,0,0,.2);
        }
        .info-close { position: absolute; top: 12px; right: 15px; border: 0; background: none; font-size: 24px; color: #766b7c; cursor: pointer; }
        .modal-eyebrow { color: #9362a8; font-size: 9px; font-weight: 800; letter-spacing: 2px; }
        .info-modal h2 { margin: 8px 0 16px; color: #302638; font-size: 25px; }
        .info-modal p { color: #756b7b; font-size: 13px; line-height: 1.75; }
        .modal-policy-link { display: inline-block; margin: 8px 0 18px; color: #7e22ce; font-size: 12px; }
        .modal-action { display: block; width: 100%; min-height: 46px; border: 0; border-radius: 5px; background: #8426c8; color: #fff; font-weight: 700; cursor: pointer; }
        .mobile-buy-bar { display: none; }
        @media (max-width: 800px) {
          .product-detail-page { padding: 0 16px 54px; }
          .topbar { min-height: 62px; grid-template-columns: 1fr auto; margin-bottom: 18px; }
          .topbar-brand { justify-self: end; font-size: 11px; }
          .topbar-caption { display: none; }
          .detail-layout { grid-template-columns: minmax(0, 1fr); gap: 18px; }
          .main-photo { aspect-ratio: 4 / 4.7; max-height: none; }
          .product-info { position: static; padding-top: 12px; max-width: none; }
          h1 { font-size: 31px; }
          .price-line strong { font-size: 23px; }
          .thumbnail { flex-basis: 72px; width: 72px; height: 88px; }
          .related-section { margin: 58px 0 24px; }
          .related-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
          .mobile-buy-bar {
            display: flex; position: fixed; z-index: 5000; left: 0; right: 0; bottom: 0;
            align-items: center; justify-content: space-between; gap: 14px;
            padding: 10px 16px calc(10px + env(safe-area-inset-bottom));
            background: rgba(255,255,255,.97); border-top: 1px solid #eee7f1;
            box-shadow: 0 -8px 25px rgba(40,25,48,.08);
          }
          .mobile-buy-bar div { display: flex; flex-direction: column; gap: 3px; }
          .mobile-buy-bar strong { color: #302638; font-size: 15px; }
          .mobile-buy-bar span { color: #817687; font-size: 10px; }
          .mobile-buy-bar button {
            min-width: 132px; min-height: 44px; border: 0; border-radius: 5px;
            background: #8426c8; color: #fff; font-size: 11px; font-weight: 800;
            letter-spacing: .7px;
          }
        }
      `}</style>
    </main>
  );
}
