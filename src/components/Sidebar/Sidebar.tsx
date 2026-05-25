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

  type Extracted = Record<string, { value: unknown; confidence: number }>;

  // Shared by both sources: high-confidence values auto-fill; low-confidence
  // checkbox/radio decisions are queued for the ambiguity modal.
  function applyValues(values: Extracted, sourceContext: string) {
    let filled = 0;
    let ambiguous = 0;
    for (const [fid, payload] of Object.entries(values)) {
      const ok =
        payload &&
        typeof payload.confidence === "number" &&
        payload.confidence >= 0.7 &&
        payload.value !== "" &&
        payload.value !== null &&
        payload.value !== undefined;
      if (ok) {
        setFieldValue(fid, payload.value as string | boolean);
        filled++;
      } else {
        const field = fields.find((f) => f.id === fid);
        if (field && (field.type === "checkbox" || field.type === "radio")) {
          enqueueAmbiguous({ field, sourceContext });
          ambiguous++;
        } else if (field && payload?.value) {
          setFieldValue(fid, payload.value as string | boolean);
          filled++;
        }
      }
    }
    return { filled, ambiguous };
  }

  async function pullFromRag() {
    if (!uploadedPath) {
      setStatus("Open a form first.");
      return;
    }
    const query = ragQueryText.trim();
    if (!query) {
      setStatus("Enter a RAG query first.");
      return;
    }
    setPulling(true);
    setStatus("Querying RAG (ndis)…");
    try {
      const ragText = await window.api.ragQuery(query);
      setStatus("Extracting fields…");
      const res = await sidecar.post<Extracted>("/extract-values", {
        schema: { fields },
        source_text: ragText,
      });
      if (!res.ok) {
        setStatus(`Extraction failed: ${JSON.stringify(res.data)}`);
        return;
      }
      const { filled, ambiguous } = applyValues(res.data, ragText.slice(0, 240));
      setStatus(`RAG: filled ${filled} field(s)${ambiguous ? `, ${ambiguous} need review` : ""} ✓`);
    } catch (e) {
      setStatus(`RAG error: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setPulling(false);
    }
  }

  async function pullFromFolder() {
    if (!uploadedPath) {
      setStatus("Open a form first.");
      return;
    }
    const dir = await window.api.openFolder();
    if (!dir) return;
    setPulling(true);
    setStatus("Reading folder & extracting…");
    try {
      const res = await sidecar.post<{
        values?: Extracted;
        files_read?: string[];
        error?: string;
      }>("/extract-from-folder", { folder_path: dir, schema: { fields } });
      if (!res.ok || res.data?.error) {
        setStatus(`Folder extract failed: ${JSON.stringify(res.data)}`);
        return;
      }
      const { filled, ambiguous } = applyValues(res.data.values ?? {}, `folder: ${dir}`);
      const n = res.data.files_read?.length ?? 0;
      setStatus(
        `Folder: read ${n} file(s), filled ${filled}${ambiguous ? `, ${ambiguous} need review` : ""} ✓`,
      );
    } catch (e) {
      setStatus(`Folder error: ${e instanceof Error ? e.message : String(e)}`);
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
    path === "direct"    ? "Filling original" :
    path === "replicate" ? "Filling replica" :
    uploadedPath         ? "Analyzing" : "No file";
  const fieldCompletion = fields.length
    ? Math.round((Object.keys(fieldValues).filter((id) => fieldValues[id] !== "" && fieldValues[id] !== undefined).length / fields.length) * 100)
    : 0;
  const fileName = uploadedPath ? uploadedPath.split("/").at(-1) : "No document selected";

  return (
    <aside className="control-panel">
      <div className="panel-heading">
        <span className="eyebrow">Workspace</span>
        <h2>Form console</h2>
      </div>

      <section className="score-card">
        <div className="score-ring">{fieldCompletion}</div>
        <div>
          <strong>{fieldCompletion >= 80 ? "Ready" : uploadedPath ? "In progress" : "Waiting"}</strong>
          <span>{fields.length} detected fields</span>
        </div>
      </section>

      <section className="document-card">
        <span className="eyebrow">Active document</span>
        <strong title={uploadedPath ?? undefined}>{fileName}</strong>
        <div className="doc-meta">
          <span>{pathLabel}</span>
          <span>{editability ?? "unknown"}</span>
        </div>
      </section>

      <button onClick={pickFile} className="primary-action">
        Open Form
      </button>

      <section className="action-group">
        <label>
          <span>Auto-fill source</span>
          <input
            type="text"
            value={ragQueryText}
            onChange={(e) => setRagQueryText(e.target.value)}
            placeholder="RAG query — e.g. Tara Ford NDIS details"
          />
        </label>
        <button
          onClick={pullFromRag}
          disabled={!uploadedPath || pulling || !ragQueryText.trim()}
          className="secondary-action"
        >
          {pulling ? "Working…" : "Pull from RAG (ndis)"}
        </button>
        <button
          onClick={pullFromFolder}
          disabled={!uploadedPath || pulling}
          className="secondary-action"
        >
          Pull from Local Folder…
        </button>
      </section>

      <div className="split-actions">
        <button onClick={runFill} disabled={!uploadedPath} className="secondary-action violet">
          Fill
        </button>
        <button onClick={runExport} disabled={!filledPath} className="secondary-action amber">
          Export PDF
        </button>
      </div>

      {status && <div className="status-log">{status}</div>}

      <section className="pipeline-card">
        <span className="eyebrow">Pipeline</span>
        <Step label="Ingest" active={Boolean(uploadedPath)} />
        <Step label="Schema" active={fields.length > 0} />
        <Step label="Fill" active={Boolean(filledPath)} />
        <Step label="Export" active={status.startsWith("Exported")} />
      </section>

      {uploadedPath && <div className="path-readout">{uploadedPath}</div>}
    </aside>
  );
}

function Step({ label, active }: { label: string; active: boolean }) {
  return (
    <div className={active ? "pipeline-step active" : "pipeline-step"}>
      <span />
      <strong>{label}</strong>
    </div>
  );
}
