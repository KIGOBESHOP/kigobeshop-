"use client";

import { useState, useMemo, useCallback } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Categories from "@/components/Categories";
import ProductCard from "@/components/ProductCard";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import { products, categories, type Product } from "@/lib/products";
import CheckoutForm from "@/components/CheckoutForm";
type CartItem = {
  product: Product;
  qty: number;
};
type CustomerData = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
};
export default function Home() {
  const [cart, setCart] = useState<CartItem[]>([]);
const [customerData, setCustomerData] = useState<CustomerData>({
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  postalCode: "",
});
const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [sortBy, setSortBy] = useState("destacados");
  const [badgeKey, setBadgeKey] = useState(0);
  const [toast, setToast] = useState("");
  const [emailSubscribed, setEmailSubscribed] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 9000);
  }, []);

  const addToCart = useCallback(
    (product: Product) => {
      setCart((prev) => {
        const existing = prev.find((i) => i.product.id === product.id);
        if (existing) {
          return prev.map((i) =>
            i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i
          );
        }
        return [...prev, { product, qty: 1 }];
      });
      setBadgeKey((k) => k + 1);
      showToast(`${product.name} añadido al carrito`);
    },
    [showToast]
  );

  const increaseQty = (id: number) => {
    setCart((prev) =>
      prev.map((i) => (i.product.id === id ? { ...i, qty: i.qty + 1 } : i))
    );
  };

  const decreaseQty = (id: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.product.id === id ? { ...i, qty: i.qty - 1 } : i))
        .filter((i) => i.qty > 0)
    );
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((i) => i.product.id !== id));
  };

  const toggleFavorite = (id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
    setBadgeKey((k) => k + 1);
  };

 const checkout = () => {
  setCheckoutOpen(true);
};

const handleCustomerChange = (data: CustomerData) => {
  setCustomerData(data);
};

