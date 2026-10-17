
import Link from "next/link";

export default function SobreNosotros() {
  return (
    <main
      style={{
        minHeight: "70vh",
        background: "linear-gradient(180deg, #f8f3fc 0%, #ffffff 100%)",
        color: "#35243f",
        padding: "70px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "850px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        <p
          style={{
            color: "#8854a5",
            letterSpacing: "3px",
            fontSize: "12px",
            fontWeight: 600,
            textTransform: "uppercase",
          }}
        >
          Bienvenida a KigobeShop
        </p>

        <h1
          style={{
            color: "#58366f",
            fontSize: "clamp(34px, 6vw, 52px)",
            margin: "18px 0",
            lineHeight: 1.15,
          }}
        >
          Detrás de KigobeShop
        </h1>

        <p
          style={{
            fontSize: "21px",
            color: "#8854a5",
            marginBottom: "35px",
          }}
        >
          Moda para sentirte tú.
        </p>

        <div
          style={{
            textAlign: "left",
            fontSize: "17px",
            lineHeight: 1.9,
          }}
        >
          <p>
            En KigobeShop creemos que vestir bien no consiste en seguir todas
            las tendencias, sino en encontrar esas prendas y accesorios que
            encajan contigo y te hacen sentir especial.
          </p>

          <p style={{ marginTop: "22px" }}>
            Hemos creado este espacio para que descubras conjuntos con estilo,
            bolsos y pequeños detalles que marcan la diferencia.
          </p>

          <p style={{ marginTop: "22px" }}>
            Queremos que encuentres inspiración para expresar tu personalidad
            a través de la moda, elegir tu propio estilo y sentirte bien con
            cada look.
          </p>
        </div>

        <p
          style={{
            color: "#58366f",
            fontSize: "21px",
            fontWeight: 600,
            margin: "38px 0",
          }}
        >
          Tu estilo, tus reglas. Bienvenida a KigobeShop.
        </p>

        <Link
          href="/"
          style={{
            display: "inline-block",
            background: "#70458b",
            color: "#ffffff",
            padding: "14px 28px",
            borderRadius: "30px",
            textDecoration: "none",
            fontWeight: 600,
          }}
        >
          Descubrir la colección
        </Link>
      </div>
    </main>
  );
}
