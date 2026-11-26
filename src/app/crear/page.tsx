import { CrearBolsaWizard } from "@/components/nb/crear-bolsa-wizard";
import { requireUsuario } from "@/lib/queries";


export default async function CrearPage() {
  await requireUsuario(["admin"]);
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12">
      <CrearBolsaWizard />
    </main>
  );
}
