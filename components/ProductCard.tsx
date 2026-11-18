"use client";

import { useState, useRef } from "react";
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
      <article
        className="productCard fadeInUp"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{
          display: "flex",
          flexDirection: "column",
          background: "#ffffff",
          borderRadius: 12,
          overflow: "hidden",
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
    backgroundColor: "#f4f4f5",
    overflow: "hidden",
    borderRadius: 10,
    touchAction: "pan-y",
  }}
>

          {product.tag && (
            <span
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                zIndex: 10,
                background: "rgba(255, 255, 255, 0.92)",
                color: "#18181b",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "1.2px",
                padding: "4px 9px",
                borderRadius: 4,
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
              top: 10,
              right: 10,
              zIndex: 10,
              width: 34,
              height: 34,
              borderRadius: "50%",
              border: "none",
              background: "rgba(255, 255, 255, 0.88)",
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
            onClick={() => setImageOpen(true)}
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
                style={{
                  position: "absolute",
                  left: 8,
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
                {"<"}
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  changeImage(1);
                }}
                aria-label="Foto siguiente"
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
                  background: "rgba(0,0,0,0.25)",
                  padding: "4px 8px",
                  borderRadius: 12,
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
                      background: imageIndex === index ? "#ffffff" : "rgba(255,255,255,0.5)",
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div
          style={{
            padding: "12px 4px 4px 4px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            flex: 1,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <h3 style={{ fontSize: 14, fontWeight: 500, color: "#18181b", margin: 0 }}>
              {product.name}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0 }}>
              {product.oldPrice != null && product.oldPrice > product.price && (
                <span style={{ fontSize: 12, color: "#a1a1aa", textDecoration: "line-through" }}>
                  {product.oldPrice.toFixed(2)} €
                </span>
              )}
              <span style={{ fontSize: 15, fontWeight: 700, color: product.oldPrice != null && product.oldPrice > product.price ? "#7e22ce" : "#18181b" }}>
                {product.price.toFixed(2)} €
              </span>
              {product.oldPrice != null && product.oldPrice > product.price && (
                <span style={{ fontSize: 10, fontWeight: 700, color: "#7e22ce" }}>
                  -{Math.round((1 - product.price / product.oldPrice) * 100)}%
                </span>
              )}
            </div>
          </div>
          {variants.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
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
                        width: 18,
                        height: 18,
                        borderRadius: "50%",
                        backgroundColor: hex,
                        border: hex === "#ffffff" ? "1px solid #d4d4d8" : "1px solid rgba(0,0,0,0.15)",
                        outline: isSelected ? "1.5px solid #6b21a8" : "none",
                        outlineOffset: 2,
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
              {selectedColor && (
                <span style={{ fontSize: 11, color: "#71717a" }}>{selectedColor}</span>
              )}
            </div>
          )}

          {availableSizes.length > 0 && (
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {availableSizes.map((size) => {
                const isSelected = selectedSize === size;
                return (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    style={{
                      minWidth: 30,
                      height: 28,
                      padding: "0 7px",
                      fontSize: 11,
                      fontWeight: isSelected ? 700 : 500,
                      borderRadius: 6,
                      border: isSelected ? "1.5px solid #6b21a8" : "1px solid #e4e4e7",
                      background: isSelected ? "#6b21a8" : "#ffffff",
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
              padding: "10px 14px",
              borderRadius: 8,
              border: needsSizeSelection ? "1px solid #d4d4d8" : "1px solid #6b21a8",
              background: needsSizeSelection ? "#fafafa" : "#6b21a8",
              color: needsSizeSelection ? "#52525b" : "#ffffff",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            {needsSizeSelection ? "Elige una talla" : "+ Añadir al carrito"}
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
