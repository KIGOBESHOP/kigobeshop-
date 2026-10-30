import React from 'react';

export default function Legal() {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', fontFamily: 'sans-serif', color: '#333', lineHeight: '1.6' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '40px', color: '#000' }}>Textos Legales KigobeShop</h1>
      
      {/* --- AVISO LEGAL --- */}
      <section style={{ marginBottom: '40px', borderBottom: '1px solid #eee', paddingBottom: '30px' }}>
        <h2 style={{ color: '#555' }}>1. AVISO LEGAL</h2>
        <p><strong>Datos Identificativos:</strong> En cumplimiento con el deber de información recogido en el artículo 10 de la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y del Comercio Electrónico (LSSI-CE), se reflejan los siguientes datos:</p>
        <ul>
          <li><strong>Titular de la web:</strong> Inmaculada Yepes Expósito</li>
          <li><strong>NIF:</strong> 75268471M</li>
          <li><strong>Domicilio comercial / Recogida:</strong> Calle Granada, Plaza Primero de Mayo 27, 04008 Almería</li>
          <li><strong>Domicilio fiscal / Facturación:</strong> C/ Granada, 281, Almería</li>
          <li><strong>Correo electrónico de contacto:</strong> kigobeshop@gmail.com</li>
          <li><strong>Nombre comercial:</strong> KigobeShop / Kigobe24h</li>
        </ul>
        <p><strong>Condiciones de Uso:</strong> El acceso y/o uso de este portal de KigobeShop atribuye la condición de USUARIO, que acepta, desde dicho acceso y/o uso, las Condiciones Generales de Uso aquí reflejadas.</p>
        <p><strong>Propiedad Intelectual:</strong> Inmaculada Yepes Expósito es titular de todos los derechos de propiedad intelectual e industrial de su página web, así como de los elementos contenidos en la misma (imágenes, logotipos, textos, marcas, etc.). Queda expresamente prohibida la reproducción o distribución de los mismos sin autorización expresa.</p>
      </section>

      {/* --- POLÍTICA DE PRIVACIDAD --- */}
      <section style={{ marginBottom: '40px', borderBottom: '1px solid #eee', paddingBottom: '30px' }}>
        <h2 style={{ color: '#555' }}>2. POLÍTICA DE PRIVACIDAD</h2>
        <p><strong>Responsable del Tratamiento:</strong> Inmaculada Yepes Expósito (75268471M), con domicilio en Calle Granada, Plaza Primero de Mayo 27, 04008 Almería. Email: kigobeshop@gmail.com.</p>
        <p><strong>Finalidad de los datos:</strong> En KigobeShop recogemos los datos personales que nos facilitas al realizar una compra (nombre, apellidos, dirección, código postal, ciudad, teléfono y correo electrónico). La finalidad es única y exclusivamente gestionar y procesar tus pedidos, así como enviarte las actualizaciones del estado de tu envío.</p>
        <p><strong>Legitimación:</strong> La base legal para el tratamiento de tus datos es la ejecución del contrato de compraventa al adquirir nuestros productos.</p>
        <p><strong>Destinatarios:</strong> Tus datos no se cederán a terceros en ningún caso, salvo obligación legal. Para poder entregarte los pedidos, compartiremos tus datos de envío de forma segura con la empresa de transporte <strong>GLS (General Logistics Systems Spain S.A.)</strong>. Los datos se almacenan en servidores seguros dentro de la Unión Europea facilitados por nuestro proveedor de base de datos <strong>Supabase</strong>.</p>
        <p><strong>Derechos:</strong> Tienes derecho a acceder, rectificar, limitar o borrar tus datos personales en cualquier momento. Para ejercer estos derechos, puedes enviar un correo electrónico a kigobeshop@gmail.com adjuntando una copia de tu documento de identidad.</p>
      </section>

      {/* --- TÉRMINOS Y CONDICIONES --- */}
      <section style={{ marginBottom: '20px' }}>
        <h2 style={{ color: '#555' }}>3. TÉRMINOS Y CONDICIONES DE COMPRA</h2>
        <p><strong>Precios y Pagos:</strong> Todos los precios de los bolsos expuestos en KigobeShop están indicados en euros (€) e incluyen los impuestos aplicables (IVA). Los métodos de pago aceptados son Tarjeta de Crédito/Débito y Bizum a través de nuestra pasarela de pago segura.</p>
        <p><strong>Envíos:</strong> Los envíos se gestionan a través de la empresa de transportes <strong>GLS</strong>. El plazo de entrega estimado en la Península es de 24 a 48 horas laborables desde que el pedido sale de nuestro almacén.</p>
        <p><strong>Derecho de Desistimiento y Devoluciones:</strong> De acuerdo con la normativa europea, dispones de un plazo de <strong>14 días naturales</strong> desde la recepción del producto para devolverlo sin necesidad de justificación.</p>
        <ul>
          <li>El bolso debe estar en perfecto estado, sin usar y en su embalaje original.</li>
          <li>Los gastos de envío de la devolución correrán a cargo del comprador, salvo tara o defecto de fabricación.</li>
          <li>Para iniciar una devolución, escrébenos a kigobeshop@gmail.com.</li>
        </ul>
      </section>
    </div>
  );
}
