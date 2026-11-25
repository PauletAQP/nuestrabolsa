import { TopNav } from "@/components/nb/top-nav";
import { requireResponsable } from "@/lib/queries";
import { marcarVencidos } from "@/lib/actions/pagos";

export default async function ComiteLayout({ children }: { children: React.ReactNode }) {
  const session = await requireResponsable();
  await marcarVencidos(session.bolsaId);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <TopNav
        titulo="Nuestra Bolsa · Comité"
        links={[
          { href: "/comite", label: "Panel" },
          { href: "/comite/proponer", label: "Proponer pago" },
          { href: "/comite/familias", label: "Familias" },
          { href: "/comite/efectivo", label: "Efectivo" },
          { href: "/comite/crm", label: "CRM" },
        ]}
      />
      <div className="flex-1">{children}</div>
    </div>
  );
}
