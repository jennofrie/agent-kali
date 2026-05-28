import React, { useState, useEffect, useCallback } from "react";
import { Icon } from "../Shared/Icon";
import {
  MOCK_FIELDS,
  MOCK_OPEN_DOCS,
  MOCK_PARTICIPANTS,
  PARTICIPANT_COLORS,
  type MockField,
  type OpenDoc,
  type RealParticipant,
} from "../../lib/mockData";
import { sidecar } from "../../lib/ipc/sidecar";
import { useStore } from "../../store";
import type { FieldSchema } from "../../store";
import { DocumentViewer } from "../DocumentViewer/DocumentViewer";

// ---------------------------------------------------------------------------
// Prop types
// ---------------------------------------------------------------------------

interface DocMiniCardProps {
  doc: OpenDoc;
  onMaximize: () => void;
  onClose: () => void;
}

interface DocGridProps {
  docs: OpenDoc[];
  setActiveDocId: (id: string) => void;
  closeDoc: (id: string) => void;
  onAddNew: () => void;
}

interface FakePdfPageProps {
  doc: OpenDoc;
}

interface FieldsPanelProps {
  onResolveAmbiguity?: () => void;
}

interface InfoPanelProps {
  doc: OpenDoc;
}

interface PipelinePanelProps {
  doc: OpenDoc;
  onUpdateDoc?: (id: string, updates: Partial<OpenDoc>) => void;
  instructions: string;
  ragQuery: string;
  participantName: string;
  sourceFolder: string;
  freeFormContext: string;
}

interface SourcesPanelProps {
  doc: OpenDoc;
  instructions: string;
  setInstructions: (v: string) => void;
  ragQuery: string;
  setRagQuery: (v: string) => void;
  freeFormContext: string;
  setFreeFormContext: (v: string) => void;
  onParticipantChange: (name: string, folder: string) => void;
  extractStatus: string;
  onReExtract: () => void;
}

interface MaximizedDocProps {
  doc: OpenDoc;
  openDocs: OpenDoc[];
  setActiveDocId: (id: string) => void;
  closeDoc: (id: string) => void;
  minimize: () => void;
  onResolveAmbiguity?: () => void;
  onUpdateDoc?: (id: string, updates: Partial<OpenDoc>) => void;
  onAddNew: () => void;
}

interface FormsViewProps {
  onResolveAmbiguity?: () => void;
}

// ---------------------------------------------------------------------------
// Pipeline step type
// ---------------------------------------------------------------------------

interface PipelineStep {
  num: number;
  name: string;
  sub: string;
  state: "done" | "active" | "";
}

// ---------------------------------------------------------------------------
// Pipeline helpers (real sidecar calls)
// ---------------------------------------------------------------------------

async function runIngest(doc: OpenDoc): Promise<{ error?: string; editability?: string; path?: string; formMap?: any }> {
  if (!doc.filePath) return { error: "No file path" };
  try {
    const res = await sidecar.post<any>("/ingest", { file_path: doc.filePath });
    if (!res.ok || res.data?.error) return { error: res.data?.error || `Ingest failed: ${res.status}` };
    const store = useStore.getState();
    // The ingest response IS the form map: {source_path, editability, path, pages: [...]}
    const data = res.data;
    if (data?.editability) {
      store.setEditability(data.editability, data.path ?? null);
    }
    // Store the entire response as the form map (needed for replicate path)
    store.setFormMap(data);
    store.setUploaded(doc.filePath);
    return {
      editability: data?.editability,
      path: data?.path,
      formMap: data,
    };
  } catch (err) {
    return { error: String(err) };
  }
}

async function runSchema(doc: OpenDoc): Promise<{ error?: string; fieldCount?: number }> {
  if (!doc.filePath) return { error: "No file path" };
  try {
    const res = await sidecar.post<any>("/schema", { file_path: doc.filePath });
    if (!res.ok || res.data?.error) return { error: res.data?.error || `Schema failed: ${res.status}` };
    const store = useStore.getState();
    // Schema response: { fields: [...] }
    const fields = res.data?.fields ?? [];
    if (fields.length > 0) {
      store.setFields(fields);
    }
    return { fieldCount: fields.length };
  } catch (err) {
    return { error: String(err) };
  }
}

async function runExtract(
  _doc: OpenDoc,
  instructions: string,
  ragQuery: string,
  participantName?: string,
  sourceFolder?: string,
  freeFormContext?: string,
): Promise<{ error?: string; filledCount?: number; sourceSummary?: string }> {
  try {
    const sections: string[] = [];

    // 1. Query RAG for participant details (automatic if participant selected)
    if (participantName && window.api?.ragQuery) {
      try {
        const ragResult = await window.api.ragQuery(
          `${participantName} date of birth address phone email NDIS number diagnosis plan details personal information`
        );
        if (ragResult && ragResult.length > 10) {
          sections.push(`=== PARTICIPANT DATA (from RAG) ===\n${ragResult}`);
        }
      } catch {
        // RAG unavailable, continue
      }
    }

    // 2. Read files from participant's SC folder via sidecar
    if (sourceFolder) {
      try {
        const folderRes = await sidecar.post<any>("/extract-from-folder", {
          folder_path: sourceFolder,
          schema: { fields: useStore.getState().fields },
        });
        if (folderRes.ok && folderRes.data?.values) {
          // Apply folder-extracted values directly
          const store = useStore.getState();
          const values = folderRes.data.values as Record<string, { value: unknown; confidence: number }>;
          let folderFilled = 0;
          for (const [id, payload] of Object.entries(values)) {
            if (payload && payload.value !== null && payload.value !== undefined && payload.value !== "") {
              store.setFieldValue(id, payload.value as string | boolean);
              folderFilled++;
            }
          }
          const filesRead = folderRes.data.files_read?.length ?? 0;
          sections.push(`=== FOLDER DATA (${filesRead} files read, ${folderFilled} fields extracted) ===`);
        }
      } catch {
        // Folder extraction failed, continue with other sources
      }
    }

    // 3. Query additional RAG workspace if specified
    if (ragQuery && ragQuery !== "" && window.api?.ragQuery) {
      try {
        const queryText = participantName
          ? `${participantName} ${ragQuery}`
          : ragQuery;
        const ragResult = await window.api.ragQuery(queryText);
        if (ragResult && ragResult.length > 10) {
          sections.push(`=== RAG WORKSPACE DATA ===\n${ragResult}`);
        }
      } catch {
        // RAG query failed
      }
    }

    // 4. Add free-form context
    if (freeFormContext && freeFormContext.trim()) {
      sections.push(`=== ADDITIONAL CONTEXT ===\n${freeFormContext.trim()}`);
    }

    // 5. Add checkbox/tick instructions
    if (instructions && instructions.trim()) {
      sections.push(`=== CHECKBOX AND TICK INSTRUCTIONS ===\n${instructions.trim()}\n\nIMPORTANT: Follow these instructions exactly when determining checkbox, tick, and radio button values.`);
    }

    // Combine all source text
    const sourceText = sections.join("\n\n");

    if (!sourceText.trim()) {
      return { error: "No data sources configured. Select a participant, enter a RAG query, or provide context." };
    }

    // 6. Send combined source text to sidecar for field extraction
    const fields = useStore.getState().fields;
    const res = await sidecar.post<any>("/extract-values", {
      schema: { fields },
      source_text: sourceText,
    });
    if (!res.ok) return { error: res.data?.error || `Sidecar returned ${res.status}` };

    // The sidecar returns the extraction result directly as res.data
    // Format: { field_id: { value: ..., confidence: 0.0-1.0 }, ... }
    const store = useStore.getState();
    let filledCount = 0;
    const data = res.data as Record<string, unknown>;
    if (data && typeof data === "object") {
      for (const [id, payload] of Object.entries(data)) {
        if (id === "error") continue; // skip error field if present
        if (payload && typeof payload === "object" && "value" in (payload as Record<string, unknown>)) {
          const p = payload as { value: unknown; confidence: number };
          if (p.value !== null && p.value !== undefined && p.value !== "") {
            store.setFieldValue(id, p.value as string | boolean);
            filledCount++;
          }
        } else if (payload !== null && payload !== undefined && payload !== "") {
          store.setFieldValue(id, payload as string | boolean);
          filledCount++;
        }
      }
    }

    const summary = sections.map(s => s.split("\n")[0]).join("; ");
    return { filledCount, sourceSummary: summary };
  } catch (err) {
    return { error: String(err) };
  }
}

