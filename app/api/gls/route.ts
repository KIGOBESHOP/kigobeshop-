import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Dirección confirmada en el manual específico facilitado por GLS.
const GLS_URL = "https://ws-customer.gls-spain.es/b2b.asmx";
// Configuración de producción GLS.
// La creación de expediciones permanece bloqueada hasta confirmar los datos.
const GLS_PRODUCTION_ENABLED = false;
const GLS_SERVICES = {
  standard: {
    serviceCode: "96",
    scheduleCode: "18",
    name: "BusinessParcel",
  },
} as const;
function getGLSProductionUid(): string {
  return process.env.GLS_UIDCLIENTE?.trim() ?? "";
}
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
function getProvinceFromPostalCode(postalCode: string): string | null {
  const provinces: Record<string, string> = {
    "01": "Álava",
    "02": "Albacete",
    "03": "Alicante",
    "04": "Almería",
    "05": "Ávila",
    "06": "Badajoz",
    "07": "Baleares",
    "08": "Barcelona",
    "09": "Burgos",
    "10": "Cáceres",
    "11": "Cádiz",
    "12": "Castellón",
    "13": "Ciudad Real",
    "14": "Córdoba",
    "15": "A Coruña",
    "16": "Cuenca",
    "17": "Girona",
    "18": "Granada",
    "19": "Guadalajara",
    "20": "Guipúzcoa",
    "21": "Huelva",
    "22": "Huesca",
    "23": "Jaén",
    "24": "León",
    "25": "Lleida",
    "26": "La Rioja",
    "27": "Lugo",
    "28": "Madrid",
    "29": "Málaga",
    "30": "Murcia",
    "31": "Navarra",
    "32": "Ourense",
    "33": "Asturias",
    "34": "Palencia",
    "35": "Las Palmas",
    "36": "Pontevedra",
    "37": "Salamanca",
    "38": "Santa Cruz de Tenerife",
    "39": "Cantabria",
    "40": "Segovia",
    "41": "Sevilla",
    "42": "Soria",
    "43": "Tarragona",
    "44": "Teruel",
    "45": "Toledo",
    "46": "Valencia",
    "47": "Valladolid",
    "48": "Vizcaya",
    "49": "Zamora",
    "50": "Zaragoza",
    "51": "Ceuta",
    "52": "Melilla",
  };

  const postalCodeClean = postalCode.trim();

  if (!/^\d{5}$/.test(postalCodeClean)) {
    return null;
  }

  return provinces[postalCodeClean.substring(0, 2)] ?? null;
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
      ok: false as const,
      error: NextResponse.json(
        { ok: false, message: "Falta configurar Supabase o ADMIN_EMAIL en Vercel." },
        { status: 503 }
      ),
    };
  }

  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7) : "";

  if (!token) {
    return {
      ok: false as const,
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
      ok: false as const,
      error: NextResponse.json(
        { ok: false, message: "La sesión no es válida." },
        { status: 401 }
      ),
    };
  }

  if (data.user.email?.trim().toLowerCase() !== adminEmail) {
    return {
      ok: false as const,
      error: NextResponse.json(
        { ok: false, message: "No tienes permiso para ejecutar esta acción." },
        { status: 403 }
      ),
    };
  }

  return { ok: true as const, user: data.user };
}

