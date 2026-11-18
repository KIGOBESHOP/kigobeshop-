"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/products";

type SelectedVariant = {
  color: string;
  image: string;
};

type Props = {
  product: Product;
  isFavorite: boolean;
  onAddToCart: (variant?: SelectedVariant, size?: string) => void;
  onToggleFavorite: () => void;
};

const COLOR_MAP: Record<string, string> = {
  negro: "#18181b",
  blanco: "#ffffff",
  gris: "#9ca3af",
  verde: "#2e5a44",
  "verde agua": "#6ee7b7",
  "verde militar": "#4b5320",
  mostaza: "#d4a017",
  amarillo: "#facc15",
  burdeos: "#6d1a36",
  rojo: "#dc2626",
  rosa: "#f472b6",
  fucsia: "#c026d3",
  morado: "#6b21a8",
  lila: "#c084fc",
  azul: "#2563eb",
  "azul marino": "#1e3a8a",
  celeste: "#7dd3fc",
  beige: "#e7d8c9",
  crema: "#f5f5dc",
  camel: "#c19a6b",
  marron: "#5c4033",
  "marrón": "#5c4033",
  naranja: "#ea580c",
  dorado: "#d4af37",
  plateado: "#cbd5e1",
};

function getColorHex(colorName: string): string | null {
  return COLOR_MAP[colorName.trim().toLowerCase()] ?? null;
}

export default function ProductCard({
  product,
  isFavorite,
  onAddToCart,
  onToggleFavorite,
}: Props) {
  const router = useRouter();
  const variants = product.variants ?? [];
  const productSizes = product.sizes ?? [];
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState(variants[0]?.color ?? "");
  const [isHovered, setIsHovered] = useState(false);

  const selectedVariant = variants.find((v) => v.color === selectedColor);
  const stockByColor = product.stock;
  const stockForSelectedColor = stockByColor?.[selectedColor || "Único"];
  const baseSizes = selectedVariant?.sizes?.length ? selectedVariant.sizes : productSizes;
  const hasStockData = !!stockByColor && Object.keys(stockByColor).length > 0;

  const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "XXXXL"];

  const availableSizes = (
    hasStockData
      ? Object.entries(stockForSelectedColor ?? {})
          .filter(([, quantity]) => Number(quantity) > 0)
          .map(([size]) => size)
      : baseSizes
  ).sort((a, b) => {
    const indexA = SIZE_ORDER.indexOf(a.trim().toUpperCase());
    const indexB = SIZE_ORDER.indexOf(b.trim().toUpperCase());
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    return indexA - indexB;
  });

  const galleryImages = Array.from(
    new Map(
      [
        {
          image: product.image,
          color: variants.find((v) => v.images?.includes(product.image))?.color ?? null,
        },
        ...variants.flatMap((v) =>
          (v.images ?? []).map((image) => ({ image, color: v.color }))
        ),
      ]
        .filter((item) => Boolean(item.image))
        .map((item) => [item.image, item])
    ).values()
  );

  const images = galleryImages.map((item) => item.image);
  const [imageIndex, setImageIndex] = useState(0);
  const safeImageIndex = Math.min(imageIndex, images.length - 1);
  const currentImage = images[safeImageIndex] ?? product.image;
  const normalizedColor = selectedColor
  .trim()
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "");

const isOsloBrown =
  product.name.trim().toLowerCase() === "jersey oslo" &&
  normalizedColor === "marron";

