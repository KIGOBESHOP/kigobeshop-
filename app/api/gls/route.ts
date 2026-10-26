
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const GLS_URL = "https://ws-customer.gls-spain.es/b2b.asmx";

export async function GET(request: NextRequest) {
  const uidCliente = process.env.GLS_UIDCLIENTE;

  if (!uidCliente) {
    return NextResponse.json(
      { ok: false, message: "Falta GLS_UIDCLIENTE en Vercel." },
      { status: 500 }
    );
  }

  const action = request.nextUrl.searchParams.get("action");

  // Comprobación básica existente
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
        message: "Servidor GLS accesible. SOAP pendiente de comprobar.",
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

  // Consulta de lectura: no crea expediciones.
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
      message: response.ok
        ? "GLS respondió a la petición SOAP. Revisa los indicadores."
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
