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
          <a href="/legal">Política de privacidad</a>
          <a href="/legal">Términos y condiciones</a>
        </div>
      </div>

      <div className="footerBottom" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
        <p style={{ margin: 0 }}>©️ 2026 KIGOBESHOP. Todos los derechos reservados.</p>
        
        {/* ICONOS DE CONFIANZA: MÉTODOS DE PAGO Y ENVÍO */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', opacity: 0.8 }}>
          {/* Logo Visa */}
          <svg width="45" height="28" viewBox="0 0 24 24" fill="currentColor" aria-label="Visa">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-6.2 13H11l1.6-4.9h1.3L12.8 16zm4.1-3.6c-.3-.2-.7-.3-1.1-.3-.9 0-1.6.5-1.6 1.2 0 .5.5.8.8.9.4.2.5.3.5.5 0 .3-.3.4-.7.4-.5 0-.9-.1-1.2-.3l-.2-.1-.2 1.1c.3.1.8.2 1.3.2 1 0 1.6-.5 1.6-1.3 0-.6-.4-.9-.9-1.1-.3-.2-.5-.3-.5-.5 0-.2.2-.4.6-.4.4 0 .7.1.9.2l.1.1.3-1.1zm-8.2 3.6l-.9-3.9-.9 3.9h1.8zm-2.4-4.8H8l1.7 4.8h1.2l.7-4.8H10.4l-.4 2.8-.7-2.8H8.7l-.4 2.8-.4-2.8H6.3z"/>
          </svg>
          {/* Logo Mastercard */}
          <svg width="45" height="28" viewBox="0 0 24 24" fill="currentColor" aria-label="Mastercard">
            <path d="M12 17c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3zm4.5-6c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2h-1c0-2.2-1.8-4-4-4s-4 1.8-4 4h-1c-1.1 0-2-.9-2-2v-2c0-1.1.9-2 2-2h9z"/>
          </svg>
          {/* Distintivo de Pago Seguro (CECA) */}
          <span style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px', border: '1px solid currentColor', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
            CECA Secure
          </span>
          {/* Distintivo Envío GLS */}
          <span style={{ fontSize: '11px', fontWeight: 'bold', letterSpacing: '1px', border: '1px solid currentColor', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '4px' }}>
            📦 GLS Envío 24/72h
          </span>
        </div>
      </div>
    </footer>
  );
}
