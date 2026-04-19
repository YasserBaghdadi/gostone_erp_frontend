import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileWarning } from "lucide-react";
import type { AttachmentKind } from "@/lib/attachmentPreview";

type AttachmentPreviewDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  /** رابط مباشر (https) أو blob: من createObjectURL */
  src: string | null;
  kind: AttachmentKind;
  fileName?: string;
};

export function AttachmentPreviewDialog({
  open,
  onOpenChange,
  title = "معاينة الملف",
  src,
  kind,
  fileName,
}: AttachmentPreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className='max-w-4xl w-[min(96vw,56rem)] h-[min(88vh,720px)] flex flex-col p-0 gap-0 overflow-hidden'
        dir='rtl'
        aria-describedby={undefined}
      >
        <DialogHeader className='px-4 py-3 border-b shrink-0 space-y-1'>
          <DialogTitle className='text-base leading-tight'>{title}</DialogTitle>
          {fileName ? (
            <p className='text-xs text-muted-foreground truncate' title={fileName}>
              {fileName}
            </p>
          ) : null}
        </DialogHeader>

        <div className='flex-1 min-h-0 flex flex-col bg-muted/20'>
          {src && kind === "image" && (
            <div className='flex-1 min-h-0 flex items-center justify-center p-4 overflow-auto'>
              <img
                src={src}
                alt={fileName || "معاينة"}
                className='max-h-full max-w-full object-contain rounded-md'
              />
            </div>
          )}

          {src && kind === "pdf" && (
            <div className='flex-1 min-h-0 flex flex-col'>
              <iframe
                title={fileName || "PDF"}
                src={src}
                className='w-full flex-1 min-h-[50vh] border-0 bg-background'
              />
              <div className='shrink-0 flex justify-center gap-2 py-2 px-3 border-t bg-muted/30'>
                <Button variant='outline' size='sm' asChild>
                  <a href={src} target='_blank' rel='noopener noreferrer'>
                    <ExternalLink className='h-3.5 w-3.5 ml-1.5' />
                    فتح في نافذة جديدة
                  </a>
                </Button>
              </div>
            </div>
          )}

          {src && kind === "unknown" && (
            <div className='flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center'>
              <FileWarning className='h-12 w-12 text-muted-foreground' />
              <p className='text-sm text-muted-foreground max-w-sm'>
                لا تتوفر معاينة مباشرة لهذا النوع من الملفات. يمكنك فتحه في
                نافذة جديدة.
              </p>
              <Button asChild>
                <a href={src} target='_blank' rel='noopener noreferrer'>
                  <ExternalLink className='h-4 w-4 ml-2' />
                  فتح الملف
                </a>
              </Button>
            </div>
          )}

          {!src && (
            <div className='flex-1 flex items-center justify-center p-8 text-muted-foreground text-sm'>
              لا يوجد ملف للعرض
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
