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
        <p>
          Completa tus datos para realizar tu compra en KigobeShop.
        </p>

        <div className="checkoutForm">
          {/* 01. Datos personales */}
          <div className="checkoutSection">
            <h3>01. Datos personales</h3>

            {/* CORREGIDO: Se elimina por completo el campo "Sexo" para cumplir con la minimización de datos del RGPD */}
            <div style={{ marginBottom: "15px", display: "flex", flexDirection: "column" }}>
              <label htmlFor="checkoutName" style={{ fontWeight: "bold", marginBottom: "5px" }}>Nombre</label>
              <input
                id="checkoutName"
                type="text"
                autoComplete="given-name"
                placeholder="Tu nombre"
                value={data.name}
                onChange={(e) => update("name", e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: "15px", display: "flex", flexDirection: "column" }}>
              <label htmlFor="checkoutSurname" style={{ fontWeight: "bold", marginBottom: "5px" }}>Apellidos</label>
              <input
                id="checkoutSurname"
                type="text"
                autoComplete="family-name"
                placeholder="Tus apellidos"
                value={data.surname}
                onChange={(e) => update("surname", e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: "15px", display: "flex", flexDirection: "column" }}>
              <label htmlFor="checkoutEmail" style={{ fontWeight: "bold", marginBottom: "5px" }}>Correo electrónico</label>
              <input
                id="checkoutEmail"
                type="email"
                autoComplete="email"
                placeholder="tu@email.com"
                value={data.email}
                onChange={(e) => update("email", e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: "15px", display: "flex", flexDirection: "column" }}>
              <label htmlFor="checkoutPhone" style={{ fontWeight: "bold", marginBottom: "5px" }}>Teléfono</label>
              <input
                id="checkoutPhone"
                type="tel"
                autoComplete="tel"
                placeholder="Tu teléfono"
                value={data.phone}
                onChange={(e) => update("phone", e.target.value)}
                required
              />
            </div>
          </div>

          {/* 02. Dirección de envío */}
          <div className="checkoutSection">
            <h3>02. Dirección de envío</h3>

            <div style={{ marginBottom: "15px", display: "flex", flexDirection: "column" }}>
              <label htmlFor="checkoutAddress" style={{ fontWeight: "bold", marginBottom: "5px" }}>Dirección completa</label>
              <input
                id="checkoutAddress"
                type="text"
                autoComplete="street-address"
                placeholder="Calle, número, piso..."
                value={data.address}
                onChange={(e) => update("address", e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: "15px", display: "flex", flexDirection: "column" }}>
              <label htmlFor="checkoutCity" style={{ fontWeight: "bold", marginBottom: "5px" }}>Ciudad</label>
              <input
                id="checkoutCity"
                type="text"
                autoComplete="address-level2"
                placeholder="Tu ciudad"
                value={data.city}
                onChange={(e) => update("city", e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: "15px", display: "flex", flexDirection: "column" }}>
              <label htmlFor="checkoutPostalCode" style={{ fontWeight: "bold", marginBottom: "5px" }}>Código postal</label>
              <input
                id="checkoutPostalCode"
                type="text"
                autoComplete="postal-code"
                placeholder="Código postal"
                value={data.postalCode}
                onChange={(e) => update("postalCode", e.target.value)}
                required
              />
            </div>
          </div>

          {/* 03. Método de envío */}
          <div className="checkoutSection">
            <h3>03. Método de envío</h3>
            <label className="checkoutShippingOption" style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
              <input
                type="radio"
                name="shippingMethod"
                value="standard"
                checked={data.shippingMethod === "standard"}
                onChange={(e) => update("shippingMethod", e.target.value)}
                required
              />
              <span>
                <strong>Envío estándar</strong>
                <br />
                <small>El coste y el plazo se mostrarán antes de confirmar el pedido.</small>
              </span>
            </label>
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

            {/* CORREGIDO: Alineación perfecta de casillas y actualización de rutas a /legal */}
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

            {/* CORREGIDO: Se elimina el <p> que rompía la estructura visual */}
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
