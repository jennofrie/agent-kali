import { useState, useEffect } from "react";
import { Icon } from "../Shared/Icon";
import { PdfPreview } from "../Shared/PdfPreview";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScannedReport {
  name: string;
  path: string;
  modified: number;
  participant: string;
  type: string;
}

type ReportType = "all" | "plan-reassessment" | "support-letter" | "budget-utilisation" | "monthly-summary" | "outcome-report" | "progress-report";

const REPORT_TYPES: { id: ReportType; label: string; icon: string }[] = [
  { id: "plan-reassessment", label: "Plan Reassessment", icon: "report" },
  { id: "support-letter", label: "Support Letter", icon: "mail" },
  { id: "budget-utilisation", label: "Budget Utilisation", icon: "scale" },
  { id: "monthly-summary", label: "Monthly Summary", icon: "calendar" },
  { id: "outcome-report", label: "Outcome Report", icon: "check" },
  { id: "progress-report", label: "Progress Report", icon: "trend-up" },
];

const DEFAULT_ROOT = (typeof process !== 'undefined' && process.env?.HOME)
  ? `${process.env.HOME}/Desktop/Support-Coordination`
  : "~/Desktop/Support-Coordination";

// Classify a file into a report type based on its name
function classifyReport(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("reassessment") || n.includes("plan-review") || n.includes("plan_review") || n.includes("planreview")) return "plan-reassessment";
  if (n.includes("support-letter") || n.includes("support_letter") || n.includes("supportletter")) return "support-letter";
  if (n.includes("budget") || n.includes("utilisation") || n.includes("utilization")) return "budget-utilisation";
  if (n.includes("monthly") || n.includes("coordination-summary")) return "monthly-summary";
  if (n.includes("outcome")) return "outcome-report";
  if (n.includes("progress") || n.includes("implementation") || n.includes("90-day") || n.includes("90_day")) return "progress-report";
  return "other";
}

// participantFromPath is used internally by scanReports
function _participantFromPath(filePath: string): string {
  const parts = filePath.split("/");
  const scIdx = parts.findIndex(p => p === "Support-Coordination");
  if (scIdx >= 0 && scIdx + 1 < parts.length) {
    return parts[scIdx + 1].replace(/-/g, " ");
  }
  return "Unknown";
}
void _participantFromPath; // suppress unused warning - available for future use

// ---------------------------------------------------------------------------
// ReportsView
// ---------------------------------------------------------------------------

