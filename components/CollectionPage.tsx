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

export default function CollectionPage({ collection }: Props) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [dbProductsLoaded, setDbProductsLoaded] = useState(false);
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
      } finaly {
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

  const collectionProducts = dbProducts.filter((product) => product.collection === collection);
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

        {collectionProducts.length ? (
          <div className="productGrid">
            {collectionProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isFavorite={favorites.includes(product.id)}
                onAddToCart={(variant, size) => addToCart(product, variant, size)}
                onToggleFavorite={() => toggleFavorite(product.id)}
              />
            ))}
          </div>
        ) : (
          <p>Estamos preparando esta colección. ¡Muy pronto habrá novedades!</p>
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
