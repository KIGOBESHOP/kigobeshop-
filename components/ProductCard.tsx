
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
  onAddToCart: (
    variant?: SelectedVariant,
    size?: string
  ) => void;
  onToggleFavorite: () => void;
};

export default function ProductCard({
  product,
  isFavorite,
  onAddToCart,
  onToggleFavorite,
}: Props) {
  const variants = product.variants ?? [];
    const sizes = product.sizes ?? [];
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState(
    variants[0]?.color ?? ""
  );
  const selectedVariant = variants.find(
    (variant) => variant.color === selectedColor
  );
   
const images = Array.from(
  new Set(
    [
      product.image,
      ...(selectedVariant?.images ?? []),
      ...variants.flatMap((variant) => variant.images ?? []),
    ].filter(Boolean)
  )
);

  const [imageIndex, setImageIndex] = useState(0);
  const safeImageIndex = Math.min(imageIndex, images.length - 1);
const currentImage = images[safeImageIndex] ?? product.image;
    const touchStartX = useRef(0);

  function changeImage(direction: number) {
    setImageIndex((current) => {
      const total = images.length;
      return (current + direction + total) % total;
    });
  }
  const [imageOpen, setImageOpen] = useState(false);
 
   function changeColor(color: string) {
  setSelectedColor(color);
  setImageIndex(0);
}
  return (
    <>
      <article className="productCard fadeInUp">
        {product.tag && (
          <span className={`productTag ${product.tag}`}>
            {product.tag}
          </span>
        )}

        <button
          className={`favoriteButton ${isFavorite ? "active" : ""}`}
          onClick={onToggleFavorite}
          aria-label="Favorito"
        >
          <svg
            viewBox="0 0 24 24"
            fill={isFavorite ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>

       <div
  className="productImageWrap"
  onTouchStart={(event) => {
    touchStartX.current = event.touches[0].clientX;
  }}
  onTouchEnd={(event) => {
    const difference =
      event.changedTouches[0].clientX - touchStartX.current;

    if (Math.abs(difference) > 40 && images.length > 1) {
      changeImage(difference < 0 ? 1 : -1);
    }
   }}
  style={{ position: "relative", touchAction: "pan-y" }}
>   
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
      src={currentImage}
      alt={`${product.name}${selectedColor ? ` - ${selectedColor}` : ""}`}
      loading="lazy"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
      }}
    />
  </button>

  {images.length > 1 && (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
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
          width: 34,
          height: 34,
          background: "rgba(255,255,255,0.9)",
          color: "#581c87",
          fontSize: 22,
          cursor: "pointer",
        }}
      >
        ‹
      </button>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
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
          width: 34,
          height: 34,
          background: "rgba(255,255,255,0.9)",
          color: "#581c87",
          fontSize: 22,
          cursor: "pointer",
        }}
      >
        ›
      </button>
    </>
  )}
</div>

        {images.length > 1 && (
          <div
            style={{
              display: "flex",
              gap: 6,
              justifyContent: "center",
              flexWrap: "wrap",
              padding: "8px 10px",
            }}
          >
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                type="button"
                onClick={() => setImageIndex(index)}
                aria-label={`Ver foto ${index + 1}`}
                style={{
                  width: 42,
                  height: 42,
                  padding: 2,
                  borderRadius: 6,
                  overflow: "hidden",
                  border:
                    imageIndex === index
                      ? "2px solid #7e22ce"
                      : "1px solid #ddd",
                  background: "white",
                  cursor: "pointer",
                }}
              >
                <img
                  src={image}
                  alt=""
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </button>
            ))}
          </div>
        )}

        <div className="productInfo">
          <span className="productCategory">{product.category}</span>
          <h3 className="productName">{product.name}</h3>
          <p className="productDesc">{product.description}</p>

{sizes.length > 0 && (
  <div style={{ margin: "12px 0" }}>
    <span
      style={{
        display: "block",
        fontSize: 13,
        marginBottom: 7,
        fontWeight: 600,
      }}
    >
      Elige tu talla: {selectedSize && ` ${selectedSize}`}
    </span>

    <div
      style={{
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
      }}
    >
      {sizes.map((size) => (
        <button
          key={size}
          type="button"
          onClick={() => setSelectedSize(size)}
          aria-pressed={selectedSize === size}
          style={{
            padding: "8px 13px",
            borderRadius: 8,
            border:
              selectedSize === size
                ? "2px solid #7e22ce"
                : "1px solid #ddd",
            background:
              selectedSize === size ? "#f3e8ff" : "white",
            color: "#30213c",
            fontWeight: selectedSize === size ? 700 : 400,
            cursor: "pointer",
          }}
        >
          {size}
        </button>
      ))}
    </div>
  </div>
)}

          {variants.length > 0 && (
            <div style={{ margin: "12px 0" }}>
              <label
                style={{
                  display: "block",
                  fontSize: 13,
                  marginBottom: 7,
                  fontWeight: 600,
                }}
              >
                Color: {selectedColor}
              </label>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                {variants.map((variant) => (
                  <button
                    key={variant.color}
                    type="button"
                    onClick={() => changeColor(variant.color)}
                    aria-pressed={selectedColor === variant.color}
                    style={{
                      padding: "7px 12px",
                      borderRadius: 20,
                      border:
                        selectedColor === variant.color
                          ? "2px solid #7e22ce"
                          : "1px solid #ddd",
                      background:
                        selectedColor === variant.color
                          ? "#f3e8ff"
                          : "white",
                      color: "#30213c",
                      cursor: "pointer",
                    }}
                  >
                    {variant.color}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="productFooter">
            <div className="priceWrap">
              {product.oldPrice && (
                <span className="priceOld">
                  {product.oldPrice.toFixed(2)} €
                </span>
              )}
              <span className="price">
                {product.price.toFixed(2)} €
              </span>
            </div>

            <button
              className="cartButton"
              onClick={() =>
  onAddToCart(
    selectedVariant
      ? {
          color: selectedVariant.color,
          image: currentImage,
        }
      : undefined,
    selectedSize || undefined
  )
}
              aria-label={`Añadir ${product.name} al carrito`}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </div>
      </article>

      {imageOpen && (
        <div
          onClick={() => setImageOpen(false)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setImageOpen(false);
          }}
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
          role="dialog"
          aria-modal="true"
          aria-label={`Foto ampliada de ${product.name}`}
        >
          <button
            type="button"
            onClick={() => setImageOpen(false)}
            aria-label="Cerrar foto ampliada"
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
              fontSize: 30,
              cursor: "pointer",
            }}
          >
            ×
          </button>
{images.length > 1 && (
  <>
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        changeImage(-1);
      }}
      aria-label="Foto anterior"
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
        fontSize: 28,
        cursor: "pointer",
      }}
    >
      ‹
    </button>

    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        changeImage(1);
      }}
      aria-label="Foto siguiente"
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
        fontSize: 28,
        cursor: "pointer",
      }}
    >
      ›
    </button>
  </>
)}
          <img
            src={currentImage}
            alt={`${product.name}${selectedColor ? ` - ${selectedColor}` : ""}`}
            onClick={(event) => event.stopPropagation()}
            style={{
              display: "block",
              maxWidth: "95vw",
              maxHeight: "88vh",
              width: "auto",
              height: "auto",
              objectFit: "contain",
              borderRadius: 10,
              cursor: "default",
            }}
          />
        </div>
      )}
    </>
  );
}