export function ReportsView() {
  const [reports, setReports] = useState<ScannedReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [rootPath, setRootPath] = useState(DEFAULT_ROOT);
  const [showConfig, setShowConfig] = useState(false);
  const [viewingReport, setViewingReport] = useState<ScannedReport | null>(null);

  useEffect(() => {
    scanReports();
  }, [rootPath]);

  async function scanReports() {
    setLoading(true);
    try {
      if (!window.api?.scanParticipants) {
        // Fallback mock data when not in Electron
        setReports([
          { name: "SC-Progress-Report-18_03_2026.pdf", path: "/mock", modified: Date.now(), participant: "Samuel Donnelly", type: "progress-report" },
          { name: "Support_Coordinator_Progress_Report_Kydan_Jaremenko.pdf", path: "/mock", modified: Date.now() - 86400000, participant: "Kydan Jaremenko", type: "progress-report" },
          { name: "Monica Tulloch NDIS Budget Summary Plan End 28 Feb 2026.pdf", path: "/mock", modified: Date.now() - 172800000, participant: "Monica Tulloch", type: "budget-utilisation" },
        ]);
        setLoading(false);
        return;
      }

      const result = await window.api.scanParticipants();
      const allReports: ScannedReport[] = [];

      for (const p of result.participants || []) {
        // Scan all subfolders for report-like files
        for (const sub of p.subfolders) {
          try {
            const filesResult = await window.api.listParticipantFiles(p.folderPath, sub);
            for (const f of filesResult.files || []) {
              const ext = f.name.toLowerCase();
              if (ext.endsWith(".pdf") || ext.endsWith(".docx") || ext.endsWith(".md")) {
                const type = classifyReport(f.name);
                if (type !== "other" || sub.toLowerCase().includes("report")) {
                  allReports.push({
                    name: f.name,
                    path: f.path,
                    modified: f.modified,
                    participant: p.name,
                    type: type === "other" ? "progress-report" : type,
                  });
                }
              }
            }
          } catch {}
        }
      }

      allReports.sort((a, b) => b.modified - a.modified);
      setReports(allReports);
    } catch (e) {
      console.error("Failed to scan reports:", e);
    }
    setLoading(false);
  }

  const filtered = filter === "all" ? reports : reports.filter(r => r.type === filter);

  const typeLabel = (type: string) => {
    const found = REPORT_TYPES.find(t => t.id === type);
    return found ? found.label : type;
  };

  const formatDate = (ms: number) => {
    const d = new Date(ms);
    const now = Date.now();
    const diff = now - ms;
    if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.round(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.round(diff / 86400000)}d ago`;
    return d.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
  };

  // Maximized PDF view
  if (viewingReport) {
    return (
      <PdfPreview
        filePath={viewingReport.path}
        fileName={viewingReport.name}
        subtitle={`${viewingReport.participant} · ${typeLabel(viewingReport.type)}`}
        onMinimize={() => setViewingReport(null)}
      />
    );
  }

  return (
    <div>
      <div className="section-head" style={{ marginTop: 0 }}>
        <div>
          <div className="section-title">Reports</div>
          <div className="section-sub">
            {loading ? "Scanning..." : `${reports.length} reports found across all participants`}
          </div>
        </div>
        <button className="btn small" onClick={() => setShowConfig(!showConfig)} title="Configure reports folder">
          <Icon name="settings" size={14} />
        </button>
      </div>

      {showConfig && (
        <div className="card" style={{ padding: 16, marginBottom: 16, display: "flex", gap: 12, alignItems: "center" }}>
          <Icon name="folder" size={16} style={{ color: "var(--text-muted)", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: "var(--text-faint)", textTransform: "uppercase", fontWeight: 700, marginBottom: 4 }}>Reports root directory</div>
            <input
              className="field-input"
              value={rootPath}
              onChange={(e) => setRootPath(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>
          <button className="btn small primary" onClick={scanReports}>Rescan</button>
        </div>
      )}

      {/* Report type quick filters */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        <button
          className={"pill " + (filter === "all" ? "active" : "")}
          onClick={() => setFilter("all")}
        >All</button>
        {REPORT_TYPES.map(t => (
          <button
            key={t.id}
            className={"pill " + (filter === t.id ? "active" : "")}
            onClick={() => setFilter(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="form-grid">
        {/* New report CTA */}
        <div className="docmini add" style={{ aspectRatio: "auto", padding: 30, minHeight: 220 }}>
          <div>
            <div className="plus"><Icon name="plus" size={28} /></div>
            <div className="add-title">New report</div>
            <div className="add-sub">Choose a template &amp; sources</div>
          </div>
        </div>

        {filtered.slice(0, 20).map((r, i) => (
          <div key={i} className="form-card" style={{ cursor: "pointer" }} onClick={() => {
            if (r.path !== "/mock") {
              setViewingReport(r);
            }
          }}>
            <div className="form-thumb">
              <div className="form-thumb-stripes" style={{
                background: r.type === "plan-reassessment"
                  ? "repeating-linear-gradient(135deg, rgba(138,100,255,0.22) 0 12px, rgba(138,100,255,0.06) 12px 24px), linear-gradient(180deg, rgba(138,100,255,0.2), rgba(108,79,212,0.15))"
                  : r.type === "support-letter"
                  ? "repeating-linear-gradient(135deg, rgba(52,211,153,0.22) 0 12px, rgba(52,211,153,0.06) 12px 24px), linear-gradient(180deg, rgba(52,211,153,0.2), rgba(34,197,94,0.15))"
                  : r.type === "budget-utilisation"
                  ? "repeating-linear-gradient(135deg, rgba(246,183,60,0.22) 0 12px, rgba(246,183,60,0.06) 12px 24px), linear-gradient(180deg, rgba(246,183,60,0.2), rgba(234,179,8,0.15))"
                  : "repeating-linear-gradient(135deg, rgba(96,165,250,0.18) 0 12px, rgba(96,165,250,0.04) 12px 24px), linear-gradient(180deg, rgba(96,165,250,0.18), rgba(138,100,255,0.12))"
              }}></div>
              <div className="form-thumb-pdf">
                <div className="row head"></div><div className="row"></div><div className="row med"></div>
                <div className="row short"></div><div className="row"></div><div className="row med"></div>
              </div>
              <div className="form-duration">{formatDate(r.modified)}</div>
            </div>
            <div className="form-body">
              <div className="form-icon" style={{
                background: r.type === "plan-reassessment"
                  ? "linear-gradient(135deg, var(--primary), var(--primary-2))"
                  : r.type === "support-letter"
                  ? "linear-gradient(135deg, #34d399, #059669)"
                  : r.type === "budget-utilisation"
                  ? "linear-gradient(135deg, #f6b73c, #d97706)"
                  : "linear-gradient(135deg, #60a5fa, var(--primary))"
              }}>
                <Icon name={REPORT_TYPES.find(t => t.id === r.type)?.icon || "report"} size={14} />
              </div>
              <div className="form-meta">
                <div className="form-title">{r.name}</div>
                <div className="form-sub">{r.participant}</div>
                <div className="form-stats">
                  <span className="status-chip done">{typeLabel(r.type)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {!loading && filtered.length === 0 && (
          <div className="empty-state" style={{ gridColumn: "1 / -1" }}>
            <div className="glyph"><Icon name="report" size={32} /></div>
            <h3>No reports found</h3>
            <p>Reports matching "{filter}" will appear here once generated.</p>
          </div>
        )}
      </div>
    </div>
  );
}
