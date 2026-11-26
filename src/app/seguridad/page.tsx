import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const puntos = [
  {
    titulo: "Tu contraseña nunca se guarda",
    detalle:
      "Guardamos solo una huella PBKDF2-SHA256 con 150,000 iteraciones y una sal distinta para cada familia. Ni nosotros podemos ver tu contraseña real.",
  },
  {
    titulo: "Recuperación con código único",
    detalle:
      "El código de recuperación también se guarda como huella, no en texto plano, y se genera uno nuevo cada vez que lo usas.",
  },
  {
    titulo: "Documentos privados",
    detalle:
      "Las fotos de DNI, el acta del comité y los comprobantes se guardan en almacenamiento privado y solo se abren con enlaces firmados temporales.",
  },
  {
    titulo: "Todo se valida en el servidor",
    detalle:
      "La lectura y escritura de datos ocurre únicamente en el servidor, con validación de quién eres antes de mostrar o cambiar cualquier dato.",
  },
  {
    titulo: "La vista pública protege tus datos",
    detalle:
      "Cualquiera puede ver en qué se gastó la bolsa, pero la vista pública nunca muestra celulares, DNIs ni datos personales de las familias.",
  },
  {
    titulo: "Registro encadenado y verificable",
    detalle:
      "Cada aporte y cada pago queda encadenado al movimiento anterior. Si algo se alterara, la cadena dejaría de coincidir y cualquiera podría notarlo desde el enlace público.",
  },
];

export default function SeguridadPage() {
  return (
    <main className="flex-1 px-4 py-12">
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold">Cómo se protege tu información</h1>
          <p className="text-muted-foreground">
            Nuestra Bolsa maneja dinero y datos de familias, así que la seguridad es la base del diseño.
          </p>
        </div>
        <div className="space-y-4">
          {puntos.map((p) => (
            <Card key={p.titulo}>
              <CardHeader>
                <CardTitle className="text-base">{p.titulo}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">{p.detalle}</CardContent>
            </Card>
          ))}
        </div>
        <p className="text-center text-sm">
          <Link href="/" className="underline underline-offset-4">
            Volver al inicio
          </Link>
        </p>
      </div>
    </main>
  );
}
