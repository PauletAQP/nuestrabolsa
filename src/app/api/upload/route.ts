import { NextRequest, NextResponse } from "next/server";
import { saveUploadedFile, signedFileUrl } from "@/lib/files";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No se envió ningún archivo" }, { status: 400 });
  }

  try {
    const fileId = await saveUploadedFile(file);
    const url = await signedFileUrl(fileId);
    return NextResponse.json({ fileId, url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "No se pudo subir el archivo";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
