"use client";

import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/nb/file-upload";
import { crearBolsaAction } from "@/lib/actions/bolsa";
import type { CrearBolsaInput } from "@/lib/schemas";
import { formatSoles } from "@/lib/format";

type Responsable = CrearBolsaInput["responsables"][number];

const ROLES: Responsable["rol"][] = ["tesorero", "presidente", "secretario"];
const ROL_LABEL: Record<Responsable["rol"], string> = {
  tesorero: "Tesorero",
  presidente: "Presidente",
  secretario: "Secretario",
};

const RESPONSABLE_VACIO: Responsable = {
  nombre: "",
  apellidos: "",
  dni: "",
  celular: "",
  rol: "tesorero",
  dniFotoUri: undefined,
  contrasena: "",
};

export function CrearBolsaWizard() {
  const [paso, setPaso] = useState(1);
  const [nombre, setNombre] = useState("");
  const [colegio, setColegio] = useState("");
  const [cuota, setCuota] = useState("");
  const [estudiantesEsperados, setEstudiantesEsperados] = useState("");
  const [actaUri, setActaUri] = useState<string | undefined>();
  const [responsables, setResponsables] = useState<Responsable[]>([
    { ...RESPONSABLE_VACIO, rol: "tesorero" },
    { ...RESPONSABLE_VACIO, rol: "presidente" },
    { ...RESPONSABLE_VACIO, rol: "secretario" },
  ]);
  const [pending, startTransition] = useTransition();

  const meta = useMemo(() => {
    const c = Number(cuota) || 0;
    const e = Number(estudiantesEsperados) || 0;
    return c * e;
  }, [cuota, estudiantesEsperados]);

  function actualizarResponsable(i: number, campo: keyof Responsable, valor: string) {
    setResponsables((prev) => prev.map((r, idx) => (idx === i ? { ...r, [campo]: valor } : r)));
  }

  function validarPaso(): string | null {
    if (paso === 1) {
      if (!nombre.trim() || !colegio.trim()) return "Completa el nombre de la bolsa y el colegio";
    }
    if (paso === 2) {
      if (!cuota || Number(cuota) < 1) return "La cuota debe ser de al menos S/ 1";
      if (!estudiantesEsperados || Number(estudiantesEsperados) < 1) return "Indica cuántos estudiantes hay";
    }
    if (paso === 3) {
      for (const r of responsables) {
        if (!r.nombre.trim() || !r.apellidos.trim()) return "Completa nombres y apellidos de los 3 responsables";
        if (!/^\d{8}$/.test(r.dni)) return "Cada responsable necesita un DNI de 8 dígitos";
        if (!/^\d{9}$/.test(r.celular)) return "Cada responsable necesita un celular de 9 dígitos";
        if (r.contrasena.length < 6) return "Cada responsable necesita una contraseña de al menos 6 caracteres";
      }
      const dnis = responsables.map((r) => r.dni);
      if (new Set(dnis).size !== dnis.length) return "Los 3 responsables deben tener DNI distintos";
    }
    return null;
  }

  function siguiente() {
    const error = validarPaso();
    if (error) {
      toast.error(error);
      return;
    }
    setPaso((p) => Math.min(4, p + 1));
  }

  function crear() {
    const input: CrearBolsaInput = {
      nombre,
      colegio,
      cuota: Number(cuota),
      estudiantesEsperados: Number(estudiantesEsperados),
      actaUri,
      responsables,
    };
    startTransition(async () => {
      const res = await crearBolsaAction(input);
      if (!res.ok) toast.error(res.error);
    });
  }

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle>Crear una bolsa</CardTitle>
        <CardDescription>Paso {paso} de 4</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {paso === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre de la bolsa</Label>
              <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Bolsa 5.º A · Promoción 2027" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="colegio">Colegio</Label>
              <Input id="colegio" value={colegio} onChange={(e) => setColegio(e.target.value)} placeholder="Nombre del colegio" />
            </div>
          </div>
        )}

        {paso === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cuota">Cuota por estudiante (S/)</Label>
              <Input id="cuota" type="number" min={1} value={cuota} onChange={(e) => setCuota(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estudiantes">Estudiantes del salón</Label>
              <Input
                id="estudiantes"
                type="number"
                min={1}
                value={estudiantesEsperados}
                onChange={(e) => setEstudiantesEsperados(e.target.value)}
              />
            </div>
            <div className="rounded-lg bg-muted p-3 text-sm">
              Meta calculada: <span className="font-semibold">{formatSoles(meta)}</span>
            </div>
          </div>
        )}

        {paso === 3 && (
          <div className="space-y-6">
            {responsables.map((r, i) => (
              <div key={i} className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Responsable {i + 1}</p>
                  <Select
                    items={Object.fromEntries(ROLES.map((rol) => [rol, ROL_LABEL[rol]]))}
                    value={r.rol}
                    onValueChange={(v) => v && actualizarResponsable(i, "rol", v)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ROLES.map((rol) => (
                        <SelectItem key={rol} value={rol}>
                          {ROL_LABEL[rol]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Nombres</Label>
                    <Input value={r.nombre} onChange={(e) => actualizarResponsable(i, "nombre", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Apellidos</Label>
                    <Input value={r.apellidos} onChange={(e) => actualizarResponsable(i, "apellidos", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>DNI</Label>
                    <Input maxLength={8} value={r.dni} onChange={(e) => actualizarResponsable(i, "dni", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Celular</Label>
                    <Input maxLength={9} value={r.celular} onChange={(e) => actualizarResponsable(i, "celular", e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Contraseña de acceso al panel del comité</Label>
                  <Input
                    type="password"
                    value={r.contrasena}
                    onChange={(e) => actualizarResponsable(i, "contrasena", e.target.value)}
                  />
                </div>
                <FileUpload
                  id={`dni-foto-${i}`}
                  label="Foto del DNI (privada)"
                  onUploaded={(fileId) => actualizarResponsable(i, "dniFotoUri", fileId)}
                />
              </div>
            ))}
          </div>
        )}

        {paso === 4 && (
          <div className="space-y-4">
            <FileUpload id="acta" label="Acta firmada por los 3 responsables (privada)" onUploaded={setActaUri} />
            <div className="space-y-2 rounded-lg border p-4 text-sm">
              <p>
                <span className="text-muted-foreground">Bolsa:</span> {nombre} · {colegio}
              </p>
              <p>
                <span className="text-muted-foreground">Cuota:</span> {formatSoles(Number(cuota) || 0)} ×{" "}
                {estudiantesEsperados || 0} estudiantes = {formatSoles(meta)}
              </p>
              <p>
                <span className="text-muted-foreground">Comité:</span>{" "}
                {responsables.map((r) => `${r.nombre} (${ROL_LABEL[r.rol]})`).join(", ")}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Al crear la bolsa se generan un código de invitación para las familias y un código público de
              transparencia, y entras automáticamente al panel del comité como tesorero.
            </p>
          </div>
        )}

        <div className="flex justify-between pt-2">
          <Button variant="outline" onClick={() => setPaso((p) => Math.max(1, p - 1))} disabled={paso === 1 || pending}>
            Atrás
          </Button>
          {paso < 4 ? (
            <Button onClick={siguiente}>Siguiente</Button>
          ) : (
            <Button onClick={crear} disabled={pending}>
              {pending ? "Creando..." : "Crear bolsa"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
