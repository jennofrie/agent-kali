import React, { useState, useEffect } from "react";
import { Icon } from "../Shared/Icon";
import { MOCK_FORMS } from "../../lib/mockData";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StatCardProps {
  label: string;
  value: string;
  icon: string;
  meta?: string;
  metaIcon?: string;
  badge?: string;
}

interface FormData {
  id: string | number;
  title: string;
  participant: string;
  date: string;
  status: "done" | "progress" | "pending" | "review";
  thumbType: string;
  duration: string;
  pct: number;
}

interface RecentFormCardProps {
  form: FormData;
  onOpen: () => void;
}

interface FormThumbProps {
  type: string;
  duration: string;
  pct: number;
}

interface DashboardViewProps {
  setActiveTab: (tab: string) => void;
}

// ---------------------------------------------------------------------------
// StatCard
// ---------------------------------------------------------------------------

export function StatCard({ label, value, icon, meta, metaIcon, badge }: StatCardProps) {
  return (
    <div className="stat-card">
      {badge ? <span className="stat-badge stat-badge-corner">{badge}</span> : null}
      <div className="stat-head">
        <div className="stat-icon"><Icon name={icon} size={16} /></div>
        <span>{label}</span>
      </div>
      <div className="stat-value">{value}</div>
      {meta && (
        <div className="stat-meta">
          {metaIcon && <Icon name={metaIcon} size={13} className={meta.includes("\u2191") || metaIcon === "trend-up" ? "up" : metaIcon === "trend-down" ? "down" : ""} />}
          <span>{meta}</span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FormThumb — decorative thumbnail with striped backgrounds & type-based colors
// ---------------------------------------------------------------------------

export function FormThumb({ type, duration, pct }: FormThumbProps) {
  const tints: Record<string, { a: string; b: string }> = {
    service: { a: "rgba(138,100,255,0.22)", b: "rgba(96,165,250,0.18)" },
    review:  { a: "rgba(231,76,138,0.22)", b: "rgba(138,100,255,0.18)" },
    claim:   { a: "rgba(52,211,153,0.22)", b: "rgba(138,100,255,0.18)" },
    risk:    { a: "rgba(247,183,60,0.22)", b: "rgba(231,76,138,0.18)" },
    sil:     { a: "rgba(96,165,250,0.22)", b: "rgba(138,100,255,0.18)" },
    bsp:     { a: "rgba(196,181,255,0.25)", b: "rgba(231,76,138,0.18)" },
  };
  const tint = tints[type] || tints.service;

  return (
    <div className="form-thumb">
      <div className="form-thumb-stripes" style={{
        background: `repeating-linear-gradient(135deg, ${tint.a} 0 12px, rgba(138,100,255,0.04) 12px 24px), linear-gradient(180deg, ${tint.a}, ${tint.b})`
      }}></div>
      <div className="form-thumb-pdf">
        <div className="row head"></div>
        <div className="row med"></div>
        <div className="row"></div>
        <div className="row short"></div>
        <div className="row med"></div>
        <div className="row"></div>
        <div className="row short"></div>
      </div>
      <div className="form-duration">{duration}</div>
      {pct < 100 && (
        <div style={{ position: "absolute", left: 10, bottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
          <div className="gauge" style={{ width: 56, background: "rgba(0,0,0,0.55)" }}>
            <div className="fill" style={{ "--pct": pct + "%" } as React.CSSProperties}></div>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "white", background: "rgba(0,0,0,0.65)", padding: "2px 6px", borderRadius: 4, backdropFilter: "blur(6px)" }}>{pct}%</span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// RecentFormCard
// ---------------------------------------------------------------------------

export function RecentFormCard({ form, onOpen }: RecentFormCardProps) {
  const initials = form.participant.split(" ").map((s) => s[0]).join("").slice(0, 2);
  const statusLabel: Record<string, string> = { done: "Exported", progress: "In progress", pending: "Pending", review: "Review" };

  return (
    <div className="form-card" onClick={onOpen}>
      <FormThumb type={form.thumbType} duration={form.duration} pct={form.pct} />
      <div className="form-body">
        <div className="form-icon">{initials}</div>
        <div className="form-meta">
          <div className="form-title">{form.title}</div>
          <div className="form-sub">{form.participant}</div>
          <div className="form-stats">
            <span>{form.date}</span>
            <span className="dot"></span>
            <span className={"status-chip " + form.status}>{statusLabel[form.status]}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// DashboardView
// ---------------------------------------------------------------------------

interface RecentFile {
  name: string;
  path: string;
  modified: number;
  participant: string;
}

export function DashboardView({ setActiveTab }: DashboardViewProps) {
  const [participantCount, setParticipantCount] = useState<number>(0);
  const [totalFiles, setTotalFiles] = useState<number>(0);
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (window.api?.scanParticipants) {
        try {
          const result = await window.api.scanParticipants();
          if (cancelled) return;
          const pList = result.participants || [];
          setParticipantCount(pList.length);

          // Gather recent files across all participants
          let allFiles: RecentFile[] = [];
          let total = 0;
          let pending = 0;
          for (const p of pList) {
            total += p.fileCount || 0;
            if (!p.hasServiceAgreement) pending++;
            // Get recent files from this participant
            for (const rf of (p.recentFiles || [])) {
              allFiles.push({
                name: rf.name,
                path: rf.path,
                modified: rf.modified,
                participant: p.name,
              });
            }
          }
          // Sort by most recent, take top 6
          allFiles.sort((a, b) => b.modified - a.modified);
          setRecentFiles(allFiles.slice(0, 6));
          setTotalFiles(total);
          setPendingCount(pending);
        } catch {
          // fallback
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const formatRelDate = (ms: number) => {
    const diff = Date.now() - ms;
    if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.round(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.round(diff / 86400000)}d ago`;
    return new Date(ms).toLocaleDateString("en-AU", { day: "2-digit", month: "short" });
  };

  // Determine form type from filename for thumbnail colors
  const thumbType = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes("service") || n.includes("agreement") || n.includes("sa")) return "service";
    if (n.includes("plan") || n.includes("review") || n.includes("reassess")) return "review";
    if (n.includes("invoice") || n.includes("claim") || n.includes("travel")) return "claim";
    if (n.includes("report") || n.includes("progress") || n.includes("implementation")) return "report";
    if (n.includes("intake") || n.includes("referral") || n.includes("enquiry")) return "service";
    return "report";
  };

  const hasMockFallback = participantCount === 0;

  return (
    <div>
      <div className="stat-grid">
        <StatCard
          label="Total Participants"
          value={hasMockFallback ? "22" : String(participantCount)}
          icon="users"
          meta={hasMockFallback ? "Loading..." : `${totalFiles} files across all folders`}
          metaIcon="trend-up"
        />
        <StatCard
          label="Forms & Documents"
          value={hasMockFallback ? "\u2014" : String(totalFiles)}
          icon="forms"
          meta="Across all participant folders"
        />
        <StatCard
          label="Pending Actions"
          value={hasMockFallback ? "\u2014" : String(pendingCount)}
          icon="clock"
          badge={pendingCount > 0 ? `${pendingCount} NEED SA` : undefined}
          meta="Participants without service agreement"
        />
        <StatCard
          label="RAG Connected"
          value="2"
          icon="sparkles"
          meta="ndis + technical workspaces"
        />
      </div>

      <div className="section-head">
        <div>
          <div className="section-title">Recent files</div>
          <div className="section-sub">Most recently modified across all participants</div>
        </div>
        <span className="see-all" onClick={() => setActiveTab("files")}>View all files \u2192</span>
      </div>

      <div className="form-grid">
        {recentFiles.length > 0 ? recentFiles.map((rf, i) => {
          const formData: FormData = {
            id: `rf-${i}`,
            title: rf.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
            participant: rf.participant,
            duration: "",
            thumbType: thumbType(rf.name),
            date: formatRelDate(rf.modified),
            status: "done" as const,
            pct: 100,
          };
          return <RecentFormCard key={i} form={formData} onOpen={() => setActiveTab("files")} />;
        }) : (
          MOCK_FORMS.map((f: FormData) => (
            <RecentFormCard key={f.id} form={f} onOpen={() => setActiveTab("forms")} />
          ))
        )}
      </div>

      <div className="section-head" style={{ marginTop: 28 }}>
        <div>
          <div className="section-title">Quick actions</div>
          <div className="section-sub">Jump back into common workflows</div>
        </div>
      </div>
      <div className="quick-row">
        <button className="btn primary" onClick={() => setActiveTab("forms")}><Icon name="upload" size={15} />Upload PDF</button>
        <button className="btn" onClick={() => setActiveTab("rag")}><Icon name="sparkles" size={15} />Research</button>
        <button className="btn" onClick={() => setActiveTab("participants")}><Icon name="users" size={15} />Participants</button>
        <button className="btn" onClick={() => setActiveTab("templates")}><Icon name="template" size={15} />Templates</button>
        <button className="btn" onClick={() => setActiveTab("reports")}><Icon name="report" size={15} />Reports</button>
      </div>
    </div>
  );
}
