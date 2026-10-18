"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Categories from "@/components/Categories";
import ProductCard from "@/components/ProductCard";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import { products, categories, type Product } from "@/lib/products";
import { supabase } from "@/lib/supabase";
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
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
const [, setDbProductsLoaded] = useState(false);
  const [sortBy, setSortBy] = useState("destacados");
const [categoryGender, setCategoryGender] = useState("");

const handleCategoryClick = (category: string) => {
  if (category === "Todos" || category === "Ropa" || category === "Bolsos") {
    setActiveFilter(category);
    setCategoryGender("");
  } else {
    setCategoryGender(category);
    setActiveFilter("Todos");
  }

  document.getElementById("productos")?.scrollIntoView({
    behavior: "smooth",
  });
};

  const [badgeKey, setBadgeKey] = useState(0);
  const [toast, setToast] = useState("");
  const [emailSubscribed, setEmailSubscribed] = useState(false);
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("kigobeshop-cart");
      const savedFavorites = localStorage.getItem("kigobeshop-favorites");

      if (savedCart) setCart(JSON.parse(savedCart));
      if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    } catch (error) {
      console.error("Error al cargar los datos guardados", error);
    }
    setStorageLoaded(true);
  }, []);

  useEffect(() => {
    if (!storageLoaded) return;

    localStorage.setItem("kigobeshop-cart", JSON.stringify(cart));
    localStorage.setItem("kigobeshop-favorites", JSON.stringify(favorites));
  }, [cart, favorites, storageLoaded]);
  
  useEffect(() => {
    let cancelled = false;

    async function loadDbProducts() {
      try {
        const { data, error } = await supabase
          .from("products")
          .select("*");

        if (error) throw error;

        const loadedProducts: Product[] = (data ?? []).map((p) => ({
          id: 1000000 + Number(p.id),
          name: p.name,
          category: p.category,
          collection: p.collection,
          price: Number(p.price),
          ...(p.old_price != null
            ? { oldPrice: Number(p.old_price) }
            : {}),
          image: p.image,
          description: p.description ?? "",
        }));

        if (!cancelled) {
          setDbProducts(loadedProducts);
        }
      } catch (error) {
        console.error("Error al cargar productos de Supabase:", error);
      } finally {
        if (!cancelled) {
          setDbProductsLoaded(true);
        }
      }
    }

    loadDbProducts();

    return () => {
      cancelled = true;
    };
  }, []);

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

let list = [...products, ...dbProducts];


  if (categoryGender !== "") {
    list = list.filter((p) => p.collection === categoryGender);
  } else if (activeFilter !== "Todos") {
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
      list = list
        .filter((p) => p.oldPrice)
        .sort((a, b) => {
          const aDisc = a.oldPrice
            ? (a.oldPrice - a.price) / a.oldPrice
            : 0;
          const bDisc = b.oldPrice
            ? (b.oldPrice - b.price) / b.oldPrice
            : 0;
          return bDisc - aDisc;
        });
      break;
    default:
      break;
  }

  return list;
}, [activeFilter, sortBy, categoryGender, dbProducts]);

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
        onFavClick={() => setFavoritesOpen(true)}
      />

      <Hero />

    <Categories />


      
       
      <section className="section" id="novedades" style={{ paddingTop: 0 }}>
        <div className="sectionHeader">
          <h2>New Arrivals</h2>
          <p>The latest styles, just for you.</p>
        </div>

        <div className="productGrid">
          {products
            .filter((product) => product.tag === "NUEVO")
            .map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isFavorite={favorites.includes(product.id)}
                onAddToCart={() => addToCart(product)}
                onToggleFavorite={() => toggleFavorite(product.id)}
              />
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
                onClick={() => {
  setCategoryGender("");
  setActiveFilter(cat.name);
}}
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
    <p className="promoLabel">BIENVENIDA A KIGOBESHOP</p>
    <h2>Tu estilo, tus reglas.</h2>
    <p>
      Descubre una moda que celebra quién eres.
      Ropa, bolsos y accesorios para mujer, tallas grandes y hombre.
      Encuentra tu estilo y vístete a tu manera.
    </p>
    <a href="#productos" className="btnPrimary">
      DESCUBRIR LA TIENDA
    </a>
  </div>

  <div className="promoImages">
    <div className="promoImg">
      <img
        src="https://images.pexels.com/photos/31462588/pexels-photo-31462588.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
        alt="Moda elegante"
      />
    </div>
    <div className="promoImg">
      <img
        src="https://images.pexels.com/photos/9267587/pexels-photo-9267587.jpeg?auto=compress&cs=tinysrgb&h=650&w=940"
        alt="Bolsos y complementos"
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


    <section className="benefits" id="beneficios">
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
         <h3>Devoluciones en 14 días</h3>
<p>Dispones de 14 días para devolver tu compra, según las condiciones aplicables.</p>
        </div>
      </section>

      

      <Footer />

{favoritesOpen && (
  <div
    onClick={() => setFavoritesOpen(false)}
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 2000,
      background: "rgba(20, 10, 30, 0.55)",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      padding: "16px",
    }}
  >
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        background: "#fff",
        borderRadius: "20px",
        padding: "24px",
        width: "100%",
        maxWidth: "900px",
        maxHeight: "85vh",
        overflowY: "auto",
        color: "#30213c",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ margin: 0 }}>♡ Mis favoritos</h2>
        <button
          onClick={() => setFavoritesOpen(false)}
          aria-label="Cerrar favoritos"
          style={{
            border: 0,
            background: "#f3eafa",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            fontSize: "25px",
            cursor: "pointer",
          }}
        >
          ×
        </button>
      </div>

      {favorites.length === 0 ? (
        <p>Aún no tienes prendas favoritas. ¡Explora la tienda y guarda las que te gusten!</p>
      ) : (
        <div className="productGrid">
          {products
            .filter((product) => favorites.includes(product.id))
            .map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isFavorite={true}
                onAddToCart={() => addToCart(product)}
                onToggleFavorite={() => toggleFavorite(product.id)}
              />
            ))}
        </div>
      )}
    </div>
  </div>
)}

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
