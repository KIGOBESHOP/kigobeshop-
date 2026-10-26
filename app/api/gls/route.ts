
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const uidCliente = process.env.GLS_UIDCLIENTE;

  if (!uidCliente) {
    return NextResponse.json(
      { ok: false, message: "Falta GLS_UIDCLIENTE en Vercel." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      "https://ws-customer.gls-spain.es/b2b.asmx",
      {
        method: "GET",
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      }
    );

    return NextResponse.json({
      ok: true,
      uidConfigured: true,
      serviceReachable: true,
      httpStatus: response.status,
      message:
        "El servidor de GLS ha respondido. Aún falta verificar la conexión SOAP.",
    });
  } catch {
    return NextResponse.json({
      ok: false,
      uidConfigured: true,
      serviceReachable: false,
      message:
        "No se ha podido contactar con el servidor de GLS desde Vercel.",
    });
  }
}
