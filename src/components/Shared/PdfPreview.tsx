import { useEffect } from "react";
import { Icon } from "./Icon";
import { useStore } from "../../store";
import { DocumentViewer } from "../DocumentViewer/DocumentViewer";

// ---------------------------------------------------------------------------
// PdfPreview — maximized PDF viewer with minimize button
// Used by Reports and Templates tabs when clicking a document card.
// ---------------------------------------------------------------------------

interface PdfPreviewProps {
  filePath: string;
  fileName: string;
  subtitle?: string;
  onMinimize: () => void;
}

export function PdfPreview({ filePath, fileName, subtitle, onMinimize }: PdfPreviewProps) {
  const { setUploaded } = useStore();

  // Set the store's uploadedPath so DocumentViewer renders this file
  useEffect(() => {
    setUploaded(filePath);
    return () => {
      // Clear when unmounting so it doesn't linger
      setUploaded(null);
    };
  }, [filePath, setUploaded]);

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
        <button className="btn small ghost" onClick={() => {
          if (window.api?.saveFile) {
            // Export / save a copy
            window.api.saveFile(fileName).then(dest => {
              if (dest && window.api?.readFile) {
                // Copy the file
                window.api.readFile(filePath).then(_bytes => {
                  // Would need a write IPC — for now just show the path
                  console.log("Would export to:", dest);
                });
              }
            });
          }
        }}>
          <Icon name="download" size={14} />
          Export
        </button>
        <button className="btn small" onClick={onMinimize}>
          <Icon name="minimize" size={14} />
          Minimize
        </button>
      </div>

      {/* PDF viewer */}
      <div style={{ flex: 1, overflow: "auto", background: "#070a12" }}>
        {filePath.toLowerCase().endsWith(".pdf") ? (
          <DocumentViewer />
        ) : (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
            <Icon name="forms" size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
            <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>
              {fileName}
            </div>
            <div style={{ fontSize: 12, marginTop: 6 }}>
              Preview available for PDF files only.
              {filePath.endsWith(".docx") && " DOCX preview coming soon."}
              {filePath.endsWith(".md") && " Markdown preview coming soon."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
