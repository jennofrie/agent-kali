import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import pdfWorkerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { useStore } from "../../store";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Keep the worker inside the Vite bundle so it always comes from the installed
// pdfjs-dist version. A CDN or stale copied worker causes the PDF.js
// "API version does not match Worker version" runtime failure.
pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerSrc;

export function DocumentViewer() {
  const { uploadedPath, filledPath } = useStore();
  const [numPages, setNumPages] = useState(0);
  const [fileData, setFileData] = useState<{ data: Uint8Array } | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Track which path we've loaded so we only re-fetch when the path changes
  const loadedPathRef = useRef<string | null>(null);

  const fileToShow = filledPath ?? uploadedPath;

  useEffect(() => {
    if (!fileToShow) {
      setFileData(null);
      setNumPages(0);
      setLoadError(null);
      loadedPathRef.current = null;
      return;
    }

    if (loadedPathRef.current === fileToShow) return;

    setFileData(null);
    setNumPages(0);
    setLoadError(null);
    loadedPathRef.current = fileToShow;

    // IPC bytes approach: read the file in the main process and pass bytes across.
    // This is far more reliable than file:// URLs in Electron because it bypasses
    // all CORS / webSecurity checks entirely — the renderer never fetches a URL.
    const pathAtStart = fileToShow;
    window.api
      .readFile(fileToShow)
      .then((bytes) => {
        // Ignore a stale response if the path changed while this read was in flight.
        if (loadedPathRef.current !== pathAtStart) return;
        setFileData({ data: new Uint8Array(bytes) });
      })
      .catch((err: unknown) => {
        if (loadedPathRef.current !== pathAtStart) return;
        const msg = err instanceof Error ? err.message : String(err);
        setLoadError(`Failed to read file: ${msg}`);
      });
  }, [fileToShow]);

  if (!fileToShow) {
    return (
      <ViewerFrame filled={Boolean(filledPath)} pageCount={numPages}>
        <ViewerState title="No file loaded" detail="Open a PDF form to start the ingest pipeline." />
      </ViewerFrame>
    );
  }

  if (loadError) {
    return (
      <ViewerFrame filled={Boolean(filledPath)} pageCount={numPages}>
        <ViewerState tone="error" title="PDF load error" detail={loadError} />
      </ViewerFrame>
    );
  }

  if (!fileData) {
    return (
      <ViewerFrame filled={Boolean(filledPath)} pageCount={numPages}>
        <ViewerState title="Loading document" detail="Reading PDF bytes through the Electron bridge." />
      </ViewerFrame>
    );
  }

  return (
    <ViewerFrame filled={Boolean(filledPath)} pageCount={numPages}>
      <div className="pdf-stage">
        <Document
          file={fileData}
          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
          onLoadError={(err) => setLoadError(err.message)}
          loading={<ViewerState title="Rendering pages" detail="Preparing the document preview." compact />}
        >
          {Array.from({ length: numPages }, (_, i) => (
            <Page
              key={i + 1}
              pageNumber={i + 1}
              className="pdf-page"
              width={760}
              loading={<div className="page-loading">Page {i + 1}</div>}
            />
          ))}
        </Document>
      </div>
    </ViewerFrame>
  );
}

function ViewerFrame({
  children,
  filled,
  pageCount,
}: {
  children: ReactNode;
  filled: boolean;
  pageCount: number;
}) {
  return (
    <div className="viewer-scroll">
      <div className="viewer-toolbar">
        <div>
          <span className="eyebrow">Output</span>
          <strong>{filled ? "Filled PDF Preview" : "Source PDF Preview"}</strong>
        </div>
        <div className="viewer-meta">
          <span>{pageCount || "?"} pages</span>
          <span>{filled ? "filled snapshot" : "source form"}</span>
        </div>
      </div>
      {children}
    </div>
  );
}

function ViewerState({
  title,
  detail,
  tone = "default",
  compact = false,
}: {
  title: string;
  detail: string;
  tone?: "default" | "error";
  compact?: boolean;
}) {
  return (
    <div className={compact ? "viewer-state compact" : "viewer-state"}>
      <div className={tone === "error" ? "state-dot error" : "state-dot"} />
      <h2>{title}</h2>
      <p>{detail}</p>
    </div>
  );
}
