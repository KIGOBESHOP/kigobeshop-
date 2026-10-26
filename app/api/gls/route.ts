
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    service: "KigobeShop GLS",
    status: "configured",
    mode: "test",
    message: "La ruta de GLS está preparada.",
  });
}
