
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
return new Response(ok ? "$*$OKY$*$" : "$*$NOK$*$", {
    status: 200,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

async function saveCecaDiagnostic(
  step: string,
  operation: string | null = null,
  details: Record<string, unknown> = {}
) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) return;

    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { error } = await supabase
      .from("ceca_notification_logs")
      .insert({ step, operation, details });

    if (error) {
      console.error("Error guardando diagnóstico CECA:", error.message);
    }
  } catch (error) {
    console.error("Error guardando diagnóstico CECA:", error);
  }
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
  await saveCecaDiagnostic("configuracion_incompleta", null, {
    merchantIdPresente: Boolean(merchantId),
    acquirerBinPresente: Boolean(acquirerBin),
    terminalIdPresente: Boolean(terminalId),
    claveCecaPresente: Boolean(encryptionKey),
    urlSupabasePresente: Boolean(supabaseUrl),
    claveSupabasePresente: Boolean(serviceKey),
  });

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
  await saveCecaDiagnostic(
    "datos_no_validos",
    received.operation || null,
    {
      merchantIdCorrecto: received.merchantId === merchantId,
      acquirerBinCorrecto: received.acquirerBin === acquirerBin,
      terminalIdCorrecto: received.terminalId === terminalId,
      operacionPresente: Boolean(received.operation),
      importeNumerico: /^\d+$/.test(received.amount),
      monedaCorrecta: received.currency === "978",
      exponenteCorrecto: received.exponent === "2",
    }
  );

  console.error("Datos de notificación CECA no válidos.");
  return cecaResponse(false);
}


    // CECA utiliza el importe de 12 posiciones para calcular la firma.
    const paddedAmount = received.amount.padStart(12, "0");

   if (paddedAmount.length !== 12) {
  await saveCecaDiagnostic(
    "formato_importe_invalido",
    received.operation || null,
    {
      longitudImporte: received.amount.length,
      longitudImporteRellenado: paddedAmount.length,
    }
  );

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
  await saveCecaDiagnostic(
    "firma_no_valida",
    received.operation || null,
    {
      merchantIdCorrecto: received.merchantId === merchantId,
      acquirerBinCorrecto: received.acquirerBin === acquirerBin,
      terminalIdCorrecto: received.terminalId === terminalId,
      importeConFormatoValido: /^\d+$/.test(received.amount),
      longitudFirmaRecibida: received.signature.length,
    }
  );

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
  await saveCecaDiagnostic(
    "pedido_no_encontrado",
    received.operation || null,
    {
      error: orderError?.message ?? null,
      pedidoEncontrado: Boolean(order),
    }
  );

  console.error("No se encontró el pedido de la notificación CECA.");
  return cecaResponse(false);
}

    
if (Number(order.total_cents) !== amountCents) {
  await saveCecaDiagnostic(
    "importe_no_coincide",
    received.operation || null,
    {
      importePedidoEnCentimos: Number(order.total_cents),
      importeCECAEnCentimos: amountCents,
    }
  );

  console.error("El importe CECA no coincide con el pedido.");
  return cecaResponse(false);
}

    // Una notificación repetida de un pedido ya pagado es válida.
    if (order.payment_status === "paid") {
      return cecaResponse(true);
    }

   
if (order.payment_status !== "pending") {
  await saveCecaDiagnostic(
    "estado_pedido_invalido",
    received.operation || null,
    {
      estadoActual: order.payment_status,
      pedidoId: order.id,
    }
  );

  console.error("El pedido no está pendiente de pago.");
  return cecaResponse(false);
}


    // Confirma el pago y consume la reserva de stock en una operación segura.
    const { data: confirmation, error: confirmationError } =
      await supabase.rpc("confirm_order_paid", {
        p_order_id: order.id,
      });

    
if (confirmationError || confirmation?.ok !== true) {
  await saveCecaDiagnostic(
    "confirmacion_pago_fallida",
    received.operation || null,
    {
      error: confirmationError?.message ?? null,
      respuestaRPC: confirmationError ? null : confirmation,
    }
  );

  console.error(
    "No se pudo confirmar el pago/reserva:",
    confirmationError ?? confirmation
  );
  return cecaResponse(false);
}


    // Si otra notificación ya confirmó el pago, no duplicamos el correo.
    if (confirmation.already_paid === true) {
      return cecaResponse(true);
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
await saveCecaDiagnostic(
  "pago_confirmado",
  received.operation || null,
  {
    pedidoId: order.id,
    importeEnCentimos: amountCents,
  }
);
    console.log("Pago CECA confirmado para pedido:", order.id);
    return cecaResponse(true);
 
} catch (error) {
  await saveCecaDiagnostic(
    "error_inesperado",
    null,
    {
      mensaje: error instanceof Error ? error.message : "Error desconocido",
    }
  );

  console.error("Error procesando la notificación CECA:", error);
  return cecaResponse(false);
}

}
