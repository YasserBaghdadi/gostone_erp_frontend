/** نوع المرفق لعرض المعاينة */
export type AttachmentKind = "image" | "pdf" | "unknown";

export function inferAttachmentKindFromFile(file: File): AttachmentKind {
  if (file.type.startsWith("image/")) return "image";
  if (file.type === "application/pdf") return "pdf";
  return inferAttachmentKindFromUrl(file.name);
}

/** استنتاج من مسار URL أو اسم ملف */
export function inferAttachmentKindFromUrl(urlOrName: string): AttachmentKind {
  const path = urlOrName.split("?")[0].toLowerCase();
  if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(path)) return "image";
  if (/\.pdf$/.test(path)) return "pdf";
  return "unknown";
}
