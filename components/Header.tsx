 "use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type HeaderProps = {
  cartCount: number;
  favCount: number;
  badgeKey: number;
  onCartClick: () => void;
  onFavClick: () => void;
};

type SearchProduct = {
  id: string | number;
  name: string;
  collection?: string | null;
  subcategory?: string | null;
  description?: string | null;
  price?: number | string | null;
  image?: string | null;
};

const collectionLinks: Record<string, string> = {
  Mujer: "/collections/mujer",
  Hombre: "/collections/hombre",
  "Tallas grandes": "/collections/tallas-grandes",
  Bolsos: "/collections/bolsos",
};

export default function Header({
  cartCount,
  favCount,
  badgeKey,
  onCartClick,
  onFavClick,
}: HeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [products, setProducts] = useState<SearchProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!searchOpen || products.length > 0) return;

    let cancelled = false;

    const loadProducts = async () => {
      setLoadingProducts(true);
      const { data, error } = await supabase
        .from("products")
        .select("id, name, collection, subcategory, description, price, image");

      if (!cancelled) {
        if (error) {
          console.error("Error cargando productos para el buscador:", error);
        } else {
          setProducts((data ?? []) as SearchProduct[]);
        }
        setLoadingProducts(false);
      }
    };

    loadProducts();

    return () => {
      cancelled = true;
    };
  }, [searchOpen, products.length]);

  const closeMenu = () => setMenuOpen(false);

  const searchResults = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase("es");
    if (!term) return [];

    return products
      .filter((product) =>
        [
          product.name,
          product.collection,
          product.subcategory,
          product.description,
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("es")
          .includes(term)
      )
      .slice(0, 8);
  }, [products, searchTerm]);

  return (
    <header className={`header ${scrolled ? "scrolled" : ""}`}>
      <a href="/" className="logo" onClick={closeMenu}>
        <span className="logoIcon" aria-hidden="true">
          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 17h28l3 25H7l3-25Z" />
            <path d="M16 18v-5a8 8 0 0 1 16 0v5" />
          </svg>
        </span>
        <span className="logoWords">
          <strong>KIGOBESHOP</strong>
          <small>ROPA · BOLSOS · ESTILO</small>
        </span>
      </a>

      <nav className={`nav ${menuOpen ? "open" : ""}`}>
        <a href="/" onClick={closeMenu}>Inicio</a>
        <a href="/#categorias" onClick={closeMenu}>Categorías</a>
        <a href="/#novedades" onClick={closeMenu}>Novedades</a>
        <a href="/#ofertas" onClick={closeMenu}>Ofertas</a>
      </nav>

      <div className="headerActions">
        <button
          className="iconButton"
          onClick={() => {
            setSearchOpen((open) => !open);
            setSearchTerm("");
          }}
          aria-label="Buscar productos"
          aria-expanded={searchOpen}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="23" height="23">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-4-4" />
          </svg>
        </button>

        <button className="iconButton" onClick={onFavClick} aria-label="Favoritos">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="23" height="23">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          {favCount > 0 && <span className="badge" key={`fav-${badgeKey}`}>{favCount}</span>}
        </button>

        <button className="iconButton" onClick={onCartClick} aria-label="Carrito">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="23" height="23">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
          {cartCount > 0 && <span className="badge animate" key={`cart-${badgeKey}`}>{cartCount}</span>}
        </button>

        <button className="menuToggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menú">
          {menuOpen ? "×" : "☰"}
        </button>
      </div>

      {searchOpen && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: "clamp(12px, 4vw, 60px)",
            width: "min(420px, calc(100vw - 24px))",
            padding: 18,
            background: "#fff",
            border: "1px solid #eadff0",
            borderRadius: 14,
            boxShadow: "0 12px 35px rgba(35, 15, 45, 0.16)",
            zIndex: 1000,
            color: "#321b3d",
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              autoFocus
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="¿Qué estás buscando?"
              aria-label="Buscar productos"
              style={{
                flex: 1,
                minWidth: 0,
                padding: "12px 14px",
                border: "1px solid #d8c5e2",
                borderRadius: 9,
                outlineColor: "#7620a5",
                font: "inherit",
              }}
            />
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              aria-label="Cerrar buscador"
              style={{
                border: 0,
                background: "transparent",
                color: "#54206f",
                fontSize: 24,
                cursor: "pointer",
              }}
            >
              ×
            </button>
          </div>

          {searchTerm.trim() && (
            <div style={{ marginTop: 12, maxHeight: 360, overflowY: "auto" }}>
              {loadingProducts ? (
                <p style={{ margin: 8 }}>Cargando productos...</p>
              ) : searchResults.length > 0 ? (
                searchResults.map((product) => (
                  <a
                    key={product.id}
                   href={`${collectionLinks[product.collection ?? ""] ?? "/#categorias"}?producto=${encodeURIComponent(String(product.id))}`}
                    onClick={() => setSearchOpen(false)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "9px 4px",
                      color: "inherit",
                      textDecoration: "none",
                      borderBottom: "1px solid #f0eaf3",
                    }}
                  >
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        style={{ width: 54, height: 62, objectFit: "cover", borderRadius: 7 }}
                      />
                    ) : (
                      <span style={{ width: 54, height: 62, background: "#f4eef7", borderRadius: 7 }} />
                    )}
                    <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      <strong>{product.name}</strong>
                      <small style={{ color: "#806b89" }}>
                        {[product.subcategory, product.collection].filter(Boolean).join(" · ")}
                      </small>
                      {product.price != null && <strong>{Number(product.price).toFixed(2).replace(".", ",")} €</strong>}
                    </span>
                  </a>
                ))
              ) : (
                <p style={{ margin: 8 }}>No hemos encontrado productos con ese nombre.</p>
              )}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