async function runFill(doc: OpenDoc): Promise<{ error?: string; filledPath?: string }> {
  if (!doc.filePath) return { error: "No file path" };
  try {
    const store = useStore.getState();
    const fields = store.fields;
    const fieldValues = store.fieldValues;
    const fillPath = store.path || "direct"; // Use the path from ingest (direct or replicate)
    const tmpOut = `/tmp/agent-kali-filled-${Date.now()}.pdf`;

    // If path is "replicate", we need to create a replica first
    let replicaPath = store.replicaPath;
    if (fillPath === "replicate" && !replicaPath) {
      const formMap = store.formMap;
      if (!formMap) return { error: "No form map available for replication" };
      const repRes = await sidecar.post<any>("/replicate", { form_map: formMap });
      if (!repRes.ok || repRes.data?.error) {
        return { error: repRes.data?.error || "Replication failed" };
      }
      replicaPath = repRes.data?.replica_path;
      store.setReplicaPath(replicaPath ?? null);
    }

    const res = await sidecar.post<any>("/fill", {
      source_path: doc.filePath,
      out_path: tmpOut,
      path: fillPath,
      schema: { fields },
      values: fieldValues,
      replica_path: replicaPath,
    });
    if (!res.ok || res.data?.error) return { error: res.data?.error || `Fill failed: ${res.status}` };
    const filledPath = res.data?.filled_path || tmpOut;
    store.setFilled(filledPath);
    return { filledPath };
  } catch (err) {
    return { error: String(err) };
  }
}

async function runExport(_doc: OpenDoc): Promise<{ error?: string; destPath?: string }> {
  try {
    const filled = useStore.getState().filledPath;
    if (!filled) return { error: "No filled PDF available" };
    if (!window.api?.saveFile) return { error: "Save dialog not available (browser mode)" };
    const dest = await window.api.saveFile("filled.pdf");
    if (!dest) return { error: "Export cancelled" };
    const res = await sidecar.post<any>("/export", {
      source_path: filled,
      out_path: dest,
      format: "pdf",
      flatten: true,
    });
    if (res.data?.error) return { error: res.data.error };
    return { destPath: dest };
  } catch (err) {
    return { error: String(err) };
  }
}

// ---------------------------------------------------------------------------
// File picker helper
// ---------------------------------------------------------------------------

async function pickAndOpenFile(): Promise<OpenDoc | null> {
  if (!window.api?.openFile) return null;
  const filePath = await window.api.openFile();
  if (!filePath) return null;
  const fileName = filePath.split("/").pop() || "document.pdf";
  const newDoc: OpenDoc = {
    id: "doc-" + Date.now(),
    fileName,
    participant: "",
    pages: 0,
    pct: 0,
    status: "progress",
    filePath,
  };
  return newDoc;
}

// ---------------------------------------------------------------------------
// DocMiniCard
// ---------------------------------------------------------------------------

