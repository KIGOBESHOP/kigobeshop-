import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GLS_URL = "https://gls-spain.es";

function escapeXml(value: string): string {
  return (value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get("action");

  // Diagnóstico de pedidos: solo lectura y solo para la administradora.
  if (action === "orders-test") {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

    if (!supabaseUrl || !anonKey || !serviceKey || !adminEmail) {
      return NextResponse.json(
        { ok: false, message: "Falta configurar Supabase o ADMIN_EMAIL en Vercel." },
        { status: 503 }
      );
    }

    const authorization = request.headers.get("authorization");
    const token = authorization?.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";

    if (!token) {
      return NextResponse.json(
        { ok: false, message: "Debes iniciar sesión como administradora." },
        { status: 401 }
      );
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: authData, error: authError } =
      await authClient.auth.getUser(token);

    if (authError || !authData.user) {
      return NextResponse.json(
        { ok: false, message: "La sesión no es válida." },
        { status: 401 }
      );
    }

    if (authData.user.email?.trim().toLowerCase() !== adminEmail) {
      return NextResponse.json(
        { ok: false, message: "No tienes permiso para consultar los pedidos." },
        { status: 403 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: orders, error } = await supabase
      .from("orders")
      .select(
        "id, customer_name, customer_surname, customer_address, customer_city, customer_postal_code, shipping_method, payment_status, gls_status"
      )
      .eq("payment_status", "paid")
      .limit(5);

    if (error) {
      console.error("Error de diagnóstico GLS:", error);
      return NextResponse.json(
        { ok: false, message: "No se pudieron consultar los pedidos." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      mode: "read-only",
      shipmentCreationEnabled: false,
      paidOrdersFound: orders?.length ?? 0,
      orders: (orders ?? []).map((order) => ({
        id: order.id,
        hasRecipient: Boolean(order.customer_name),
        hasAddress: Boolean(order.customer_address),
        hasCity: Boolean(order.customer_city),
        hasPostalCode: Boolean(order.customer_postal_code),
        shippingMethod: order.shipping_method,
        glsStatus: order.gls_status,
      })),
    });
  }

  // Las comprobaciones de conexión con GLS sí necesitan el identificador del cliente.
  const uidCliente = process.env.GLS_UIDCLIENTE;

  if (!uidCliente) {
    return NextResponse.json(
      { ok: false, message: "Falta GLS_UIDCLIENTE en Vercel." },
      { status: 500 }
    );
  }

  // Comprobación básica de conexión.
  if (action !== "soap-test") {
    try {
      const response = await fetch(GLS_URL, {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });

      return NextResponse.json({
        ok: true,
        uidConfigured: true,
        serviceReachable: true,
        httpStatus: response.status,
        shipmentCreationEnabled: false,
        message: "Servidor GLS accesible. No se han creado expediciones.",
      });
    } catch {
      return NextResponse.json({
        ok: false,
        uidConfigured: true,
        serviceReachable: false,
        message: "No se pudo contactar con GLS.",
      });
    }
  }

  // Consulta SOAP de lectura: no crea expediciones.
  const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://w3.org"
 xmlns:xsd="http://w3.org"
 xmlns:soap12="http://w3.org">
  <soap12:Body>
    <GetPlazaXCP xmlns="http://asmred.com">
      <codPais>34</codPais>
      <cp>08338</cp>
    </GetPlazaXCP>
  </soap12:Body>
</soap12:Envelope>`;

  try {
    const response = await fetch(GLS_URL, {
      method: "POST",
      headers: {
        "Content-Type":
          'application/soap+xml; charset=utf-8; action="http://asmred.comGetPlazaXCP"',
      },
      body: envelope,
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

    const xml = await response.text();

    return NextResponse.json({
      ok: response.ok,
      uidConfigured: true,
      soapResponded: true,
      httpStatus: response.status,
      operation: "GetPlazaXCP",
      responseReceived: xml.length > 0,
      soapFault: /<[^>]*Fault\b/i.test(xml),
      resultPresent: /GetPlazaXCPResult/.test(xml),
      shipmentCreationEnabled: false,
      message: response.ok
        ? "GLS respondió a la petición SOAP."
        : "GLS respondió con un estado HTTP de error.",
    });
  } catch {
    return NextResponse.json({
      ok: false,
      uidConfigured: true,
      soapResponded: false,
      message: "No se pudo completar la petición SOAP.",
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const uidCliente = process.env.GLS_UIDCLIENTE;

    if (!supabaseUrl || !anonKey || !serviceKey || !adminEmail || !uidCliente) {
      return NextResponse.json(
        {
          ok: false,
          message: "Falta configurar dependencias esenciales (Supabase, EMAIL o GLS_UIDCLIENTE) en Vercel.",
        },
        { status: 503 }
      );
    }

    const authorization = request.headers.get("authorization");
    const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";

    if (!token) {
      return NextResponse.json({ ok: false, message: "Debes iniciar sesión como administradora." }, { status: 401 });
    }

    const authClient = createClient(supabaseUrl, anonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: authError } = await authClient.auth.getUser(token);

    if (authError || !userData.user) {
      return NextResponse.json({ ok: false, message: "La sesión no es válida." }, { status: 401 });
    }

    if (userData.user.email?.trim().toLowerCase() !== adminEmail) {
      return NextResponse.json({ ok: false, message: "No tienes permiso para ejecutar esta acción." }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    
    // Permitir tanto test manual como envíos de pedidos reales
    const isTest = body?.action === "shipment-test";
    const orderId = body?.orderId;

    if (!isTest && !orderId) {
      return NextResponse.json({ ok: false, message: "Falta el parámetro orderId o una acción válida." }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    
    // Definición de variables para el envío
    let destinatarioNombre = "GLS TEST";
    let destinatarioDireccion = "Calle Juan Esplandi 513b";
    let destinatarioPoblacion = "Madrid";
    let destinatarioProvincia = "Madrid";
    let destinatarioCP = "28007";
    let destinatarioTelefono = "933888777";
    let destinatarioEmail = "test@test.com";
    let referencia = `TEST${Date.now()}`;

    // Si pasamos un orderId válido, extraemos la información real de Supabase
    if (orderId) {
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (orderError || !order) {
        return NextResponse.json({
          ok: false,
          message: `No se encontró el pedido con ID: ${orderId}`
        }, { status: 404 });
      }

      if (orderError || !order) {
  return NextResponse.json({
    ok: false,
    message: "Pedido no encontrado"
  }, { status: 404 });
}

if (!isTest && order.payment_status !== "paid") {
  return NextResponse.json({
    ok: false,
    message: "No se puede generar un envío: el pedido no está pagado."
  }, { status: 409 });
}

if (
  !isTest &&
  (order.shipping_barcode || order.gls_status === "generado")
) {
  return NextResponse.json({
    ok: false,
    message: "Este pedido ya tiene un envío GLS generado.",
    barcode: order.shipping_barcode
  }, { status: 409 });
}

if (
  !isTest &&
  (
    !order.customer_name ||
    !order.customer_address ||
    !order.customer_city ||
    !order.customer_postal_code
  )
) {
  return NextResponse.json({
    ok: false,
    message: "Faltan datos obligatorios del destinatario."
  }, { status: 400 });
}


      destinatarioNombre = `${order.customer_name} ${order.customer_surname || ""}`.trim();
      destinatarioDireccion = order.customer_address;
      destinatarioPoblacion = order.customer_city;
      destinatarioProvincia = order.customer_provincia || order.customer_city;
      destinatarioCP = order.customer_postal_code;
      destinatarioTelefono = order.customer_phone || "666777888";
      destinatarioEmail = order.customer_email || "info@kigobeshop.com";
      referencia = `PEDIDO-${order.id}`;
    }

    const parts = new Intl.DateTimeFormat("es-ES", {
      timeZone: "Europe/Madrid",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).formatToParts(new Date());

    const datePart = (type: string) =>
      parts.find((part) => part.type === type)?.value ?? "";

    const fecha = `${datePart("day")}/${datePart("month")}/${datePart("year")}`;

    const docIn = `<Servicios uidcliente="${uidCliente}" xmlns="http://asmred.com">
  <Envio codbarras="">
    <Fecha>${fecha}</Fecha>
    <Portes>P</Portes>
    <Servicio>96</Servicio>
    <Horario>18</Horario>
    <Bultos>1</Bultos>
    <Peso>1</Peso>
    <Volumen></Volumen>
    <Declarado></Declarado>
    <DNINomb></DNINomb>
    <FechaPrevistaEntrega></FechaPrevistaEntrega>
    <Retorno>0</Retorno>

    <Pod>N</Pod>
    <PODObligatorio>N</PODObligatorio>

    <Remite>
      <Plaza></Plaza>
      <Nombre><![CDATA[KigobeShop]]></Nombre>
      <Direccion><![CDATA[Calle Granada, Plaza Primero de Mayo 27]]></Direccion>
      <Poblacion><![CDATA[Almería]]></Poblacion>
      <Provincia><![CDATA[Almería]]></Provincia>
      <Pais>34</Pais>
      <CP>04008</CP>
      <Email><![CDATA[kigobeshop@gmail.com]]></Email>
    </Remite>
    <Destinatario>
      <Codigo></Codigo>
      <Plaza></Plaza>
      <Nombre><![CDATA[${escapeXml(destinatarioNombre)}]]></Nombre>
      <Direccion><![CDATA[${escapeXml(destinatarioDireccion)}]]></Direccion>
      <Poblacion><![CDATA[${escapeXml(destinatarioPoblacion)}]]></Poblacion>
      <Provincia><![CDATA[${escapeXml(destinatarioProvincia)}]]></Provincia>
      <Pais>34</Pais>
      <CP>${escapeXml(destinatarioCP)}</CP>
      <Telefono><![CDATA[${escapeXml(destinatarioTelefono)}]]></Telefono>
      <Movil><![CDATA[${escapeXml(destinatarioTelefono)}]]></Movil>
      <Email><![CDATA[${escapeXml(destinatarioEmail)}]]></Email>
      <Observaciones><![CDATA[${isTest ? 'PRUEBA TECNICA' : 'ENTREGA TIENDA ONLINE'}]]></Observaciones>
    </Destinatario>
    <Referencias>
      <Referencia tipo="C"><![CDATA[${referencia}]]></Referencia>
    </Referencias>
    <DevuelveAdicionales>
      <PlazaDestino />
    </DevuelveAdicionales>
  </Envio>
</Servicios>`;

    const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://w3.org"
 xmlns:xsd="http://w3.org"
 xmlns:soap12="http://w3.org">
  <soap12:Body>
    <GrabaServicios xmlns="http://asmred.com">
      <docIn>${docIn}</docIn>
    </GrabaServicios>
  </soap12:Body>
</soap12:Envelope>`;

    const response = await fetch(GLS_URL, {
      method: "POST",
      headers: {
        "Content-Type": 'application/soap+xml; charset=utf-8; action="http://asmred.comGrabaServicios"',
      },
      body: envelope,
      cache: "no-store",
      signal: AbortSignal.timeout(25000),
    });

    const responseXml = await response.text();

   const match = responseXml.match(/<GrabaServiciosResult[^>]*>([\s\S]*?)<\/GrabaServiciosResult>/i);
    const unescapeXml = (value: string) =>
      value
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, "&");

    const resultXml = match ? unescapeXml(match[1]) : "";
    const shipmentMatch = resultXml.match(/<Envio\b([^>]*)>/i);
    const barcodeMatch = shipmentMatch ? shipmentMatch[1].match(/\bcodbarras="([^"]*)"/i) : null;
   const returnMatch = resultXml.match(/<Resultado\b[^>]*\breturn="([^"]*)"/i);

    const returnCode = returnMatch ? returnMatch[1] : null;
    const barcode = barcodeMatch ? barcodeMatch[1] : null;
   const labelReturned = /<Etiqueta\b[^>]*>[\s\S]*?<\/Etiqueta>/i.test(resultXml);

    const isSuccess = response.ok && returnCode === "0";

    if (isSuccess && orderId) {
      await supabase
        .from("orders")
        .update({ 
          gls_status: "generado", 
          shipping_barcode: barcode 
        })
        .eq("id", orderId);
    }

    return NextResponse.json({
      ok: isSuccess,
      operation: "GrabaServicios",
      httpStatus: response.status,
      reference: referencia,
      glsReturnCode: returnCode,
      barcode,
      labelReturned,
      soapFault: /<[^>]*Fault\b/i.test(responseXml),
      responseReceived: responseXml.length > 0,
      shipmentCreationEnabled: !isTest,
      message: isSuccess
          ? "GLS ha aceptado y procesado el envío correctamente."
          : "GLS no ha confirmado el envío. Revisa los datos de destino u origen.",
      responseExcerpt: resultXml
  ? resultXml.replace(/<Etiqueta\b[^>]*>[\s\S]*?<\/Etiqueta>/gi, "<Etiqueta>[omitida]</Etiqueta>").slice(0, 3000)
  : responseXml.slice(0, 1500),
    });
  } catch (error) {
    console.error("Error en procesamiento GLS:", error instanceof Error ? error.message : "Error desconocido");
    return NextResponse.json({ ok: false, message: "No se pudo procesar la petición con GLS." }, { status: 502 });
  }
}
