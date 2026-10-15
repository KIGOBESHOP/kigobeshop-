import { useState, useEffect } from "react";

type HeaderProps = {
  cartCount: number;
  favCount: number;
  badgeKey: number;
  onCartClick: () => void;
  onFavClick: () => void;
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className={`header ${scrolled ? "scrolled" : ""}`}>
      <a href="#inicio" className="logo" onClick={closeMenu}>
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
        <a href="#inicio" onClick={closeMenu}>Inicio</a>
        <a href="#productos" onClick={closeMenu}>Tienda</a>
        <a href="#categorias" onClick={closeMenu}>Categorías</a>
        <a href="#novedades" onClick={closeMenu}>Novedades</a>
        <a href="#ofertas" onClick={closeMenu}>Ofertas</a>
      </nav>

      <div className="headerActions">
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
    </header>
  );
}