
export default function PagoErrorPage() {
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
      <h1>No se ha podido completar el pago</h1>
      <p>
        Tu pago no se ha confirmado. Puedes volver a la tienda
        y comprobar tu carrito antes de intentarlo de nuevo.
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
