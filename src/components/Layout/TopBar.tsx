// TopBar: title + search bar (centered) + notification + avatar
// React import not needed with JSX transform
import { Icon } from "../Shared/Icon";

interface TopBarProps {
  activeTab: string;
  pillIdx: number;
  setPillIdx: (idx: number) => void;
}

const TAB_TITLES: Record<string, { title: string; sub: string }> = {
  dashboard: { title: "Dashboard", sub: "Wednesday, 28 May 2026" },
  forms: { title: "Forms", sub: "3 open documents" },
  participants: { title: "Participants", sub: "32 active" },
  drafts: { title: "Drafts", sub: "5 unsent" },
  rag: { title: "RAG Search", sub: "LightRAG · 4 workspaces" },
  templates: { title: "Templates", sub: "24 forms in library" },
  reports: { title: "Reports", sub: "9 generated this month" },
  providers: { title: "Providers", sub: "108 onboarded" },
  lightrag: { title: "LightRAG", sub: "Knowledge graph status" },
  files: { title: "Local Files", sub: "/Users/jordan/Documents/NDIS" },
  settings: { title: "Settings", sub: "Workspace + integrations" },
};

const SEARCH_PLACEHOLDERS: Record<string, string> = {
  dashboard: "Search participants, forms, drafts…",
  forms: "Find form, field, or participant…",
  participants: "Search by name, NDIS #, diagnosis…",
  drafts: "Search drafts…",
  rag: "Ask the knowledge graph…",
  templates: "Find a template…",
  reports: "Search reports…",
  providers: "Search providers, services, suburb…",
  settings: "Search settings…",
};

const PILL_SETS: Record<string, string[]> = {
  dashboard:    ["All", "This week", "Due soon", "Awaiting review", "Exported", "Recurring", "Archived"],
  forms:        ["All open", "Service bookings", "Plan reviews", "Claims", "Risk", "BSP", "Incidents"],
  participants: ["All", "Active plans", "Review due", "New intake", "On hold", "Self-managed", "Plan-managed", "Agency"],
  drafts:       ["All", "Today", "This week", "Service booking", "Plan review", "Claim", "Risk"],
  rag:          ["All workspaces", "Participants", "NDIS Pricing 2026", "Internal SOPs", "Provider docs"],
  templates:    ["All", "NDIA official", "Internal", "Service agreement", "Claims", "Risk", "BSP", "SIL"],
  reports:      ["All", "Plan reassessment", "Support letter", "Budget utilisation", "Monthly summary", "Outcome reports", "Progress reports"],
  providers:    ["All", "Open now", "Allied health", "SIL", "Transport", "Community access", "Behaviour support", "Therapy"],
  settings:     ["General", "API & sidecar", "Paths", "Profile", "Integrations", "Shortcuts"],
};

export function TopBar({ activeTab, pillIdx, setPillIdx }: TopBarProps) {
  const titleInfo = TAB_TITLES[activeTab] || { title: activeTab, sub: "" };
  const placeholder = SEARCH_PLACEHOLDERS[activeTab] || "Search…";
  const pills = PILL_SETS[activeTab] || [];

  return (
    <>
      <div className="topbar">
        <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
          <span className="tab-title">{titleInfo.title}</span>
          <span style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>{titleInfo.sub}</span>
        </div>

        <div className="search-bar">
          <Icon name="search" size={15} style={{ color: "var(--text-faint)" }} />
          <input placeholder={placeholder} />
          <Icon name="mic" size={15} className="mic" />
        </div>

        <div className="topbar-right">
          <button className="icon-btn" title="Open meeting"><Icon name="video" size={16} /></button>
          <button className="icon-btn" title="Notifications">
            <Icon name="bell" size={16} />
            <span className="dot"></span>
          </button>
          <div className="avatar" title="Jordan Davies">JD</div>
        </div>
      </div>

      {pills.length > 0 && (
        <div className="pills-row">
          {pills.map((p, i) => (
            <button key={p} className={"pill " + (i === pillIdx ? "active" : "")} onClick={() => setPillIdx(i)}>{p}</button>
          ))}
        </div>
      )}
    </>
  );
}
