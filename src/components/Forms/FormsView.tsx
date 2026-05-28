import React, { useState, useEffect } from "react";
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

interface MaximizedDocProps {
  doc: OpenDoc;
  openDocs: OpenDoc[];
  setActiveDocId: (id: string) => void;
  closeDoc: (id: string) => void;
  minimize: () => void;
  onResolveAmbiguity?: () => void;
  onUpdateDoc?: (id: string, updates: Partial<OpenDoc>) => void;
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
        <button className="btn primary">
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
// FieldsPanel
// ---------------------------------------------------------------------------

export function FieldsPanel({ onResolveAmbiguity }: FieldsPanelProps) {
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
// SourcesPanel
// ---------------------------------------------------------------------------

export function SourcesPanel() {
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
        <select className="field-input" defaultValue="Marcus Chen">
          {MOCK_PARTICIPANTS.map((p) => (
            <option key={p.id}>{p.name}</option>
          ))}
        </select>
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
            defaultValue="/Documents/NDIS/Marcus_Chen/"
          />
          <button className="btn small">
            <Icon name="folder" size={13} />
          </button>
        </div>
        <div className="field-source">
          12 files &middot; Auto-watched for changes
        </div>
      </div>

      <div className="field-card">
        <div className="field-card-head">
          <span className="field-card-label">RAG workspace</span>
        </div>
        <select className="field-input" defaultValue="NDIS Pricing 2026">
          <option>NDIS Pricing 2026</option>
          <option>Internal SOPs</option>
          <option>Provider docs</option>
          <option>Participant workspace</option>
        </select>
      </div>

      <div className="field-card">
        <div className="field-card-head">
          <span className="field-card-label">Free-form context</span>
        </div>
        <textarea
          className="field-input"
          rows={4}
          placeholder="Paste an email, meeting note, or extra context for Claude to use during extraction\u2026"
          style={{ resize: "vertical" }}
        ></textarea>
      </div>

      <button
        className="btn primary"
        style={{ width: "100%", justifyContent: "center", marginTop: 6 }}
      >
        <Icon name="sparkles" size={14} />
        Re-extract field values
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// PipelinePanel
// ---------------------------------------------------------------------------

export function PipelinePanel() {
  const steps: PipelineStep[] = [
    {
      num: 1,
      name: "Ingest",
      sub: "Analyzed editability \u00B7 AcroForm detected",
      state: "done",
    },
    {
      num: 2,
      name: "Schema extraction",
      sub: "12 fields \u00B7 Native + Vision pass",
      state: "done",
    },
    {
      num: 3,
      name: "Value extraction",
      sub: "10/12 filled \u00B7 2 flagged for review",
      state: "active",
    },
    {
      num: 4,
      name: "Fill PDF",
      sub: "Direct path (writable AcroForm)",
      state: "",
    },
    {
      num: 5,
      name: "Export",
      sub: "Flatten + watermark",
      state: "",
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
            {s.state === "active" ? (
              <button className="btn small primary">Resume</button>
            ) : s.state === "" ? (
              <button className="btn small">Run</button>
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
      >
        <Icon name="zap" size={14} />
        Run full pipeline
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// InfoPanel
// ---------------------------------------------------------------------------

export function InfoPanel({ doc }: InfoPanelProps) {
  const rows: [string, string][] = [
    ["Filename", doc.fileName],
    ["Participant", doc.participant],
    ["Pages", String(doc.pages)],
    ["Editability", "Editable AcroForm"],
    ["Fill path", "Direct write"],
    ["Replica path", "\u2014"],
    ["Created", "May 28, 2026 \u00B7 14:22"],
    ["Last filled", "May 28, 2026 \u00B7 14:24"],
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
                k === "Filename" ? "var(--font-mono)" : "inherit",
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

function ReplaceAndSave({ doc }: { doc: OpenDoc }) {
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
}: MaximizedDocProps) {
  const [subtab, setSubtab] = useState<string>("fields");

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
        <div className="doctab-add">
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
            <ReplaceAndSave doc={doc} />
            <ImportToParticipant
              doc={doc}
              onMoved={(newPath) => {
                if (onUpdateDoc) {
                  // Extract just the filename from the new path
                  const newFileName = newPath.split("/").pop() || doc.fileName;
                  onUpdateDoc(doc.id, { fileName: newFileName });
                }
              }}
            />
            <button className="btn small ghost">
              <Icon name="download" size={13} />
              Export
            </button>
          </div>
          <div className="pdf-canvas">
            <FakePdfPage doc={doc} />
          </div>
        </div>

        <div className="controlpanel">
          <div className="controltabs">
            {["fields", "sources", "pipeline", "info"].map((t) => (
              <div
                key={t}
                className={
                  "controltab " + (subtab === t ? "active" : "")
                }
                onClick={() => setSubtab(t)}
              >
                {t[0].toUpperCase() + t.slice(1)}
              </div>
            ))}
          </div>
          <div className="controlbody">
            {subtab === "fields" && (
              <FieldsPanel onResolveAmbiguity={onResolveAmbiguity} />
            )}
            {subtab === "sources" && <SourcesPanel />}
            {subtab === "pipeline" && <PipelinePanel />}
            {subtab === "info" && <InfoPanel doc={doc} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// FormsView  (top-level)
// ---------------------------------------------------------------------------

export function FormsView({ onResolveAmbiguity }: FormsViewProps) {
  const [openDocs, setOpenDocs] = useState<OpenDoc[]>(MOCK_OPEN_DOCS);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);

  const activeDoc = openDocs.find((d) => d.id === activeDocId);

  const closeDoc = (id: string) => {
    setOpenDocs(openDocs.filter((d) => d.id !== id));
    if (activeDocId === id) {
      const remaining = openDocs.filter((d) => d.id !== id);
      setActiveDocId(remaining[0]?.id ?? null);
    }
  };

  const addNew = () => {
    if (openDocs.length >= 4) return;
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
  };

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
      />
    );
  }

  return (
    <DocGrid
      docs={openDocs}
      setActiveDocId={setActiveDocId}
      closeDoc={closeDoc}
      onAddNew={addNew}
    />
  );
}
