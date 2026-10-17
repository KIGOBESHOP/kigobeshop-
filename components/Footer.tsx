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
          <a href="#productos">Calzado</a>
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
          <a href="#">Envíos</a>
          <a href="#">Devoluciones</a>
          <a href="#">Guía de tallas</a>
        </div>


        <div className="footerCol">
          <h4>Empresa</h4>
         <a href="/sobre-nosotros">Sobre nosotros</a>
          <a href="/legal">Aviso legal</a>
          <a href="#">Privacidad</a>
                   <a href="#">Términos y condiciones</a>
        </div>
      </div>

      <div className="footerBottom">
        <p>© 2026 KIGOBESHOP. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
