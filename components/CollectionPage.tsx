"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import CartDrawer from "@/components/CartDrawer";
import CheckoutForm from "@/components/CheckoutForm";
import Footer from "@/components/Footer";
import { products, type Product } from "@/lib/products";
import { supabase } from "@/lib/supabase";

type CartItem = {
  cartKey: string;
  product: Product;
  qty: number;
  selectedColor?: string;
  selectedImage?: string;
  selectedSize?: string;
};

// CORREGIDO: Eliminado "gender" del tipo de datos
type CustomerData = {
  name: string;
  surname: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  shippingMethod: string;
  acceptTerms: boolean;
  acknowledgePrivacy: boolean;
};

type Props = { collection: Product["collection"] };

const titles: Record<Product["collection"], string> = {
  Mujer: "Colección Mujer",
  Hombre: "Colección Hombre",
  "Tallas grandes": "Colección Tallas grandes",
  Bolsos: "Colección Bolsos",
};
const subcategoriesByCollection: Record<
  string,
  { name: string; image: string }[]
> = {
  Mujer: [
    { name: "Vaqueros", image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600" },
    { name: "Camisas", image: "https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=600" },
    { name: "Camisetas y tops", image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600" },
    { name: "Pantalones", image: "https://images.unsplash.com/photo-1506629905607-d9b1e7e3b8a5?w=600" },
    { name: "Vestidos", image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600" },
    { name: "Conjuntos", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600" },
    { name: "Jerséis y chalecos", image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600" },
    { name: "Chaquetas y abrigos", image: "https://images.unsplash.com/photo-1548126032-079a0fb0099d?w=600" },
  ],
  Hombre: [
    { name: "Vaqueros", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=600" },
    { name: "Camisas", image: "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=600" },
    { name: "Camisetas", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600" },
    { name: "Sudaderas", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=600" },
    { name: "Pantalones", image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600" },
    { name: "Conjuntos", image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600" },
    { name: "Chaquetas", image: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600" },
  ],
 "Tallas grandes": [
  { name: "Vaqueros", image: "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=600" },
  { name: "Camisas", image: "https://images.unsplash.com/photo-1598554747436-c9293d6a588f?w=600" },
  { name: "Camisetas y tops", image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=600" },
  { name: "Pantalones", image: "https://images.unsplash.com/photo-1506629905607-d9b1e7e3b8a5?w=600" },
  { name: "Pantalones de licra", image: "https://images.unsplash.com/photo-1506629905607-d9b1e7e3b8a5?w=600" },
  { name: "Conjuntos", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600" },
],
  Bolsos: [
    { name: "Bolsos de mano", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600" },
    { name: "Bolsos bandolera", image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600" },
    { name: "Mochilas", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600" },
    { name: "Carteras", image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=600" },
  ],
};
export default function CollectionPage({ collection }: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [dbProductsLoaded, setDbProductsLoaded] = useState(false);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [badgeKey, setBadgeKey] = useState(0);
  const [toast, setToast] = useState("");

  // CORREGIDO: Eliminado "gender: ''" del estado inicial
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: "",
    surname: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    shippingMethod: "standard",
    acceptTerms: false,
    acknowledgePrivacy: false,
  });
  
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
          subcategory: p.subcategory ?? "",
          price: Number(p.price),
          ...(p.old_price != null ? { oldPrice: Number(p.old_price) } : {}),
          image: p.image,
          description: p.description ?? "",
          sizes: Array.isArray(p.sizes) ? p.sizes : [],
          variants: Array.isArray(p.variants) ? p.variants : [],
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

  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("kigobeshop-cart");
      const savedFavorites = localStorage.getItem("kigobeshop-favorites");

      if (savedCart) {
        const parsedCart = JSON.parse(savedCart);
        setCart(
          parsedCart.map((item: any) => ({
            ...item,
            cartKey: item.cartKey ?? `${item.product.id}::${item.selectedColor ?? ""}`,
          }))
        );
      }
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

  const showToast = useCallback((message: string) => {
    setToast(message);
    setTimeout(() => setToast(""), 4000);
  }, []);

  const addToCart = (
    product: Product,
    variant?: { color: string; image: string },
    size?: string
  ) => {
    const cartKey = `${product.id}::${variant?.color ?? ""}::${size ?? ""}`;

    setCart((prev) => {
      const existing = prev.find((item) => item.cartKey === cartKey);
      return existing
        ? prev.map((item) => item.cartKey === cartKey ? { ...item, qty: item.qty + 1 } : item)
        : [
            ...prev,
            {
              cartKey,
              product,
              qty: 1,
              selectedColor: variant?.color,
              selectedImage: variant?.image,
              selectedSize: size,
            },
          ];
    });

    setBadgeKey((key) => key + 1);
    showToast(`${product.name} añadido al carrito`);
  };

  const toggleFavorite = (id: number) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((favorite) => favorite !== id) : [...prev, id]
    );
    setBadgeKey((key) => key + 1);
  };

  const increaseQty = (cartKey: string) =>
    setCart((prev) =>
      prev.map((item) => item.cartKey === cartKey ? { ...item, qty: item.qty + 1 } : item)
    );

  const decreaseQty = (cartKey: string) =>
    setCart((prev) =>
      prev
        .map((item) => item.cartKey === cartKey ? { ...item, qty: item.qty - 1 } : item)
        .filter((item) => item.qty > 0)
    );

  const removeFromCart = (cartKey: string) =>
    setCart((prev) => prev.filter((item) => item.cartKey !== cartKey));

  const collectionProducts = dbProducts.filter(
  (product) =>
    product.collection === collection &&
    (!selectedSubcategory || product.subcategory === selectedSubcategory)
);
  const favoriteProducts = products.filter((product) => favorites.includes(product.id));
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const handleCheckoutSubmit = async () => {
    // CORREGIDO: Eliminado customerData.gender de la lista de campos obligatorios
    const requiredFields = [
      customerData.name,
      customerData.surname,
      customerData.email,
      customerData.phone,
      customerData.address,
      customerData.city,
      customerData.postalCode,
      customerData.shippingMethod,
    ];

    if (requiredFields.some((value) => !value || !value.trim())) {
      showToast("Completa todos los datos para continuar.");
      return;
    }

    if (!customerData.acceptTerms) {
      showToast("Debes aceptar las condiciones de compra.");
      return;
    }

    if (!customerData.acknowledgePrivacy) {
      showToast("Confirma que has leído la política de privacidad.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerData.email)) {
      showToast("Introduce un correo electrónico válido.");
      return;
    }

    if (cart.length === 0) {
      showToast("Tu carrito está vacío.");
      return;
    }

    try {
      const response = await fetch("/api/pago", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: customerData,
          items: cart.map((item) => ({
            productId: item.product.id,
            qty: item.qty,
            selectedSize: item.selectedSize ?? "",
            selectedColor: item.selectedColor ?? "",
            selectedImage: item.selectedImage ?? item.product.image,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        showToast(result.error || "No se ha podido preparar el pago.");
        return;
      }

      if (typeof result.action !== "string" || !result.fields || typeof result.fields !== "object") {
        showToast("La respuesta del pago no es válida.");
        return;
      }

      const form = document.createElement("form");
      form.method = "POST";
      form.action = result.action;

      for (const [name, value] of Object.entries(result.fields)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = String(value);
        form.appendChild(input);
      }

      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      console.error("Error iniciando el pago:", error);
      showToast("No se ha podido conectar con el servicio de pago.");
    }
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

      <section className="section" id="inicio">
        <div className="sectionHeader">
          <Link href="/" className="category-link">
            ← Volver a KigobeShop
          </Link>
          <h1>{titles[collection]}</h1>
          <p>Descubre tus prendas favoritas.</p>
        </div>

       {!selectedSubcategory ? (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
      gap: 22,
    }}
  >
    {(subcategoriesByCollection[collection] || []).map((item) => (
      <button
        key={item.name}
        onClick={() => setSelectedSubcategory(item.name)}
        style={{
          border: "none",
          padding: 0,
          background: "white",
          cursor: "pointer",
          textAlign: "center",
        }}
      >
        <img
          src={item.image}
          alt={item.name}
          style={{
            width: "100%",
            height: 260,
            objectFit: "cover",
            borderRadius: 14,
          }}
        />
        <h3 style={{ marginTop: 12, color: "#30213c" }}>
          {item.name}
        </h3>
      </button>
    ))}
  </div>
) : (
  <>
    <button
      onClick={() => setSelectedSubcategory(null)}
      style={{
        marginBottom: 24,
        padding: "10px 18px",
        borderRadius: 20,
        border: "1px solid #d8b4fe",
        background: "#f3e8ff",
        color: "#6b21a8",
        cursor: "pointer",
      }}
    >
      ← Volver a las categorías
    </button>

    <h2>{selectedSubcategory}</h2>

    {collectionProducts.length ? (
      <div className="productGrid">
        {collectionProducts.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            isFavorite={favorites.includes(product.id)}
            onAddToCart={(variant, size) =>
              addToCart(product, variant, size)
            }
            onToggleFavorite={() => toggleFavorite(product.id)}
          />
        ))}
      </div>
    ) : (
      <p>Próximamente añadiremos productos a esta sección 💜</p>
    )}
  </>
)}
      </section>

      <Footer />

      {favoritesOpen && (
        <div
          onClick={() => setFavoritesOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 2000,
            background: "rgba(20,10,30,.55)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 16,
            }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 20,
              padding: 24,
              width: "100%",
              maxWidth: 900,
              maxHeight: "85vh",
              overflowY: "auto",
              color: "#30213c",
            }}
          >
            <button onClick={() => setFavoritesOpen(false)}>Cerrar ×</button>
            <h2>♡ Mis favoritos</h2>
            {favoriteProducts.length ? (
              <div className="productGrid">
                {favoriteProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    isFavorite
                    onAddToCart={(variant, size) => addToCart(product, variant, size)}
                    onToggleFavorite={() => toggleFavorite(product.id)}
                  />
                ))}
              </div>
            ) : (
              <p>Aún no tienes prendas favoritas.</p>
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
        onCheckout={() => setCheckoutOpen(true)}
      />

      {checkoutOpen && (
        <CheckoutForm
          data={customerData}
          onChange={setCustomerData}
          onClose={() => setCheckoutOpen(false)}
          onSubmit={handleCheckoutSubmit}
        />
      )}

      <div className={`toast ${toast ? "show" : ""}`}>{toast}</div>
    </main>
  );
}
