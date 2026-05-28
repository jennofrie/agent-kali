import React, { useState, useEffect } from "react";
import { Icon } from "../Shared/Icon";
import { StatCard, RecentFormCard } from "../Dashboard/DashboardView";
import {
  MOCK_PARTICIPANTS,
  MOCK_FORMS,
  MOCK_PROVIDERS,
  PARTICIPANT_COLORS,
  type Participant,
  type RealParticipant,
  type Provider,
} from "../../lib/mockData";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ParticipantCardProps {
  p: Participant;
  onOpen: () => void;
}

interface RealParticipantCardProps {
  p: RealParticipant;
  onOpen: () => void;
}

interface ParticipantGridProps {
  setActive: (p: Participant) => void;
}

interface RealParticipantGridProps {
  participants: RealParticipant[];
  setActive: (p: RealParticipant) => void;
}

interface ParticipantDetailProps {
  p: Participant;
  onBack: () => void;
}

interface RealParticipantDetailProps {
  p: RealParticipant;
  onBack: () => void;
}

interface ProviderCardProps {
  p: Provider;
}

interface Subtab {
  id: string;
  label: string;
  icon: string;
}

interface CaseNote {
  d: string;
  t: string;
  body: string;
}

type BudgetRow = [string, number, number];

type PlanSummaryEntry = [string, string];

// ---------------------------------------------------------------------------
// ParticipantCard (original, kept for mock fallback)
// ---------------------------------------------------------------------------

