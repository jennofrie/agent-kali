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
          <span>RAG source</span>
          <input
            type="text"
            value={ragQueryText}
            onChange={(e) => setRagQueryText(e.target.value)}
            placeholder="NDIS plan, client notes, support evidence"
          />
        </label>
        <button
          onClick={pullFromRag}
          disabled={!uploadedPath || pulling || !ragQueryText.trim()}
          className="secondary-action"
        >
          {pulling ? "Pulling..." : "Pull from RAG"}
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
