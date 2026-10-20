
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
  <h3>01. Datos personales</h3>

          <label htmlFor="checkoutGender">Sexo</label>
          <select
            id="checkoutGender"
            value={data.gender}
            onChange={(e) => update("gender", e.target.value)}
            required
          >
            <option value="">Selecciona una opción</option>
            <option value="mujer">Mujer</option>
            <option value="hombre">Hombre</option>
            <option value="no-indicar">Prefiero no indicarlo</option>
          </select>

          <label htmlFor="checkoutName">Nombre</label>
          <input
            id="checkoutName"
            type="text"
            autoComplete="given-name"
            placeholder="Tu nombre"
            value={data.name}
            onChange={(e) => update("name", e.target.value)}
            required
          />

          <label htmlFor="checkoutSurname">Apellidos</label>
          <input
            id="checkoutSurname"
            type="text"
            autoComplete="family-name"
            placeholder="Tus apellidos"
            value={data.surname}
            onChange={(e) => update("surname", e.target.value)}
            required
          />

          <label htmlFor="checkoutEmail">Correo electrónico</label>
          <input
            id="checkoutEmail"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            value={data.email}
            onChange={(e) => update("email", e.target.value)}
            required
          />

          <label htmlFor="checkoutPhone">Teléfono</label>
          <input
            id="checkoutPhone"
            type="tel"
            autoComplete="tel"
            placeholder="Tu teléfono"
            value={data.phone}
            onChange={(e) => update("phone", e.target.value)}
            required
          />

          <label htmlFor="checkoutBirthDate">Fecha de nacimiento</label>
          <input
            id="checkoutBirthDate"
            type="date"
            autoComplete="bday"
            value={data.birthDate}
            onChange={(e) => update("birthDate", e.target.value)}
            required
          />

         </div>
<div className="checkoutSection">

          <label htmlFor="checkoutAddress">Dirección completa</label>
          <input
            id="checkoutAddress"
            type="text"
            autoComplete="street-address"
            placeholder="Calle, número, piso..."
            value={data.address}
            onChange={(e) => update("address", e.target.value)}
            required
          />

          <label htmlFor="checkoutCity">Ciudad</label>
          <input
            id="checkoutCity"
            type="text"
            autoComplete="address-level2"
            placeholder="Tu ciudad"
            value={data.city}
            onChange={(e) => update("city", e.target.value)}
            required
          />

          <label htmlFor="checkoutPostalCode">Código postal</label>
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
<div className="checkoutSection">

          <label className="checkoutShippingOption">
            <input
              type="radio"
              name="shippingMethod"
              value="standard"
              checked={data.shippingMethod === "standard"}
              onChange={(e) =>
                update("shippingMethod", e.target.value)
              }
              required
            />
            <span>
              <strong>Envío estándar</strong>
              <br />
              <small>El coste y el plazo se mostrarán antes de confirmar el pedido.</small>
            </span>
          </label>

        </div>
<div className="checkoutSection">

          <div className="checkoutPaymentInfo">
            <strong>Pago seguro con CECA</strong>
            <p>
              Al continuar, accederás a la pasarela segura para introducir
              los datos de tu tarjeta.
            </p>
          </div>
</div>
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
              He leído y acepto las{" "}
              <a href="/condiciones-de-compra" target="_blank" rel="noreferrer">
                condiciones de compra
              </a>.
            </span>
          </label>

          <label className="checkoutLegalOption">
            <input
              type="checkbox"
              checked={data.acknowledgePrivacy}
              onChange={(e) =>
                update("acknowledgePrivacy", e.target.checked)
              }
              required
            />
            <span>
              Confirmo que he leído la{" "}
              <a href="/politica-de-privacidad" target="_blank" rel="noreferrer">
                política de privacidad
              </a>.
            </span>
          </label>

          <button
            type="button"
            className="checkoutContinue"
            onClick={onSubmit}
          >
            </div>
            Continuar al pago seguro
          </button>
        </div>
      </div>
    </div>
  );
}
