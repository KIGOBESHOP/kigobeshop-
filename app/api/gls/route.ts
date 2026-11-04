 if (body?.action === "shipment-production") {
      if (GLS_PRODUCTION_ENABLED) {
  return NextResponse.json(
    {
      ok: false,
      shipmentCreated: false,
      message: "La creación real de envíos GLS sigue bloqueada. Esta acción solo permite preparar y validar el XML.",
    },
    { status: 403 }
  );
}
     
      const orderId = String(body.orderId ?? "").trim();

      if (!orderId) {
        return NextResponse.json(
          { ok: false, message: "Falta el identificador del pedido." },
          { status: 400 }
        );
      }
