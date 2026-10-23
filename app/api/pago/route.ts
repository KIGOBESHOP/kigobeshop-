
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
      action: CECA_TEST_URL,
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
        Cifrado: "SHA2",
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
