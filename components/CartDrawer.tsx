
type CartItem = {
  cartKey: string;
  selectedColor?: string;
  selectedImage?: string;
  selectedSize?: string;
  product: {
    id: number;
    name: string;
    price: number;
    image: string;
  };
  qty: number;
};

type Props = {
  open: boolean;
  items: CartItem[];
  onClose: () => void;
  onIncrease: (cartKey: string) => void;
  onDecrease: (cartKey: string) => void;
  onRemove: (cartKey: string) => void;
  onCheckout: () => void;
};

export default function CartDrawer({
  open,
  items,
  onClose,
  onIncrease,
  onDecrease,
  onRemove,
  onCheckout,
}: Props) {
  const total = items.reduce(
    (sum, item) => sum + item.product.price * item.qty,
    0
  );

  return (
    <>
      <div
        className={`overlay ${open ? "open" : ""}`}
        onClick={onClose}
      />

      <aside className={`cartDrawer ${open ? "open" : ""}`}>
        <div className="cartHeader">
          <h3>
            Carrito <span>({items.reduce((sum, item) => sum + item.qty, 0)})</span>
          </h3>

          <button
            className="closeBtn"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              width="22"
              height="22"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="cartItems">
          {items.length === 0 ? (
            <div className="cartEmpty">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <p>Tu carrito está vacío</p>
              <p style={{ fontSize: 13, marginTop: 6 }}>
                Añade productos para empezar tu compra.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div className="cartItem" key={item.cartKey}>
                <div className="cartItemImg">
                  <img
                    src={item.selectedImage || item.product.image}
                    alt={item.product.name}
                  />
                </div>

                <div className="cartItemInfo">
                  <span className="cartItemName">
                    {item.product.name}
                  </span>
                  {item.selectedSize && (
  <span style={{ display: "block", fontSize: 13, marginTop: 4 }}>
    Talla: {item.selectedSize}
  </span>
)}

                  {item.selectedColor && (
                    <span style={{ display: "block", fontSize: 13, marginTop: 4 }}>
                      Color: {item.selectedColor}
                    </span>
                  )}

                  <span className="cartItemPrice">
                    {item.product.price.toFixed(2)} €
                  </span>

                  <div className="qtyControls">
                    <button
                      className="qtyBtn"
                      onClick={() => onDecrease(item.cartKey)}
                    >
                      −
                    </button>

                    <span className="qtyNum">{item.qty}</span>

                    <button
                      className="qtyBtn"
                      onClick={() => onIncrease(item.cartKey)}
                    >
                      +
                    </button>

                    <button
                      className="removeItem"
                      onClick={() => onRemove(item.cartKey)}
                      aria-label="Eliminar"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {items.length > 0 && (
          <div className="cartFooter">
            <div className="cartTotal">
              <span>Total</span>
              <strong>{total.toFixed(2)} €</strong>
            </div>

            <button className="checkoutBtn" onClick={onCheckout}>
              Finalizar compra
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                width="18"
                height="18"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
