import { useEffect, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Icon } from "./Icon";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

// ---------------------------------------------------------------------------
// PdfPreview — standalone PDF viewer (does NOT use the shared Zustand store)
// Used by Reports and Templates tabs.
// ---------------------------------------------------------------------------

interface PdfPreviewProps {
  filePath: string;
  fileName: string;
  subtitle?: string;
  onMinimize: () => void;
}

export function PdfPreview({ filePath, fileName, subtitle, onMinimize }: PdfPreviewProps) {
  const [fileData, setFileData] = useState<{ data: Uint8Array } | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setFileData(null);
    setNumPages(0);
    setLoadError(null);

    if (!filePath) return;

    if (window.api?.readFile) {
      window.api.readFile(filePath)
        .then((bytes: number[]) => {
          setFileData({ data: new Uint8Array(bytes) });
        })
        .catch((err: unknown) => {
          setLoadError(err instanceof Error ? err.message : String(err));
        });
    } else {
      setLoadError("File reading not available (browser mode)");
    }
  }, [filePath]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Toolbar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 18px",
        borderBottom: "1px solid var(--border)",
        background: "rgba(15,15,26,0.95)",
        backdropFilter: "blur(12px)",
        flexShrink: 0,
      }}>
        <button className="btn small ghost" onClick={onMinimize}>
          <Icon name="chevron-left" size={14} />
          Back
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-hi)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {fileName}
          </div>
          {subtitle && (
            <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>{subtitle}</div>
          )}
        </div>
        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
          {numPages > 0 ? `${numPages} page${numPages > 1 ? "s" : ""}` : ""}
        </span>
        <button className="btn small" onClick={onMinimize}>
          <Icon name="minimize" size={14} />
          Minimize
        </button>
      </div>

      {/* PDF viewer — self-contained, no shared store */}
      <div style={{ flex: 1, overflow: "auto", background: "#070a12", display: "grid", justifyItems: "center", padding: 22 }}>
        {loadError ? (
          <div style={{ textAlign: "center", color: "var(--danger)", padding: 40 }}>
            <Icon name="warning" size={24} style={{ marginBottom: 8 }} />
            <div>{loadError}</div>
          </div>
        ) : !fileData ? (
          <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 40 }}>
            Loading PDF...
          </div>
        ) : !filePath.toLowerCase().endsWith(".pdf") ? (
          <div style={{ textAlign: "center", color: "var(--text-muted)", padding: 40 }}>
            <Icon name="forms" size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>{fileName}</div>
            <div style={{ fontSize: 12, marginTop: 6 }}>Preview available for PDF files only.</div>
          </div>
        ) : (
          <Document
            file={fileData}
            onLoadSuccess={({ numPages: n }) => setNumPages(n)}
            onLoadError={(err) => setLoadError(err.message)}
            loading={<div style={{ color: "var(--text-muted)", padding: 40 }}>Rendering pages...</div>}
          >
            {Array.from({ length: numPages }, (_, i) => (
              <Page
                key={i + 1}
                pageNumber={i + 1}
                width={760}
                className="pdf-page"
                
                loading={<div style={{ width: 760, height: 420, display: "grid", placeItems: "center", color: "var(--text-muted)" }}>Page {i + 1}</div>}
              />
            ))}
          </Document>
        )}
      </div>
    </div>
  );
}
