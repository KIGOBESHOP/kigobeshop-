import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
  return NextResponse.json(
    {
      error:
        "Liberación desactivada hasta verificar el estado real del pago CECA.",
    },
    { status: 409 }
  );
}
