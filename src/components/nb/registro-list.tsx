import { Badge } from "@/components/ui/badge";
import { formatFechaLima, TIPO_MOVIMIENTO_LABEL } from "@/lib/format";
import { CheckCircle2, XCircle } from "lucide-react";

type RegistroItem = {
  id: string;
  secuencia: number;
  tipo: string;
  detalle: string;
  codigo: string;
  anterior: string | null;
  createdDate: Date;
};

export function RegistroList({
  registros,
  validez,
}: {
  registros: RegistroItem[];
  validez?: { secuencia: number; valido: boolean }[];
}) {
  const mapaValidez = new Map(validez?.map((v) => [v.secuencia, v.valido]));

  if (registros.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no hay movimientos en esta bolsa.</p>;
  }

  return (
    <ol className="space-y-3">
      {[...registros].reverse().map((r) => {
        const valido = mapaValidez.has(r.secuencia) ? mapaValidez.get(r.secuencia) : undefined;
        return (
          <li key={r.id} className="rounded-lg border p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">#{r.secuencia}</Badge>
                  <Badge>{TIPO_MOVIMIENTO_LABEL[r.tipo] ?? r.tipo}</Badge>
                  {valido !== undefined &&
                    (valido ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-600">
                        <CheckCircle2 className="size-3.5" /> verificado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-destructive">
                        <XCircle className="size-3.5" /> no coincide
                      </span>
                    ))}
                </div>
                <p className="text-sm">{r.detalle}</p>
                <p className="font-mono text-xs text-muted-foreground break-all">
                  código: {r.codigo.slice(0, 16)}… {r.anterior ? `· anterior: ${r.anterior.slice(0, 16)}…` : "· origen de la cadena"}
                </p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">{formatFechaLima(r.createdDate)}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
