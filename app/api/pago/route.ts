
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  createCipheriv,
  createHmac,
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
  const decodedKey = Buffer.from(encryptionKey, "base64");

  if (decodedKey.length !== 24) {
    throw new Error("La clave de pruebas de CECA no tiene el formato esperado.");
  }

  const iv = Buffer.alloc(8, 0);
  const operationBytes = Buffer.from(operation, "utf8");
  const paddedLength = Math.ceil(operationBytes.length / 8) * 8;
  const paddedOperation = Buffer.alloc(paddedLength, 0);
  operationBytes.copy(paddedOperation);

  const cipher = createCipheriv(
    "des-ede3-cbc",
    decodedKey,
    iv
  );
  cipher.setAutoPadding(false);

  const encryptedOperation = Buffer.concat([
    cipher.update(paddedOperation),
    cipher.final(),
  ]);

  const signingText =
    encryptionKey +
    merchantId +
    acquirerBin +
    terminalId +
    operation +
    amount +
    "978" +
    "2" +
    "HMAC" +
    urlOk +
    urlNok;

  return createHmac("sha256", encryptedOperation)
    .update(signingText, "utf8")
    .digest("base64");
}

export async function POST(request: Request) {
  try {
    const merchantId = process.env.CECA_TEST_MERCHANT_ID;
    const acquirerBin = process.env.CECA_TEST_ACQUIRER_BIN;
    const terminalId = process.env.CECA_TEST_TERMINAL_ID;
    const encryptionKey = process.env.CECA_TEST_ENCRYPTION_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      const missing = [
      ["CECA_TEST_MERCHANT_ID", merchantId],
      ["CECA_TEST_ACQUIRER_BIN", acquirerBin],
      ["CECA_TEST_TERMINAL_ID", terminalId],
      ["CECA_TEST_ENCRYPTION_KEY", encryptionKey],
      ["NEXT_PUBLIC_SUPABASE_URL", supabaseUrl],
      ["NEXT_PUBLIC_SUPABASE_ANON_KEY", supabaseKey],
    ]
      .filter(([, value]) => !value)
      .map(([name]) => name);

    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: "Falta configurar el TPV de pruebas.",
          missing,
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const items = body.items;

    if (
      !Array.isArray(items) ||
      items.length === 0 ||
      items.length > 50
    ) {
      return NextResponse.json(
        { error: "El carrito no es válido." },
        { status: 400 }
      );
    }

    const normalizedItems = items.map((item: any) => ({
      id: Number(item.productId),
      qty: Number(item.qty),
    }));

    if (
      normalizedItems.some(
        (item) =>
          !Number.isSafeInteger(item.id) ||
          item.id < 1000001 ||
          !Number.isSafeInteger(item.qty) ||
          item.qty < 1 ||
          item.qty > 20
      )
    ) {
      return NextResponse.json(
        { error: "Hay productos o cantidades no válidos." },
        { status: 400 }
      );
    }

    const dbIds = normalizedItems.map((item) => item.id - 1000000);

    if (new Set(dbIds).size !== dbIds.length) {
      return NextResponse.json(
        { error: "El carrito contiene productos duplicados." },
        { status: 400 }
      );
    }

   const validSupabaseUrl = supabaseUrl!;
const validSupabaseKey = supabaseKey!;
const supabase = createClient(validSupabaseUrl, validSupabaseKey);

    const { data: products, error } = await supabase
      .from("products")
      .select("id, price")
      .in("id", dbIds);

    if (error || !products || products.length !== dbIds.length) {
      return NextResponse.json(
        { error: "No se han podido verificar los productos del carrito." },
        { status: 400 }
      );
    }

    const priceById = new Map(
      products.map((product) => [
        Number(product.id),
        Number(product.price),
      ])
    );

    let totalCents = 0;

    for (const item of normalizedItems) {
      const price = priceById.get(item.id - 1000000);

      if (price === undefined || !Number.isFinite(price) || price <= 0) {
        return NextResponse.json(
          { error: "Hay un precio de producto no válido." },
          { status: 400 }
        );
      }

      totalCents += Math.round(price * 100) * item.qty;
    }

    if (
      !Number.isSafeInteger(totalCents) ||
      totalCents <= 0 ||
      totalCents > 999999999999
    ) {
      return NextResponse.json(
        { error: "El importe del pedido no es válido." },
        { status: 400 }
      );
    }

    const amount = String(totalCents);
    const operation =
      `KG${Date.now()}${randomBytes(4).toString("hex")}`;

    const origin = new URL(request.url).origin;
    const urlOk = new URL("/pago/ok", origin).toString();
    const urlNok = new URL("/pago/error", origin).toString();

    const signature = getCecaSignature(
  merchantId!,
  acquirerBin!,
  terminalId!,
  operation,
  amount,
  urlOk,
  urlNok,
  encryptionKey!
);
    return NextResponse.json({
      action: CECA_TEST_URL,
      fields: {
        MerchantID: merchantId,
        AcquirerBIN: acquirerBin,
        TerminalID: terminalId,
        Num_operacion: operation,
        Importe: amount,
        TipoMoneda: "978",
        Exponente: "2",
        URL_OK: urlOk,
        URL_NOK: urlNok,
        Firma: signature,
        Cifrado: "HMAC",
        Idioma: "1",
      },
    });
  } catch (error) {
    console.error("Error preparando el pago CECA:", error);

    return NextResponse.json(
      { error: "No se ha podido preparar el pago de pruebas." },
      { status: 500 }
    );
  }
}
