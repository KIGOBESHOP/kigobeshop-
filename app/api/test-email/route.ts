
import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request: Request) {
  const secret = process.env.EMAIL_TEST_SECRET;
  const provided = request.headers.get("x-test-secret");

  if (!secret || provided !== secret) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta configurar RESEND_API_KEY" },
      { status: 500 }
    );
  }

  try {
    const resend = new Resend(apiKey);

    const result = await resend.emails.send({
      from: "KigobeShop <onboarding@resend.dev>",
      to: ["kigobeshop@gmail.com"],
      subject: "Prueba de correo de KigobeShop",
      text: "¡Hola! Esta es una prueba del aviso por correo de KigobeShop. No se ha creado ningún pedido ni se ha realizado ningún pago.",
    });

    if (result.error) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Solicitud de envío aceptada por Resend",
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo enviar el correo de prueba" },
      { status: 500 }
    );
  }
}
