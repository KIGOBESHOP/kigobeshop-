
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
};

type CustomerData = {
  gender: string;
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
 const [customerData, setCustomerData] = useState<CustomerData>({
  gender: "",
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
          ...(p.old_price != null
            ? { oldPrice: Number(p.old_price) }
            : {}),
                    image: p.image,
          description: p.description ?? "",
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
      cartKey:
        item.cartKey ??
        `${item.product.id}::${item.selectedColor ?? ""}`,
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
    variant?: { color: string; image: string }
  ) => {
    const cartKey = `${product.id}::${variant?.color ?? ""}`;

    setCart((prev) => {
      const existing = prev.find((item) => item.cartKey === cartKey);

      return existing
        ? prev.map((item) =>
            item.cartKey === cartKey
              ? { ...item, qty: item.qty + 1 }
              : item
          )
        : [
            ...prev,
            {
              cartKey,
              product,
              qty: 1,
              selectedColor: variant?.color,
              selectedImage: variant?.image,
            },
          ];
    });

    setBadgeKey((key) => key + 1);
    showToast(`${product.name} añadido al carrito`);
  };

  const toggleFavorite = (id: number) => {
    setFavorites((prev) =>
      prev.includes(id)
        ? prev.filter((favorite) => favorite !== id)
        : [...prev, id]
    );
    setBadgeKey((key) => key + 1);
  };

  const increaseQty = (cartKey: string) =>
    setCart((prev) =>
      prev.map((item) =>
        item.cartKey === cartKey ? { ...item, qty: item.qty + 1 } : item
      )
    );

  const decreaseQty = (cartKey: string) =>
    setCart((prev) =>
      prev
        .map((item) =>
          item.cartKey === cartKey ? { ...item, qty: item.qty - 1 } : item
        )
        .filter((item) => item.qty > 0)
    );

  const removeFromCart = (cartKey: string) =>
    setCart((prev) => prev.filter((item) => item.cartKey !== cartKey));

 const collectionProducts = dbProducts.filter(
  (product) => product.collection === collection
);
  const favoriteProducts = products.filter((product) =>
    favorites.includes(product.id)
  );

  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const handleCheckoutSubmit = () => {
  const requiredFields = [
    customerData.gender,
    customerData.name,
    customerData.surname,
    customerData.email,
    customerData.phone,
    customerData.birthDate,
    customerData.address,
    customerData.city,
    customerData.postalCode,
    customerData.shippingMethod,
  ];

  if (requiredFields.some((value) => !value.trim())) {
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

  showToast(
    "Datos comprobados. El pago de esta página de colección aún está pendiente de conectar."
  );
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
                onAddToCart={(variant) => addToCart(product, variant)}
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
                    onAddToCart={(variant) => addToCart(product, variant)}
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