export function DocMiniCard({ doc, onMaximize, onClose }: DocMiniCardProps) {
  return (
    <div className="docmini" onClick={onMaximize}>
      <div className="docmini-thumb">
        <div className="docmini-thumb-paper">
          <div className="row head"></div>
          <div className="row med"></div>
          <div className="row"></div>
          <div className="row short"></div>
          <div className="row"></div>
          <div className="row med"></div>
          <div className="row short"></div>
          <div className="row"></div>
        </div>
        <div className="docmini-actions">
          <button
            title="Maximize"
            onClick={(e) => {
              e.stopPropagation();
              onMaximize();
            }}
          >
            <Icon name="maximize" size={13} />
          </button>
          <button
            title="Close"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <Icon name="x" size={13} />
          </button>
        </div>
        <div className="form-duration">{doc.pages}p</div>
      </div>
      <div className="docmini-body">
        <div className="docmini-title">{doc.fileName}</div>
        <div className="docmini-meta">
          <span>{doc.participant}</span>
          <span style={{ color: "var(--text-faint)" }}>&middot;</span>
          <div className="completion">
            <div className="gauge">
              <div
                className="fill"
                style={{ "--pct": doc.pct + "%" } as React.CSSProperties}
              ></div>
            </div>
            <span className="completion-pct">{doc.pct}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DocGrid
// ---------------------------------------------------------------------------

export function DocGrid({
  docs,
  setActiveDocId,
  closeDoc,
  onAddNew,
}: DocGridProps) {
  const slots: (OpenDoc | null)[] = [...docs];
  while (slots.length < 4) slots.push(null);

  return (
    <div>
      <div className="section-head" style={{ marginTop: 0 }}>
        <div>
          <div className="section-title">Open documents</div>
          <div className="section-sub">
            {docs.length} of 4 slots &middot; Click a card to expand
          </div>
        </div>
        <button className="btn primary" onClick={onAddNew}>
          <Icon name="upload" size={14} />
          Upload PDF
        </button>
      </div>
      <div className="docgrid">
        {slots.map((doc, i) =>
          doc ? (
            <DocMiniCard
              key={doc.id}
              doc={doc}
              onMaximize={() => setActiveDocId(doc.id)}
              onClose={() => closeDoc(doc.id)}
            />
          ) : (
            <div
              key={"add-" + i}
              className="docmini add"
              onClick={onAddNew}
            >
              <div>
                <div className="plus">
                  <Icon name="plus" size={28} />
                </div>
                <div className="add-title">Open new document</div>
                <div className="add-sub">PDF, AcroForm or scanned</div>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FakePdfPage
// ---------------------------------------------------------------------------

export function FakePdfPage({ doc }: FakePdfPageProps) {
  const fields: MockField[] = MOCK_FIELDS;

  return (
    <div className="pdf-page">
      <h1>Support Service Booking</h1>
      <div style={{ fontSize: 9, color: "#666" }}>
        NDIS Provider Agreement &mdash; Schedule A &middot; v3.2
      </div>

      <h2>Participant Details</h2>
      {fields.slice(0, 4).map((f) => (
        <div className="field-line" key={f.id}>
          <span className="field-label">{f.label}:</span>
          <span className={"field-blank " + (f.value ? "filled" : "")}>
            {f.value}
          </span>
        </div>
      ))}

      <h2>Service Specifications</h2>
      {fields.slice(4, 9).map((f) => (
        <div className="field-line" key={f.id}>
          <span className="field-label">{f.label}:</span>
          <span
            className={
              "field-blank " +
              (f.value ? "filled" : "") +
              (f.flagged ? " flagged" : "")
            }
          >
            {f.value || (f.flagged ? "\u26A0 Needs review" : "")}
          </span>
        </div>
      ))}

      <h2>Authorisation</h2>
      {fields.slice(9, 12).map((f) => (
        <div className="field-line" key={f.id}>
          <span className="field-label">{f.label}:</span>
          <span className={"field-blank " + (f.value ? "filled" : "")}>
            {f.value}
          </span>
        </div>
      ))}

      <div
        style={{
          position: "absolute",
          left: 36,
          bottom: 24,
          right: 36,
          display: "flex",
          justifyContent: "space-between",
          fontSize: 7,
          color: "#999",
        }}
      >
        <span>{doc.fileName}</span>
        <span>
          Page 1 of {doc.pages}
        </span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FieldsPanel — uses real store fields when available, mock as fallback
// ---------------------------------------------------------------------------

export function FieldsPanel({ onResolveAmbiguity }: FieldsPanelProps) {
  const { fields, fieldValues, setFieldValue } = useStore();

  // Use real fields if available, otherwise show mock fields as demo
  const hasRealFields = fields.length > 0;

  if (hasRealFields) {
    return (
      <div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--text-faint)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            {fields.length} fields detected
          </div>
          <button className="btn small ghost">
            <Icon name="filter" size={12} />
            Filter
          </button>
        </div>
        {fields.map((f: FieldSchema) => {
          const val = fieldValues[f.id];
          const displayVal = val !== undefined ? String(val) : "";
          const isCheckbox = f.type === "checkbox" || f.type === "radio";

          return (
            <div
              key={f.id}
              className="field-card"
            >
              <div className="field-card-head">
                <span className="field-card-label">{f.label}</span>
                <span className={"field-card-pill " + (displayVal ? "high" : "low")}>
                  {f.type}
                </span>
              </div>
              {isCheckbox ? (
                <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                  <input
                    type="checkbox"
                    checked={val === true || val === "true" || val === "Yes"}
                    onChange={(e) => setFieldValue(f.id, e.target.checked)}
                  />
                  <span style={{ fontSize: 12.5, color: "var(--text-hi)" }}>
                    {val === true || val === "true" || val === "Yes" ? "Checked" : "Unchecked"}
                  </span>
                </label>
              ) : (
                <input
                  className="field-input"
                  value={displayVal}
                  placeholder="No value extracted"
                  onChange={(e) => setFieldValue(f.id, e.target.value)}
                />
              )}
              {f.instructions && (
                <div className="field-source">Instructions: {f.instructions}</div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Fallback: mock fields for demo/browser mode
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--text-faint)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          12 fields detected
        </div>
        <button className="btn small ghost">
          <Icon name="filter" size={12} />
          Filter
        </button>
      </div>
      {MOCK_FIELDS.map((f) => (
        <div
          key={f.id}
          className={"field-card " + (f.flagged ? "flagged" : "")}
        >
          <div className="field-card-head">
            <span className="field-card-label">{f.label}</span>
            <span className={"field-card-pill " + f.confidence}>
              {f.confidence}
            </span>
          </div>
          {f.flagged ? (
            <div>
              <input
                className="field-input"
                placeholder="No value extracted"
                disabled
              />
              <button
                className="btn small primary"
                style={{
                  marginTop: 8,
                  width: "100%",
                  justifyContent: "center",
                }}
                onClick={onResolveAmbiguity}
              >
                <Icon name="warning" size={12} />
                Resolve ambiguity
              </button>
            </div>
          ) : (
            <input className="field-input" defaultValue={f.value} />
          )}
          {!f.flagged && (
            <div className="field-source">Source: {f.source}</div>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SourcesPanel — wired to real participants and RAG
// ---------------------------------------------------------------------------

export function SourcesPanel({
  doc,
  instructions,
  setInstructions,
  ragQuery,
  setRagQuery,
  freeFormContext,
  setFreeFormContext,
  onParticipantChange,
  extractStatus,
  onReExtract,
}: SourcesPanelProps) {
  const [realParticipants, setRealParticipants] = useState<RealParticipant[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<string>("");
  const [sourceFolder, setSourceFolder] = useState<string>("");

  // Scan participants on mount
  useEffect(() => {
    if (window.api?.scanParticipants) {
      window.api.scanParticipants().then((r) => {
        const pList = r.participants || [];
        setRealParticipants(pList);
        // Auto-select if doc has a participant name
        if (doc.participant && pList.length > 0) {
          const match = pList.find((p) => p.name === doc.participant);
          if (match) {
            setSelectedParticipant(match.id);
            setSourceFolder(match.folderPath);
          }
        }
      }).catch(() => {
        setRealParticipants([]);
      });
    }
  }, []);

  // Update source folder when participant changes
  const handleParticipantChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pid = e.target.value;
    setSelectedParticipant(pid);
    const p = realParticipants.find((rp) => rp.id === pid);
    if (p) {
      setSourceFolder(p.folderPath);
      onParticipantChange(p.name, p.folderPath);
    }
  };

  const handleBrowseFolder = async () => {
    if (window.api?.openFolder) {
      const folder = await window.api.openFolder();
      if (folder) setSourceFolder(folder);
    }
  };

  // Decide which participants to show
  const hasRealParticipants = realParticipants.length > 0;

  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "var(--text-faint)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        Knowledge sources
      </div>

      <div className="field-card">
        <div className="field-card-head">
          <span className="field-card-label">Participant</span>
        </div>
        {hasRealParticipants ? (
          <select
            className="field-input"
            value={selectedParticipant}
            onChange={handleParticipantChange}
          >
            <option value="">-- Select participant --</option>
            {realParticipants.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        ) : (
          <select className="field-input" defaultValue="Marcus Chen">
            {MOCK_PARTICIPANTS.map((p) => (
              <option key={p.id}>{p.name}</option>
            ))}
          </select>
        )}
        <div className="field-source">
          Loads plan PDF, intake form, and case notes
        </div>
      </div>

      <div className="field-card">
        <div className="field-card-head">
          <span className="field-card-label">Source folder</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            className="field-input"
            value={sourceFolder || "/Documents/NDIS/"}
            onChange={(e) => setSourceFolder(e.target.value)}
          />
          <button className="btn small" onClick={handleBrowseFolder}>
            <Icon name="folder" size={13} />
          </button>
        </div>
        <div className="field-source">
          {hasRealParticipants && selectedParticipant
            ? `${realParticipants.find((p) => p.id === selectedParticipant)?.fileCount ?? 0} files`
            : "12 files"}{" "}
          &middot; Auto-watched for changes
        </div>
      </div>

      <div className="field-card">
        <div className="field-card-head">
          <span className="field-card-label">RAG workspace</span>
        </div>
        <select
          className="field-input"
          value={ragQuery}
          onChange={(e) => setRagQuery(e.target.value)}
        >
          <option value="">None (no RAG query)</option>
          <option value="NDIS Pricing 2026">NDIS Pricing 2026</option>
          <option value="Internal SOPs">Internal SOPs</option>
          <option value="Provider docs">Provider docs</option>
          <option value="Participant workspace">Participant workspace</option>
        </select>
      </div>

      <div className="field-card">
        <div className="field-card-head">
          <span className="field-card-label">Free-form context</span>
        </div>
        <textarea
          className="field-input"
          rows={4}
          placeholder="Paste an email, meeting note, or extra context to use during extraction&hellip;"
          value={freeFormContext}
          onChange={(e) => setFreeFormContext(e.target.value)}
          style={{ resize: "vertical" }}
        />
      </div>

      <div className="field-card">
        <div className="field-card-head">
          <span className="field-card-label">Checkbox & tick instructions</span>
          <span className="field-card-pill high">AI-assisted</span>
        </div>
        <textarea
          className="field-input"
          rows={4}
          placeholder={`Type instructions for checkboxes and tick marks. Example:\n\u2022 Tick 'Yes' for consent\n\u2022 Tick 'Plan managed' for funding type\n\u2022 Cross 'No' for interpreter required\n\u2022 Check 'At Home' and 'Elsewhere' for session location`}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          style={{ resize: "vertical" }}
        />
        <div className="field-source">
          These instructions will be sent to the AI during field extraction to determine checkbox values
        </div>
      </div>

      {extractStatus && (
        <div style={{
          padding: "10px 12px",
          borderRadius: 8,
          background: extractStatus.startsWith("Error")
            ? "rgba(251,81,104,0.12)" : "rgba(138,100,255,0.12)",
          color: extractStatus.startsWith("Error")
            ? "var(--danger)" : "var(--accent-soft)",
          fontSize: 12,
          fontWeight: 600,
          marginTop: 8,
          lineHeight: 1.4,
        }}>{extractStatus}</div>
      )}

      <button
        className="btn primary"
        style={{ width: "100%", justifyContent: "center", marginTop: 6 }}
        onClick={onReExtract}
      >
        <Icon name="sparkles" size={14} />
        Extract from all sources
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PipelinePanel — wired to real sidecar calls
// ---------------------------------------------------------------------------

export function PipelinePanel({ doc, onUpdateDoc, instructions, ragQuery, participantName, sourceFolder, freeFormContext }: PipelinePanelProps) {
  const [stepStates, setStepStates] = useState<Record<number, "done" | "active" | "running" | "">>({
    1: "",
    2: "",
    3: "",
    4: "",
    5: "",
  });
  const [stepSubs, setStepSubs] = useState<Record<number, string>>({
    1: "Analyze editability",
    2: "Extract field schema",
    3: "Extract field values from sources",
    4: "Write values to PDF",
    5: "Flatten + watermark",
  });
  const [runningAll, setRunningAll] = useState(false);

  const updateStep = (num: number, state: "done" | "active" | "running" | "", sub?: string) => {
    setStepStates((prev) => ({ ...prev, [num]: state }));
    if (sub) setStepSubs((prev) => ({ ...prev, [num]: sub }));
  };

  const handleRunIngest = useCallback(async () => {
    updateStep(1, "running", "Ingesting...");
    const result = await runIngest(doc);
    if (result.error) {
      updateStep(1, "", `Error: ${result.error}`);
      return false;
    }
    updateStep(1, "done", `Analyzed editability \u00B7 ${result.editability ?? "AcroForm"} detected`);
    if (onUpdateDoc) onUpdateDoc(doc.id, { pct: 10 });
    return true;
  }, [doc, onUpdateDoc]);

  const handleRunSchema = useCallback(async () => {
    updateStep(2, "running", "Extracting schema...");
    const result = await runSchema(doc);
    if (result.error) {
      updateStep(2, "", `Error: ${result.error}`);
      return false;
    }
    updateStep(2, "done", `${result.fieldCount ?? 0} fields \u00B7 Native + Vision pass`);
    if (onUpdateDoc) onUpdateDoc(doc.id, { pct: 30 });
    return true;
  }, [doc, onUpdateDoc]);

  const handleRunExtract = useCallback(async () => {
    updateStep(3, "running", "Gathering data from all sources...");
    const result = await runExtract(doc, instructions, ragQuery, participantName, sourceFolder, freeFormContext);
    if (result.error) {
      updateStep(3, "active", `Error: ${result.error}`);
      return false;
    }
    const fieldCount = useStore.getState().fields.length;
    const filledCount = result.filledCount ?? 0;
    const flagged = fieldCount - filledCount;
    updateStep(3, "done", `${filledCount}/${fieldCount} filled${flagged > 0 ? ` \u00B7 ${flagged} flagged for review` : ""}`);
    if (onUpdateDoc) onUpdateDoc(doc.id, { pct: 70 });
    return true;
  }, [doc, instructions, ragQuery, participantName, sourceFolder, freeFormContext, onUpdateDoc]);

  const handleRunFill = useCallback(async () => {
    updateStep(4, "running", "Filling PDF...");
    const result = await runFill(doc);
    if (result.error) {
      updateStep(4, "", `Error: ${result.error}`);
      return false;
    }
    updateStep(4, "done", `Direct path (writable AcroForm)`);
    if (onUpdateDoc) onUpdateDoc(doc.id, { pct: 90 });
    return true;
  }, [doc, onUpdateDoc]);

  const handleRunExport = useCallback(async () => {
    updateStep(5, "running", "Exporting...");
    const result = await runExport(doc);
    if (result.error) {
      updateStep(5, "", `Error: ${result.error}`);
      return false;
    }
    updateStep(5, "done", `Exported to ${result.destPath}`);
    if (onUpdateDoc) onUpdateDoc(doc.id, { pct: 100, status: "done" });
    return true;
  }, [doc, onUpdateDoc]);

  const handleRunFullPipeline = useCallback(async () => {
    setRunningAll(true);
    const ok1 = await handleRunIngest();
    if (!ok1) { setRunningAll(false); return; }
    const ok2 = await handleRunSchema();
    if (!ok2) { setRunningAll(false); return; }
    const ok3 = await handleRunExtract();
    if (!ok3) { setRunningAll(false); return; }
    const ok4 = await handleRunFill();
    if (!ok4) { setRunningAll(false); return; }
    await handleRunExport();
    setRunningAll(false);
  }, [handleRunIngest, handleRunSchema, handleRunExtract, handleRunFill, handleRunExport]);

  const steps: (PipelineStep & { handler: () => Promise<boolean> })[] = [
    {
      num: 1,
      name: "Ingest",
      sub: stepSubs[1],
      state: stepStates[1] === "running" ? "active" : stepStates[1] as "done" | "active" | "",
      handler: handleRunIngest,
    },
    {
      num: 2,
      name: "Schema extraction",
      sub: stepSubs[2],
      state: stepStates[2] === "running" ? "active" : stepStates[2] as "done" | "active" | "",
      handler: handleRunSchema,
    },
    {
      num: 3,
      name: "Value extraction",
      sub: stepSubs[3],
      state: stepStates[3] === "running" ? "active" : stepStates[3] as "done" | "active" | "",
      handler: handleRunExtract,
    },
    {
      num: 4,
      name: "Fill PDF",
      sub: stepSubs[4],
      state: stepStates[4] === "running" ? "active" : stepStates[4] as "done" | "active" | "",
      handler: handleRunFill,
    },
    {
      num: 5,
      name: "Export",
      sub: stepSubs[5],
      state: stepStates[5] === "running" ? "active" : stepStates[5] as "done" | "active" | "",
      handler: handleRunExport,
    },
  ];

  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "var(--text-faint)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        Pipeline
      </div>
      {steps.map((s) => (
        <div key={s.num} className={"pipe-step " + s.state}>
          <div className="num">
            {s.state === "done" ? <Icon name="check" size={14} /> : s.num}
          </div>
          <div style={{ minWidth: 0 }}>
            <div className="pipe-name">{s.name}</div>
            <div className="pipe-sub">{s.sub}</div>
          </div>
          <div className="pipe-cta">
            {stepStates[s.num] === "running" ? (
              <button className="btn small" disabled>
                <Icon name="loader" size={12} />
              </button>
            ) : s.state === "active" ? (
              <button className="btn small primary" onClick={() => s.handler()}>Resume</button>
            ) : s.state === "" ? (
              <button className="btn small" onClick={() => s.handler()}>Run</button>
            ) : (
              <Icon
                name="check"
                size={16}
                style={{ color: "var(--success)" }}
              />
            )}
          </div>
        </div>
      ))}
      <button
        className="btn primary"
        style={{ width: "100%", justifyContent: "center", marginTop: 16 }}
        onClick={handleRunFullPipeline}
        disabled={runningAll}
      >
        <Icon name="zap" size={14} />
        {runningAll ? "Running pipeline..." : "Run full pipeline"}
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// InfoPanel
// ---------------------------------------------------------------------------

export function InfoPanel({ doc }: InfoPanelProps) {
  const { editability, path: fillPath, filledPath } = useStore();

  const rows: [string, string][] = [
    ["Filename", doc.fileName],
    ["Participant", doc.participant || "\u2014"],
    ["Pages", String(doc.pages)],
    ["Editability", editability ? String(editability) : "Editable AcroForm"],
    ["Fill path", fillPath ? String(fillPath) : "Direct write"],
    ["Replica path", "\u2014"],
    ["File path", doc.filePath || "\u2014"],
    ["Filled path", filledPath || "\u2014"],
    ["Sidecar", "/sidecar :8801 \u00B7 OK"],
  ];

  return (
    <div>
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: "var(--text-faint)",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          marginBottom: 12,
        }}
      >
        Document metadata
      </div>
      {rows.map(([k, v]) => (
        <div
          key={k}
          style={{
            display: "flex",
            justifyContent: "space-between",
            padding: "9px 0",
            borderBottom: "1px solid var(--border)",
            fontSize: 12.5,
          }}
        >
          <span style={{ color: "var(--text-muted)" }}>{k}</span>
          <span
            style={{
              color: "var(--text-hi)",
              fontWeight: 500,
              fontFamily:
                k === "Filename" || k === "File path" || k === "Filled path"
                  ? "var(--font-mono)"
                  : "inherit",
              maxWidth: 200,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {v}
          </span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ReplaceAndSave — replaces original empty form with the filled version
// ---------------------------------------------------------------------------

export function _ReplaceAndSave({ doc }: { doc: OpenDoc }) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");

  // Only show when the doc has been through the fill pipeline
  const isFilled = doc.status === "done" || doc.pct === 100;
  if (!isFilled) return null;

  // Derive a filled path from the original filename
  const filledPath = doc.fileName.replace(/\.pdf$/i, "-filled.pdf");

  const handleReplace = async () => {
    setStatus("loading");
    setStatusMsg("Replacing original...");
    try {
      if (window.api?.replaceFile) {
        const result = await window.api.replaceFile(doc.fileName, filledPath);
        if (result.success) {
          setStatus("success");
          setStatusMsg("Original replaced with filled version");
          setTimeout(() => {
            setStatus("idle");
            setStatusMsg("");
          }, 3000);
        } else {
          setStatus("error");
          setStatusMsg(result.error || "Failed to replace file");
        }
      } else {
        // Browser-mode fallback: show confirmation
        setStatus("success");
        setStatusMsg("Original replaced with filled version");
        setTimeout(() => {
          setStatus("idle");
          setStatusMsg("");
        }, 3000);
      }
    } catch (err) {
      setStatus("error");
      setStatusMsg(String(err));
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        className="btn small ghost"
        onClick={handleReplace}
        disabled={status === "loading"}
      >
        <Icon name="save" size={13} />
        {status === "loading"
          ? "Replacing..."
          : status === "success"
            ? "Replaced"
            : "Replace & Save"}
      </button>
      {statusMsg && status !== "idle" && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: 6,
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            padding: "8px 14px",
            fontSize: 12,
            fontWeight: 600,
            whiteSpace: "nowrap",
            zIndex: 100,
            color:
              status === "success"
                ? "var(--success, #34d399)"
                : status === "error"
                  ? "var(--danger, #ef4444)"
                  : "var(--text-hi)",
          }}
        >
          {statusMsg}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ImportToParticipant — dropdown for moving docs to participant folders
// ---------------------------------------------------------------------------

function ImportToParticipant({ doc, onMoved }: { doc: OpenDoc; onMoved?: (newPath: string) => void }) {
  const [open, setOpen] = useState(false);
  const [participants, setParticipants] = useState<RealParticipant[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<RealParticipant | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("");

  // Auto-suggest a participant based on the document filename
  // e.g., "ServiceBooking-MarcusChen.pdf" → suggests "Marcus Chen"
  const suggestParticipant = (name: string): string | null => {
    // Remove extension and common prefixes
    const base = name.replace(/\.pdf$/i, "").replace(/[-_]/g, " ");
    // Try to find a participant name embedded in the filename
    for (const p of participants) {
      const nameParts = p.name.toLowerCase().split(" ");
      const baseLower = base.toLowerCase();
      // Check if all name parts appear in the filename
      if (nameParts.every((part) => baseLower.includes(part))) {
        return p.id;
      }
      // Check concatenated name (e.g., "MarcusChen")
      const concat = p.name.replace(/\s+/g, "").toLowerCase();
      if (baseLower.includes(concat)) {
        return p.id;
      }
    }
    return null;
  };

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    async function load() {
      if (window.api?.scanParticipants) {
        try {
          const result = await window.api.scanParticipants();
          if (!cancelled && result.participants) {
            const colored = result.participants.map((p: RealParticipant, i: number) => ({
              ...p,
              color: p.color || PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length],
            }));
            setParticipants(colored);
          }
        } catch {
          setParticipants([]);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [open]);

  // Auto-select suggested participant when participants load
  useEffect(() => {
    if (participants.length === 0 || selectedParticipant) return;
    const suggestedId = suggestParticipant(doc.fileName);
    if (suggestedId) {
      const match = participants.find((p) => p.id === suggestedId);
      if (match) setSelectedParticipant(match);
    }
  }, [participants]);

  const handleImport = async (subfolder: string) => {
    if (!selectedParticipant) return;
    setStatus("loading");
    setStatusMsg("Moving file...");
    try {
      if (window.api?.moveFile) {
        // Build destination path: participantFolder/subfolder/filename
        const destFolder = subfolder === "."
          ? selectedParticipant.folderPath
          : selectedParticipant.folderPath + "/" + subfolder;
        const destPath = destFolder + "/" + doc.fileName.split("/").pop();
        const result = await window.api.moveFile(doc.fileName, destPath);
        if (result.success) {
          setStatus("success");
          setStatusMsg(`Moved to ${selectedParticipant.name}/${subfolder}`);
          if (onMoved && result.destPath) {
            onMoved(result.destPath);
          }
          setTimeout(() => {
            setOpen(false);
            setSelectedParticipant(null);
            setStatus("idle");
            setStatusMsg("");
          }, 2000);
        } else {
          setStatus("error");
          setStatusMsg(result.error || "Failed to move file");
        }
      } else if (window.api?.importFileToParticipant) {
        // Fallback to copy-based import if moveFile is not available
        const result = await window.api.importFileToParticipant(
          doc.fileName,
          selectedParticipant.folderPath,
          subfolder,
        );
        if (result.success) {
          setStatus("success");
          setStatusMsg(`Moved to ${selectedParticipant.name}/${subfolder}`);
          if (onMoved && result.destPath) {
            onMoved(result.destPath);
          }
          setTimeout(() => {
            setOpen(false);
            setSelectedParticipant(null);
            setStatus("idle");
            setStatusMsg("");
          }, 2000);
        } else {
          setStatus("error");
          setStatusMsg(result.error || "Failed to move file");
        }
      } else {
        setStatus("error");
        setStatusMsg("Move API not available (browser mode)");
      }
    } catch (err) {
      setStatus("error");
      setStatusMsg(String(err));
    }
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        className="btn small ghost"
        onClick={() => {
          setOpen(!open);
          setSelectedParticipant(null);
          setStatus("idle");
          setStatusMsg("");
        }}
      >
        <Icon name="arrow-right" size={13} />
        Move to Participant
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            right: 0,
            marginTop: 6,
            background: "var(--card)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            width: 280,
            zIndex: 100,
            overflow: "hidden",
          }}
        >
          {/* Status banner */}
          {status !== "idle" && (
            <div
              style={{
                padding: "8px 14px",
                fontSize: 12,
                fontWeight: 600,
                background:
                  status === "success"
                    ? "rgba(52,211,153,0.15)"
                    : status === "error"
                      ? "rgba(239,68,68,0.15)"
                      : "rgba(138,100,255,0.15)",
                color:
                  status === "success"
                    ? "var(--success, #34d399)"
                    : status === "error"
                      ? "var(--danger, #ef4444)"
                      : "var(--primary)",
                borderBottom: "1px solid var(--border)",
              }}
            >
              {statusMsg}
            </div>
          )}

          {!selectedParticipant ? (
            <>
              <div
                style={{
                  padding: "10px 14px 6px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-faint)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Select participant
              </div>
              <div style={{ maxHeight: 240, overflowY: "auto" }}>
                {participants.length === 0 ? (
                  <div style={{ padding: "16px 14px", fontSize: 12, color: "var(--text-faint)", textAlign: "center" }}>
                    No participants found
                  </div>
                ) : (
                  participants.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        padding: "8px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        cursor: "pointer",
                        borderBottom: "1px solid var(--border)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(138,100,255,0.08)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      onClick={() => setSelectedParticipant(p)}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: "50%",
                          background: p.color || PARTICIPANT_COLORS[0],
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 700,
                          color: "white",
                          flexShrink: 0,
                        }}
                      >
                        {p.initials}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-hi)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-faint)" }}>
                          {p.fileCount} files
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  padding: "10px 14px 6px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <button
                  className="btn small ghost"
                  style={{ padding: "2px 4px" }}
                  onClick={() => setSelectedParticipant(null)}
                >
                  <Icon name="chevron-left" size={12} />
                </button>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-hi)" }}>
                  {selectedParticipant.name}
                </span>
              </div>
              <div
                style={{
                  padding: "4px 14px 6px",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--text-faint)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                Choose subfolder
              </div>
              <div style={{ maxHeight: 240, overflowY: "auto" }}>
                {selectedParticipant.subfolders.length === 0 ? (
                  <div
                    style={{
                      padding: "8px 14px",
                      cursor: "pointer",
                      borderBottom: "1px solid var(--border)",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(138,100,255,0.08)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                    onClick={() => handleImport(".")}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Icon name="folder" size={13} style={{ color: "var(--text-faint)" }} />
                      <span style={{ fontSize: 13, color: "var(--text-hi)" }}>Root folder</span>
                    </div>
                  </div>
                ) : (
                  selectedParticipant.subfolders.map((sf) => (
                    <div
                      key={sf}
                      style={{
                        padding: "8px 14px",
                        cursor: "pointer",
                        borderBottom: "1px solid var(--border)",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(138,100,255,0.08)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                      onClick={() => handleImport(sf)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Icon name="folder" size={13} style={{ color: "var(--text-faint)" }} />
                        <span style={{ fontSize: 13, color: "var(--text-hi)" }}>{sf}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AutoFillPanel — single automated workflow, no manual tabs
// ---------------------------------------------------------------------------

type AutoFillStep = "idle" | "selecting" | "running" | "done" | "error";

function AutoFillPanel({
  doc,
  onUpdateDoc,
  onResolveAmbiguity: _onResolveAmbiguity,
}: {
  doc: OpenDoc;
  onUpdateDoc?: (id: string, updates: Partial<OpenDoc>) => void;
  onResolveAmbiguity?: () => void;
}) {
  const [participants, setParticipants] = useState<RealParticipant[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [instructions, setInstructions] = useState<string>("");
  const [step, setStep] = useState<AutoFillStep>("idle");
  const [progress, setProgress] = useState<string>("");
  const [stepNum, setStepNum] = useState<number>(0);
  const [totalSteps] = useState<number>(5);
  const [fieldCount, setFieldCount] = useState<number>(0);
  const [filledCount, setFilledCount] = useState<number>(0);
  const [showFields, setShowFields] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const { fields, fieldValues } = useStore();

  // Load real participants on mount
  useEffect(() => {
    if (window.api?.scanParticipants) {
      window.api.scanParticipants().then((r) => {
        const pList = (r.participants || []).map((p: RealParticipant, i: number) => ({
          ...p,
          color: p.color || PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length],
        }));
        setParticipants(pList);
        // Auto-detect participant from filename
        if (doc.fileName && pList.length > 0) {
          const fname = doc.fileName.toLowerCase().replace(/[-_]/g, " ");
          const match = pList.find((p: RealParticipant) =>
            fname.includes(p.name.toLowerCase().replace(/[-_]/g, " ")) ||
            fname.includes(p.name.toLowerCase().split(" ").join(""))
          );
          if (match) setSelectedId(match.id);
        }
      }).catch(() => setParticipants([]));
    } else {
      // Browser fallback
      setParticipants(MOCK_PARTICIPANTS.map((p, i) => ({
        id: p.id, name: p.name, initials: p.initials,
        folderPath: "", folderName: "", subfolders: [],
        fileCount: 0, hasIntakeForm: false, hasServiceAgreement: false, hasCaseNotes: false,
        recentFiles: [],
        color: PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length],
      })));
    }
  }, [doc.fileName]);

  const selectedParticipant = participants.find(p => p.id === selectedId);

  // THE ONE BUTTON — runs entire pipeline automatically
  const handleAutoFill = useCallback(async () => {
    if (!doc.filePath) {
      setErrorMsg("No file loaded. Upload a PDF first.");
      setStep("error");
      return;
    }
    if (!selectedParticipant) {
      setErrorMsg("Select a participant first.");
      setStep("error");
      return;
    }

    setStep("running");
    setErrorMsg("");

    // STEP 1: Ingest
    setStepNum(1);
    setProgress("Analyzing PDF structure...");
    const ingestResult = await runIngest(doc);
    if (ingestResult.error) {
      setErrorMsg(`Ingest failed: ${ingestResult.error}`);
      setStep("error");
      return;
    }
    if (onUpdateDoc) onUpdateDoc(doc.id, { pct: 10 });

    // STEP 2: Schema
    setStepNum(2);
    setProgress(`PDF is ${ingestResult.editability}. Extracting form fields...`);
    const schemaResult = await runSchema(doc);
    if (schemaResult.error) {
      setErrorMsg(`Schema extraction failed: ${schemaResult.error}`);
      setStep("error");
      return;
    }
    setFieldCount(schemaResult.fieldCount || 0);
    setProgress(`Found ${schemaResult.fieldCount} fields. Gathering participant data...`);
    if (onUpdateDoc) onUpdateDoc(doc.id, { pct: 25 });

    // STEP 3: Extract values from all sources
    setStepNum(3);
    setProgress(`Querying RAG for ${selectedParticipant.name}... Reading SC folder...`);
    const extractResult = await runExtract(
      doc,
      instructions,
      "", // ragQuery — the participant name query is built inside runExtract
      selectedParticipant.name,
      selectedParticipant.folderPath,
      "", // freeFormContext
    );
    if (extractResult.error) {
      setErrorMsg(`Extraction failed: ${extractResult.error}`);
      setStep("error");
      return;
    }
    setFilledCount(extractResult.filledCount || 0);
    setProgress(`Extracted ${extractResult.filledCount} field values. Generating PDF...`);
    if (onUpdateDoc) onUpdateDoc(doc.id, { pct: 60 });

    // STEP 4: Fill PDF
    setStepNum(4);
    setProgress("Writing values to PDF...");
    const fillResult = await runFill(doc);
    if (fillResult.error) {
      setErrorMsg(`Fill failed: ${fillResult.error}`);
      setStep("error");
      return;
    }
    if (onUpdateDoc) onUpdateDoc(doc.id, { pct: 90 });

    // DONE
    setStepNum(5);
    setProgress(`Complete. ${extractResult.filledCount}/${schemaResult.fieldCount} fields filled.`);
    setStep("done");
    if (onUpdateDoc) onUpdateDoc(doc.id, { pct: 100, status: "done" });
  }, [doc, selectedParticipant, instructions, onUpdateDoc]);

  const handleExport = useCallback(async () => {
    setProgress("Exporting...");
    const result = await runExport(doc);
    if (result.error) {
      setProgress(`Export error: ${result.error}`);
    } else {
      setProgress(`Exported to ${result.destPath}`);
    }
  }, [doc]);

  const pct = totalSteps > 0 ? Math.round((stepNum / totalSteps) * 100) : 0;

  return (
    <div className="controlpanel">
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 14, height: "100%", overflow: "auto" }}>

        {/* Header */}
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Auto-Fill
        </div>

        {/* Step 1: Select participant */}
        <div className="field-card">
          <div className="field-card-head">
            <span className="field-card-label">Who is this form for?</span>
          </div>
          <select
            className="field-input"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            disabled={step === "running"}
          >
            <option value="">-- Select participant --</option>
            {participants.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          {selectedParticipant && (
            <div className="field-source" style={{ marginTop: 6 }}>
              {selectedParticipant.fileCount} files in SC folder
              {selectedParticipant.folderPath ? ` \u00B7 ${selectedParticipant.folderPath.split("/").pop()}` : ""}
            </div>
          )}
        </div>

        {/* Optional: checkbox instructions */}
        <div className="field-card">
          <div className="field-card-head">
            <span className="field-card-label">Checkbox instructions</span>
            <span className="field-card-pill high" style={{ fontSize: 9 }}>optional</span>
          </div>
          <textarea
            className="field-input"
            rows={3}
            placeholder={"Example:\n\u2022 Tick Yes for consent\n\u2022 Tick Plan managed\n\u2022 Check At Home for location"}
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            disabled={step === "running"}
            style={{ resize: "vertical", fontSize: 12 }}
          />
        </div>

        {/* THE BUTTON */}
        {step !== "done" && (
          <button
            className="btn primary"
            style={{ width: "100%", justifyContent: "center", minHeight: 48, fontSize: 15, fontWeight: 700 }}
            onClick={handleAutoFill}
            disabled={step === "running" || !selectedId}
          >
            {step === "running" ? (
              <><Icon name="loader" size={16} /> Running...</>
            ) : (
              <><Icon name="zap" size={16} /> Auto-Fill Form</>
            )}
          </button>
        )}

        {/* Progress */}
        {step === "running" && (
          <div className="field-card" style={{ borderColor: "var(--border-strong)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-soft)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                Step {stepNum} of {totalSteps}
              </div>
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(138,100,255,0.15)" }}>
                <div style={{ width: pct + "%", height: "100%", borderRadius: 2, background: "var(--primary)", transition: "width 300ms ease" }}></div>
              </div>
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 700 }}>{pct}%</span>
            </div>
            <div style={{ fontSize: 12.5, color: "var(--text)", lineHeight: 1.5 }}>{progress}</div>
          </div>
        )}

        {/* Error */}
        {step === "error" && (
          <div className="field-card" style={{ borderColor: "var(--danger)" }}>
            <div style={{ fontSize: 12.5, color: "var(--danger)", lineHeight: 1.5 }}>
              <Icon name="warning" size={14} style={{ verticalAlign: "middle", marginRight: 6 }} />
              {errorMsg}
            </div>
            <button className="btn small" style={{ marginTop: 8 }} onClick={() => { setStep("idle"); setErrorMsg(""); }}>
              Try again
            </button>
          </div>
        )}

        {/* Done */}
        {step === "done" && (
          <>
            <div className="field-card" style={{ borderColor: "var(--success, #34d399)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Icon name="check" size={16} style={{ color: "var(--success, #34d399)" }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-hi)" }}>Form filled successfully</span>
              </div>
              <div style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5 }}>
                {filledCount} of {fieldCount} fields populated from {selectedParticipant?.name || "participant"}'s data.
              </div>
            </div>

            <button
              className="btn primary"
              style={{ width: "100%", justifyContent: "center", minHeight: 44 }}
              onClick={handleExport}
            >
              <Icon name="download" size={15} /> Export Filled PDF
            </button>

            <button
              className="btn"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => { setStep("idle"); setStepNum(0); }}
            >
              <Icon name="sparkles" size={14} /> Re-run with different settings
            </button>
          </>
        )}

        {/* Info section — always visible at bottom */}
        <div style={{ marginTop: "auto", borderTop: "1px solid var(--border)", paddingTop: 12 }}>
          <div
            style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            onClick={() => setShowFields(!showFields)}
          >
            <Icon name={showFields ? "chevron-down" : "chevron-right"} size={12} />
            {fields.length > 0 ? `${fields.length} fields detected` : "Document info"}
          </div>

          {showFields && fields.length > 0 && (
            <div style={{ maxHeight: 200, overflow: "auto", marginBottom: 8 }}>
              {fields.map(f => (
                <div key={f.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 11.5, borderBottom: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--text-muted)" }}>{f.label}</span>
                  <span style={{ color: fieldValues[f.id] ? "var(--success, #34d399)" : "var(--text-faint)", fontWeight: 600, maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right" }}>
                    {fieldValues[f.id] !== undefined && fieldValues[f.id] !== ""
                      ? (typeof fieldValues[f.id] === "boolean" ? (fieldValues[f.id] ? "\u2713" : "\u2717") : String(fieldValues[f.id]))
                      : "\u2014"}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div style={{ fontSize: 11, color: "var(--text-faint)", lineHeight: 1.6 }}>
            <div>{doc.fileName}</div>
            <div>{doc.pages} pages \u00B7 {doc.filePath ? "Real PDF" : "Demo"}</div>
            {selectedParticipant && <div>Participant: {selectedParticipant.name}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// MaximizedDoc
// ---------------------------------------------------------------------------

export function MaximizedDoc({
  doc,
  openDocs,
  setActiveDocId,
  closeDoc,
  minimize,
  onResolveAmbiguity,
  onUpdateDoc,
  onAddNew,
}: MaximizedDocProps) {
  // When switching to a doc with a filePath, set the store's uploadedPath
  const { setUploaded } = useStore();
  useEffect(() => {
    if (doc.filePath) {
      setUploaded(doc.filePath);
    }
  }, [doc.id, doc.filePath, setUploaded]);

  return (
    <div className="docworkspace">
      <div className="doctabs">
        {openDocs.map((d) => (
          <div
            key={d.id}
            className={"doctab " + (d.id === doc.id ? "active" : "")}
            onClick={() => setActiveDocId(d.id)}
          >
            <Icon name="forms" size={13} />
            <span className="name">{d.fileName}</span>
            <span
              className="close"
              onClick={(e) => {
                e.stopPropagation();
                closeDoc(d.id);
              }}
            >
              <Icon name="x" size={12} />
            </span>
          </div>
        ))}
        <div className="doctab-add" onClick={onAddNew}>
          <Icon name="plus" size={13} />
          New
        </div>
        <div style={{ flex: 1 }}></div>
        <button className="btn small ghost" onClick={minimize}>
          <Icon name="minimize" size={13} />
          Minimize
        </button>
      </div>

      <div className="docpanel">
        <div className="pdf-viewer">
          <div className="pdf-toolbar">
            <button className="btn small ghost">
              <Icon name="chevron-left" size={13} />
            </button>
            <span>
              Page 1 of {doc.pages}
            </span>
            <button className="btn small ghost">
              <Icon name="chevron-right" size={13} />
            </button>
            <div className="spacer"></div>
            <span style={{ color: "var(--text-faint)" }}>Zoom 100%</span>
            <ImportToParticipant
              doc={doc}
              onMoved={(newPath) => {
                if (onUpdateDoc) {
                  const newFileName = newPath.split("/").pop() || doc.fileName;
                  onUpdateDoc(doc.id, { fileName: newFileName, filePath: newPath });
                }
              }}
            />
          </div>
          <div className="pdf-canvas">
            {doc.filePath ? (
              <DocumentViewer />
            ) : (
              <FakePdfPage doc={doc} />
            )}
          </div>
        </div>

        <AutoFillPanel
          doc={doc}
          onUpdateDoc={onUpdateDoc}
          onResolveAmbiguity={onResolveAmbiguity}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FormsView  (top-level)
// ---------------------------------------------------------------------------

export function FormsView({ onResolveAmbiguity }: FormsViewProps) {
  // Start empty in Electron mode; use mock data in browser mode as demo
  const hasElectronApi = typeof window !== "undefined" && window.api != null && typeof window.api.openFile === "function";
  const [openDocs, setOpenDocs] = useState<OpenDoc[]>(
    hasElectronApi ? [] : MOCK_OPEN_DOCS
  );
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  const activeDoc = openDocs.find((d) => d.id === activeDocId);

  const closeDoc = (id: string) => {
    setOpenDocs(openDocs.filter((d) => d.id !== id));
    if (activeDocId === id) {
      const remaining = openDocs.filter((d) => d.id !== id);
      setActiveDocId(remaining[0]?.id ?? null);
    }
  };

  const handleOpenFile = useCallback(async () => {
    if (openDocs.length >= 4) return;

    if (hasElectronApi) {
      const newDoc = await pickAndOpenFile();
      if (!newDoc) return;
      setOpenDocs((prev) => [...prev.slice(0, 3), newDoc]); // max 4
      setActiveDocId(newDoc.id);
      // Set uploaded path in store so DocumentViewer can pick it up
      useStore.getState().setUploaded(newDoc.filePath!);
    } else {
      // Browser fallback: create an untitled doc
      const id = "doc" + Date.now();
      const newDoc: OpenDoc = {
        id,
        fileName: "Untitled.pdf",
        participant: "\u2014",
        pages: 1,
        pct: 0,
        status: "progress",
      };
      setOpenDocs([...openDocs, newDoc]);
      setActiveDocId(id);
    }
  }, [openDocs]);

  const updateDoc = (id: string, updates: Partial<OpenDoc>) => {
    setOpenDocs((prev) =>
      prev.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    );
  };

  if (activeDoc) {
    return (
      <MaximizedDoc
        doc={activeDoc}
        openDocs={openDocs}
        setActiveDocId={setActiveDocId}
        closeDoc={closeDoc}
        minimize={() => setActiveDocId(null)}
        onResolveAmbiguity={onResolveAmbiguity}
        onUpdateDoc={updateDoc}
        onAddNew={handleOpenFile}
      />
    );
  }

  return (
    <DocGrid
      docs={openDocs}
      setActiveDocId={setActiveDocId}
      closeDoc={closeDoc}
      onAddNew={handleOpenFile}
    />
  );
}