export function ParticipantCard({ p, onOpen }: ParticipantCardProps) {
  return (
    <div
      className="participant-card"
      style={{ "--p-color": p.color } as React.CSSProperties}
      onClick={onOpen}
    >
      <div
        className="p-avatar"
        style={{ "--p-color": p.color, background: p.color } as React.CSSProperties}
      >
        {p.initials}
      </div>
      <div className="p-name">{p.name}</div>
      <div className="p-ndis">NDIS · {p.ndis}</div>
      <div className="p-diag">{p.diagnosis}</div>
      <div className="p-foot">
        <span className="status-chip progress">
          <Icon name="calendar" size={11} />
          Plan ends {p.planExpiry}
        </span>
        <button className="btn small primary">
          <Icon name="forms" size={12} />
          Fill form
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RealParticipantCard — renders a card from filesystem-scanned data
// ---------------------------------------------------------------------------

export function RealParticipantCard({ p, onOpen }: RealParticipantCardProps) {
  const color = p.color || PARTICIPANT_COLORS[0];

  return (
    <div
      className="participant-card"
      style={{ "--p-color": color } as React.CSSProperties}
      onClick={onOpen}
    >
      <div
        className="p-avatar"
        style={{ "--p-color": color, background: color } as React.CSSProperties}
      >
        {p.initials}
      </div>
      <div className="p-name">{p.name}</div>
      <div className="p-ndis" style={{ fontFamily: p.ndis ? "var(--font-mono)" : "inherit" }}>
        {p.ndis ? `NDIS · ${p.ndis}` : `${p.fileCount} files`}
      </div>
      <div className="p-diag">
        {p.diagnosis || (p.subfolders.length > 0 ? p.subfolders.slice(0, 3).join(", ") : "No subfolders")}
      </div>
      <div className="p-foot">
        <span className="status-chip progress">
          <Icon name="folder" size={11} />
          {p.subfolders.length} folders
        </span>
        <button className="btn small primary">
          <Icon name="forms" size={12} />
          Fill form
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ParticipantGrid (original, kept for mock fallback)
// ---------------------------------------------------------------------------

export function ParticipantGrid({ setActive }: ParticipantGridProps) {
  return (
    <div>
      <div className="section-head" style={{ marginTop: 0 }}>
        <div>
          <div className="section-title">All participants</div>
          <div className="section-sub">
            32 active · 4 plan reviews this fortnight
          </div>
        </div>
        <button className="btn primary">
          <Icon name="plus" size={14} />
          New intake
        </button>
      </div>
      <div className="participants-grid">
        {MOCK_PARTICIPANTS.map((p) => (
          <ParticipantCard key={p.id} p={p} onOpen={() => setActive(p)} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// RealParticipantGrid — grid of real scanned participants
// ---------------------------------------------------------------------------

export function RealParticipantGrid({ participants, setActive }: RealParticipantGridProps) {
  return (
    <div>
      <div className="section-head" style={{ marginTop: 0 }}>
        <div>
          <div className="section-title">All participants</div>
          <div className="section-sub">
            {participants.length} active · Scanned from filesystem
          </div>
        </div>
        <button className="btn primary">
          <Icon name="plus" size={14} />
          New intake
        </button>
      </div>
      <div className="participants-grid">
        {participants.map((p) => (
          <RealParticipantCard key={p.id} p={p} onOpen={() => setActive(p)} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProviderCard
// ---------------------------------------------------------------------------

export function ProviderCard({ p }: ProviderCardProps) {
  return (
    <div
      className="participant-card"
      style={{ "--p-color": "#60a5fa" } as React.CSSProperties}
    >
      <div
        className="p-avatar"
        style={{
          background: "linear-gradient(135deg, #60a5fa, var(--primary))",
          fontSize: 14,
        }}
      >
        {p.name
          .split(" ")
          .map((s) => s[0])
          .slice(0, 2)
          .join("")}
      </div>
      <div className="p-name">{p.name}</div>
      <div className="p-ndis" style={{ fontFamily: "inherit" }}>
        {p.service}
      </div>
      <div
        className="p-diag"
        style={{ display: "flex", alignItems: "center", gap: 6 }}
      >
        <Icon
          name="map-pin"
          size={12}
          style={{ color: "var(--text-faint)" }}
        />
        {p.location}
      </div>
      <div className="p-foot">
        <span
          className={
            "status-chip " +
            (p.capacity === "Open"
              ? "done"
              : p.capacity === "Full"
                ? "pending"
                : "progress")
          }
        >
          {p.capacity}
        </span>
        <button className="btn small">
          <Icon name="phone" size={12} />
          Contact
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ParticipantDetail (original, kept for mock fallback)
// ---------------------------------------------------------------------------

const SUBTABS: Subtab[] = [
  { id: "overview", label: "Overview", icon: "home" },
  { id: "documents", label: "Documents", icon: "forms" },
  { id: "providers", label: "Providers", icon: "provider" },
  { id: "notes", label: "Case notes", icon: "draft" },
  { id: "budget", label: "Budget", icon: "scale" },
  { id: "history", label: "History", icon: "clock" },
];

const CASE_NOTES: CaseNote[] = [
  {
    d: "28 May 2026 · 14:22",
    t: "Phone check-in",
    body: "Confirmed Marcus is happy with current Hearthside support workers. Discussed transition planning for college. Action: book OT review by mid-June.",
  },
  {
    d: "21 May 2026 · 10:05",
    t: "Provider meeting",
    body: "Met with Tessellate OT to align goal targets. New sensory routine starts week of 03 Jun.",
  },
  {
    d: "14 May 2026 · 09:48",
    t: "Plan review prep",
    body: "Pulled utilisation report. Capacity building budget under-utilised by 42% — plan review will propose reallocation.",
  },
];

const BUDGET_ROWS: BudgetRow[] = [
  ["Core supports — Daily activities", 71, 38420],
  ["Core supports — Transport", 84, 6200],
  ["Capacity building — Daily living", 58, 9100],
  ["Capacity building — Social/community", 32, 5110],
  ["Capital — Assistive technology", 100, 6500],
];

export function ParticipantDetail({ p, onBack }: ParticipantDetailProps) {
  const [sub, setSub] = useState("overview");

  const planSummaryAll: PlanSummaryEntry[] = [
    ["Plan manager", "MyPlanCo (Self)"],
    ["Start date", "14 Mar 2026"],
    ["End date", p.planExpiry],
    ["Coordinator", "Jordan Davies"],
    ["Core supports", "$ 38,420"],
    ["Capacity building", "$ 14,210"],
    ["Capital", "$ 6,500"],
    ["Total", "$ 59,130"],
  ];

  return (
    <div>
      {/* Back button */}
      <button
        className="btn small ghost"
        style={{ marginBottom: 12 }}
        onClick={onBack}
      >
        <Icon name="chevron-left" size={13} />
        Back to participants
      </button>

      {/* Banner */}
      <div className="banner">
        <div
          className="banner-img"
          style={{ "--p-color": p.color } as React.CSSProperties}
        />
        <div className="banner-body">
          <div
            className="banner-mark"
            style={{
              background: `linear-gradient(135deg, ${p.color}, var(--secondary))`,
            }}
          >
            {p.initials}
          </div>
          <div>
            <div className="banner-title">{p.name}</div>
            <div className="banner-handle">
              NDIS {p.ndis} · {p.diagnosis}
            </div>
          </div>
        </div>
        <div className="banner-cta">
          <button className="btn">
            <Icon name="mail" size={13} />
            Message
          </button>
          <button className="btn primary">
            <Icon name="forms" size={13} />
            Fill form
          </button>
        </div>
      </div>

      {/* Subtabs */}
      <div className="subtabs">
        {SUBTABS.map((s) => (
          <div
            key={s.id}
            className={"subtab " + (sub === s.id ? "active" : "")}
            onClick={() => setSub(s.id)}
          >
            <Icon name={s.icon} size={14} />
            {s.label}
          </div>
        ))}
      </div>

      {/* ---- Overview tab ---- */}
      {sub === "overview" && (
        <div>
          <div
            className="stat-grid"
            style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
          >
            <StatCard
              label="Plan utilisation"
              value="68%"
              icon="scale"
              meta="Core 71% · Capacity 58%"
            />
            <StatCard
              label="Forms filled"
              value="12"
              icon="forms"
              meta="Last: 2h ago"
              metaIcon="trend-up"
            />
            <StatCard
              label="Open actions"
              value="2"
              icon="warning"
              badge="1 OVERDUE"
              meta="Travel claim · Plan review prep"
            />
          </div>

          <div className="section-head">
            <div>
              <div className="section-title">Recent documents</div>
              <div className="section-sub">Click to open in Forms</div>
            </div>
          </div>
          <div className="form-grid">
            {MOCK_FORMS.slice(0, 3).map((f) => (
              <RecentFormCard
                key={f.id}
                form={{ ...f, participant: p.name } as Parameters<typeof RecentFormCard>[0]["form"]}
                onOpen={() => {}}
              />
            ))}
          </div>

          <div className="section-head" style={{ marginTop: 28 }}>
            <div>
              <div className="section-title">Plan summary</div>
            </div>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 14,
              }}
            >
              {planSummaryAll.map(([k, v]) => (
                <div key={k}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--text-faint)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      marginBottom: 4,
                    }}
                  >
                    {k}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--text-hi)",
                    }}
                  >
                    {v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ---- Documents tab ---- */}
      {sub === "documents" && (
        <div className="form-grid">
          {MOCK_FORMS.map((f) => (
            <RecentFormCard
              key={f.id}
              form={{ ...f, participant: p.name } as Parameters<typeof RecentFormCard>[0]["form"]}
              onOpen={() => {}}
            />
          ))}
        </div>
      )}

      {/* ---- Providers tab ---- */}
      {sub === "providers" && (
        <div className="participants-grid">
          {MOCK_PROVIDERS.slice(0, 4).map((pr) => (
            <ProviderCard key={pr.id} p={pr} />
          ))}
        </div>
      )}

      {/* ---- Case notes tab ---- */}
      {sub === "notes" && (
        <div className="card" style={{ padding: 0 }}>
          {CASE_NOTES.map((n, i) => (
            <div
              key={i}
              style={{
                padding: 18,
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    color: "var(--text-hi)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {n.t}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-faint)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {n.d}
                </span>
              </div>
              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: 13,
                  lineHeight: 1.6,
                }}
              >
                {n.body}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---- Budget tab ---- */}
      {sub === "budget" && (
        <div className="card" style={{ padding: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>
            Budget utilisation by category
          </div>
          {BUDGET_ROWS.map(([label, pct, amount]) => (
            <div key={label} style={{ marginBottom: 18 }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 6,
                  fontSize: 12.5,
                }}
              >
                <span style={{ color: "var(--text)" }}>{label}</span>
                <span
                  style={{
                    color: "var(--text-faint)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {pct}% · ${amount.toLocaleString()}
                </span>
              </div>
              <div className="gauge" style={{ width: "100%", height: 8 }}>
                <div
                  className="fill"
                  style={
                    {
                      "--pct": pct + "%",
                      background:
                        pct >= 95
                          ? "var(--danger)"
                          : pct >= 70
                            ? "var(--warning)"
                            : "linear-gradient(90deg, var(--primary), var(--accent-soft))",
                    } as React.CSSProperties
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ---- History tab ---- */}
      {sub === "history" && (
        <div className="empty-state">
          <div className="glyph">
            <Icon name="clock" size={28} />
          </div>
          <div
            style={{
              color: "var(--text-hi)",
              fontWeight: 600,
              fontSize: 15,
              marginBottom: 4,
            }}
          >
            History timeline
          </div>
          <div>
            Audit log of form events, exports, RAG queries and plan changes.
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RealParticipantDetail — detail view for filesystem-scanned participants
// ---------------------------------------------------------------------------

const REAL_SUBTABS: Subtab[] = [
  { id: "overview", label: "Overview", icon: "home" },
  { id: "files", label: "Files", icon: "forms" },
  { id: "folders", label: "Folders", icon: "folder" },
  { id: "providers", label: "Providers", icon: "provider" },
  { id: "history", label: "History", icon: "clock" },
];

function formatFileDate(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
}

export function RealParticipantDetail({ p, onBack }: RealParticipantDetailProps) {
  const [sub, setSub] = useState("overview");
  const [activeSubfolder, setActiveSubfolder] = useState<string | null>(null);
  const [subfolderFiles, setSubfolderFiles] = useState<Array<{ name: string; path: string; size: number; modified: number }>>([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

  const color = p.color || PARTICIPANT_COLORS[0];

  const loadSubfolderFiles = async (subfolder: string) => {
    setActiveSubfolder(subfolder);
    setLoadingFiles(true);
    try {
      if (window.api?.listParticipantFiles) {
        const result = await window.api.listParticipantFiles(p.folderPath, subfolder);
        setSubfolderFiles(result.files);
      }
    } catch {
      setSubfolderFiles([]);
    }
    setLoadingFiles(false);
  };

  return (
    <div>
      {/* Back button */}
      <button
        className="btn small ghost"
        style={{ marginBottom: 12 }}
        onClick={onBack}
      >
        <Icon name="chevron-left" size={13} />
        Back to participants
      </button>

      {/* Banner */}
      <div className="banner">
        <div
          className="banner-img"
          style={{ "--p-color": color } as React.CSSProperties}
        />
        <div className="banner-body">
          <div
            className="banner-mark"
            style={{
              background: `linear-gradient(135deg, ${color}, var(--secondary))`,
            }}
          >
            {p.initials}
          </div>
          <div>
            <div className="banner-title">{p.name}</div>
            <div className="banner-handle">
              {p.ndis ? `NDIS ${p.ndis}` : p.folderPath}
              {p.diagnosis ? ` · ${p.diagnosis}` : ""}
            </div>
          </div>
        </div>
        <div className="banner-cta">
          <button className="btn">
            <Icon name="folder" size={13} />
            Open folder
          </button>
          <button className="btn primary">
            <Icon name="forms" size={13} />
            Fill form
          </button>
        </div>
      </div>

      {/* Subtabs */}
      <div className="subtabs">
        {REAL_SUBTABS.map((s) => (
          <div
            key={s.id}
            className={"subtab " + (sub === s.id ? "active" : "")}
            onClick={() => setSub(s.id)}
          >
            <Icon name={s.icon} size={14} />
            {s.label}
          </div>
        ))}
      </div>

      {/* ---- Overview tab ---- */}
      {sub === "overview" && (
        <div>
          <div
            className="stat-grid"
            style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
          >
            <StatCard
              label="Total files"
              value={String(p.fileCount)}
              icon="forms"
              meta={`${p.subfolders.length} subfolders`}
            />
            <StatCard
              label="Document types"
              value={
                [p.hasIntakeForm && "Intake", p.hasServiceAgreement && "SA", p.hasCaseNotes && "Notes"]
                  .filter(Boolean)
                  .join(", ") || "None detected"
              }
              icon="template"
              meta="Auto-detected from filenames"
            />
            <StatCard
              label="Last modified"
              value={p.recentFiles[0] ? formatFileDate(p.recentFiles[0].modified) : "N/A"}
              icon="clock"
              meta={p.recentFiles[0]?.name || "No files found"}
            />
          </div>

          {/* Info row: key details if available */}
          {(p.ndis || p.dob || p.phone || p.email || p.planExpiry || p.planManagement) && (
            <>
              <div className="section-head" style={{ marginTop: 28 }}>
                <div>
                  <div className="section-title">Participant details</div>
                </div>
              </div>
              <div className="card" style={{ padding: 20 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, 1fr)",
                    gap: 14,
                  }}
                >
                  {([
                    p.ndis && ["NDIS number", p.ndis],
                    p.dob && ["Date of birth", p.dob],
                    p.phone && ["Phone", p.phone],
                    p.email && ["Email", p.email],
                    p.planExpiry && ["Plan expiry", p.planExpiry],
                    p.planManagement && ["Plan management", p.planManagement],
                    p.address && ["Address", p.address],
                    p.diagnosis && ["Diagnosis", p.diagnosis],
                  ].filter(Boolean) as [string, string][]).map(([k, v]) => (
                    <div key={k}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "var(--text-faint)",
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          marginBottom: 4,
                        }}
                      >
                        {k}
                      </div>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--text-hi)",
                        }}
                      >
                        {v}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Recent files */}
          <div className="section-head" style={{ marginTop: 28 }}>
            <div>
              <div className="section-title">Recent files</div>
              <div className="section-sub">Most recently modified files in this participant&rsquo;s folder</div>
            </div>
          </div>
          <div className="card" style={{ padding: 0 }}>
            {p.recentFiles.length === 0 ? (
              <div style={{ padding: 24, textAlign: "center", color: "var(--text-faint)" }}>
                No files found
              </div>
            ) : (
              p.recentFiles.map((f, i) => (
                <div
                  key={i}
                  style={{
                    padding: "12px 18px",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <Icon name="forms" size={14} style={{ color: "var(--text-faint)", flexShrink: 0 }} />
                    <span
                      style={{
                        fontWeight: 500,
                        color: "var(--text-hi)",
                        fontSize: 13,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {f.name}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      color: "var(--text-faint)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatFileDate(f.modified)}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Subfolders quick glance */}
          <div className="section-head" style={{ marginTop: 28 }}>
            <div>
              <div className="section-title">Subfolders</div>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {p.subfolders.map((sf) => (
              <span
                key={sf}
                className="status-chip progress"
                style={{ cursor: "pointer" }}
                onClick={() => {
                  setSub("folders");
                  loadSubfolderFiles(sf);
                }}
              >
                <Icon name="folder" size={11} />
                {sf}
              </span>
            ))}
            {p.subfolders.length === 0 && (
              <span style={{ color: "var(--text-faint)", fontSize: 13 }}>No subfolders</span>
            )}
          </div>
        </div>
      )}

      {/* ---- Files tab ---- */}
      {sub === "files" && (
        <div className="card" style={{ padding: 0 }}>
          {p.recentFiles.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "var(--text-faint)" }}>
              No files found in this participant&rsquo;s folder
            </div>
          ) : (
            p.recentFiles.map((f, i) => (
              <div
                key={i}
                style={{
                  padding: "12px 18px",
                  borderBottom: "1px solid var(--border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <Icon name="forms" size={14} style={{ color: "var(--text-faint)", flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 500,
                        color: "var(--text-hi)",
                        fontSize: 13,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {f.name}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {f.path}
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    color: "var(--text-faint)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {formatFileDate(f.modified)}
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {/* ---- Folders tab ---- */}
      {sub === "folders" && (
        <div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
            {p.subfolders.map((sf) => (
              <button
                key={sf}
                className={"btn small " + (activeSubfolder === sf ? "primary" : "")}
                onClick={() => loadSubfolderFiles(sf)}
              >
                <Icon name="folder" size={12} />
                {sf}
              </button>
            ))}
            {p.subfolders.length === 0 && (
              <div className="empty-state" style={{ width: "100%" }}>
                <div className="glyph">
                  <Icon name="folder" size={28} />
                </div>
                <div style={{ color: "var(--text-hi)", fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                  No subfolders
                </div>
                <div>This participant&rsquo;s folder has no subdirectories.</div>
              </div>
            )}
          </div>

          {activeSubfolder && (
            <div>
              <div className="section-head" style={{ marginTop: 0 }}>
                <div>
                  <div className="section-title">{activeSubfolder}</div>
                  <div className="section-sub">{subfolderFiles.length} files</div>
                </div>
              </div>
              <div className="card" style={{ padding: 0 }}>
                {loadingFiles ? (
                  <div style={{ padding: 24, textAlign: "center", color: "var(--text-faint)" }}>
                    Loading files...
                  </div>
                ) : subfolderFiles.length === 0 ? (
                  <div style={{ padding: 24, textAlign: "center", color: "var(--text-faint)" }}>
                    No files in this folder
                  </div>
                ) : (
                  subfolderFiles.map((f, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "12px 18px",
                        borderBottom: "1px solid var(--border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                        <Icon name="forms" size={14} style={{ color: "var(--text-faint)", flexShrink: 0 }} />
                        <span
                          style={{
                            fontWeight: 500,
                            color: "var(--text-hi)",
                            fontSize: 13,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {f.name}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 12, color: "var(--text-faint)", whiteSpace: "nowrap", fontFamily: "var(--font-mono)" }}>
                          {formatFileSize(f.size)}
                        </span>
                        <span style={{ fontSize: 12, color: "var(--text-faint)", whiteSpace: "nowrap" }}>
                          {formatFileDate(f.modified)}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ---- Providers tab ---- */}
      {sub === "providers" && (
        <div className="participants-grid">
          {MOCK_PROVIDERS.slice(0, 4).map((pr) => (
            <ProviderCard key={pr.id} p={pr} />
          ))}
        </div>
      )}

      {/* ---- History tab ---- */}
      {sub === "history" && (
        <div className="empty-state">
          <div className="glyph">
            <Icon name="clock" size={28} />
          </div>
          <div
            style={{
              color: "var(--text-hi)",
              fontWeight: 600,
              fontSize: 15,
              marginBottom: 4,
            }}
          >
            History timeline
          </div>
          <div>
            Audit log of form events, exports, RAG queries and plan changes.
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ParticipantsView — top-level routed component
// ---------------------------------------------------------------------------

export function ParticipantsView() {
  const [activeOld, setActiveOld] = useState<Participant | null>(null);
  const [activeReal, setActiveReal] = useState<RealParticipant | null>(null);
  const [realParticipants, setRealParticipants] = useState<RealParticipant[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Try to load real participants from the filesystem
      if (window.api?.scanParticipants) {
        try {
          const result = await window.api.scanParticipants();
          if (!cancelled && result.participants && result.participants.length > 0) {
            // Assign colors to each participant
            const colored = result.participants.map((p, i) => ({
              ...p,
              color: p.color || PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length],
            }));
            setRealParticipants(colored);
          }
        } catch {
          // Fall through to mock data
        }
      }
      if (!cancelled) setLoading(false);
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // Loading state
  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: "center", color: "var(--text-faint)" }}>
        Scanning participant folders...
      </div>
    );
  }

  // Detail view for real participant
  if (activeReal) {
    return <RealParticipantDetail p={activeReal} onBack={() => setActiveReal(null)} />;
  }

  // Detail view for mock participant (fallback)
  if (activeOld) {
    return <ParticipantDetail p={activeOld} onBack={() => setActiveOld(null)} />;
  }

  // Real participants grid
  if (realParticipants && realParticipants.length > 0) {
    return <RealParticipantGrid participants={realParticipants} setActive={setActiveReal} />;
  }

  // Fallback to mock data
  return <ParticipantGrid setActive={setActiveOld} />;
}
