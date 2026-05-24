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
    fieldValues,
    setFieldValue,
    enqueueAmbiguous,
    filledPath,
    setFilled,
  } = useStore();

  const [pulling, setPulling] = useState(false);
  const [status, setStatus] = useState("");
  const [ragQueryText, setRagQueryText] = useState("");

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
    const query = ragQueryText.trim();
    if (!query) {
      setStatus("Enter a RAG query first.");
      return;
    }
    setPulling(true);
    setStatus("Pulling from RAG…");
    try {
      const ragText = await window.api.ragQuery(query);
      const res = await sidecar.post<Record<string, { value: unknown; confidence: number }>>(
        "/extract-values",
        { schema: { fields }, source_text: ragText }
      );
      if (!res.ok) {
        setStatus(`Extraction failed: ${JSON.stringify(res.data)}`);
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
      setStatus("RAG pull complete ✓");
    } catch (e) {
      setStatus(`RAG pull error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setPulling(false);
    }
  }

  async function runFill() {
    if (!uploadedPath) return;
    setStatus("Filling…");
    try {
      const tmpOut = `/tmp/agent-form-filler-filled-${Date.now()}.pdf`;
      let replica = useStore.getState().replicaPath ?? undefined;
      if (path === "replicate" && !replica) {
        const fm = useStore.getState().formMap;
        const rep = await sidecar.post<{ replica_path?: string; error?: string }>("/replicate", { form_map: fm });
        if (rep.data?.error || !rep.data?.replica_path) {
          setStatus(`Replicate failed: ${JSON.stringify(rep.data)}`);
          return;
        }
        replica = rep.data.replica_path;
        useStore.getState().setReplicaPath(replica ?? null);
      }
      const res = await sidecar.post<{ filled_path?: string; error?: string }>("/fill", {
        source_path: uploadedPath,
        out_path: tmpOut,
        path: path ?? "direct",
        schema: { fields },
        values: fieldValues,
        replica_path: replica,
      });
      if (res.data?.error || !res.data?.filled_path) {
        setStatus(`Fill failed: ${JSON.stringify(res.data)}`);
        return;
      }
      setFilled(res.data.filled_path);
      setStatus("Filled ✓");
    } catch (e) {
      setStatus(`Fill error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  async function runExport() {
    const filled = useStore.getState().filledPath;
    if (!filled) return;
    const dest = await window.api.saveFile("filled.pdf");
    if (!dest) return;
    setStatus("Exporting…");
    try {
      const res = await sidecar.post<{ export_path?: string; error?: string }>("/export", {
        source_path: filled, out_path: dest, format: "pdf", flatten: true,
      });
      if (res.data?.error) {
        setStatus(`Export failed: ${JSON.stringify(res.data)}`);
        return;
      }
      setStatus(`Exported → ${dest}`);
    } catch (e) {
      setStatus(`Export error: ${e instanceof Error ? e.message : String(e)}`);
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
      <input
        type="text"
        value={ragQueryText}
        onChange={(e) => setRagQueryText(e.target.value)}
        placeholder="RAG query, e.g. 'NDIS plan for John Smith'"
        className="bg-neutral-800 px-2 py-1 rounded text-sm placeholder:text-neutral-600"
      />
      <button
        onClick={pullFromRag}
        disabled={!uploadedPath || pulling || !ragQueryText.trim()}
        className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white py-2 rounded"
      >
        {pulling ? "Pulling…" : "Pull from RAG (ndis)"}
      </button>
      <button
        onClick={runFill}
        disabled={!uploadedPath}
        className="bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white py-2 rounded"
      >
        Fill
      </button>
      <button
        onClick={runExport}
        disabled={!filledPath}
        className="bg-amber-700 hover:bg-amber-600 disabled:opacity-50 text-white py-2 rounded"
      >
        Export PDF
      </button>
      {status && <div className="text-xs text-neutral-400 break-all">{status}</div>}
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
