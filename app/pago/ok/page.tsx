
export default function PagoOkPage() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "24px",
        textAlign: "center",
        fontFamily: "Arial, sans-serif",
        color: "#30213c",
      }}
    >
      <div style={{ fontSize: "56px" }}>💜</div>
      <h1>¡Gracias por tu compra!</h1>
      <p>
        Estamos comprobando el estado de tu pago.
      </p>
      <p>
        Recibirás la confirmación de tu pedido cuando se verifique el pago.
      </p>
      <a
        href="/"
        style={{
          marginTop: "20px",
          padding: "12px 24px",
          borderRadius: "10px",
          background: "#6b3fa0",
          color: "#fff",
          textDecoration: "none",
        }}
      >
        Volver a KigobeShop
      </a>
    </main>
  );
}
