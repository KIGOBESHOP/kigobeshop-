"use client";

type CustomerData = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
};

type CheckoutFormProps = {
  data: CustomerData;
  onChange: (data: CustomerData) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function CheckoutForm({
  data,
  onChange,
  onClose,
  onSubmit,
}: CheckoutFormProps) {
  const update = (field: keyof CustomerData, value: string) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  return (
    <div className="checkoutOverlay">
      <div className="checkoutModal">
        <button className="checkoutClose" onClick={onClose}>
          ×
        </button>

        <h2>Finalizar pedido</h2>
        <p>Introduce tus datos para preparar tu pedido.</p>

        <div className="checkoutForm">
          <input
            type="text"
            placeholder="Nombre y apellidos"
            value={data.name}
            onChange={(e) => update("name", e.target.value)}
          />

          <input
            type="email"
            placeholder="Email"
            value={data.email}
            onChange={(e) => update("email", e.target.value)}
          />

          <input
            type="tel"
            placeholder="Teléfono"
            value={data.phone}
            onChange={(e) => update("phone", e.target.value)}
          />

          <input
            type="text"
            placeholder="Dirección"
            value={data.address}
            onChange={(e) => update("address", e.target.value)}
          />

          <input
            type="text"
            placeholder="Ciudad"
            value={data.city}
            onChange={(e) => update("city", e.target.value)}
          />

          <input
            type="text"
            placeholder="Código postal"
            value={data.postalCode}
            onChange={(e) => update("postalCode", e.target.value)}
          />

          <button className="checkoutContinue" onClick={onSubmit}>
            Continuar con el pago
          </button>
        </div>
      </div>
    </div>
  );
}