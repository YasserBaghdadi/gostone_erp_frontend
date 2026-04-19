import type { AxiosResponse } from "axios";

/** Extracts the filename from a response's Content-Disposition header */
export function extractFilenameFromResponse(
  response: AxiosResponse,
  fallback: string
): string {
  const contentDisposition = response.headers["content-disposition"] || "";
  let filename = fallback;

  if (contentDisposition) {
    const utf8Match = contentDisposition.match(
      /filename\*=(?:UTF-8''|utf-8'')(.+)/i
    );
    const normalMatch = contentDisposition.match(
      /filename="?([^";\n]+)"?/i
    );

    if (utf8Match) {
      filename = decodeURIComponent(utf8Match[1].trim());
    } else if (normalMatch) {
      filename = normalMatch[1].trim();
    }
  }

  return filename;
}

/** Opens a PDF blob in a new browser window with proper filename for download/print */
export function openPdfInWindow(data: BlobPart, filename: string) {
  const blob = new Blob([data], { type: "application/pdf" });
  const url = window.URL.createObjectURL(blob);

  const printWindow = window.open("", "_blank");
  if (!printWindow) return;

  const escapedFilename = filename
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${escapedFilename}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: system-ui, sans-serif; background: #1a1a1a; }
        .toolbar {
          position: fixed; top: 0; left: 0; right: 0; z-index: 10;
          display: flex; align-items: center; justify-content: space-between;
          padding: 8px 16px; background: #2d2d2d; color: #fff;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .toolbar-title { font-size: 14px; font-weight: 500; opacity: 0.9; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 60%; }
        .toolbar-actions { display: flex; gap: 8px; }
        .btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 6px 16px; border-radius: 6px; border: none;
          font-size: 13px; font-weight: 500; cursor: pointer; transition: all 0.15s;
          text-decoration: none;
        }
        .btn-download { background: #3b82f6; color: #fff; }
        .btn-download:hover { background: #2563eb; }
        .btn-print { background: #525252; color: #fff; }
        .btn-print:hover { background: #6b6b6b; }
        iframe { position: fixed; top: 44px; left: 0; width: 100%; height: calc(100vh - 44px); border: none; }
      </style>
    </head>
    <body>
      <div class="toolbar">
        <span class="toolbar-title">${escapedFilename}</span>
        <div class="toolbar-actions">
          <a class="btn btn-download" href="${url}" download="${escapedFilename}">
            ⬇ تحميل
          </a>
          <button class="btn btn-print" onclick="document.getElementById('pdfFrame').contentWindow.print()">
            🖨 طباعة
          </button>
        </div>
      </div>
      <iframe id="pdfFrame" src="${url}"></iframe>
    </body>
    </html>
  `);
  printWindow.document.close();

  // Keep blob URL alive for 5 minutes to allow printing/downloading
  setTimeout(() => window.URL.revokeObjectURL(url), 300000);
}
