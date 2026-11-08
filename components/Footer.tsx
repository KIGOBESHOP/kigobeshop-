export default function Footer() {
  return (
    <footer>
      <div className="footerGrid">
        <div className="footerBrand">
          <h2>KIGOBESHOP</h2>
          <p>Tu estilo, tus reglas. Tienda online de ropa, bolsos y accesorios juveniles. Moda urbana con personalidad.</p>
          
          <div className="footerSocial">
            <a
              href="https://www.instagram.com/kigobeshop/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram de KIGOBESHOP"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
              <span>@kigobeshop</span>
            </a>
          </div>
        </div>

        <div className="footerCol">
          <h4>Tienda</h4>
          <a href="#productos">Ropa</a>
          <a href="#productos">Bolsos</a>
          <a href="#ofertas">Ofertas</a>
        </div>

        <div className="footerCol">
          <h4>Ayuda y contacto</h4>
          <a href="mailto:kigobeshop@gmail.com">Correo electrónico</a>
          <a href="tel:+34643885699">643 885 699</a>
          <a
            href="https://wa.me/34643885699"
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp
          </a>
        </div>

        <div className="footerCol">
          <h4>Empresa</h4>
          <a href="/sobre-nosotros">Sobre nosotros</a>
         <a href="/legal">Aviso legal</a>
<a href="/privacidad">Política de privacidad</a>
<a href="/terminos">Términos y condiciones</a>
        </div>
      </div>

     
<div
  className="footerBottom"
  style={{
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "18px",
    paddingTop: "24px",
    borderTop: "1px solid rgba(255,255,255,0.15)",
  }}
>
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexWrap: "wrap",
      gap: "24px",
      width: "100%",
      background: "#F7F3EF",
      color: "#30263A",
      borderRadius: "12px",
      padding: "16px 12px",
      boxSizing: "border-box",
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
      <svg
        width="23"
        height="23"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#72518A"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
      <span style={{ fontSize: "14px", fontWeight: 600 }}>
        Pago seguro
      </span>
    </div>

    <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
      <svg
        width="23"
        height="23"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#72518A"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 7h11v11H3z" />
        <path d="M14 11h4l3 3v4h-7z" />
        <circle cx="7.5" cy="18" r="1.5" />
        <circle cx="17.5" cy="18" r="1.5" />
      </svg>
      <span style={{ fontSize: "14px", fontWeight: 600 }}>
        Envíos 24/72 h
      </span>
    </div>
  </div>

  <p style={{ margin: 0 }}>
    © 2026 KIGOBESHOP. Todos los derechos reservados.
  </p>
</div>

  );
}
