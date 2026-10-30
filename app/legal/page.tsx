import Link from "next/link";

export default function LegalPage() {
  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 20px", fontFamily: "sans-serif", color: "#333", lineHeight: "1.6" }}>
      
      <h1 style={{ fontSize: "28px", fontWeight: "bold", borderBottom: "2px solid #000", paddingBottom: "10px", marginBottom: "30px" }}>AVISO LEGAL</h1>
      
      <p>En cumplimiento del artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSI-CE), se exponen los datos identificativos del titular del sitio web:</p>
      
      <h2 style={{ fontSize: "18px", marginTop: "20px", fontWeight: "bold" }}>1. DATOS IDENTIFICATIVOS</h2>
      <ul>
        <li><strong>Titular de la tienda:</strong> Inmaculada Yepes Expósito (KIGOBESHOP)</li>
        <li><strong>DNI/NIE:</strong>75268471M</li>
        <li><strong>Domicilio Comercial:</strong> Calle Granada, Plaza Primero de Mayo 27, 04008 Almería, España.</li>
        <li><strong>Email de contacto:</strong> KIGOBESHOP@GMAIL.COM</li>
        <li><strong>Teléfono:</strong> +34 643 885 699</li>
      </ul>

      <h2 style={{ fontSize: "18px", marginTop: "20px", fontWeight: "bold" }}>2. USO DE LA WEB Y RESPONSABILIDAD</h2>
      <p>La persona usuaria se compromete a utilizar esta web de forma responsable y conforme a la legislación aplicable. KIGOBESHOP no se hace responsable de los daños y perjuicios derivados de errores en los contenidos o falta de disponibilidad del portal.</p>

      <h2 style={{ fontSize: "18px", marginTop: "20px", fontWeight: "bold" }}>3. PRODUCTOS Y PRECIOS</h2>
      <p>Los precios mostrados en KIGOBESHOP están en Euros (€) e incluyen el Impuesto sobre el Valor Añadido (IVA) aplicable en España. Los gastos de envío se desglosarán en la pantalla de pago antes de confirmar el pedido con la empresa de transporte GLS.</p>

      <h2 style={{ fontSize: "18px", marginTop: "20px", fontWeight: "bold" }}>4. DERECHO DE DESISTIMIENTO (DEVOLUCIONES EN 14 DÍAS)</h2>
      <p>Dispones de un plazo de 14 días naturales desde la recepción de tu compra para devolverla de acuerdo con las condiciones aplicables. El producto debe encontrarse sin usar y en su etiquetado original. Los costes directos de la devolución correrán a cargo del cliente.</p>

      <div style={{ marginTop: "40px", borderTop: "1px solid #ccc", paddingTop: "20px" }}>
        <Link href="/" style={{ color: "#000", fontWeight: "bold", textDecoration: "underline" }}>
          ← Volver a KIGOBESHOP
        </Link>
      </div>
    </div>
  );
}
