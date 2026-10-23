
import { createClient } from "@supabase/supabase-js";
import { createHash, timingSafeEqual } from "crypto";

export const runtime = "nodejs";

function sha256(text: string) {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function sameSignature(a: string, b: string) {
  if (!/^[a-f0-9]{64}$/i.test(a) || !/^[a-f0-9]{64}$/i.test(b)) {
    return false;
  }

  return timingSafeEqual(
    Buffer.from(a.toLowerCase(), "hex"),
    Buffer.from(b.toLowerCase(), "hex")
  );
}

function cecaResponse(ok: boolean) {
  return new Response(ok ? "*$OKY*$" : "*$NOK*$", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

export async function POST(request: Request) {
  try {
    const merchantId = process.env.CECA_TEST_MERCHANT_ID;
    const acquirerBin = process.env.CECA_TEST_ACQUIRER_BIN;
    const terminalId = process.env.CECA_TEST_TERMINAL_ID;
    const encryptionKey = process.env.CECA_TEST_ENCRYPTION_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (
      !merchantId ||
      !acquirerBin ||
      !terminalId ||
      !encryptionKey ||
      !supabaseUrl ||
      !serviceKey
    ) {
      console.error("Falta configuración para CECA NO OK.");
      return cecaResponse(false);
    }

    const params = new URLSearchParams(await request.text());

    const received = {
      merchantId: params.get("MerchantID") ?? "",
      acquirerBin: params.get("AcquirerBIN") ?? "",
      terminalId: params.get("TerminalID") ?? "",
      operation: params.get("Num_operacion") ?? "",
      amount: params.get("Importe") ?? "",
      currency: params.get("TipoMoneda") ?? "",
      exponent: params.get("Exponente") ?? "",
      errorCode: params.get("Codigo_error") ?? "",
      signature: params.get("Firma") ?? "",
    };

    if (
      received.merchantId !== merchantId ||
      received.acquirerBin !== acquirerBin ||
      received.terminalId !== terminalId ||
      !received.operation ||
      !/^\d{1,12}$/.test(received.amount) ||
      received.currency !== "978" ||
      received.exponent !== "2" ||
      !/^\d{1,3}$/.test(received.errorCode)
    ) {
      return cecaResponse(false);
    }

    const amount = received.amount.padStart(12, "0");
    const signingText =
      encryptionKey +
      received.merchantId +
      received.acquirerBin +
      received.terminalId +
      received.operation +
      amount +
      received.currency +
      received.exponent +
      received.errorCode;

    const expectedSignature = sha256(signingText);

    if (!sameSignature(received.signature, expectedSignature)) {
      console.error("Firma CECA NO OK no válida.");
      return cecaResponse(false);
    }

    const amountCents = Number(received.amount);

    if (!Number.isSafeInteger(amountCents) || amountCents <= 0) {
      return cecaResponse(false);
    }

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { data: order, error } = await supabase
      .from("orders")
      .select("id, total_cents, payment_status")
      .eq("payment_reference", received.operation)
      .maybeSingle();

    if (error || !order) {
      console.error("Pedido de CECA NO OK no encontrado.");
      return cecaResponse(false);
    }

    if (Number(order.total_cents) !== amountCents) {
      console.error("El importe de CECA NO OK no coincide.");
      return cecaResponse(false);
    }

    // Nunca liberar stock si el pedido ya está pagado.
    if (order.payment_status === "paid") {
      console.warn("NO OK recibido para un pedido ya pagado:", order.id);
      return cecaResponse(true);
    }

    // La liberación se conectará después de verificar el flujo completo.
    console.log("CECA NO OK validado:", {
      orderId: order.id,
      errorCode: received.errorCode,
      paymentStatus: order.payment_status,
    });

    return cecaResponse(true);
  } catch (error) {
    console.error("Error procesando CECA NO OK:", error);
    return cecaResponse(false);
  }
}
