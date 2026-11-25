"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2 } from "lucide-react";

export function FileUpload({
  id,
  label,
  onUploaded,
}: {
  id: string;
  label: string;
  onUploaded: (fileId: string) => void;
}) {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatus("uploading");
    setFileName(file.name);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error al subir");
      onUploaded(data.fileId);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={handleChange} />
      {status === "uploading" && (
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" /> Subiendo {fileName}…
        </p>
      )}
      {status === "done" && (
        <p className="flex items-center gap-1 text-xs text-emerald-600">
          <CheckCircle2 className="size-3" /> {fileName} guardado de forma privada
        </p>
      )}
      {status === "error" && <p className="text-xs text-destructive">No se pudo subir el archivo</p>}
    </div>
  );
}
