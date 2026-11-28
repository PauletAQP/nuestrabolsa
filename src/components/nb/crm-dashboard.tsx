"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatSoles, formatFechaLima, MEDIO_LABEL } from "@/lib/format";
import { DescargarReporteGastos } from "@/components/nb/descargar-reporte-gastos";
import { registrarEfectivoAction } from "@/lib/actions/aportes";
import { editarFamiliaAction } from "@/lib/actions/familias";
import {
  Search,
  MessageCircle,
  Copy,
  Banknote,
  Eye,
  CheckCircle2,
  Clock,
  Target,
  TrendingUp,
  Wallet,
  Users,
  Share2,
  Phone,
  FileSpreadsheet,
  AlertCircle,
  X,
  ExternalLink,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

export type CrmFamiliaItem = {
  familia: {
    id: string;
    /** Nombre completo, para mostrar. */
    nombre: string;
    nombres: string;
    apellidos: string;
    dni: string;
    celular: string;
    estudiantes: { id: string; nombre: string }[];
  };
  cuotaEsperada: number;
  totalAportado: number;
  saldoPendiente: number;
  porcentaje: number;
  aportes: {
    id: string;
    monto: number;
    medio: string;
    estado: string;
    fecha: Date | string;
    estudianteNombre: string | null;
    codigoComprobante: string | null;
  }[];
};

type PagoReporte = {
  proveedor: string;
  motivo: string;
  monto: number;
  estado: string;
  createdDate: Date;
};

interface CrmDashboardProps {
  bolsa: {
    id: string;
    nombre: string;
    colegio: string;
    cuota: number;
    estudiantesEsperados: number | null;
    meta: number | null;
    codigoInvitacion: string;
    codigoPublico: string;
  };
  saldo: {
    totalAportado: number;
    totalPagado: number;
    saldo: number;
  };
  familias: CrmFamiliaItem[];
  pagos: PagoReporte[];
}

export function CrmDashboard({ bolsa, saldo, familias, pagos }: CrmDashboardProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroEstado, setFiltroEstado] = useState<"todos" | "pendientes" | "al_dia">("todos");
  const [orden, setOrden] = useState<"pendiente_desc" | "avance_asc" | "nombre_asc" | "aportado_desc">("pendiente_desc");

  // Modales
  const [dialogEfectivoOpen, setDialogEfectivoOpen] = useState(false);
  const [familiaSeleccionadaId, setFamiliaSeleccionadaId] = useState<string>("");
  const [estudianteSeleccionadoId, setEstudianteSeleccionadoId] = useState<string>("");
  const [montoEfectivo, setMontoEfectivo] = useState("");
  const [isPendingEfectivo, startTransitionEfectivo] = useTransition();

  const [dialogDetalleOpen, setDialogDetalleOpen] = useState(false);
  const [familiaDetalle, setFamiliaDetalle] = useState<CrmFamiliaItem | null>(null);

  const [dialogMensajeGrupalOpen, setDialogMensajeGrupalOpen] = useState(false);

  // Modal para editar familia y estudiantes
  const [dialogEditarOpen, setDialogEditarOpen] = useState(false);
  const [familiaParaEditar, setFamiliaParaEditar] = useState<{
    id: string;
    nombre: string;
    apellidos: string;
    dni: string;
    celular: string;
    estudiantes: { id?: string; nombre: string }[];
  } | null>(null);
  const [isPendingEditar, startTransitionEditar] = useTransition();

  // Cálculos globales de CRM
  const metaTotal = Number(bolsa.meta ?? 0);
  const porcentajeRecaudado = metaTotal > 0 ? Math.min(100, Math.round((saldo.totalAportado / metaTotal) * 100)) : 0;
  const familiasAlDia = familias.filter((f) => f.totalAportado >= f.cuotaEsperada).length;
  const familiasPendientes = familias.filter((f) => f.totalAportado < f.cuotaEsperada).length;
  const totalPorCobrar = familias.reduce((acc, f) => acc + f.saldoPendiente, 0);

  // Filtrado y ordenamiento de familias
  const familiasFiltradas = useMemo(() => {
    let result = [...familias];

    if (filtroEstado === "pendientes") {
      result = result.filter((f) => f.totalAportado < f.cuotaEsperada);
    } else if (filtroEstado === "al_dia") {
      result = result.filter((f) => f.totalAportado >= f.cuotaEsperada);
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(
        (f) =>
          f.familia.nombre.toLowerCase().includes(q) ||
          f.familia.dni.includes(q) ||
          f.familia.celular.includes(q) ||
          f.familia.estudiantes.some((e) => e.nombre.toLowerCase().includes(q))
      );
    }

    result.sort((a, b) => {
      if (orden === "pendiente_desc") return b.saldoPendiente - a.saldoPendiente;
      if (orden === "avance_asc") return a.porcentaje - b.porcentaje;
      if (orden === "nombre_asc") return a.familia.nombre.localeCompare(b.familia.nombre);
      if (orden === "aportado_desc") return b.totalAportado - a.totalAportado;
      return 0;
    });

    return result;
  }, [familias, filtroEstado, searchTerm, orden]);

  // Familia y estudiantes para el modal de efectivo
  const familiaSeleccionada = useMemo(
    () => familias.find((f) => f.familia.id === familiaSeleccionadaId),
    [familias, familiaSeleccionadaId]
  );
  const estudiantesDisponibles = useMemo(
    () => familiaSeleccionada?.familia.estudiantes ?? [],
    [familiaSeleccionada]
  );

  function abrirModalEfectivo(familiaId?: string) {
    const fId = familiaId || familias[0]?.familia.id || "";
    setFamiliaSeleccionadaId(fId);
    const est = familias.find((f) => f.familia.id === fId)?.familia.estudiantes[0]?.id || "";
    setEstudianteSeleccionadoId(est);
    setMontoEfectivo(String(bolsa.cuota));
    setDialogEfectivoOpen(true);
  }

  function handleCambiarFamiliaEfectivo(id: string) {
    setFamiliaSeleccionadaId(id);
    const est = familias.find((f) => f.familia.id === id)?.familia.estudiantes[0]?.id || "";
    setEstudianteSeleccionadoId(est);
  }

  function handleRegistrarEfectivo() {
    if (!familiaSeleccionadaId || !estudianteSeleccionadoId) {
      toast.error("Selecciona la familia y el estudiante");
      return;
    }
    const montoNum = Number(montoEfectivo);
    if (isNaN(montoNum) || montoNum < 1) {
      toast.error("El monto mínimo es S/ 1.00");
      return;
    }

    startTransitionEfectivo(async () => {
      const res = await registrarEfectivoAction({
        familiaId: familiaSeleccionadaId,
        estudianteId: estudianteSeleccionadoId,
        monto: montoNum,
      });

      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      toast.success("Aporte en efectivo registrado exitosamente", {
        description: "Queda pendiente de confirmación por otro miembro del comité.",
      });
      setDialogEfectivoOpen(false);
      setMontoEfectivo("");
      router.refresh();
    });
  }

  function abrirDetalleFamilia(item: CrmFamiliaItem) {
    setFamiliaDetalle(item);
    setDialogDetalleOpen(true);
  }

  function abrirModalEditar(item: CrmFamiliaItem) {
    setFamiliaParaEditar({
      id: item.familia.id,
      nombre: item.familia.nombres,
      apellidos: item.familia.apellidos,
      dni: item.familia.dni,
      celular: item.familia.celular,
      estudiantes: item.familia.estudiantes.map((e) => ({ id: e.id, nombre: e.nombre })),
    });
    setDialogEditarOpen(true);
  }

  function agregarEstudianteEditar() {
    if (!familiaParaEditar) return;
    setFamiliaParaEditar({
      ...familiaParaEditar,
      estudiantes: [...familiaParaEditar.estudiantes, { id: `nuevo_${Date.now()}`, nombre: "" }],
    });
  }

  function quitarEstudianteEditar(index: number) {
    if (!familiaParaEditar || familiaParaEditar.estudiantes.length <= 1) {
      toast.error("Debe haber al menos un estudiante registrado");
      return;
    }
    const nuevos = familiaParaEditar.estudiantes.filter((_, i) => i !== index);
    setFamiliaParaEditar({ ...familiaParaEditar, estudiantes: nuevos });
  }

  function cambiarNombreEstudianteEditar(index: number, nuevoNombre: string) {
    if (!familiaParaEditar) return;
    const nuevos = [...familiaParaEditar.estudiantes];
    nuevos[index] = { ...nuevos[index], nombre: nuevoNombre };
    setFamiliaParaEditar({ ...familiaParaEditar, estudiantes: nuevos });
  }

  function handleGuardarEdicion() {
    if (!familiaParaEditar) return;
    if (!familiaParaEditar.nombre.trim()) return toast.error("Los nombres del padre o madre son requeridos");
    if (!familiaParaEditar.apellidos.trim()) return toast.error("Los apellidos del padre o madre son requeridos");
    if (!/^\d{8}$/.test(familiaParaEditar.dni.trim())) return toast.error("El DNI debe tener exactamente 8 dígitos");
    if (!/^\d{9}$/.test(familiaParaEditar.celular.trim())) return toast.error("El celular debe tener 9 dígitos");
    if (familiaParaEditar.estudiantes.some((e) => !e.nombre.trim())) {
      return toast.error("El nombre de todos los estudiantes es requerido");
    }

    startTransitionEditar(async () => {
      const res = await editarFamiliaAction({
        familiaId: familiaParaEditar.id,
        nombre: familiaParaEditar.nombre,
        apellidos: familiaParaEditar.apellidos,
        dni: familiaParaEditar.dni,
        celular: familiaParaEditar.celular,
        estudiantes: familiaParaEditar.estudiantes.map((e) => ({
          id: e.id,
          nombre: e.nombre,
        })),
      });

      if (!res.ok) {
        toast.error(res.error);
        return;
      }

      toast.success("Familia actualizada con éxito", {
        description: "Se guardaron los cambios de contacto y estudiantes.",
      });
      setDialogEditarOpen(false);
      router.refresh();
    });
  }

  // Generadores de mensajes de WhatsApp
  function generarMensajeIndividual(item: CrmFamiliaItem): string {
    const estudiantesStr = item.familia.estudiantes.map((e) => e.nombre).join(" y ");
    if (item.saldoPendiente > 0) {
      return (
        `👋 Hola *${item.familia.nombre}*, te saludamos cordialmente del comité de *${bolsa.nombre}*.\n\n` +
        `Te recordamos que tienes una cuota pendiente de *${formatSoles(item.saldoPendiente)}* correspondiente a: *${estudiantesStr}*.\n\n` +
        `Total esperado: ${formatSoles(item.cuotaEsperada)}\n` +
        `Aportado a la fecha: ${formatSoles(item.totalAportado)}\n\n` +
        `Puedes realizar tu aporte por Yape / Plin o en efectivo con el tesorero.\n` +
        `¡Agradecemos mucho tu valioso apoyo para las actividades de nuestros hijos! 🙏`
      );
    } else {
      return (
        `👋 Hola *${item.familia.nombre}*, te saludamos del comité de *${bolsa.nombre}*.\n\n` +
        `Queremos agradecerte y confirmarte que estás *100% al día* con la cuota escolar de: *${estudiantesStr}* (${formatSoles(item.totalAportado)}).\n\n` +
        `¡Muchas gracias por tu compromiso y puntualidad con el salón! ⭐`
      );
    }
  }

  function handleEnviarWhatsApp(item: CrmFamiliaItem) {
    const celularLimpio = item.familia.celular.replace(/\D/g, "");
    if (!celularLimpio) {
      toast.error("La familia no tiene un celular registrado");
      return;
    }
    const mensaje = generarMensajeIndividual(item);
    const url = `https://wa.me/51${celularLimpio}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
  }

  function handleCopiarMensaje(item: CrmFamiliaItem) {
    const mensaje = generarMensajeIndividual(item);
    navigator.clipboard.writeText(mensaje);
    toast.success("Mensaje para WhatsApp copiado al portapapeles");
  }

  function handleCopiarInvitacion() {
    const url = `${window.location.origin}/unirse/${bolsa.codigoInvitacion}`;
    const texto = `¡Hola! Únete a la bolsa de nuestro salón "${bolsa.nombre}" ingresando a este enlace con tu DNI: ${url}`;
    navigator.clipboard.writeText(texto);
    toast.success("Enlace de invitación copiado al portapapeles", {
      description: "Compártelo con los padres del salón para que ingresen.",
    });
  }

  function generarMensajeGrupal(): string {
    const pendientes = familias.filter((f) => f.saldoPendiente > 0);
    const alDia = familias.filter((f) => f.saldoPendiente === 0);

    let texto =
      `📢 *COMUNICADO DEL COMITÉ · ${bolsa.nombre.toUpperCase()}*\n` +
      `🏫 Colegio: ${bolsa.colegio}\n` +
      `--------------------------------------\n` +
      `📊 *ESTADO GENERAL DE LA BOLSA:*\n` +
      `• Meta total del salón: ${formatSoles(metaTotal)}\n` +
      `• Total recaudado: ${formatSoles(saldo.totalAportado)} (${porcentajeRecaudado}%)\n` +
      `• Saldo en caja disponible: ${formatSoles(saldo.saldo)}\n` +
      `• Familias al día: ${familiasAlDia} de ${familias.length}\n` +
      `--------------------------------------\n\n`;

    if (pendientes.length > 0) {
      texto += `⚠️ *FAMILIAS CON CUOTA PENDIENTE:*\n`;
      pendientes.forEach((p) => {
        texto += `• ${p.familia.nombre} → Pendiente: ${formatSoles(p.saldoPendiente)}\n`;
      });
      texto += `\nLes recordamos realizar su aporte vía Yape, Plin o en efectivo con la tesorería.\n\n`;
    }

    if (alDia.length > 0) {
      texto += `✅ *FAMILIAS AL DÍA:*\n`;
      alDia.forEach((a) => {
        texto += `• ${a.familia.nombre} (¡Muchas gracias!)\n`;
      });
      texto += `\n`;
    }

    texto += `Enlace de transparencia de la bolsa:\n${typeof window !== "undefined" ? window.location.origin : ""}/ver/${bolsa.codigoPublico}\n\n¡Gracias a todos por su colaboración! 🙌`;
    return texto;
  }

  function handleCopiarMensajeGrupal() {
    const texto = generarMensajeGrupal();
    navigator.clipboard.writeText(texto);
    toast.success("Resumen grupal copiado para WhatsApp");
    setDialogMensajeGrupalOpen(false);
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      {/* Encabezado Principal */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">CRM de la bolsa</h1>
            <Badge variant="outline" className="border-primary/20 bg-primary/5 text-xs text-primary">
              Comité
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {bolsa.nombre} · {bolsa.colegio}
          </p>
        </div>

        {/* Barra de Acciones Globales */}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setDialogMensajeGrupalOpen(true)} className="gap-1.5">
            <Share2 className="size-4 text-emerald-600" />
            <span className="hidden sm:inline">Mensaje al</span> Grupo
          </Button>

          <Button variant="outline" size="sm" onClick={handleCopiarInvitacion} className="gap-1.5">
            <Copy className="size-4" />
            Invitación
          </Button>

          <DescargarReporteGastos
            bolsaNombre={bolsa.nombre}
            colegio={bolsa.colegio}
            saldo={saldo.saldo}
            totalAportado={saldo.totalAportado}
            totalPagado={saldo.totalPagado}
            pagos={pagos}
          />

          <Button size="sm" onClick={() => abrirModalEfectivo()} className="gap-1.5">
            <Banknote className="size-4" />
            Registrar efectivo
          </Button>
        </div>
      </div>

      {/* Tarjetas KPI de Resumen */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Meta */}
        <Card className="relative overflow-hidden border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">Meta del salón</CardDescription>
            <div className="flex size-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Target className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatSoles(metaTotal)}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              {bolsa.estudiantesEsperados ?? 0} alumnos · {formatSoles(bolsa.cuota)} por cuota
            </p>
          </CardContent>
        </Card>

        {/* Aportado */}
        <Card className="relative overflow-hidden border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">Total aportado</CardDescription>
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <TrendingUp className="size-4" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="text-2xl font-bold">{formatSoles(saldo.totalAportado)}</div>
              <span className="text-xs font-semibold text-emerald-600">{porcentajeRecaudado}%</span>
            </div>
            <Progress value={porcentajeRecaudado} className="h-1.5" />
          </CardContent>
        </Card>

        {/* Saldo disponible */}
        <Card className="relative overflow-hidden border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">Saldo en caja</CardDescription>
            <div className="flex size-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-400">
              <Wallet className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatSoles(saldo.saldo)}</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Gastos pagados: {formatSoles(saldo.totalPagado)}
            </p>
          </CardContent>
        </Card>

        {/* Estado de Cobranza */}
        <Card className="relative overflow-hidden border-border/80 shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardDescription className="text-xs font-medium uppercase tracking-wider">Por cobrar</CardDescription>
            <div className="flex size-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <AlertCircle className="size-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-500">{formatSoles(totalPorCobrar)}</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="font-semibold text-emerald-600">{familiasAlDia} al día</span> ·{" "}
              <span className="font-semibold text-amber-600">{familiasPendientes} pendientes</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Card Principal: Tabla Interactiva con Búsqueda y Acciones */}
      <Card className="border-border/80 shadow-xs">
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Dinero por padre y cobranza</CardTitle>
              <CardDescription>
                Supervisa el estado de cada familia, contáctalos por WhatsApp y registra pagos en efectivo.
              </CardDescription>
            </div>

            {/* Selector de orden */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Ordenar:</span>
              <select
                value={orden}
                onChange={(e) => setOrden(e.target.value as any)}
                className="h-8 rounded-lg border border-input bg-background px-2.5 text-xs font-medium shadow-2xs outline-none focus:ring-1 focus:ring-ring"
              >
                <option value="pendiente_desc">Mayor saldo pendiente</option>
                <option value="avance_asc">Menor avance (%)</option>
                <option value="nombre_asc">Familia (A - Z)</option>
                <option value="aportado_desc">Mayor aporte realizado</option>
              </select>
            </div>
          </div>

          {/* Barra de Filtros y Búsqueda */}
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Buscador */}
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por padre, estudiante o DNI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 pl-8 pr-8 text-xs sm:text-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Pills de estado */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setFiltroEstado("todos")}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filtroEstado === "todos"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Todos ({familias.length})
              </button>
              <button
                type="button"
                onClick={() => setFiltroEstado("pendientes")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filtroEstado === "pendientes"
                    ? "bg-amber-600 text-white"
                    : "bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300"
                }`}
              >
                <span className="size-1.5 rounded-full bg-amber-500" />
                Pendientes ({familiasPendientes})
              </button>
              <button
                type="button"
                onClick={() => setFiltroEstado("al_dia")}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filtroEstado === "al_dia"
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300"
                }`}
              >
                <span className="size-1.5 rounded-full bg-emerald-500" />
                Al día ({familiasAlDia})
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 sm:p-6 sm:pt-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-[280px]">Familia y Estudiantes</TableHead>
                  <TableHead className="w-[110px]">Esperado</TableHead>
                  <TableHead className="w-[140px]">Aportado</TableHead>
                  <TableHead className="w-[110px]">Por Pagar</TableHead>
                  <TableHead className="w-[110px]">Estado</TableHead>
                  <TableHead className="w-[180px] text-right pr-4">Acciones CRM</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {familiasFiltradas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No se encontraron familias con los filtros aplicados.
                    </TableCell>
                  </TableRow>
                ) : (
                  familiasFiltradas.map((item) => {
                    const estaAlDia = item.totalAportado >= item.cuotaEsperada;
                    const estudiantesList = item.familia.estudiantes;

                    return (
                      <TableRow key={item.familia.id} className="transition-colors hover:bg-muted/30">
                        {/* Familia y Estudiantes */}
                        <TableCell className="align-top py-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">{item.familia.nombre}</span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                              <span>DNI: {item.familia.dni}</span>
                              <span>•</span>
                              <span className="flex items-center gap-0.5">
                                <Phone className="size-3" />
                                {item.familia.celular}
                              </span>
                            </div>

                            {/* Chips de estudiantes */}
                            <div className="flex flex-wrap gap-1 pt-1">
                              {estudiantesList.map((e) => (
                                <span
                                  key={e.id}
                                  className="inline-flex items-center rounded-md bg-secondary/80 px-1.5 py-0.5 text-[11px] font-medium text-secondary-foreground"
                                >
                                  {e.nombre}
                                </span>
                              ))}
                            </div>
                          </div>
                        </TableCell>

                        {/* Esperado */}
                        <TableCell className="align-top py-3">
                          <div className="font-medium text-foreground">{formatSoles(item.cuotaEsperada)}</div>
                          <span className="text-[11px] text-muted-foreground">
                            {estudiantesList.length} {estudiantesList.length === 1 ? "cuota" : "cuotas"}
                          </span>
                        </TableCell>

                        {/* Aportado y Avance */}
                        <TableCell className="align-top py-3">
                          <div className="space-y-1.5">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-semibold">{formatSoles(item.totalAportado)}</span>
                              <span className="text-[11px] text-muted-foreground">{item.porcentaje}%</span>
                            </div>
                            <Progress value={item.porcentaje} className="h-1.5" />
                          </div>
                        </TableCell>

                        {/* Por Pagar / Pendiente */}
                        <TableCell className="align-top py-3">
                          {item.saldoPendiente > 0 ? (
                            <span className="font-semibold text-amber-600 dark:text-amber-500">
                              {formatSoles(item.saldoPendiente)}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="size-3.5" /> S/ 0.00
                            </span>
                          )}
                        </TableCell>

                        {/* Badge de Estado */}
                        <TableCell className="align-top py-3">
                          <Badge
                            variant={estaAlDia ? "default" : "secondary"}
                            className={
                              estaAlDia
                                ? "bg-emerald-600 hover:bg-emerald-600 text-white font-medium gap-1 text-xs"
                                : "bg-amber-100 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 font-medium gap-1 text-xs"
                            }
                          >
                            {estaAlDia ? <CheckCircle2 className="size-3" /> : <Clock className="size-3" />}
                            {estaAlDia ? "Al día" : "Pendiente"}
                          </Badge>
                        </TableCell>

                        {/* Acciones CRM */}
                        <TableCell className="align-top py-3 text-right pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* WhatsApp Directo */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEnviarWhatsApp(item)}
                              title="Enviar recordatorio por WhatsApp"
                              className="h-8 border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60"
                            >
                              <MessageCircle className="size-3.5" />
                              <span className="hidden xl:inline text-xs font-medium">WhatsApp</span>
                            </Button>

                            {/* Copiar Mensaje */}
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => handleCopiarMensaje(item)}
                              title="Copiar texto de recordatorio"
                            >
                              <Copy className="size-3.5" />
                            </Button>

                            {/* Registrar Efectivo directo para esta familia */}
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => abrirModalEfectivo(item.familia.id)}
                              title="Registrar pago en efectivo"
                            >
                              <Banknote className="size-3.5 text-blue-600" />
                            </Button>

                            {/* Ver detalle y aportes */}
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => abrirDetalleFamilia(item)}
                              title="Ver detalle de aportes"
                            >
                              <Eye className="size-3.5" />
                            </Button>

                            {/* Editar familia (nombre, celular, alumnos) */}
                            <Button
                              size="icon-sm"
                              variant="ghost"
                              onClick={() => abrirModalEditar(item)}
                              title="Editar familia (contacto y estudiantes)"
                            >
                              <Pencil className="size-3.5 text-muted-foreground hover:text-foreground" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL 1: Registrar Efectivo Rápido */}
      <Dialog open={dialogEfectivoOpen} onOpenChange={setDialogEfectivoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="size-5 text-emerald-600" />
              Registrar aporte en efectivo
            </DialogTitle>
            <DialogDescription>
              Anota el dinero entregado por el padre de familia. Quedará pendiente de confirmación por otro miembro del
              comité.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Familia */}
            <div className="space-y-1.5">
              <Label className="text-xs">Familia</Label>
              <Select
                items={Object.fromEntries(familias.map((f) => [f.familia.id, f.familia.nombre]))}
                value={familiaSeleccionadaId}
                onValueChange={(v) => v && handleCambiarFamiliaEfectivo(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {familias.map((f) => (
                    <SelectItem key={f.familia.id} value={f.familia.id}>
                      {f.familia.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estudiante */}
            <div className="space-y-1.5">
              <Label className="text-xs">Estudiante a nombre de quien aporta</Label>
              <Select
                items={Object.fromEntries(estudiantesDisponibles.map((e) => [e.id, e.nombre]))}
                value={estudianteSeleccionadoId}
                onValueChange={(v) => v && setEstudianteSeleccionadoId(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {estudiantesDisponibles.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Monto */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Monto en soles (S/)</Label>
                {familiaSeleccionada && familiaSeleccionada.saldoPendiente > 0 && (
                  <button
                    type="button"
                    onClick={() => setMontoEfectivo(String(familiaSeleccionada.saldoPendiente))}
                    className="text-[11px] text-primary underline underline-offset-2"
                  >
                    Llenar saldo pendiente ({formatSoles(familiaSeleccionada.saldoPendiente)})
                  </button>
                )}
              </div>
              <Input
                type="number"
                min="1"
                step="0.5"
                placeholder="50"
                value={montoEfectivo}
                onChange={(e) => setMontoEfectivo(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogEfectivoOpen(false)} disabled={isPendingEfectivo}>
              Cancelar
            </Button>
            <Button onClick={handleRegistrarEfectivo} disabled={isPendingEfectivo}>
              {isPendingEfectivo ? "Guardando..." : "Guardar efectivo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Detalle de Aportes de la Familia */}
      <Dialog open={dialogDetalleOpen} onOpenChange={setDialogDetalleOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="size-5 text-primary" />
              Detalle de la Familia
            </DialogTitle>
            <DialogDescription>
              Información de contacto, avance de cuotas e historial de aportes registrados.
            </DialogDescription>
          </DialogHeader>

          {familiaDetalle && (
            <div className="space-y-4 py-2">
              {/* Resumen de la familia */}
              <div className="rounded-lg border bg-muted/40 p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm text-foreground">{familiaDetalle.familia.nombre}</span>
                  <Badge variant={familiaDetalle.totalAportado >= familiaDetalle.cuotaEsperada ? "default" : "secondary"}>
                    {familiaDetalle.totalAportado >= familiaDetalle.cuotaEsperada ? "Al día" : "Pendiente"}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                  <div>DNI: {familiaDetalle.familia.dni}</div>
                  <div>Celular: {familiaDetalle.familia.celular}</div>
                  <div>Esperado: {formatSoles(familiaDetalle.cuotaEsperada)}</div>
                  <div>Aportado: {formatSoles(familiaDetalle.totalAportado)}</div>
                </div>
                <div className="pt-1">
                  <span className="text-muted-foreground">Hijos inscritos: </span>
                  <span className="font-medium text-foreground">
                    {familiaDetalle.familia.estudiantes.map((e) => e.nombre).join(", ")}
                  </span>
                </div>
              </div>

              {/* Historial de aportes */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Aportes confirmados ({familiaDetalle.aportes.length})
                </h4>

                {familiaDetalle.aportes.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-4 text-center text-xs text-muted-foreground">
                    Esta familia todavía no registra aportes confirmados.
                  </p>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {familiaDetalle.aportes.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between rounded-lg border p-2.5 text-xs bg-background"
                      >
                        <div>
                          <div className="font-semibold text-foreground">
                            {formatSoles(a.monto)} · {MEDIO_LABEL[a.medio] ?? a.medio}
                          </div>
                          <div className="text-muted-foreground">
                            Para: {a.estudianteNombre ?? "Estudiante"} · {formatFechaLima(a.fecha)}
                          </div>
                        </div>
                        {a.codigoComprobante && (
                          <span className="rounded font-mono text-[10px] bg-muted px-1.5 py-0.5">
                            {a.codigoComprobante}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {familiaDetalle && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleEnviarWhatsApp(familiaDetalle);
                }}
                className="gap-1.5 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
              >
                <MessageCircle className="size-4" />
                Contactar por WhatsApp
              </Button>
            )}
            <Button variant="default" size="sm" onClick={() => setDialogDetalleOpen(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: Mensaje Masivo para Grupo de WhatsApp */}
      <Dialog open={dialogMensajeGrupalOpen} onOpenChange={setDialogMensajeGrupalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="size-5 text-emerald-600" />
              Mensaje de Cobranza para el Grupo de Padres
            </DialogTitle>
            <DialogDescription>
              Copia este resumen prearmado y pégalo directamente en el grupo de WhatsApp del aula escolar.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <textarea
              readOnly
              rows={12}
              value={generarMensajeGrupal()}
              className="w-full rounded-lg border bg-muted/30 p-3 font-mono text-xs leading-relaxed outline-none focus:ring-1 focus:ring-ring"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogMensajeGrupalOpen(false)}>
              Cerrar
            </Button>
            <Button onClick={handleCopiarMensajeGrupal} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
              <Copy className="size-4" />
              Copiar texto para WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 4: Editar Familia y Estudiantes */}
      <Dialog open={dialogEditarOpen} onOpenChange={setDialogEditarOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="size-5 text-primary" />
              Editar Familia y Estudiantes
            </DialogTitle>
            <DialogDescription>
              Modifica los datos de contacto y la lista de hijos/estudiantes a cargo de esta familia.
            </DialogDescription>
          </DialogHeader>

          {familiaParaEditar && (
            <div className="space-y-4 py-2">
              {/* Nombres y apellidos en 2 columnas */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Nombres del padre o apoderado</Label>
                  <Input
                    value={familiaParaEditar.nombre}
                    onChange={(e) =>
                      setFamiliaParaEditar({ ...familiaParaEditar, nombre: e.target.value })
                    }
                    placeholder="Ej. Rosa Elena"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Apellidos</Label>
                  <Input
                    value={familiaParaEditar.apellidos}
                    onChange={(e) =>
                      setFamiliaParaEditar({ ...familiaParaEditar, apellidos: e.target.value })
                    }
                    placeholder="Ej. Quispe Mamani"
                  />
                </div>
              </div>

              {/* DNI y Celular en 2 columnas */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">DNI (8 dígitos)</Label>
                  <Input
                    value={familiaParaEditar.dni}
                    maxLength={8}
                    onChange={(e) =>
                      setFamiliaParaEditar({
                        ...familiaParaEditar,
                        dni: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    placeholder="40123456"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Celular WhatsApp (9 dígitos)</Label>
                  <Input
                    value={familiaParaEditar.celular}
                    maxLength={9}
                    onChange={(e) =>
                      setFamiliaParaEditar({
                        ...familiaParaEditar,
                        celular: e.target.value.replace(/\D/g, ""),
                      })
                    }
                    placeholder="940123456"
                  />
                </div>
              </div>

              {/* Estudiantes / Hijos */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold">
                    Estudiantes en el salón ({familiaParaEditar.estudiantes.length})
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    onClick={agregarEstudianteEditar}
                    className="h-7 text-xs gap-1"
                  >
                    <Plus className="size-3" />
                    Agregar hermano
                  </Button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {familiaParaEditar.estudiantes.map((est, idx) => (
                    <div key={est.id ?? idx} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-4 text-center">{idx + 1}.</span>
                      <Input
                        value={est.nombre}
                        onChange={(e) => cambiarNombreEstudianteEditar(idx, e.target.value)}
                        placeholder="Nombre y apellidos del estudiante"
                        className="h-8 text-xs flex-1"
                      />
                      {familiaParaEditar.estudiantes.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => quitarEstudianteEditar(idx)}
                          title="Quitar estudiante"
                          className="text-muted-foreground hover:text-destructive shrink-0"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Nota: Al modificar la cantidad de estudiantes, la cuota total esperada para la familia se recalcula automáticamente en el CRM.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDialogEditarOpen(false)} disabled={isPendingEditar}>
              Cancelar
            </Button>
            <Button onClick={handleGuardarEdicion} disabled={isPendingEditar}>
              {isPendingEditar ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