// La animación 360 se guarda dentro de la variante como spinUrl.
  // Si el color tiene GIF, se muestra; si no, se conserva la galería normal.
  const selectedVariantSpinUrl = (
    selectedVariant as { spinUrl?: string } | undefined
  )?.spinUrl;

  const isShowingSpin = Boolean(selectedVariantSpinUrl);

  const displayedImage = selectedVariantSpinUrl
    ? selectedVariantSpinUrl
    : isOsloBrown
      ? "https://kvsiaacfsmdbkzaysekw.supabase.co/storage/v1/object/public/productos/poncho-marron-360%20(1).webp"
      : currentImage;
  const touchStartX = useRef(0);

  function changeImage(direction: number) {
    setImageIndex((current) => {
      const total = images.length;
      if (total === 0) return 0;
      const nextIndex = (current + direction + total) % total;
      const nextColor = galleryImages[nextIndex]?.color;
      if (nextColor) setSelectedColor(nextColor);
      return nextIndex;
    });
  }

  const [imageOpen, setImageOpen] = useState(false);

  function changeColor(color: string) {
    setSelectedColor(color);
    setSelectedSize("");
    const index = galleryImages.findIndex((item) => item.color === color);
    if (index >= 0) setImageIndex(index);
  }

  const needsSizeSelection = availableSizes.length > 0 && !selectedSize;
  return (
    <>
      <style jsx global>{`
        @media (max-width: 600px) {
          .productCard {
            border-radius: 20px !important;
            padding: 7px !important;
            border: 1px solid #eee6f1 !important;
            box-shadow: 0 6px 20px rgba(54, 25, 68, 0.075) !important;
            background: #fff !important;
          }
          .productCard .productImageWrap {
            aspect-ratio: 0.82 / 1 !important;
            border-radius: 15px !important;
            background: #f8f6f8 !important;
          }
          .productCard .productCardInfo {
            padding: 11px 4px 4px !important;
            gap: 8px !important;
          }
          .productCard .productCardName {
            display: -webkit-box !important;
            -webkit-line-clamp: 2 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
            min-height: 30px !important;
            font-size: 12px !important;
            line-height: 1.25 !important;
            font-weight: 650 !important;
            letter-spacing: 0.05px !important;
            color: #302437 !important;
            text-transform: none !important;
          }
          .productCard .productCardPrice {
            display: block !important;
            margin-top: 1px !important;
            font-size: 16px !important;
            line-height: 1.2 !important;
            font-weight: 800 !important;
            color: #702783 !important;
          }
          .productCard .productCardViewButton {
            display: flex !important;
            min-height: 36px !important;
            margin-top: 3px !important;
            border: 1px solid #e7d8eb !important;
            border-radius: 999px !important;
            background: linear-gradient(180deg, #fff 0%, #faf6fb 100%) !important;
            color: #702783 !important;
            font-size: 11px !important;
            font-weight: 750 !important;
            letter-spacing: 0.1px !important;
            box-shadow: 0 2px 7px rgba(112, 39, 131, 0.06) !important;
          }
          .productCard .productCardOptions,
          .productCard .productCardSizes,
          .productCard .productCardAddButton,
          .productCard .productGalleryArrow,
          .productCard .productGalleryDots {
            display: none !important;
          }
          .productCard > .productImageWrap > span {
            top: 9px !important;
            left: 9px !important;
            padding: 5px 9px !important;
            font-size: 9px !important;
          }
          .productCard > .productImageWrap > button[aria-label="Favorito"] {
            top: 9px !important;
            right: 9px !important;
            width: 32px !important;
            height: 32px !important;
          }
        }
        @media (min-width: 601px) {
          .productCard .productCardViewButton {
            display: none !important;
          }
        }
      `}</style>
      <article
        className="productCard fadeInUp"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          borderRadius: 22,
          overflow: "hidden",
          padding: 9,
          border: "1px solid rgba(107, 33, 168, 0.08)",
          boxShadow: isHovered ? "0 14px 34px rgba(67, 30, 82, 0.14)" : "0 7px 22px rgba(67, 30, 82, 0.08)",
          transition: "box-shadow 220ms ease, transform 220ms ease",
        }}
      >

<div
  className="productImageWrap"
  onTouchStart={(e) => {
    touchStartX.current = e.touches[0].clientX;
  }}
  onTouchEnd={(e) => {
    const diff = e.changedTouches[0].clientX - touchStartX.current;

    if (Math.abs(diff) > 40 && images.length > 1) {
      changeImage(diff < 0 ? 1 : -1);
    }
  }}
  style={{
    position: "relative",
    width: "100%",
    aspectRatio: "3 / 4",
    backgroundColor: "#f7f4f7",
    overflow: "hidden",
    borderRadius: 17,
    touchAction: "pan-y",
  }}
