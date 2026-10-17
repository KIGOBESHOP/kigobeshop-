
"use client";

import Link from "next/link";
import "./Categories.css";

const categories = [
  {
    title: "Mujer",
    subtitle: "Estilo para cada momento",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=85",
    className: "women",
    href: "/collections/mujer",
  },
  {
    title: "Hombre",
    subtitle: "Tu estilo, tus reglas",
    image:
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=85",
    className: "men",
    href: "/collections/hombre",
  },
  {
    title: "Tallas grandes",
    subtitle: "Moda para todos los cuerpos",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85",
    className: "plus-size",
    href: "/collections/tallas-grandes",
  },
  {
    title: "Bolsos",
    subtitle: "El detalle que lo cambia todo",
    image:
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=85",
    className: "bags",
    href: "/collections/bolsos",
  },
];

export default function Categories() {
  return (
    <section className="categories-section" id="categorias">
      <div className="categories-heading">
        <span className="categories-eyebrow">DESCUBRE TU ESTILO</span>
        <h2>Encuentra tus prendas favoritas</h2>
        <p>Moda para expresarte tal y como eres.</p>
      </div>

      <div className="categories-grid">
        {categories.map((category) => (
          <Link
            href={category.href}
            className={`category-card ${category.className}`}
            key={category.title}
          >
            <img src={category.image} alt={category.title} />
            <div className="category-overlay">
              <span className="category-subtitle">{category.subtitle}</span>
              <h3>{category.title}</h3>
              <span className="category-link">
                Descubrir colección ↗
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
