import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GLS_URL = "https://ws-customer.gls-spain.es/b2b.asmx";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function unescapeXml(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

async function authenticateAdmin(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

  if (!supabaseUrl || !anonKey || !adminEmail) {
    return {
      error: NextResponse.json(
        { ok: false, message: "Falta configurar Supabase o ADMIN_EMAIL en Vercel." },
        { status: 503 }
      ),
    };
  }

  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  if (!token) {
    return {
      error: NextResponse.json(
        { ok: false, message: "Debes iniciar sesión como administradora." },
        { status: 401 }
      ),
    };
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await authClient.auth.getUser(token);

  if (error || !data.user) {
    return {
      error: NextResponse.json(
        { ok: false, message: "La sesión no es válida." },
        { status: 401 }
      ),
    };
  }

  if (data.user.email?.trim().toLowerCase() !== adminEmail) {
    return {
      error: NextResponse.json(
        { ok: false, message: "No tienes permiso para ejecutar esta acción." },
        { status: 403 }
      ),
    };
  }

  return { user: data.user };
}

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get("action");

  // Diagnóstico de pedidos: solo lectura y solo para la administradora.
  if (action === "orders-test") {
    const auth = await authenticateAdmin(request);
    if ("error" in auth) return auth.error;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { ok: false, message: "Falta SUPABASE_SERVICE_ROLE_KEY en Vercel." },
        { status: 503 }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
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

  // Comprobación básica: solo comprueba que el servidor responde.
  try {
    const response = await fetch(GLS_URL, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    return NextResponse.json({
      ok: true,
      serviceReachable: true,
      httpStatus: response.status,
      shipmentCreationEnabled: false,
      message: "Servidor GLS accesible. No se han creado expediciones.",
    });
  } catch (error) {
    console.error(
      "Error de conexión GLS:",
      error instanceof Error ? error.message : "Error desconocido"
    );

    return NextResponse.json(
      {
        ok: false,
        serviceReachable: false,
        shipmentCreationEnabled: false,
        message: "No se pudo contactar con GLS.",
      },
      { status: 502 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Esta versión solo permite una prueba ficticia. No genera envíos de pedidos reales.
    const auth = await authenticateAdmin(request);
    if ("error" in auth) return auth.error;

    const testUid = process.env.GLS_UIDCLIENTE_TEST;

    if (!testUid) {
      return NextResponse.json(
        {
          ok: false,
          message: "Falta GLS_UIDCLIENTE_TEST en Vercel.",
          shipmentCreationEnabled: false,
        },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => null);

    if (body?.action !== "shipment-test") {
      return NextResponse.json(
        {
          ok: false,
          message: 'La única acción permitida ahora es "shipment-test".',
          shipmentCreationEnabled: false,
        },
        { status: 400 }
      );
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
    const referencia = `TEST${Date.now()}`;

    // Datos ficticios de prueba. Se conserva la estructura del XML facilitado
    // en el código de trabajo anterior; no se toman datos de clientes ni pedidos.
    const docIn = `<Servicios uidcliente="${escapeXml(testUid)}" xmlns="http://www.asmred.com/">
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
      <PlazaDestino />
      <Etiqueta tipo="PDF" modo=""></Etiqueta>
    </DevuelveAdicionales>
  </Envio>
</Servicios>`;

    // docIn es un parámetro de texto SOAP: hay que escapar el XML interior.
    const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
 xmlns:xsd="http://www.w3.org/2001/XMLSchema"
 xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <GrabaServicios xmlns="http://www.asmred.com/">
      <docIn>${escapeXml(docIn)}</docIn>
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

    const match = responseXml.match(
      /<(?:[\w.-]+:)?GrabaServiciosResult\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?GrabaServiciosResult>/i
    );

    const resultXml = match ? unescapeXml(match[1]) : "";
    const shipmentMatch = resultXml.match(/<Envio\b([^>]*)>/i);
    const barcodeMatch = shipmentMatch?.[1].match(/\bcodbarras="([^"]*)"/i);
    const returnMatch = resultXml.match(
      /<Resultado\b[^>]*\breturn="([^"]*)"/i
    );

    const returnCode = returnMatch?.[1] ?? null;
    const barcode = barcodeMatch?.[1] ?? null;
    const labelReturned = /<Etiqueta\b[^>]*>[\s\S]*?<\/Etiqueta>/i.test(
      resultXml
    );
    const soapFault = /<(?:[\w.-]+:)?Fault\b/i.test(responseXml);
    const success = response.ok && !soapFault && returnCode === "0";

    return NextResponse.json({
      ok: success,
      operation: "GrabaServicios",
      httpStatus: response.status,
      reference: referencia,
      glsReturnCode: returnCode,
      barcode,
      labelReturned,
      soapFault,
      responseReceived: responseXml.length > 0,
      productionShipmentCreationEnabled: false,
      testShipmentSubmission: true,
      message: success
        ? "GLS ha aceptado el envío de prueba."
        : "GLS no ha confirmado el envío de prueba. Revisa la respuesta recibida.",
      responseExcerpt: resultXml
        ? resultXml
            .replace(
              /<Etiqueta\b[^>]*>[\s\S]*?<\/Etiqueta>/gi,
              "<Etiqueta>[omitida]</Etiqueta>"
            )
            .slice(0, 3000)
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
        productionShipmentCreationEnabled: false,
        testShipmentSubmission: true,
      },
      { status: 502 }
    );
  }
}
