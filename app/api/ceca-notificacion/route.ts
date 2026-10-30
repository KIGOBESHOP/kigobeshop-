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
  // CECA solo quiere un "OK" limpio en texto plano o un texto vacío con estado 200
  return new Response(ok ? "OK" : "FAIL", {
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
    await saveCecaDiagnostic("notificacion_recibida", null, {
      metodo: request.method,
      contentType: request.headers.get("content-type"),
    });

    const merchantId = process.env.CECA_REAL_MERCHANT_ID;
    const acquirerBin = process.env.CECA_REAL_ACQUIRER_BIN;
    const terminalId = process.env.CECA_REAL_TERMINAL_ID;
    const encryptionKey = process.env.CECA_REAL_ENCRYPTION_KEY;
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
      merchantId: params.get("MerchantID") || params.get("merchantID") || "",
      acquirerBin: params.get("AcquirerBIN") || params.get("acquirerBIN") || "",
      terminalId: params.get("TerminalID") || params.get("terminalID") || "",
      operation: params.get("Num_operacion") || params.get("num_operacion") || "",
      amount: params.get("Importe") || params.get("importe") || "",
      currency: params.get("TipoMoneda") || params.get("tipomoneda") || "",
      exponent: params.get("Exponente") || params.get("exponente") || "",
      reference: params.get("Referencia") || params.get("referencia") || "",
      signature: params.get("Firma") || params.get("firma") || "",
    };

    await saveCecaDiagnostic(
      "datos_notificacion_recibidos",
      received.operation || null,
      {
        camposPresentes: Object.keys(params),
        merchantIdPresente: Boolean(received.merchantId),
        acquirerBinPresente: Boolean(received.acquirerBin),
        terminalIdPresente: Boolean(received.terminalId),
        importePresente: Boolean(received.amount),
        firmaPresente: Boolean(received.signature),
      }
    );

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

    // CORREGIDO: Traemos también el email, nombre y apellidos del cliente para poder disparar el correo de bienvenida
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, total_cents, payment_status, customer_email, customer_name, customer_surname")
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

    const { data: confirmation, error: confirmationError } =
      await supabase.rpc("confirm_order_paid", {
        p_order_id: order.id,
      });

    const confirmationResult = Array.isArray(confirmation)
      ? confirmation[0]
      : confirmation;

    if (confirmationError || confirmationResult?.ok !== true) {
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

    if (confirmationResult?.already_paid === true) {
      return cecaResponse(true);
    }

    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        const emailCliente = order.customer_email || "info@kigobeshop.com";
        const nombreCliente = order.customer_name || "Comprador/a";

        // 1. Enviamos el aviso de control interno para ti (texto plano)
        await resend.emails.send({
          from: "KigobeShop <onboarding@resend.dev>",
          to: ["kigobeshop@gmail.com"],
          subject: `🚨 NUEVA VENTA — Pedido ${order.id}`,
          text: `CECA ha confirmado un pago de KigobeShop.\n\nPedido ID: ${order.id}\nImporte: ${(amountCents / 100).toFixed(2)} €\nCliente: ${nombreCliente} (${emailCliente})`,
        });
        // 2. CORREGIDO: Enviamos el correo oficial HTML de bienvenida con el cupón al cliente real
        await resend.emails.send({
          from: "KigobeShop <onboarding@resend.dev>", 
          to: [emailCliente],
          subject: "¡Oficialmente ya eres de la Crew! 🖤 Tu regalo de bienvenida dentro...",
          html: `
            <div style="max-width: 600px; margin: 0 auto; padding: 30px 20px; font-family: sans-serif; color: #333333; line-height: 1.6; background-color: #ffffff; border: 1px solid #eeeeee; border-radius: 12px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="margin: 0; font-size: 28px; font-weight: 900; letter-spacing: 2px; color: #000000;">KIGOBESHOP</h1>
                <p style="margin: 5px 0 0 0; font-size: 12px; font-weight: bold; color: #888888; text-transform: uppercase; letter-spacing: 1px;">Tu estilo, tus reglas.</p>
              </div>
              <p style="font-size: 16px; margin-bottom: 20px;">¡Hola, <strong>\${nombreCliente}</strong>!</p>
              <p style="font-size: 15px; margin-bottom: 20px;">Qué subidón tenerte por aquí. Oficialmente ya formas parte de la crew de <strong>KigobeShop</strong>, la comunidad donde tú pones las reglas y tu ropa habla por ti. 🖤</p>
              <p style="font-size: 15px; margin-bottom: 25px;">A partir de ahora vas a ser la primera persona en enterarte de los lanzamientos de nuestros nuevos bolsos, las colecciones de ropa urbana más exclusivas y las ofertas flash que vuelan en minutos.</p>
              <div style="background-color: #f9f9f9; border: 2px dashed #000000; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 30px;">
                <p style="margin: 0 0 10px 0; font-size: 14px; text-transform: uppercase; font-weight: bold; letter-spacing: 1px;">Como nos encanta empezar las cosas bien, aquí tienes un 10% de DESCUENTO directo:</p>
                <span style="font-size: 22px; font-weight: 900; color: #000000; background-color: #fff; padding: 5px 15px; border-radius: 4px; display: inline-block; letter-spacing: 1px;">🔥 BIENVENIDACREW10 🔥</span>
              </div>
              <div style="text-align: center; margin-bottom: 30px;">
                <a href="https://vercel.app" target="_blank" style="background-color: #000000; color: #ffffff; text-decoration: none; padding: 12px 30px; font-size: 15px; font-weight: bold; border-radius: 8px; display: inline-block; letter-spacing: 1px;">DESCUBRIR LA TIENDA</a>
              </div>
              <p style="font-size: 14px; color: #555555; margin-bottom: 30px;">
                Si tienes cualquier duda con tu talla, tu envío por GLS o simplemente quieres decirnos hola, escríbenos respondiendo a este correo o mándanos un WhatsApp al <strong>643 885 699</strong>. ¡Estamos al otro lado para lo que necesites!
              </p>
              <p style="font-size: 15px; font-weight: bold; margin-bottom: 0;">Pasa, ponte cómoda y encuentra tu estilo.</p>
              <p style="font-size: 14px; margin-top: 5px; color: #777777;">El equipo de KigobeShop 🛹🎒</p>
              <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eeeeee; font-size: 11px; color: #999999; text-align: center; line-height: 1.4;">
                <p style="margin: 0 0 10px 0;">Este correo electrónico ha sido enviado por Inmaculada Yepes Expósito (KigobeShop), con domicilio en Calle Granada, Plaza Primero de Mayo 27, 04008 Almería. Tratamos tus datos para gestionar tu cuenta de cliente de acuerdo con el RGPD.</p>
                <p style="margin: 0;">¿No quieres recibir más correos de la Crew? Puedes responder directamente a este email solicitando la baja.</p>
              </div>
            </div>
          `,
        });

      } catch (emailError) {
        console.error("Error en el correo de pago confirmado:", emailError);
      }
    }

    await saveCecaDiagnostic("pago_confirmado", received.operation || null, {
      pedidoId: order.id,
      importeEnCentimos: amountCents,
    });

    console.log("Pago CECA confirmado para pedido:", order.id);
    return cecaResponse(true);
  } catch (error) {
    await saveCecaDiagnostic("error_inesperado", null, {
      mensaje: error instanceof Error ? error.message : "Error desconocido",
    });

    console.error("Error procesando la notificación CECA:", error);
    return cecaResponse(false);
  }
}
