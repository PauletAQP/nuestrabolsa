import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { verifyFileToken, filePath, contentTypeFor, fileExists } from "@/lib/files";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Falta el token" }, { status: 401 });

  const fileId = await verifyFileToken(token);
  if (!fileId || fileId !== id) {
    return NextResponse.json({ error: "Enlace inválido o vencido" }, { status: 403 });
  }

  if (!(await fileExists(fileId))) {
    return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });
  }

  const buffer = await readFile(filePath(fileId));
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": contentTypeFor(fileId),
      "Cache-Control": "private, max-age=60",
    },
  });
}
