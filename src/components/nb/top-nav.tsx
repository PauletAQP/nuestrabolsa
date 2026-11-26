import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function TopNav({
  titulo,
  links,
}: {
  titulo: string;
  links: { href: string; label: string }[];
}) {
  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="font-semibold">
          {titulo}
        </Link>
        <nav className="flex flex-wrap items-center gap-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className={buttonVariants({ variant: "ghost", size: "sm" })}>
              {l.label}
            </Link>
          ))}
          <form action={logoutAction}>
            <Button variant="ghost" size="sm" type="submit">
              <LogOut className="size-4" /> Salir
            </Button>
          </form>
        </nav>
      </div>
    </header>
  );
}
