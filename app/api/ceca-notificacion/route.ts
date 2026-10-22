
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHash, timingSafeEqual } from "crypto";
import { Resend } from "resend";
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
      console.error("Falta configuración para la notificación CECA.");
      return cecaResponse(false);
    }

    const rawBody = await request.text();
    const params = new URLSearchParams(rawBody);

    const received = {
      merchantId: params.get("MerchantID") ?? "",
      acquirerBin: params.get("AcquirerBIN") ?? "",
      terminalId: params.get("TerminalID") ?? "",
      operation: params.get("Num_operacion") ?? "",
      amount: params.get("Importe") ?? "",
      currency: params.get("TipoMoneda") ?? "",
      exponent: params.get("Exponente") ?? "",
      reference: params.get("Referencia") ?? "",
      signature: params.get("Firma") ?? "",
    };

    if (
      received.merchantId !== merchantId ||
      received.acquirerBin !== acquirerBin ||
      received.terminalId !== terminalId ||
      !received.operation ||
      !/^\d+$/.test(received.amount) ||
      received.currency !== "978" ||
      received.exponent !== "2"
    ) {
      console.error("Datos de notificación CECA no válidos.");
      return cecaResponse(false);
    }

    // CECA utiliza el importe de 12 posiciones para calcular la firma.
    const paddedAmount = received.amount.padStart(12, "0");

    if (paddedAmount.length !== 12) {
      return cecaResponse(false);
    }

    const signingText =
      encryptionKey +
      received.merchantId +
      received.acquirerBin +
      received.terminalId +
      received.operation +
      paddedAmount +
      received.currency +
      received.exponent +
      received.reference;

    const expectedSignature = sha256(signingText);

    if (!sameSignature(received.signature, expectedSignature)) {
      console.error("Firma de notificación CECA no válida.");
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

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, total_cents, payment_status")
      .eq("payment_reference", received.operation)
      .maybeSingle();

    if (orderError || !order) {
      console.error("No se encontró el pedido de la notificación CECA.");
      return cecaResponse(false);
    }

    if (Number(order.total_cents) !== amountCents) {
      console.error("El importe CECA no coincide con el pedido.");
      return cecaResponse(false);
    }

    // Una repetición de una notificación válida no debe fallar.
    if (order.payment_status === "paid") {
      return cecaResponse(true);
    }

    if (order.payment_status !== "pending") {
      console.error("El pedido no está pendiente de pago.");
      return cecaResponse(false);
    }

    const { data: updatedOrder, error: updateError } = await supabase
      .from("orders")
      .update({ payment_status: "paid" })
      .eq("id", order.id)
      .eq("payment_status", "pending")
      .select("id")
      .maybeSingle();

    if (updateError || !updatedOrder) {
      console.error("No se pudo actualizar el pedido:", updateError);
      return cecaResponse(false);
    }

   const resendApiKey = process.env.RESEND_API_KEY;

if (resendApiKey) {
  try {
    const resend = new Resend(resendApiKey);

    const emailResult = await resend.emails.send({
      from: "KigobeShop <onboarding@resend.dev>",
      to: ["kigobeshop@gmail.com"],
      subject: `Pago confirmado — pedido ${order.id}`,
      text: [
        "CECA ha confirmado el pago de un pedido de KigobeShop.",
        "",
        `Pedido: ${order.id}`,
        `Importe pagado: ${(amountCents / 100).toFixed(2)} €`,
        "Estado del pago: PAGADO",
      ].join("\n"),
    });

    if (emailResult.error) {
      console.error(
        "Error enviando aviso de pago confirmado:",
        emailResult.error
      );
    }
  } catch (emailError) {
    console.error(
      "Error en el correo de pago confirmado:",
      emailError
    );
  }
}

console.log("Pago CECA confirmado para pedido:", order.id);
return cecaResponse(true);
  } catch (error) {
    console.error("Error procesando la notificación CECA:", error);
    return cecaResponse(false);
  }
}
