import { TopNav } from "@/components/nb/top-nav";
import { requireFamilia } from "@/lib/queries";

export default async function InicioLayout({ children }: { children: React.ReactNode }) {
  await requireFamilia();
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <TopNav
        titulo="Nuestra Bolsa"
        links={[
          { href: "/inicio", label: "Inicio" },
          { href: "/inicio/aportar", label: "Aportar" },
          { href: "/inicio/pagos", label: "Pagos y movimientos" },
          { href: "/elegir", label: "Mis bolsas" },
        ]}
      />
      <div className="flex-1">{children}</div>
    </div>
  );
}
