
"use client";

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

type CheckoutFormProps = {
  data: CustomerData;
  subtotal?: number;
  onChange: (data: CustomerData) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export default function CheckoutForm({
  data,
  subtotal = 0,
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

  const isPickup = data.shippingMethod === "pickup";
  const isFreeStandard = subtotal >= 50;

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
          {/* 01. Datos personales */}
          <div className="checkoutSection">
            <h3>01. Datos personales</h3>

            {[
              { id: "checkoutName", field: "name", label: "Nombre", placeholder: "Tu nombre", autoComplete: "given-name", type: "text" },
              { id: "checkoutSurname", field: "surname", label: "Apellidos", placeholder: "Tus apellidos", autoComplete: "family-name", type: "text" },
              { id: "checkoutEmail", field: "email", label: "Correo electrónico", placeholder: "tu@email.com", autoComplete: "email", type: "email" },
              { id: "checkoutPhone", field: "phone", label: "Teléfono", placeholder: "Tu teléfono", autoComplete: "tel", type: "tel" },
            ].map((item) => (
              <div key={item.id} style={{ marginBottom: "15px", display: "flex", flexDirection: "column" }}>
                <label htmlFor={item.id} style={{ fontWeight: "bold", marginBottom: "5px" }}>
                  {item.label}
                </label>
                <input
                  id={item.id}
                  type={item.type}
                  autoComplete={item.autoComplete}
                  placeholder={item.placeholder}
                  value={data[item.field as keyof CustomerData] as string}
                  onChange={(e) => update(item.field as keyof CustomerData, e.target.value)}
                  required
                />
              </div>
            ))}
          </div>

          {/* 02. Dirección de envío o recogida */}
          {isPickup ? (
            <div className="checkoutSection">
              <h3>02. Recogida en tienda</h3>
              <div style={{ padding: "16px", background: "#F5EEFC", borderRadius: "12px", border: "1px solid #E3D4F5" }}>
                <strong>Recogida gratuita en Kigobe 24h</strong>
                <p style={{ marginBottom: 0 }}>
                  Calle Granada, Plaza Primero de Mayo 27, Almería.
                </p>
              </div>
            </div>
          ) : (
            <div className="checkoutSection">
              <h3>02. Dirección de envío</h3>

              {[
                { id: "checkoutAddress", field: "address", label: "Dirección completa", placeholder: "Calle, número, piso...", autoComplete: "street-address" },
                { id: "checkoutCity", field: "city", label: "Ciudad", placeholder: "Tu ciudad", autoComplete: "address-level2" },
                { id: "checkoutPostalCode", field: "postalCode", label: "Código postal", placeholder: "Código postal", autoComplete: "postal-code" },
              ].map((item) => (
                <div key={item.id} style={{ marginBottom: "15px", display: "flex", flexDirection: "column" }}>
                  <label htmlFor={item.id} style={{ fontWeight: "bold", marginBottom: "5px" }}>
                    {item.label}
                  </label>
                  <input
                    id={item.id}
                    type="text"
                    autoComplete={item.autoComplete}
                    placeholder={item.placeholder}
                    value={data[item.field as keyof CustomerData] as string}
                    onChange={(e) => update(item.field as keyof CustomerData, e.target.value)}
                    required
                  />
                </div>
              ))}
            </div>
          )}

          {/* 03. Método de envío */}
          <div className="checkoutSection">
            <h3>03. Método de envío</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <label className="checkoutShippingOption" style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "14px", border: data.shippingMethod === "standard" ? "2px solid #8052B8" : "1px solid #ddd", borderRadius: "12px", background: data.shippingMethod === "standard" ? "#F8F3FD" : "white", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="shippingMethod"
                  value="standard"
                  checked={data.shippingMethod === "standard"}
                  onChange={(e) => update("shippingMethod", e.target.value)}
                />
                <span>
                  <strong>GLS Estándar</strong>
                  <br />
                  <small>Plazo orientativo: 48/72 h</small>
                  <br />
                  <strong style={{ color: "#7545A8" }}>
                    {isFreeStandard ? "GRATIS" : "4,90 €"}
                  </strong>
                  <br />
                  <small>Gratis en compras desde 50 €</small>
                </span>
              </label>

              <label className="checkoutShippingOption" style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "14px", border: data.shippingMethod === "premium" ? "2px solid #8052B8" : "1px solid #ddd", borderRadius: "12px", background: data.shippingMethod === "premium" ? "#F8F3FD" : "white", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="shippingMethod"
                  value="premium"
                  checked={data.shippingMethod === "premium"}
                  onChange={(e) => update("shippingMethod", e.target.value)}
                />
                <span>
                  <strong>GLS Premium</strong>
                  <br />
                  <small>Plazo orientativo: 24/48 h</small>
                  <br />
                  <strong style={{ color: "#7545A8" }}>6,90 €</strong>
                </span>
              </label>

              <label className="checkoutShippingOption" style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "14px", border: data.shippingMethod === "pickup" ? "2px solid #8052B8" : "1px solid #ddd", borderRadius: "12px", background: data.shippingMethod === "pickup" ? "#F8F3FD" : "white", cursor: "pointer" }}>
                <input
                  type="radio"
                  name="shippingMethod"
                  value="pickup"
                  checked={data.shippingMethod === "pickup"}
                  onChange={(e) => update("shippingMethod", e.target.value)}
                />
               
<div>
  <strong>Recogida local gratuita 💜</strong>
  <br />
  <strong style={{ color: "#7545A8" }}>GRATIS</strong>
  <p style={{
    margin: "8px 0 0",
    fontSize: "13px",
    lineHeight: "1.5",
    color: "#666"
  }}>
    Tu pedido no estará listo de inmediato.
    Recibirás un mensaje de confirmación en cuanto
    esté preparado para que puedas pasar a recogerlo.
  </p>
</div>

              </label>
            </div>

            <p style={{ fontSize: "12px", color: "#777", marginTop: "12px" }}>
             Los plazos de entrega son de 24/48 h para Premium y 48/72 h para Estándar.
            </p>
          </div>

          {/* 04. Pago */}
          <div className="checkoutSection">
            <h3>04. Pago</h3>
            <div className="checkoutPaymentInfo">
              <strong>Pago seguro con CECA</strong>
              <p>Al continuar, accederás a la pasarela segura para introducir los datos de tu tarjeta.</p>
            </div>
          </div>

          {/* 05. Condiciones legales */}
          <div className="checkoutSection">
            <h3>05. Condiciones legales</h3>

            <label className="checkoutLegalOption" style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "15px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={data.acceptTerms}
                onChange={(e) => update("acceptTerms", e.target.checked)}
                required
                style={{ marginTop: "4px" }}
              />
              <span style={{ fontSize: "14px", lineHeight: "1.4" }}>
                Acepto las{" "}
                <a href="/legal" target="_blank" rel="noreferrer" style={{ textDecoration: "underline", fontWeight: "600" }}>
                  condiciones generales
                </a>{" "}
                y la{" "}
                <a href="/legal" target="_blank" rel="noreferrer" style={{ textDecoration: "underline", fontWeight: "600" }}>
                  política de confidencialidad
                </a>.
              </span>
            </label>

            <label className="checkoutLegalOption" style={{ display: "flex", gap: "10px", alignItems: "flex-start", marginBottom: "25px", cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={data.acknowledgePrivacy}
                onChange={(e) => update("acknowledgePrivacy", e.target.checked)}
                required
                style={{ marginTop: "4px" }}
              />
              <span style={{ fontSize: "14px", lineHeight: "1.4" }}>
                <strong>Privacidad de los datos del cliente:</strong> He leído la{" "}
                <a href="/legal" target="_blank" rel="noreferrer" style={{ textDecoration: "underline", fontWeight: "600" }}>
                  política de privacidad
                </a>{" "}
                y acepto el tratamiento de mis datos para gestionar mi pedido.
              </span>
            </label>

            <button
              type="button"
              className="checkoutContinue"
              onClick={onSubmit}
              style={{ width: "100%", padding: "12px", cursor: "pointer" }}
            >
              Continuar al pago seguro
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