export async function GET(request: NextRequest) {
  const action = request.nextUrl.searchParams.get("action");

  // Diagnóstico de pedidos: solo lectura y solo para la administradora.
  if (action === "orders-test") {
    const auth = await authenticateAdmin(request);
    if (!auth.ok) return auth.error;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json(
        { ok: false, message: "Falta SUPABASE_SERVICE_ROLE_KEY en Vercel." },
        { status: 503 }
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

  // Esta comprobación GET solo consulta la disponibilidad HTTP del servicio.
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
      message: "Servidor GLS accesible. Esta comprobación no crea expediciones.",
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
    const auth = await authenticateAdmin(request);
    if (!auth.ok) return auth.error;



const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  return NextResponse.json(
    {
      ok: false,
      message: "Falta configurar Supabase para guardar la etiqueta GLS.",
    },
    { status: 503 }
  );
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

    const body = await request.json().catch(() => null);
    if (body?.action === "storage-test") {
  const testPdf = Buffer.from(
    "JVBERi0xLjQKJUVPRgo=",
    "base64"
  );

  const { error } = await supabase.storage
    .from("etiquetas-gls")
    .upload("pruebas/comprobacion.pdf", testPdf, {
      contentType: "application/pdf",
      upsert: true,
    });

  if (error) {
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: "La subida de prueba a Supabase funciona.",
    path: "pruebas/comprobacion.pdf",
  });
}
if (body?.action === "shipment-production") {
  if (!GLS_PRODUCTION_ENABLED) {
    return NextResponse.json(
      {
        ok: false,
        shipmentCreated: false,
        message:
          "Los envíos GLS de producción están desactivados temporalmente. No se ha creado ninguna expedición.",
      },
      { status: 403 }
    );
  }

  return NextResponse.json(
    {
      ok: false,
      shipmentCreated: false,
      message:
        "La creación de expediciones reales está pendiente de completar y verificar.",
    },
    { status: 503 }
  );
}
if (body?.action === "shipment-order") {
  const orderId = String(body.orderId ?? "").trim();
      if (!orderId) {
        return NextResponse.json(
          { ok: false, message: "Falta el identificador del pedido." },
          { status: 400 }
        );
      }

      const { data: order, error: orderError } = await supabase
        .from("orders")
        .select(
          "id, payment_status, gls_shipment_id, gls_tracking_number, gls_status, customer_name, customer_surname, customer_phone, customer_address, customer_city, customer_postal_code, shipping_method"
        )
        .eq("id", orderId)
        .maybeSingle();

      if (orderError) {
        return NextResponse.json(
          { ok: false, message: "No se pudo consultar el pedido." },
          { status: 500 }
        );
      }

      if (!order) {
        return NextResponse.json(
          { ok: false, message: "No existe ese pedido." },
          { status: 404 }
        );
      }

      if (order.payment_status !== "paid") {
        return NextResponse.json(
          { ok: false, message: "El pedido todavía no está pagado." },
          { status: 409 }
        );
      }
      if (order.shipping_method === "pickup") {
  return NextResponse.json({
    ok: true,
    action: "pickup",
    shipmentCreated: false,
    message: "Este pedido es de recogida en tienda. No necesita envío GLS.",
  });
}

if (order.shipping_method !== "standard") {
  return NextResponse.json(
    {
      ok: false,
      shipmentCreated: false,
      message: `Método de envío no reconocido: ${order.shipping_method ?? "vacío"}.`,
    },
    { status: 422 }
  );
}

const glsService = GLS_SERVICES.standard;

      if (
        order.gls_shipment_id ||
        order.gls_tracking_number ||
        order.gls_status === "generado"
      ) {
        return NextResponse.json(
          { ok: false, message: "Este pedido ya tiene una expedición GLS registrada." },
          { status: 409 }
        );
      }

      const missingFields = [
        !order.customer_name && "nombre",
        !order.customer_address && "dirección",
        !order.customer_city && "localidad",
        !order.customer_postal_code && "código postal",
        !order.customer_phone && "teléfono",
      ].filter(Boolean);

      if (missingFields.length > 0) {
        return NextResponse.json(
          {
            ok: false,
            message: `Faltan datos del destinatario: ${missingFields.join(", ")}.`,
          },
          { status: 422 }
        );
      }
const province = getProvinceFromPostalCode(order.customer_postal_code);

if (!province) {
  return NextResponse.json(
    {
      ok: false,
      message: "No se pudo determinar la provincia a partir del código postal.",
    },
    { status: 422 }
  );
}
      return NextResponse.json({
        ok: true,
        action: "shipment-order-precheck",
        shipmentCreated: false,
        message: "Pedido pagado y preparado para revisar su expedición GLS.",
        order: {
          id: order.id,
          customerName: `${order.customer_name} ${order.customer_surname ?? ""}`.trim(),
          address: order.customer_address,
          city: order.customer_city,
          postalCode: order.customer_postal_code,
          province,
          phone: order.customer_phone,
          shippingMethod: order.shipping_method,
          glsService: glsService.name,
glsServiceCode: glsService.serviceCode,
glsScheduleCode: glsService.scheduleCode,
        },
        provinceRequired: true,
      });
    }

    if (body?.action !== "shipment-test") {
      return NextResponse.json(
        {
          ok: false,
          message: 'Acción no válida. Usa "storage-test", "shipment-test" o "shipment-order".',
          shipmentCreationEnabled: false,
        },
        { status: 400 }
      );
    }

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
    const dateParts = new Intl.DateTimeFormat("es-ES", {
      timeZone: "Europe/Madrid",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).formatToParts(new Date());
    const getPart = (type: string) =>
      dateParts.find((part) => part.type === type)?.value ?? "";
    const fecha = `${getPart("day")}/${getPart("month")}/${getPart("year")}`;
    const referencia = `KIGOBE-TEST-${Date.now()}`;

// Estructura basada en el ejemplo oficial de GLS. Se solicita la etiqueta de la expedición de prueba.
    // Los datos del destinatario son ficticios. No se usan pedidos reales.
    // IMPORTANTE: GrabaServicios inserta una expedición en GLS usando el UID indicado.
    const docIn = `<Servicios uidcliente="${escapeXml(testUid)}" xmlns="http://www.asmred.com/">
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
     <Telefono><![CDATA[643885699]]></Telefono>
<Movil><![CDATA[643885699]]></Movil>
      <Email><![CDATA[kigobeshop@gmail.com]]></Email>
      <Observaciones><![CDATA[]]></Observaciones>
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
      <Observaciones><![CDATA[PRUEBA TECNICA KIGOBESHOP]]></Observaciones>
      <ATT><![CDATA[GLS TEST]]></ATT>
    </Destinatario>
       <Referencias>
      <Referencia tipo="C"><![CDATA[${referencia}]]></Referencia>
    </Referencias>
    <DevuelveAdicionales>
      <Etiqueta codificacion="CI28" tipo="PDF" modo="EtixBulto"></Etiqueta>
    </DevuelveAdicionales>
  </Envio>
</Servicios>`;

    const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
 xmlns:xsd="http://www.w3.org/2001/XMLSchema"
 xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <GrabaServicios xmlns="http://www.asmred.com/">
     <docIn>${docIn}</docIn>
    </GrabaServicios>
  </soap12:Body>
</soap12:Envelope>`;

    const response = await fetch(GLS_URL, {
      method: "POST",
      headers: {
        "Content-Type": 'application/soap+xml; charset=utf-8; action="http://www.asmred.com/GrabaServicios"',
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
    const barcode = shipmentMatch?.[1].match(/\bcodbarras="([^"]*)"/i)?.[1] ?? null;
    const uid = shipmentMatch?.[1].match(/\buid="([^"]*)"/i)?.[1] ?? null;
    const returnCode = resultXml.match(/<Resultado\b[^>]*\breturn="([^"]*)"/i)?.[1] ?? null;
const labelMatch = resultXml.match(
  /<Etiqueta\b([^>]*)>([\s\S]*?)<\/Etiqueta>/i
);

const labelReturned = Boolean(labelMatch);

const soapFault = /<(?:[\w.-]+:)?Fault\b/i.test(responseXml);
const success = response.ok && !soapFault && returnCode === "0";

let labelSaved = false;
let labelStoragePath: string | null = null;
let labelStorageError: string | null = null;
let labelMimeType: string | null = null;

if (success && labelMatch) {
  const base64 = labelMatch[2]
    .replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, "$1")
    .replace(/\s/g, "");

  if (!base64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    labelStorageError = "El contenido de la etiqueta no es Base64 válido.";
  } else {
    const labelBuffer = Buffer.from(base64, "base64");

    if (labelBuffer.subarray(0, 5).toString("ascii") === "%PDF-") {
      labelMimeType = "application/pdf";
    } else if (
      labelBuffer[0] === 0xff &&
      labelBuffer[1] === 0xd8 &&
      labelBuffer[2] === 0xff
    ) {
      labelMimeType = "image/jpeg";
    } else {
      labelStorageError = "GLS ha devuelto un formato de etiqueta no reconocido.";
    }

    if (labelMimeType) {
      const extension = labelMimeType === "application/pdf" ? "pdf" : "jpg";
      const storagePath = `pruebas/${referencia}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("etiquetas-gls")
        .upload(storagePath, labelBuffer, {
          contentType: labelMimeType,
          upsert: false,
        });

      if (uploadError) {
        labelStorageError = uploadError.message;
      } else {
        labelSaved = true;
        labelStoragePath = storagePath;
      }
    }
  }
}


    const safeResult = resultXml
      ? resultXml.replace(/<Etiqueta\b[^>]*>[\s\S]*?<\/Etiqueta>/gi, "<Etiqueta>[contenido omitido]</Etiqueta>").slice(0, 3000)
      : responseXml.slice(0, 2000);

    return NextResponse.json({
      ok: success,
      operation: "GrabaServicios",
      httpStatus: response.status,
      reference: referencia,
      glsReturnCode: returnCode,
      barcode,
      shipmentUid: uid,
      labelReturned,
      labelSaved,
labelStoragePath,
labelStorageError,
labelMimeType,
      soapFault,
      responseReceived: responseXml.length > 0,
      testUidUsed: true,
      // La operación sí puede crear una expedición en el entorno asociado al UID de test.
      testShipmentMayBeCreatedInGls: true,
      productionShipmentCreationEnabled: false,
      message: success
        ? "GLS ha aceptado la expedición de prueba en el entorno asociado al UID de test."
        : "GLS no ha confirmado la expedición de prueba. Revisa la respuesta recibida.",
      responseExcerpt: safeResult,
    });
  } catch (error) {
    console.error(
      "Error en prueba GLS:",
      error instanceof Error ? error.message : "Error desconocido"
    );
    return NextResponse.json(
      {
        ok: false,
        message: "No se pudo completar la petición a GLS.",
        productionShipmentCreationEnabled: false,
        testShipmentMayBeCreatedInGls: true,
      },
      { status: 502 }
    );
  }
}
