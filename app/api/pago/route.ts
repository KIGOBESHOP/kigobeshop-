

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import {
  createHash,
  randomBytes,
} from "crypto";

export const runtime = "nodejs";

const CECA_TEST_URL =
  "https://tpv.ceca.es/tpvweb/tpv/compra.action";

function getCecaSignature(
  merchantId: string,
  acquirerBin: string,
  terminalId: string,
  operation: string,
  amount: string,
  urlOk: string,
  urlNok: string,
  encryptionKey: string
) {
  const signingText =
    encryptionKey +
    merchantId +
    acquirerBin +
    terminalId +
    operation +
    amount +
    "978" +
    "2" +
    "SHA2" +
    urlOk +
    urlNok;

  return createHash("sha256")
    .update(signingText, "utf8")
    .digest("hex");
}

export async function POST(request: Request) {
  try {
    const merchantId = process.env.CECA_TEST_MERCHANT_ID;
    const acquirerBin = process.env.CECA_TEST_ACQUIRER_BIN;
    const terminalId = process.env.CECA_TEST_TERMINAL_ID;
    const encryptionKey = process.env.CECA_TEST_ENCRYPTION_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const missing = [
      ["CECA_TEST_MERCHANT_ID", merchantId],
      ["CECA_TEST_ACQUIRER_BIN", acquirerBin],
      ["CECA_TEST_TERMINAL_ID", terminalId],
      ["CECA_TEST_ENCRYPTION_KEY", encryptionKey],
      ["NEXT_PUBLIC_SUPABASE_URL", supabaseUrl],
      ["SUPABASE_SERVICE_ROLE_KEY", supabaseKey],
    ]
      .filter(([, value]) => !value)
      .map(([name]) => name);

    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: "Falta configurar el pago o la base de datos.",
          missing,
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const customer = body.customer;
    const items = body.items;

    if (
      !customer ||
      typeof customer.name !== "string" ||
      !customer.name.trim() ||
      typeof customer.email !== "string" ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim()) ||
      typeof customer.phone !== "string" ||
      !customer.phone.trim() ||
      typeof customer.address !== "string" ||
      !customer.address.trim() ||
      typeof customer.city !== "string" ||
      !customer.city.trim() ||
      typeof customer.postalCode !== "string" ||
      !customer.postalCode.trim()
    ) {
      return NextResponse.json(
        { error: "Los datos del cliente no son válidos." },
        { status: 400 }
      );
    }
