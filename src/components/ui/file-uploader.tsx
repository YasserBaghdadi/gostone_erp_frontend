import { useCallback, useEffect, useState, useRef } from "react";
import { useController, type Control, type FieldValues, type Path } from "react-hook-form";
import {
  UploadCloud,
  X,
  File as FileIcon,
  CheckCircle,
  AlertCircle,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AttachmentPreviewDialog } from "@/components/shared/AttachmentPreviewDialog";
import {
  inferAttachmentKindFromFile,
  inferAttachmentKindFromUrl,
  type AttachmentKind,
} from "@/lib/attachmentPreview";

function fileLabelFromUrl(url: string): string {
  try {
    const u = new URL(url);
    const seg = u.pathname.split("/").filter(Boolean).pop();
    return seg ? decodeURIComponent(seg) : "مرفق محفوظ";
  } catch {
    const seg = url.split("/").filter(Boolean).pop();
    return seg ? decodeURIComponent(seg) : "مرفق محفوظ";
  }
}

interface FileUploaderProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label?: string;
  accept?: Record<string, string[]>; // Mimic react-dropzone accept format: { 'image/*': ['.png', '.jpg'] }
  maxSizeInMB?: number;
  multiple?: boolean;
  className?: string;
  description?: string;
}

export function FileUploader<T extends FieldValues>({
  control,
  name,
  label,
  accept,
  maxSizeInMB = 5,
  multiple = false,
  className,
  description = "اسحب وأفلت الملفات هنا أو اضغط للاختيار",
}: FileUploaderProps<T>) {
  const {
    field: { onChange, value, ref },
    fieldState: { error },
  } = useController({
    name,
    control,
  });

  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<{
    url: string;
    kind: AttachmentKind;
    name: string;
  } | null>(null);

  const openAttachmentPreview = useCallback((source: File | string) => {
    setPreview((prev) => {
      if (prev?.url.startsWith("blob:")) URL.revokeObjectURL(prev.url);
      if (source instanceof File) {
        const url = URL.createObjectURL(source);
        return {
          url,
          kind: inferAttachmentKindFromFile(source),
          name: source.name,
        };
      }
      return {
        url: source,
        kind: inferAttachmentKindFromUrl(source),
        name: fileLabelFromUrl(source),
      };
    });
  }, []);

  const onPreviewOpenChange = useCallback((open: boolean) => {
    if (!open) {
      setPreview((p) => {
        if (p?.url.startsWith("blob:")) URL.revokeObjectURL(p.url);
        return null;
      });
    }
  }, []);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxSizeInMB * 1024 * 1024) {
        return `حجم الملف ${file.name} يتجاوز ${maxSizeInMB} ميجابايت`;
      }

      if (accept) {
        const fileType = file.type;
        const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`;

        const isValidType = Object.entries(accept).some(([mimeType, extensions]) => {
          if (mimeType === "*/*") return true;
          if (mimeType.endsWith("/*")) {
            const baseMime = mimeType.split("/")[0];
            return fileType.startsWith(baseMime + "/");
          }
          if (fileType === mimeType) return true;
          return extensions.includes(fileExtension);
        });

        if (!isValidType) {
          return `نوع الملف ${file.name} غير مدعوم`;
        }
      }
      return null;
    },
    [maxSizeInMB, accept],
  );

  const handleFiles = useCallback(
    (files: FileList | File[]) => {
      const validFiles: File[] = [];
      const errors: string[] = [];

      Array.from(files).forEach((file) => {
        const errorMsg = validateFile(file);
        if (errorMsg) {
          errors.push(errorMsg);
        } else {
          validFiles.push(file);
        }
      });

      if (errors.length > 0) {
        alert(errors.join("\n"));
      }

      if (validFiles.length > 0) {
        if (multiple) {
          const cur = Array.isArray(value) ? value : [];
          const fileOnly = cur.filter(
            (v: unknown): v is File => v instanceof File,
          );
          onChange([...fileOnly, ...validFiles]);
        } else {
          onChange(validFiles[0]);
        }
      }
    },
    [multiple, onChange, value, validateFile],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
    // Reset value to allow selecting the same file again if needed
    if (inputRef.current) inputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    if (multiple && Array.isArray(value)) {
        const newFiles = [...value];
        newFiles.splice(index, 1);
        onChange(newFiles);
    } else {
        onChange(null);
    }
  };

  const rawValue = value as unknown;
  const currentFiles = multiple
    ? Array.isArray(rawValue)
      ? rawValue.filter((v: unknown): v is File => v instanceof File)
      : []
    : rawValue instanceof File
      ? [rawValue]
      : [];

  const existingFileUrl =
    !multiple &&
    typeof rawValue === "string" &&
    rawValue.trim().length > 0
      ? rawValue.trim()
      : null;

  return (
    <div className={cn("space-y-3", className)}>
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </label>
      )}

      <div
        onClick={() => inputRef.current?.click()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden",
          "min-h-[140px] px-6 py-8",
          isDragActive
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30 content-visibility-auto",
          error && "border-destructive/50 bg-destructive/5"
        )}
      >
        <input
          {...ref}
          ref={inputRef}
          type="file"
          className="hidden"
          multiple={multiple}
          onChange={handleChange}
          accept={accept ? Object.keys(accept).join(",") : undefined}
        />

        <div className={cn("flex flex-col items-center gap-3 text-center transition-all duration-300", isDragActive ? "scale-110" : "scale-100")}>
           <div className={cn(
               "p-3 rounded-full shadow-sm transition-colors",
               isDragActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
           )}>
                <UploadCloud className="w-6 h-6" />
           </div>
           
           <div className="space-y-1">
               <p className="text-sm font-semibold text-foreground">
                   {isDragActive ? "أفلت الملفات هنا" : "اضغط للرفع أو اسحب وأفلت"}
               </p>
               <p className="text-xs text-muted-foreground">{description}</p>
           </div>
           
           <div className="flex gap-2 mt-1">
               <Badge variant="secondary" className="text-[10px] h-5 px-2 font-mono">Max {maxSizeInMB}MB</Badge>
               {accept && (
                   <Badge variant="outline" className="text-[10px] h-5 px-2 font-mono bg-background">
                       {Object.values(accept).flat().join(", ")}
                   </Badge>
               )}
           </div>
        </div>
      </div>

      {existingFileUrl && (
        <div className="grid gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 p-3 bg-card border rounded-lg shadow-sm group hover:border-primary/30 transition-colors">
            {inferAttachmentKindFromUrl(existingFileUrl) === "image" ? (
              <img
                src={existingFileUrl}
                alt=""
                className="h-10 w-10 rounded-md object-cover shrink-0 border border-border/50"
              />
            ) : (
              <div className="bg-primary/10 p-2 rounded-md text-primary shrink-0">
                <FileIcon className="w-5 h-5" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {fileLabelFromUrl(existingFileUrl)}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1 text-info">
                  <CheckCircle className="w-3 h-3" /> مرفق محفوظ
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openAttachmentPreview(existingFileUrl);
              }}
              className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors opacity-80"
              title="معاينة"
            >
              <Eye className="w-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeFile(0);
              }}
              className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors opacity-70 group-hover:opacity-100"
              title="إزالة لاستبدال الملف"
            >
              <X className="w-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {currentFiles.length > 0 && (
         <div className="grid gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
             {currentFiles.map((file: File, index: number) => (
                 <div 
                    key={`${file.name}-${index}`} 
                    className="flex items-center gap-3 p-3 bg-card border rounded-lg shadow-sm group hover:border-primary/30 transition-colors"
                 >
                    {file.type.startsWith("image/") ? (
                      <LocalImageThumb file={file} />
                    ) : (
                    <div className="bg-primary/10 p-2 rounded-md text-primary shrink-0">
                         <FileIcon className="w-5 h-5" />
                    </div>
                    )}
                    
                    <div className="flex-1 min-w-0">
                         <p className="text-sm font-medium truncate">{file.name}</p>
                         <div className="flex items-center gap-2 text-xs text-muted-foreground">
                             <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                             <span className="w-1 h-1 rounded-full bg-muted-foreground/40"></span>
                             <span className="flex items-center gap-1 text-success">
                                 <CheckCircle className="w-3 h-3" /> جاهز للرفع
                             </span>
                         </div>
                    </div>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            openAttachmentPreview(file);
                        }}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors opacity-80"
                        title="معاينة"
                    >
                        <Eye className="w-4 h-4" />
                    </button>

                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            removeFile(index);
                        }}
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors opacity-70 group-hover:opacity-100"
                    >
                        <X className="w-4 h-4" />
                    </button>
                 </div>
             ))}
         </div>
      )}

      {error && (
         <div className="flex items-center gap-2 text-sm text-destructive animate-in slide-in-from-top-1">
             <AlertCircle className="w-4 h-4" />
             <span>{error.message}</span>
         </div>
      )}

      <AttachmentPreviewDialog
        open={!!preview}
        onOpenChange={onPreviewOpenChange}
        src={preview?.url ?? null}
        kind={preview?.kind ?? "unknown"}
        fileName={preview?.name}
        title="معاينة المرفق"
      />
    </div>
  );
}

function LocalImageThumb({ file }: { file: File }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file.type.startsWith("image/")) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  if (!url) {
    return (
      <div className="bg-primary/10 p-2 rounded-md text-primary shrink-0">
        <FileIcon className="w-5 h-5" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt=""
      className="h-10 w-10 rounded-md object-cover shrink-0 border border-border/50"
    />
  );
}
