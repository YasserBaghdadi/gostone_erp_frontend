import { Copy, ExternalLink, FileText, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AttachmentLike = {
  id: number | string;
  file: string;
  description?: string;
  created_at?: string;
};

function safeUrl(raw: string): string | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return null;
}

function getFilenameFromUrl(url: string): string {
  try {
    const { pathname } = new URL(url);
    const seg = pathname.split("/").filter(Boolean).pop() ?? "مرفق";
    return decodeURIComponent(seg);
  } catch {
    const seg = url.split("/").filter(Boolean).pop() ?? "مرفق";
    try {
      return decodeURIComponent(seg);
    } catch {
      return seg;
    }
  }
}

function getFileKind(filename: string): "pdf" | "image" | "file" {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) return "pdf";
  if (lower.endsWith(".png") || lower.endsWith(".jpg") || lower.endsWith(".jpeg") || lower.endsWith(".webp") || lower.endsWith(".gif"))
    return "image";
  return "file";
}

function formatDateAr(value?: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("ar-SA");
}

export function AttachmentLinksList({
  attachments,
  className,
  emptyLabel = "لا توجد مرفقات",
}: {
  attachments: AttachmentLike[] | undefined | null;
  className?: string;
  emptyLabel?: string;
}) {
  const list = Array.isArray(attachments) ? attachments : [];

  if (list.length === 0) {
    return <p className={cn("text-sm text-muted-foreground", className)}>{emptyLabel}</p>;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {list.map((a) => {
        const url = safeUrl(a.file);
        const filename = url ? getFilenameFromUrl(url) : "مرفق";
        const kind = getFileKind(filename);
        const createdAt = formatDateAr(a.created_at);

        const Icon = kind === "pdf" ? FileText : kind === "image" ? ImageIcon : FileText;

        return (
          <div
            key={a.id}
            className="group flex items-start justify-between gap-3 rounded-xl border border-border/60 bg-muted/10 p-3"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-start gap-2 min-w-0">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-card ring-1 ring-border/60">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate">{filename}</p>
                  {a.description?.trim() ? (
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap wrap-break-word">
                      {a.description.trim()}
                    </p>
                  ) : null}
                  {createdAt ? (
                    <p className="text-[11px] text-muted-foreground font-mono">{createdAt}</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-primary"
                disabled={!url}
                onClick={async () => {
                  if (!url) return;
                  try {
                    await navigator.clipboard.writeText(url);
                    toast.success("تم نسخ رابط المرفق");
                  } catch {
                    toast.error("تعذر نسخ الرابط");
                  }
                }}
                title="نسخ الرابط"
              >
                <Copy className="h-4 w-4" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9 text-muted-foreground hover:text-primary"
                asChild
                disabled={!url}
                title="فتح في تبويب جديد"
              >
                <a href={url ?? undefined} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

