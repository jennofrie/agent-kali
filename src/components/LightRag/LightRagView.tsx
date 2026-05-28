// React import not needed with JSX transform
import { Icon } from "../Shared/Icon";
import { StatCard } from "../Dashboard/DashboardView";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface WorkspaceData {
  name: string;
  docs: number;
  entities: number;
  last: string;
  health: "healthy" | "stale";
}

// ---------------------------------------------------------------------------
// LightRagView
// ---------------------------------------------------------------------------

export function LightRagView() {
  const workspaces: WorkspaceData[] = [
    { name: "Participants", docs: 412, entities: 3104, last: "2h ago", health: "healthy" },
    { name: "NDIS Pricing 2026", docs: 18, entities: 942, last: "3 days ago", health: "healthy" },
    { name: "Internal SOPs", docs: 96, entities: 1208, last: "1 week ago", health: "stale" },
    { name: "Provider docs", docs: 758, entities: 3648, last: "5h ago", health: "healthy" },
  ];

  return (
    <div>
      <div className="stat-grid">
        <StatCard label="Documents indexed" value="1,284" icon="book" meta="+24 today" metaIcon="trend-up" />
        <StatCard label="Entities extracted" value="8,902" icon="database" meta="92% confidence avg" />
        <StatCard label="Relations" value="14,318" icon="share" meta="Graph density 0.31" />
        <StatCard label="Storage" value="2.4 GB" icon="folder" meta="Local · ./rag_storage" />
      </div>

      <div className="section-head"><div><div className="section-title">Workspaces</div></div><button className="btn small"><Icon name="plus" size={12} />New workspace</button></div>

      {workspaces.map(w => (
        <div key={w.name} className="card" style={{ padding: "14px 18px", marginBottom: 10, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(138,100,255,0.14)", color: "var(--primary)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Icon name="database" size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: "var(--text-hi)", fontSize: 14 }}>{w.name}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{w.docs} docs · {w.entities.toLocaleString()} entities · indexed {w.last}</div>
          </div>
          <span className={"status-chip " + (w.health === "healthy" ? "done" : "pending")}>{w.health}</span>
          <button className="btn small">Re-index</button>
        </div>
      ))}
    </div>
  );
}
