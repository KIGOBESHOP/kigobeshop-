

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import {
  createHmac,
  createCipheriv,
  randomBytes,
} from "crypto";
export const runtime = "nodejs";


const CECA_PRODUCTION_URL =
  "https://pgw.ceca.es/tpvweb/tpv/compra.action";


function getCecaSignature(
  merchantId: string,
  acquirerBin: string,
  terminalId: string,
  operation: string,
  amount: string,
  urlOk: string,
  urlNok: string,
  encryptionKey: string
): string {
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

  // Paso 1: decodificar la clave del comercio.
  const decodedKey = Buffer.from(
    Buffer.from(encryptionKey, "utf8").toString("utf8"),
    "base64"
  );

  if (decodedKey.length !== 24) {
    throw new Error(
      `Clave CECA inválida: se esperaban 24 bytes y se obtuvieron ${decodedKey.length}.`
    );
  }

  // Paso 2: cifrar el número de operación con Triple DES.
  const iv = Buffer.alloc(8, 0);
  const operationBytes = Buffer.from(operation, "utf8");
  const paddingLength = (8 - (operationBytes.length % 8)) % 8;

  const paddedOperation = Buffer.concat([
    operationBytes,
    Buffer.alloc(paddingLength, 0),
  ]);

  const cipher = createCipheriv("des-ede3-cbc", decodedKey, iv);
  cipher.setAutoPadding(false);

  const encryptedOperation = Buffer.concat([
    cipher.update(paddedOperation),
    cipher.final(),
  ]);

  // Paso 3: HMAC-SHA256 y salida Base64.
  return createHmac("sha256", encryptedOperation)
    .update(signingText, "utf8")
    .digest("base64");
}
export async function POST(request: Request) {
  try {
    
const merchantId = process.env.CECA_REAL_MERCHANT_ID;
const acquirerBin = process.env.CECA_REAL_ACQUIRER_BIN;
const terminalId = process.env.CECA_REAL_TERMINAL_ID;
const encryptionKey = process.env.CECA_REAL_ENCRYPTION_KEY;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    
    const missing = [
      ["CECA_REAL_MERCHANT_ID", merchantId],
      ["CECA_REAL_ACQUIRER_BIN", acquirerBin],
      ["CECA_REAL_TERMINAL_ID", terminalId],
      ["CECA_REAL_ENCRYPTION_KEY", encryptionKey],
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
      selectedSize:
        typeof item.selectedSize === "string"
          ? item.selectedSize.slice(0, 50)
          : "",
      selectedColor:
        typeof item.selectedColor === "string"
          ? item.selectedColor.slice(0, 100)
          : "",
      selectedImage:
        typeof item.selectedImage === "string"
          ? item.selectedImage.slice(0, 2000)
          : "",
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

    const dbIds = Array.from(
      new Set(normalizedItems.map((item) => item.id - 1000000))
    );

    const supabase = createClient(
      supabaseUrl!,
      supabaseKey!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, name, price, image")
      .in("id", dbIds);

    if (
      productsError ||
      !products ||
      products.length !== dbIds.length
    ) {
      console.error("Error verificando productos:", productsError);

      return NextResponse.json(
        { error: "No se han podido verificar los productos del carrito." },
        { status: 400 }
      );
    }

    const productById = new Map(
      products.map((product) => [Number(product.id), product])
    );

    let totalCents = 0;

    for (const item of normalizedItems) {
      const product = productById.get(item.id - 1000000);
      const price = Number(product?.price);

      if (!product || !Number.isFinite(price) || price <= 0) {
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

   const urlOk = "https://www.kigobeshop.com/pago/ok";
const urlNok = "https://www.kigobeshop.com/pago/error";

    // Calculamos la firma una sola vez, antes de crear el pedido.
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
console.log("[CECA DIAGNOSTICO]", {
  merchantId,
  acquirerBin,
  terminalId,
  operation,
  amount,
  currency: "978",
  exponent: "2",
  cipher: "HMAC",
  urlOk,
  urlNok,
  signature,
});
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_name: customer.name.trim().slice(0, 150),
        customer_surname:
          typeof customer.surname === "string"
            ? customer.surname.trim().slice(0, 200)
            : "",
        customer_email: customer.email.trim().slice(0, 254),
        customer_phone: customer.phone.trim().slice(0, 50),
        customer_address: customer.address.trim().slice(0, 300),
        customer_city: customer.city.trim().slice(0, 150),
        customer_postal_code: customer.postalCode.trim().slice(0, 20),
        shipping_method:
          typeof customer.shippingMethod === "string"
            ? customer.shippingMethod.slice(0, 50)
            : "standard",
        total_cents: totalCents,
        currency: "EUR",
        payment_status: "pending",
        payment_reference: operation,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      console.error("Error guardando pedido:", orderError);

      return NextResponse.json(
        { error: "No se ha podido guardar el pedido." },
        { status: 500 }
      );
    }

    const orderItems = normalizedItems.map((item) => {
      const product = productById.get(item.id - 1000000)!;

      return {
        order_id: order.id,
        product_id: Number(product.id),
        product_name: String(product.name),
        quantity: item.qty,
        unit_price_cents: Math.round(Number(product.price) * 100),
        selected_size: item.selectedSize || null,
        selected_color: item.selectedColor || null,
        selected_image: item.selectedImage || product.image || null,
      };
    });

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Error guardando líneas del pedido:", itemsError);

      await supabase.from("orders").delete().eq("id", order.id);

      return NextResponse.json(
        { error: "No se han podido guardar los productos del pedido." },
        { status: 500 }
      );
    }

    // Reservar el stock por color y talla antes de enviar a CECA.
    const { data: reservation, error: reservationError } =
      await supabase.rpc("reserve_order_stock", {
        p_order_id: order.id,
      });

    if (reservationError) {
      console.error("No se pudo confirmar la reserva de stock:", reservationError);

      // No borramos el pedido: el resultado de la reserva podría ser incierto.
      return NextResponse.json(
        {
          error:
            "No se ha podido verificar la reserva de stock. No continúes al pago; contacta con la tienda.",
        },
        { status: 503 }
      );
    }

    if (reservation?.ok !== true) {
      console.error("Reserva de stock rechazada:", reservation);

      await supabase.from("orders").delete().eq("id", order.id);

      return NextResponse.json(
        {
          error:
            reservation?.error === "insufficient_stock"
              ? "Ya no hay suficientes unidades de este producto, color o talla."
              : "No se ha podido reservar el stock del pedido.",
        },
        { status: 409 }
      );
    }

    // Aviso por correo: pedido pendiente de confirmación del pago.
    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);

        const productSummary = orderItems
          .map(
            (item) =>
              `${item.product_name} x ${item.quantity} — ${(
                item.unit_price_cents / 100
              ).toFixed(2)} €` +
              (item.selected_color ? ` | Color: ${item.selected_color}` : "") +
              (item.selected_size ? ` | Talla: ${item.selected_size}` : "")
          )
          .join("\n");

        const emailResult = await resend.emails.send({
          from: "KigobeShop <onboarding@resend.dev>",
          to: ["kigobeshop@gmail.com"],
          subject: `Nuevo pedido ${order.id} — pago pendiente`,
          text: [
            "Se ha registrado un nuevo pedido en KigobeShop.",
            "",
            `Pedido: ${order.id}`,
            `Cliente: ${customer.name} ${customer.surname ?? ""}`,
            `Correo: ${customer.email}`,
            `Teléfono: ${customer.phone}`,
            `Dirección: ${customer.address}`,
            `Ciudad: ${customer.city}`,
            `Código postal: ${customer.postalCode}`,
            "",
            "Productos:",
            productSummary,
            "",
            `Total: ${(totalCents / 100).toFixed(2)} €`,
            "Estado del pago: PENDIENTE DE CONFIRMACIÓN",
          ].join("\n"),
        });

        if (emailResult.error) {
          console.error("Error enviando aviso del pedido:", emailResult.error);
        }
      } catch (emailError) {
        console.error("Error en la notificación por correo:", emailError);
      }
    }

    return NextResponse.json({
    action: CECA_PRODUCTION_URL,
      fields: {
        MerchantID: merchantId!,
        AcquirerBIN: acquirerBin!,
        TerminalID: terminalId!,
        Num_operacion: operation,
        Importe: amount,
        TipoMoneda: "978",
        Exponente: "2",
        URL_OK: urlOk,
        URL_NOK: urlNok,
        Firma: signature,
Cifrado: "HMAC",
Pago_soportado: "SSL",
Idioma: "1",
      },
    });
  } catch (error) {
    console.error("Error preparando pedido y pago CECA:", error);

    return NextResponse.json(
      {
        error:
          "No se ha podido preparar el pedido y el pago de pruebas.",
      },
      { status: 500 }
    );
  }
}