const handleCheckoutSubmit = () => {
  if (
    !customerData.name.trim() ||
    !customerData.email.trim() ||
    !customerData.phone.trim() ||
    !customerData.address.trim() ||
    !customerData.city.trim() ||
    !customerData.postalCode.trim()
  ) {
    showToast("Completa todos los datos para continuar.");
    return;
  }

  showToast(
    "Datos comprobados. Estamos preparando la configuración del pago."
  );
};
  const handleSubscribe = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setEmailSubscribed(true);
    setTimeout(() => setEmailSubscribed(false), 4000);
    (e.target as HTMLFormElement).reset();
  };

  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const filteredProducts = useMemo(() => {
    let list = [...products];
    if (activeFilter !== "Todos") {
      list = list.filter((p) => p.category === activeFilter);
    }
    switch (sortBy) {
      case "precio-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "precio-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "ofertas":
        list = list.filter((p) => p.oldPrice).sort((a, b) => {
          const aDisc = a.oldPrice ? (a.oldPrice - a.price) / a.oldPrice : 0;
          const bDisc = b.oldPrice ? (b.oldPrice - b.price) / b.oldPrice : 0;
          return bDisc - aDisc;
        });
        break;
      default:
        break;
    }
    return list;
  }, [activeFilter, sortBy]);

  const countByCategory = (cat: string) => {
    if (cat === "Todos") return products.length;
    return products.filter((p) => p.category === cat).length;
  };

  return (
    <main>
      <Header
        cartCount={cartCount}
        favCount={favorites.length}
        badgeKey={badgeKey}
        onCartClick={() => setCartOpen(true)}
        onFavClick={() => {
          if (favorites.length > 0) {
            showToast(`${favorites.length} producto(s) en favoritos`);
          } else {
            showToast("Aún no tienes favoritos");
          }
        }}
      />

      <Hero />

      <section className="trustBar">
        <div className="trustItem">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="3" width="15" height="13" rx="2" />
            <path d="M16 8h4l3 3v5h-7V8z" />
            <circle cx="5.5" cy="18.5" r="2.5" />
            <circle cx="18.5" cy="18.5" r="2.5" />
          </svg>
          <div>
            <h4>Envío rápido</h4>
            <p>24-48h a todo el país</p>
          </div>
        </div>
        <div className="trustItem">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <div>
            <h4>Pago seguro</h4>
            <p>Transacciones protegidas</p>
          </div>
        </div>
        <div className="trustItem">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="1 4 1 10 7 10" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
          <div>
            <h4>Devoluciones gratis</h4>
            <p>30 días para cambios</p>
          </div>
        </div>
      </section>

      <section className="section" id="categorias">
        <div className="sectionHeader">
          <h2>Explora nuestras categorías</h2>
          <p>Encuentra justo lo que buscas</p>
        </div>

        <div className="categoryGrid">
          {categories.map((cat) => (
            <div
              key={cat.name}1:37 10/10/2026
              className={`categoryCard ${activeFilter === cat.name ? "active" : ""}`}
              onClick={() => {
                setActiveFilter(cat.name);
                document.getElementById("productos")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
            >
              <div className="categoryIcon">{cat.icon}</div>
              <h3>{cat.name}</h3>
              <p>{countByCategory(cat.name)} productos</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="productos" style={{ paddingTop: 0 }}>
        <div className="sectionHeader">
          <h2>Productos destacados</h2>
          <p>Descubre nuestras últimas novedades y ofertas</p>
        </div>

        <div className="productsToolbar">
          <div className="filterChips">
            {categories.map((cat) => (
              <button
                key={cat.name}
                className={`chip ${activeFilter === cat.name ? "active" : ""}`}
                onClick={() => setActiveFilter(cat.name)}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <select
            className="sortSelect"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="destacados">Destacados</option>
            <option value="precio-asc">Precio: menor a mayor</option>
            <option value="precio-desc">Precio: mayor a menor</option>
            <option value="ofertas">Mejores ofertas</option>
          </select>
        </div>

        <div className="productGrid">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isFavorite={favorites.includes(product.id)}
                onAddToCart={() => addToCart(product)}
                onToggleFavorite={() => toggleFavorite(product.id)}
              />
            ))
          ) : (
            <div className="noResults">
              No se encontraron productos en esta categoría.
            </div>
          )}
        </div>
      </section>

      <section className="promotion" id="ofertas">
        <div className="promoContent">
          <p className="promoLabel">NUEVA COLECCIÓN</p>
          <h2>Tu próximo look empieza aquí</h2>
          <a href="#productos" className="btnPrimary">
            VER COLECCIÓN
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </a>
        </div>
        <div className="promoImages">
          <div className="promoImg">
            <img
              src="https://images.pexels.com/photos/31462588/pexels-photo-31462588.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
              alt="Vestido elegante"
            />
          </div>
          <div className="promoImg">
            <img
              src="https://images.pexels.com/photos/9267587/pexels-photo-9267587.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
              alt="Bolso de cuero"
            />
          </div>
          <div className="promoImg">
            <img
              src="https://images.pexels.com/photos/7762477/pexels-photo-7762477.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
              alt="Moda urbana"
            />
          </div>
        </div>
      </section>

      <section className="benefits" id="novedades">
        <div className="benefitCard">
          <div className="benefitIcon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="3" width="15" height="13" rx="2" />
              <path d="M16 8h4l3 3v5h-7V8z" />
              <circle cx="5.5" cy="18.5" r="2.5" />
              <circle cx="18.5" cy="18.5" r="2.5" />
            </svg>
          </div>
          <h3>Envíos rápidos</h3>
          <p>Recibe tus pedidos en 24-48h a todo el país.</p>
        </div>
        <div className="benefitCard">
          <div className="benefitIcon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h3>Compra segura</h3>
          <p>Pagos protegidos y encriptados en cada transacción.</p>
        </div>
        <div className="benefitCard">
          <div className="benefitIcon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
          </div>
          <h3>Moda para ti</h3>
          <p>Tendencias juveniles que expresan tu personalidad.</p>
        </div>
      </section>

      <section className="newsletter">
        <h2>Únete al club KIGOBESHOP</h2>
        <p>Suscríbete y recibe un 10% de descuento en tu primera compra.</p>
        <form className="newsletterForm" onSubmit={handleSubscribe}>
          <input
            type="email"
            placeholder="tu@email.com"
            required
          />
          <button type="submit">Suscribirme</button>
        </form>
        {emailSubscribed && (
          <p className="newsletterMsg">
            ¡Gracias! Revisa tu email para el cupón de descuento.
          </p>
        )}
      </section>

      <Footer />

      <CartDrawer
        open={cartOpen}
        items={cart}
        onClose={() => setCartOpen(false)}
        onIncrease={increaseQty}
        onDecrease={decreaseQty}
        onRemove={removeFromCart}
        onCheckout={checkout}
      />
{checkoutOpen && (
  <CheckoutForm
    data={customerData}
    onChange={handleCustomerChange}
    onClose={() => setCheckoutOpen(false)}
    onSubmit={handleCheckoutSubmit}
  />
)}
      <div className={`toast ${toast ? "show" : ""}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
        {toast}
      </div>
    </main>
  );
}
