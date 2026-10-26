
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const uidCliente = process.env.GLS_UIDCLIENTE;

  return NextResponse.json({
    service: "KigobeShop GLS",
    mode: "test",
    uidConfigured: Boolean(uidCliente),
    message: uidCliente
      ? "El UIDCLIENTE está configurado."
      : "Falta configurar GLS_UIDCLIENTE en Vercel.",
  });
}
