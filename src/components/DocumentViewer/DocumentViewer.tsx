import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { useStore } from "../../store";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Vite-compatible worker setup — import.meta.url resolves correctly through Vite's bundler
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

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
      <div className="flex-1 flex items-center justify-center text-neutral-500">
        No file loaded.
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex-1 flex items-center justify-center text-red-400 px-6">
        {loadError}
      </div>
    );
  }

  if (!fileData) {
    return (
      <div className="flex-1 flex items-center justify-center text-neutral-400">
        Loading…
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto bg-neutral-950 p-4">
      <Document
        file={fileData}
        onLoadSuccess={({ numPages: n }) => setNumPages(n)}
        onLoadError={(err) => setLoadError(`PDF load error: ${err.message}`)}
      >
        {Array.from({ length: numPages }, (_, i) => (
          <Page
            key={i + 1}
            pageNumber={i + 1}
            className="mb-4"
            width={700}
          />
        ))}
      </Document>
    </div>
  );
}
