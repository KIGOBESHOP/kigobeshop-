import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GLS_URL = "https://ws-customer.gls-spain.es/b2b.asmx";

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
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
 xmlns:xsd="http://www.w3.org/2001/XMLSchema"
 xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <GetPlazaXCP xmlns="http://www.asmred.com/">
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
          'application/soap+xml; charset=utf-8; action="http://www.asmred.com/GetPlazaXCP"',
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
    // Solo permite ejecutar la prueba a la administradora.
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const testUid = process.env.GLS_UIDCLIENTE_TEST;

    if (!supabaseUrl || !anonKey || !adminEmail || !testUid) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "Falta configurar Supabase, ADMIN_EMAIL o GLS_UIDCLIENTE_TEST en Vercel.",
        },
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

    const { data, error } = await authClient.auth.getUser(token);

    if (error || !data.user) {
      return NextResponse.json(
        { ok: false, message: "La sesión no es válida." },
        { status: 401 }
      );
    }

    if (data.user.email?.trim().toLowerCase() !== adminEmail) {
      return NextResponse.json(
        { ok: false, message: "No tienes permiso para ejecutar la prueba." },
        { status: 403 }
      );
    }

    // Evita ejecutar accidentalmente una petición distinta.
    const body = await request.json().catch(() => null);

    if (body?.action !== "shipment-test") {
      return NextResponse.json(
        {
          ok: false,
          message: 'La acción debe ser "shipment-test".',
          shipmentCreationEnabled: false,
        },
        { status: 400 }
      );
    }

    // Fecha de hoy en España, con formato DD/MM/YYYY.
    const parts = new Intl.DateTimeFormat("es-ES", {
      timeZone: "Europe/Madrid",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).formatToParts(new Date());

    const datePart = (type: string) =>
      parts.find((part) => part.type === type)?.value ?? "";

    const fecha =
      `${datePart("day")}/${datePart("month")}/${datePart("year")}`;

    // Referencia única para identificar esta prueba.
    const referencia = `TEST${Date.now()}`;

    // Envío ficticio; no utiliza ningún pedido de la tienda.
    const docIn = `<?xml version="1.0" encoding="utf-8"?>
<Servicios uidcliente="${testUid}" xmlns="http://www.asmred.com/">
  <Envio codbarras="">
    <Fecha>${fecha}</Fecha>
    <Portes>P</Portes>
    <Servicio>96</Servicio>
    <Horario>18</Horario>
    <Bultos>1</Bultos>
    <Peso>1</Peso>
    <Retorno>0</Retorno>
    <Pod>N</Pod>
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
      <Nombre><![CDATA[GLS TEST]]></Nombre>
      <Direccion><![CDATA[Calle Juan Esplandi 513b]]></Direccion>
      <Poblacion><![CDATA[Madrid]]></Poblacion>
      <Provincia><![CDATA[Madrid]]></Provincia>
      <Pais>34</Pais>
      <CP>28007</CP>
      <Telefono><![CDATA[933888777]]></Telefono>
      <Movil><![CDATA[666777888]]></Movil>
      <Email><![CDATA[test@test.com]]></Email>
      <Observaciones><![CDATA[PRUEBA TECNICA]]></Observaciones>
    </Destinatario>
    <Referencias>
      <Referencia tipo="C"><![CDATA[${referencia}]]></Referencia>
    </Referencias>
    <DevuelveAdicionales>
      <Etiqueta tipo="PDF"></Etiqueta>
    </DevuelveAdicionales>
  </Envio>
</Servicios>`;

    // docIn es texto XML dentro del sobre SOAP.
    const escapedDocIn = docIn
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
 xmlns:xsd="http://www.w3.org/2001/XMLSchema"
 xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <GrabaServicios xmlns="http://www.asmred.com/">
      <docIn>${escapedDocIn}</docIn>
    </GrabaServicios>
  </soap12:Body>
</soap12:Envelope>`;

    const response = await fetch(GLS_URL, {
      method: "POST",
      headers: {
        "Content-Type":
          'application/soap+xml; charset=utf-8; action="http://www.asmred.com/GrabaServicios"',
      },
      body: envelope,
      cache: "no-store",
      signal: AbortSignal.timeout(25000),
    });

    const responseXml = await response.text();

    // Extrae el resultado XML que GLS devuelve dentro de SOAP.
    const match = responseXml.match(
      /<GrabaServiciosResult[^>]*>([\s\S]*?)<\/GrabaServiciosResult>/i
    );

    const unescapeXml = (value: string) =>
      value
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, "&");

    const resultXml = match ? unescapeXml(match[1]) : "";
    const shipmentMatch = resultXml.match(/<Envio\b([^>]*)>/i);
    const barcodeMatch = shipmentMatch?.[1].match(
      /\bcodbarras="([^"]*)"/i
    );
    const returnMatch = resultXml.match(
      /<Resultado\b[^>]*\breturn="([^"]*)"/i
    );

    const returnCode = returnMatch?.[1] ?? null;
    const barcode = barcodeMatch?.[1] ?? null;
    const labelReturned = /<Etiqueta\b[^>]*>[\s\S]*?<\/Etiqueta>/i.test(
      resultXml
    );

    return NextResponse.json({
      ok: response.ok && returnCode === "0",
      operation: "GrabaServicios",
      httpStatus: response.status,
      reference: referencia,
      glsReturnCode: returnCode,
      barcode,
      labelReturned,
      soapFault: /<[^>]*Fault\b/i.test(responseXml),
      responseReceived: responseXml.length > 0,
      shipmentCreationEnabled: false,
      message:
        response.ok && returnCode === "0"
          ? "GLS ha aceptado el envío de prueba."
          : "GLS no ha confirmado el envío. Revisa el código de respuesta.",
      // Evitamos devolver el contenido completo de la etiqueta.
      responseExcerpt: resultXml
        ? resultXml.replace(/<Etiqueta\b[^>]*>[\s\S]*?<\/Etiqueta>/gi, "<Etiqueta>[omitida]</Etiqueta>").slice(0, 3000)
        : responseXml.slice(0, 1500),
    });
  } catch (error) {
    console.error(
      "Error en prueba GLS:",
      error instanceof Error ? error.message : "Error desconocido"
    );

    return NextResponse.json(
      {
        ok: false,
        message: "No se pudo completar la prueba de GLS.",
        shipmentCreationEnabled: false,
      },
      { status: 502 }
    );
  }
}
