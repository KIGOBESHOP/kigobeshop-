
"use client";

import { useState } from "react";

type Props = {
  product: {
    id: number;
    name: string;
    category: string;
    price: number;
    oldPrice?: number;
    image: string;
    tag?: "NUEVO" | "OFERTA" | "TRENDING";
    description: string;
  };
  isFavorite: boolean;
  onAddToCart: () => void;
  onToggleFavorite: () => void;
};

export default function ProductCard({
  product,
  isFavorite,
  onAddToCart,
  onToggleFavorite,
}: Props) {
  const [imageOpen, setImageOpen] = useState(false);

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

        <div className="productImageWrap">
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
              src={product.image}
              alt={product.name}
              loading="lazy"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </button>
        </div>

        <div className="productInfo">
          <span className="productCategory">{product.category}</span>
          <h3 className="productName">{product.name}</h3>
          <p className="productDesc">{product.description}</p>

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
              onClick={onAddToCart}
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

          <img
            src={product.image}
            alt={product.name}
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
