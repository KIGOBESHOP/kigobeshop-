

"use client";

type CustomerData = {
  gender: string;
  name: string;
  surname: string;
  email: string;
  phone: string;
  birthDate: string;
  address: string;
  city: string;
  postalCode: string;
  shippingMethod: string;
  acceptTerms: boolean;
  acknowledgePrivacy: boolean;
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
  const update = (
    field: keyof CustomerData,
    value: string | boolean
  ) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  return (
    <div className="checkoutOverlay">
      <div className="checkoutModal">
        <button
          type="button"
          className="checkoutClose"
          onClick={onClose}
          aria-label="Cerrar formulario"
        >
          ×
        </button>

        <h2>Finalizar pedido</h2>
        <p>Completa tus datos para realizar tu compra en KigobeShop.</p>

        <div className="checkoutForm">
         
          <div className="checkoutSection">
            <h3>05. Condiciones legales</h3>

            <label className="checkoutLegalOption">
              <input
                type="checkbox"
                checked={data.acceptTerms}
                onChange={(e) => update("acceptTerms", e.target.checked)}
                required
              />
              <span>
                Acepto las{" "}
                <a
                  href="/condiciones-de-compra"
                  target="_blank"
                  rel="noreferrer"
                >
                  condiciones generales
                </a>{" "}
                y la{" "}
                <a
                  href="/politica-de-privacidad"
                  target="_blank"
                  rel="noreferrer"
                >
                  política de confidencialidad
                </a>.
              </span>
            </label>

            <div className="checkoutLegalOption">
              <strong>Privacidad de los datos del cliente</strong>
              <p>
                Los datos personales que proporciona son utilizados para
                satisfacer sus necesidades, procesar pedidos o permitirle
                el acceso a una información específica.
              </p>
            </div>

            <button
              type="button"
              className="checkoutContinue"
              onClick={onSubmit}
            >
              Continuar al pago seguro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
