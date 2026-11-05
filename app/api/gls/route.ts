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
  // BLOQUEO DE SEGURIDAD: no se envía nada a GLS mientras esté desactivado.
  if (!GLS_PRODUCTION_ENABLED) {
    return NextResponse.json(
      {
        ok: false,
        shipmentCreated: false,
        message:
          "Producción GLS desactivada. No se ha creado ninguna expedición.",
      },
      { status: 403 }
    );
  }

  const orderId = String(body.orderId ?? "").trim();
  const weightKg = Number(body.weightKg);

  if (!orderId) {
    return NextResponse.json(
      { ok: false, message: "Falta el identificador del pedido." },
      { status: 400 }
    );
  }

  if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 31.5) {
    return NextResponse.json(
      {
        ok: false,
        message: "Introduce un peso real entre 0,1 y 31,5 kg.",
      },
      { status: 400 }
    );
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      "id, payment_status, gls_shipment_id, gls_tracking_number, gls_status, customer_name, customer_surname, customer_phone, customer_email, customer_address, customer_city, customer_postal_code, shipping_method"
    )
    .eq("id", orderId)
    .maybeSingle();

  if (orderError || !order) {
    return NextResponse.json(
      { ok: false, message: "No se pudo encontrar el pedido." },
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
      shipmentCreated: false,
      message: "El pedido es de recogida en tienda. No necesita GLS.",
    });
  }

  if (order.shipping_method !== "standard") {
    return NextResponse.json(
      { ok: false, message: "Método de envío no reconocido." },
      { status: 422 }
    );
  }

  if (
    order.gls_shipment_id ||
    order.gls_tracking_number ||
    order.gls_status !== null
  ) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "El pedido ya tiene un envío GLS o un proceso anterior pendiente de revisión. No se repetirá la operación.",
      },
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

  const province = getProvinceFromPostalCode(
    order.customer_postal_code
  );

  if (!province) {
    return NextResponse.json(
      { ok: false, message: "No se pudo determinar la provincia." },
      { status: 422 }
    );
  }

  const productionUid = getGLSProductionUid();

  if (!productionUid) {
    return NextResponse.json(
      { ok: false, message: "Falta GLS_UIDCLIENTE en Vercel." },
      { status: 503 }
    );
  }

  // Reserva atómica para impedir dos solicitudes simultáneas.
  const { data: reservation, error: reservationError } =
    await supabase
      .from("orders")
      .update({ gls_status: "procesando" })
      .eq("id", orderId)
      .is("gls_shipment_id", null)
      .is("gls_tracking_number", null)
      .is("gls_status", null)
      .select("id")
      .maybeSingle();

  if (reservationError || !reservation) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "No se pudo reservar el pedido. Puede que otra solicitud ya lo esté procesando.",
      },
      { status: 409 }
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
  const referencia = `K${Date.now().toString().slice(-14)}`;
  const glsService = GLS_SERVICES.standard;

  const docIn = `<Servicios uidcliente="${escapeXml(productionUid)}" xmlns="http://www.asmred.com/">
  <Envio codbarras="">
    <Fecha>${fecha}</Fecha>
    <Portes>P</Portes>
    <Servicio>${glsService.serviceCode}</Servicio>
    <Horario>${glsService.scheduleCode}</Horario>
    <Bultos>1</Bultos>
    <Peso>${weightKg.toFixed(2)}</Peso>
    <Retorno>0</Retorno>
    <Pod>N</Pod>
    <Remite>
      <Plaza></Plaza>
      <Nombre>KigobeShop</Nombre>
      <Direccion>Calle Granada, Plaza Primero de Mayo 27</Direccion>
      <Poblacion>Almería</Poblacion>
      <Provincia>Almería</Provincia>
      <Pais>34</Pais>
      <CP>04008</CP>
      <Telefono>643885699</Telefono>
      <Movil>643885699</Movil>
      <Email>kigobeshop@gmail.com</Email>
    </Remite>
    <Destinatario>
      <Codigo></Codigo>
      <Plaza></Plaza>
      <Nombre>${escapeXml(`${order.customer_name} ${order.customer_surname ?? ""}`.trim())}</Nombre>
      <Direccion>${escapeXml(order.customer_address)}</Direccion>
      <Poblacion>${escapeXml(order.customer_city)}</Poblacion>
      <Provincia>${escapeXml(province)}</Provincia>
      <Pais>34</Pais>
      <CP>${escapeXml(order.customer_postal_code)}</CP>
      <Telefono>${escapeXml(order.customer_phone)}</Telefono>
      <Movil>${escapeXml(order.customer_phone)}</Movil>
      <Email>${escapeXml(order.customer_email ?? "")}</Email>
      <Observaciones></Observaciones>
      <ATT>${escapeXml(order.customer_name)}</ATT>
    </Destinatario>
    <Referencias>
      <Referencia tipo="C">${referencia}</Referencia>
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

  let response: Response;

  try {
    response = await fetch(GLS_URL, {
      method: "POST",
      headers: {
        "Content-Type":
          'application/soap+xml; charset=utf-8; action="http://www.asmred.com/GrabaServicios"',
      },
      body: envelope,
      cache: "no-store",
      signal: AbortSignal.timeout(25000),
    });
  } catch (error) {
    console.error(
      "Respuesta incierta de GLS:",
      error instanceof Error ? error.message : "Error desconocido"
    );

    await supabase
      .from("orders")
      .update({ gls_status: "respuesta_incierta" })
      .eq("id", orderId)
      .eq("gls_status", "procesando");

   return NextResponse.json(
  {
    ok: false,
    shipmentCreated: null,
    shipmentMayHaveBeenCreated: true,
    status: "respuesta_incierta",
    message:
      "No se pudo confirmar la respuesta de GLS. La expedición podría haberse creado. El pedido queda bloqueado para revisión manual. No repitas la operación.",
  },
  { status: 502 }
);

  const responseXml = await response.text();

  const match = responseXml.match(
    /<(?:[\w.-]+:)?GrabaServiciosResult\b[^>]*>([\s\S]*?)<\/(?:[\w.-]+:)?GrabaServiciosResult>/i
  );

  const resultXml = match ? unescapeXml(match[1]) : "";
  const shipmentMatch = resultXml.match(/<Envio\b([^>]*)>/i);

  const barcode =
    shipmentMatch?.[1].match(/\bcodbarras="([^"]*)"/i)?.[1] ?? null;

  const uid =
    shipmentMatch?.[1].match(/\buid="([^"]*)"/i)?.[1] ?? null;

  const returnCode =
    resultXml.match(/<Resultado\b[^>]*\breturn="([^"]*)"/i)?.[1] ??
    null;

  const labelMatch = resultXml.match(
    /<Etiqueta\b([^>]*)>([\s\S]*?)<\/Etiqueta>/i
  );

  const soapFault = /<(?:[\w.-]+:)?Fault\b/i.test(responseXml);
  const success = response.ok && !soapFault && returnCode === "0";

 if (!success) {
  await supabase
    .from("orders")
    .update({ gls_status: "error_gls" })
    .eq("id", orderId)
    .eq("gls_status", "procesando");

  return NextResponse.json(
    {
      ok: false,
      shipmentCreated: false,
      status: "error_gls",
      httpStatus: response.status,
      glsReturnCode: returnCode,
      soapFault,
      message:
        "GLS no ha confirmado la expedición. El pedido queda bloqueado para revisión manual.",
    },
    { status: 502 }
  );
}

if (!barcode) {
  await supabase
    .from("orders")
    .update({ gls_status: "respuesta_incompleta" })
    .eq("id", orderId)
    .eq("gls_status", "procesando");

  return NextResponse.json(
    {
      ok: false,
      shipmentCreated: true,
      status: "respuesta_incompleta",
      glsReturnCode: returnCode,
      message:
        "GLS ha aceptado la solicitud, pero no hemos podido identificar el código de barras. No repitas el envío: requiere revisión manual.",
    },
    { status: 502 }
  );
}

  // GLS ha aceptado la expedición. Guardamos primero sus identificadores
  // para evitar que un fallo posterior de la etiqueta provoque duplicados.
  const shipmentId = uid || barcode;

  const { error: shipmentUpdateError } = await supabase
    .from("orders")
    .update({
      gls_shipment_id: shipmentId,
      gls_tracking_number: barcode,
      gls_status: "etiqueta_pendiente",
    })
    .eq("id", orderId)
    .eq("gls_status", "procesando");

  if (shipmentUpdateError) {
    console.error(
      "GLS aceptó la expedición, pero no se pudieron guardar sus identificadores:",
      shipmentUpdateError.message
    );

    return NextResponse.json(
      {
        ok: false,
        shipmentCreated: true,
        barcode,
        message:
          "GLS ha aceptado el envío, pero no se pudieron guardar sus datos en Supabase. No repitas la operación; requiere revisión manual.",
      },
      { status: 500 }
    );
  }

  if (!labelMatch) {
    return NextResponse.json(
      {
        ok: false,
        shipmentCreated: true,
        barcode,
        shipmentUid: shipmentId,
        status: "etiqueta_pendiente",
        message:
          "GLS ha creado la expedición, pero no ha devuelto la etiqueta. El seguimiento está guardado. Requiere revisión manual.",
      },
      { status: 502 }
    );
  }

  const base64 = labelMatch[2]
    .replace(/^<!\[CDATA\[([\s\S]*)\]\]>$/, "$1")
    .replace(/\s/g, "");

  if (!base64 || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    return NextResponse.json(
      {
        ok: false,
        shipmentCreated: true,
        barcode,
        status: "etiqueta_pendiente",
        message:
          "La expedición está creada, pero la etiqueta recibida no tiene un Base64 válido. Requiere revisión manual.",
      },
      { status: 502 }
    );
  }

  const labelBuffer = Buffer.from(base64, "base64");

  let labelMimeType: string | null = null;

  if (labelBuffer.subarray(0, 5).toString("ascii") === "%PDF-") {
    labelMimeType = "application/pdf";
  } else if (
    labelBuffer[0] === 0xff &&
    labelBuffer[1] === 0xd8 &&
    labelBuffer[2] === 0xff
  ) {
    labelMimeType = "image/jpeg";
  }

  if (!labelMimeType) {
    return NextResponse.json(
      {
        ok: false,
        shipmentCreated: true,
        barcode,
        status: "etiqueta_pendiente",
        message:
          "La expedición está creada, pero GLS ha devuelto un formato de etiqueta no reconocido.",
      },
      { status: 502 }
    );
  }

  const extension = labelMimeType === "application/pdf" ? "pdf" : "jpg";
  const storagePath = `produccion/${orderId}/${referencia}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from("etiquetas-gls")
    .upload(storagePath, labelBuffer, {
      contentType: labelMimeType,
      upsert: false,
    });

  if (uploadError) {
    console.error("Error guardando etiqueta GLS:", uploadError.message);

    return NextResponse.json(
      {
        ok: false,
        shipmentCreated: true,
        barcode,
        status: "etiqueta_pendiente",
        message:
          "La expedición está creada y el seguimiento guardado, pero no se pudo subir la etiqueta. No repitas el envío.",
      },
      { status: 502 }
    );
  }

  const { error: finalUpdateError } = await supabase
    .from("orders")
    .update({
      gls_label_url: storagePath,
      gls_status: "generado",
    })
    .eq("id", orderId)
    .eq("gls_status", "etiqueta_pendiente");

  if (finalUpdateError) {
    console.error(
      "Etiqueta guardada, pero no se pudo actualizar el pedido:",
      finalUpdateError.message
    );

    return NextResponse.json(
      {
        ok: false,
        shipmentCreated: true,
        barcode,
        labelSaved: true,
        labelStoragePath: storagePath,
        message:
          "El envío y la etiqueta están guardados, pero el estado del pedido necesita revisión manual.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    shipmentCreated: true,
    orderId,
    reference: referencia,
    service: glsService.name,
    weightKg,
    barcode,
    shipmentUid: shipmentId,
    labelSaved: true,
    labelStoragePath: storagePath,
    labelMimeType,
    status: "generado",
    message:
      "GLS ha aceptado la expedición. El seguimiento y la etiqueta se han guardado en Supabase.",
  });
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
