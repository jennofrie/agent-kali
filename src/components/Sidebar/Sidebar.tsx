import { useState } from "react";
import { useStore } from "../../store";
import { sidecar } from "../../lib/ipc/sidecar";

export function Sidebar() {
  const {
    uploadedPath,
    editability,
    path,
    setUploaded,
    setEditability,
    setFormMap,
    setFields,
    fields,
    setFieldValue,
    enqueueAmbiguous,
  } = useStore();

  const [pulling, setPulling] = useState(false);

  async function pickFile() {
    const p = await window.api.openFile();
    if (!p) return;
    setUploaded(p);
    const ingestRes = await sidecar.post<any>("/ingest", { file_path: p });
    if (ingestRes.data?.error) {
      setEditability(null, null);
      return;
    }
    setEditability(ingestRes.data.editability, ingestRes.data.path);
    setFormMap(ingestRes.data);
    const schemaRes = await sidecar.post<any>("/schema", { file_path: p });
    setFields(schemaRes.data?.fields ?? []);
  }

  async function pullFromRag() {
    const query = window.prompt("RAG query (e.g. 'NDIS plan for John Smith'):");
    if (!query) return;
    setPulling(true);
    try {
      const ragText = await window.api.ragQuery(query);
      const res = await sidecar.post<Record<string, { value: unknown; confidence: number }>>(
        "/extract-values",
        { schema: { fields }, source_text: ragText }
      );
      if (!res.ok) {
        window.alert(`Extraction failed: ${JSON.stringify(res.data)}`);
        return;
      }
      for (const [fid, payload] of Object.entries(res.data)) {
        if (payload && typeof payload.confidence === "number" && payload.confidence >= 0.7) {
          setFieldValue(fid, payload.value as string | boolean);
        } else {
          const field = fields.find((f) => f.id === fid);
          // Only checkboxes/radios need disambiguation; low-confidence text just fills as best guess
          if (field && (field.type === "checkbox" || field.type === "radio")) {
            enqueueAmbiguous({ field, sourceContext: ragText.slice(0, 240) });
          } else if (field) {
            setFieldValue(fid, payload.value as string | boolean);
          }
        }
      }
    } catch (e) {
      window.alert(`RAG pull error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setPulling(false);
    }
  }

  const pathLabel =
    path === "direct"    ? "🟢 Filling original" :
    path === "replicate" ? "🟡 Filling replica (locked form detected)" :
    uploadedPath         ? "Analyzing…" : "No file";

  return (
    <aside className="w-72 h-full bg-neutral-900 p-4 flex flex-col gap-4 border-r border-neutral-800">
      <h1 className="text-lg font-semibold">agent-form-filler</h1>
      <button onClick={pickFile} className="bg-blue-600 hover:bg-blue-500 text-white py-2 rounded">
        Open Form
      </button>
      <button
        onClick={pullFromRag}
        disabled={!uploadedPath || pulling}
        className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white py-2 rounded"
      >
        {pulling ? "Pulling…" : "Pull from RAG (ndis)"}
      </button>
      <div className="text-sm">
        <div className="text-neutral-400">Status</div>
        <div>{pathLabel}</div>
      </div>
      {uploadedPath && (
        <div className="text-xs text-neutral-500 break-all">{uploadedPath}</div>
      )}
      <div className="text-xs text-neutral-500 mt-auto">Editability: {editability ?? "—"}</div>
    </aside>
  );
}