>

          {product.tag && (
            <span
              style={{
                position: "absolute",
                top: 12,
                left: 12,
                zIndex: 10,
                background: product.tag === "OFERTA" ? "linear-gradient(135deg, #d946a6, #a21caf)" : "linear-gradient(135deg, #a855c7, #7e22ce)",
                color: "#ffffff",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: "0.6px",
                padding: "7px 12px",
                borderRadius: 999,
                boxShadow: "0 4px 12px rgba(126, 34, 206, 0.18)",
                textTransform: "uppercase",
              }}
            >
              {product.tag}
            </span>
          )}

          <button
            type="button"
            onClick={onToggleFavorite}
            aria-label="Favorito"
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              zIndex: 10,
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "none",
              background: "rgba(255, 255, 255, 0.95)",
              boxShadow: "0 3px 12px rgba(0,0,0,0.10)",
              color: isFavorite ? "#9333ea" : "#3f3f46",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill={isFavorite ? "currentColor" : "none"}
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </button>

          {isShowingSpin && (
            <span
              style={{
                position: "absolute",
                left: 10,
                bottom: 10,
                zIndex: 8,
                padding: "5px 9px",
                borderRadius: 20,
                background: "rgba(24, 24, 27, 0.72)",
                color: "#ffffff",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.5px",
                pointerEvents: "none",
              }}
            >
              360°
            </span>
          )}

          <button
            type="button"
            onClick={() => router.push(`/producto/${product.id}`)}
            aria-label={`Ampliar foto de ${product.name}`}
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              padding: 0,
              border: 0,
              background: "transparent",
              cursor: "zoom-in",
            }}
          >
            <img
             src={displayedImage}
              alt={`${product.name}${selectedColor ? ` - ${selectedColor}` : ""}`}
              loading="lazy"
              style={{
                width: "100%",
                height: "100%",
               objectFit: isOsloBrown ? "contain" : "cover",
                transform: isHovered ? "scale(1.05)" : "scale(1)",
                transition: "transform 0.5s ease",
              }}
            />
          </button>
          {!isShowingSpin && images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  changeImage(-1);
                }}
                aria-label="Foto anterior"
                className="productGalleryArrow"
                style={{
                  position: "absolute",
                  left: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: 0,
                  borderRadius: "50%",
                  width: 34,
                  height: 34,
                  background: "rgba(255,255,255,0.94)",
                  color: "#542064",
                  fontSize: 18,
                  boxShadow: "0 3px 12px rgba(0,0,0,0.10)",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {"<"}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  changeImage(1);
                }}
                aria-label="Foto siguiente"
                className="productGalleryArrow"
                style={{
                  position: "absolute",
                  right: 8,
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: 0,
                  borderRadius: "50%",
                  width: 30,
                  height: 30,
                  background: "rgba(255,255,255,0.85)",
                  color: "#18181b",
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {">"}
              </button>

              <div
                style={{
                  position: "absolute",
                  bottom: 10,
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  gap: 5,
                  background: "rgba(255,255,255,0.88)",
                  padding: "5px 8px",
                  borderRadius: 999,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                }}
              >
                {images.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImageIndex(index);
                      const color = galleryImages[index]?.color;
                      if (color) setSelectedColor(color);
                    }}
                    aria-label={`Imagen ${index + 1}`}
                    style={{
                      width: imageIndex === index ? 14 : 6,
                      height: 6,
                      borderRadius: 4,
                      border: "none",
                      padding: 0,
                      background: imageIndex === index ? "#76218d" : "#d6cbd9",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div
          className="productCardInfo"
          style={{
            padding: "14px 5px 5px",
            display: "flex",
            flexDirection: "column",
            gap: 11,
            flex: 1,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 5 }}>
            <button
              className="productCardName"
              type="button"
              onClick={() => router.push(`/producto/${product.id}`)}
              style={{
                fontSize: 15,
                lineHeight: 1.3,
                fontWeight: 650,
                color: "#302437",
                margin: 0,
                padding: 0,
                border: 0,
                background: "transparent",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              {product.name}
            </button>
            <div style={{ display: "flex", flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", gap: 8, flexShrink: 0 }}>
              {product.oldPrice != null && product.oldPrice > product.price && (
                <span style={{ fontSize: 12, color: "#a1a1aa", textDecoration: "line-through" }}>
                  {product.oldPrice.toFixed(2)} €
                </span>
              )}
              <span className="productCardPrice" style={{ fontSize: 19, fontWeight: 800, color: "#702783", letterSpacing: "-0.3px" }}>
                {product.price.toFixed(2)} €
              </span>
              {product.oldPrice != null && product.oldPrice > product.price && (
                <span style={{ fontSize: 10, fontWeight: 800, color: "#702783", background: "#f4def8", padding: "4px 8px", borderRadius: 999 }}>
                  -{Math.round((1 - product.price / product.oldPrice) * 100)}%
                </span>
              )}
            </div>
          </div>
          {variants.length > 0 && (
            <div className="productCardOptions" style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
              {variants.map((variant) => {
                const hex = getColorHex(variant.color);
                const isSelected = selectedColor === variant.color;
                if (hex) {
                  return (
                    <button
                      key={variant.color}
                      type="button"
                      onClick={() => changeColor(variant.color)}
                      title={variant.color}
                      aria-label={`Color ${variant.color}`}
                      style={{
                        width: 23,
                        height: 23,
                        borderRadius: "50%",
                        backgroundColor: hex,
                        border: hex === "#ffffff" ? "1px solid #d4d4d8" : "1px solid rgba(0,0,0,0.15)",
                        outline: isSelected ? "2px solid #702783" : "none",
                        outlineOffset: 3,
                        cursor: "pointer",
                        padding: 0,
                      }}
                    />
                  );
                }
                return (
                  <button
                    key={variant.color}
                    type="button"
                    onClick={() => changeColor(variant.color)}
                    style={{
                      fontSize: 11,
                      padding: "2px 8px",
                      borderRadius: 12,
                      border: isSelected ? "1.5px solid #6b21a8" : "1px solid #e4e4e7",
                      background: isSelected ? "#f3e8ff" : "#fafafa",
                      color: "#27272a",
                      cursor: "pointer",
                    }}
                  >
                    {variant.color}
                  </button>
                );
              })}
              {selectedColor && !getColorHex(selectedColor) && (
                <span style={{ fontSize: 11, color: "#77707d" }}>{selectedColor}</span>
              )}
            </div>
          )}

          {availableSizes.length > 0 && (
            <div className="productCardSizes" style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {availableSizes.map((size) => {
                const isSelected = selectedSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    style={{
                      minWidth: 36,
                      height: 34,
                      padding: "0 10px",
                      fontSize: 12,
                      fontWeight: isSelected ? 700 : 500,
                      borderRadius: 10,
                      border: isSelected ? "1.5px solid #702783" : "1px solid #ded2e2",
                      background: isSelected ? "#702783" : "#ffffff",
                      color: isSelected ? "#ffffff" : "#3f3f46",
                      cursor: "pointer",
                    }}
                  >
                    {size}
                  </button>
                );
              })}
            </div>
          )}

          <button
            className="productCardAddButton"
            type="button"
            onClick={() =>
              onAddToCart(
                selectedVariant ? { color: selectedVariant.color, image: currentImage } : undefined,
                selectedSize || undefined
              )
            }
            style={{
              marginTop: "auto",
              width: "100%",
              padding: "12px 14px",
              borderRadius: 999,
              border: needsSizeSelection ? "1px solid #d8cbdc" : "1px solid #76218d",
              background: needsSizeSelection ? "linear-gradient(180deg, #ffffff, #faf7fb)" : "linear-gradient(135deg, #a13caf, #76218d)",
              color: needsSizeSelection ? "#6f6474" : "#ffffff",
              boxShadow: needsSizeSelection ? "none" : "0 5px 14px rgba(118, 33, 141, 0.20)",
              fontSize: 12,
              fontWeight: 750,
              letterSpacing: "0.2px",
              textTransform: "none",
              cursor: "pointer",
            }}
          >
            {needsSizeSelection ? "Elige una talla" : "Añadir al carrito"}
          </button>
          <button
            type="button"
            className="productCardViewButton"
            onClick={() => router.push(`/producto/${product.id}`)}
            style={{
              display: "none",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              minHeight: 34,
              marginTop: 2,
              border: "1px solid #e3d3e8",
              borderRadius: 999,
              background: "#fbf7fc",
              color: "#702783",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Ver prenda
          </button>
        </div>
      </article>

      {imageOpen && (
        <div
          onClick={() => setImageOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            background: "rgba(20, 10, 25, 0.88)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            cursor: "zoom-out",
          }}
        >
          <button
            type="button"
            onClick={() => setImageOpen(false)}
            style={{
              position: "absolute",
              top: 18,
              right: 22,
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: "none",
              background: "white",
              color: "#581c87",
              fontSize: 24,
              cursor: "pointer",
            }}
          >
            X
          </button>
          {!isShowingSpin && images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  changeImage(-1);
                }}
                style={{
                  position: "absolute",
                  left: 20,
                  top: "50%",
                  border: 0,
                  borderRadius: "50%",
                  width: 44,
                  height: 44,
                  background: "white",
                  color: "#581c87",
                  fontSize: 22,
                  cursor: "pointer",
                }}
              >
                {"<"}
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  changeImage(1);
                }}
                style={{
                  position: "absolute",
                  right: 20,
                  top: "50%",
                  border: 0,
                  borderRadius: "50%",
                  width: 44,
                  height: 44,
                  background: "white",
                  color: "#581c87",
                  fontSize: 22,
                  cursor: "pointer",
                }}
              >
                {">"}
              </button>
            </>
          )}
          <img
          src={displayedImage}
            alt={product.name}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "95vw",
              maxHeight: "88vh",
              objectFit: "contain",
              borderRadius: 10,
            }}
          />
        </div>
      )}
    </>
  );
}
