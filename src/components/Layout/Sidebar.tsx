import { useState, useEffect } from "react";
import { Icon } from "../Shared/Icon";
import { PARTICIPANT_COLORS, type RealParticipant } from "../../lib/mockData";

// ── Navigation data ─────────────────────────────────────────────

interface NavItemData {
  id: string;
  label: string;
  icon: string;
  badge?: number;
}

const NAV_MAIN: NavItemData[] = [
  { id: "dashboard", label: "Dashboard", icon: "home" },
  { id: "forms", label: "Forms", icon: "forms", badge: 3 },
  { id: "participants", label: "Participants", icon: "users" },
  { id: "drafts", label: "Prompts", icon: "draft" },
];

const NAV_TOOLS: NavItemData[] = [
  { id: "rag", label: "Research", icon: "search" },
  { id: "templates", label: "Templates", icon: "template" },
  { id: "reports", label: "Reports", icon: "report" },
  { id: "providers", label: "Providers", icon: "provider" },
];

const NAV_DATA: NavItemData[] = [
  { id: "lightrag", label: "LightRAG", icon: "database" },
  { id: "files", label: "Local Files", icon: "folder" },
];

// Pinned participants (shown first in sidebar, in this order)
const PINNED_NAMES = [
  "Kydan Jaremenko",
  "Tara Ford",
  "Mary Dudek",
  "Monica Tulloch",
  "Rebecca Ritossa",
];

// ── NavItem sub-component ───────────────────────────────────────

interface NavItemProps {
  item: NavItemData;
  active: boolean;
  onClick: () => void;
  collapsed: boolean;
}

function NavItem({ item, active, onClick, collapsed }: NavItemProps) {
  return (
    <div
      className={"nav-item " + (active ? "active" : "")}
      onClick={onClick}
      title={collapsed ? item.label : ""}
    >
      <Icon name={item.icon} size={18} />
      <span className="label">{item.label}</span>
      {item.badge ? <span className="badge">{item.badge}</span> : null}
    </div>
  );
}

// ── Sidebar ─────────────────────────────────────────────────────

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

export function Sidebar({
  activeTab,
  setActiveTab,
  collapsed,
  setCollapsed,
}: SidebarProps) {
  const [showAll, setShowAll] = useState(false);
  const [realParticipants, setRealParticipants] = useState<RealParticipant[]>([]);

  // Load real participants from filesystem
  useEffect(() => {
    if (window.api?.scanParticipants) {
      window.api.scanParticipants().then((r) => {
        const pList = (r.participants || []).map((p: RealParticipant, i: number) => ({
          ...p,
          color: p.color || PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length],
        }));
        setRealParticipants(pList);
      }).catch(() => setRealParticipants([]));
    }
  }, []);

  // Sort participants: pinned first (in order), then the rest alphabetically
  const sortedParticipants = (() => {
    if (realParticipants.length === 0) return [];
    const pinned: RealParticipant[] = [];
    const rest: RealParticipant[] = [];
    for (const name of PINNED_NAMES) {
      const match = realParticipants.find(p => p.name.toLowerCase() === name.toLowerCase());
      if (match) pinned.push(match);
    }
    for (const p of realParticipants) {
      if (!PINNED_NAMES.some(n => n.toLowerCase() === p.name.toLowerCase())) {
        rest.push(p);
      }
    }
    rest.sort((a, b) => a.name.localeCompare(b.name));
    return [...pinned, ...rest];
  })();

  const recents = sortedParticipants.slice(0, showAll ? sortedParticipants.length : 5);

  return (
    <aside className="sidebar">
      {/* No custom traffic lights — using native macOS titleBarStyle: hiddenInset */}
      <div className="sidebar-brand" style={{ paddingTop: 38 }}>
        <div className="brand-mark">
          <img src="/logo-32.png" alt="Agent Kali" className="sidebar-logo-img" />
        </div>
        <div className="brand-name">Agent Kali</div>
      </div>

      <button
        className="collapse-toggle"
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? "Expand" : "Collapse"}
      >
        <Icon name={collapsed ? "chevron-right" : "chevron-left"} size={12} />
      </button>

      <div className="sidebar-scroll">
        <div className="nav-section">
          <div className="nav-label">Main</div>
          {NAV_MAIN.map((it) => (
            <NavItem
              key={it.id}
              item={it}
              active={activeTab === it.id}
              collapsed={collapsed}
              onClick={() => setActiveTab(it.id)}
            />
          ))}
        </div>

        <div className="nav-divider"></div>

        <div className="nav-section">
          <div className="nav-label">Tools</div>
          {NAV_TOOLS.map((it) => (
            <NavItem
              key={it.id}
              item={it}
              active={activeTab === it.id}
              collapsed={collapsed}
              onClick={() => setActiveTab(it.id)}
            />
          ))}
        </div>

        <div className="nav-divider"></div>

        <div className="nav-section">
          <div className="nav-label">Data</div>
          {NAV_DATA.map((it) => (
            <NavItem
              key={it.id}
              item={it}
              active={activeTab === it.id}
              collapsed={collapsed}
              onClick={() => setActiveTab(it.id)}
            />
          ))}
        </div>

        <div className="nav-divider"></div>

        {recents.length > 0 && (
          <div className="nav-section recents-section">
            <div className="nav-label">Participants</div>
            <div className="recent-list">
              {recents.map((p) => (
                <div
                  key={p.id}
                  className="recent-item"
                  title={collapsed ? p.name : ""}
                  onClick={() => setActiveTab("participants")}
                >
                  <div
                    className="recent-avatar"
                    style={{ background: p.color || PARTICIPANT_COLORS[0] }}
                  >
                    {p.initials}
                  </div>
                  <span className="recent-name">{p.name}</span>
                  <Icon
                    name="chevron-right"
                    size={13}
                    style={{ color: "var(--text-faint)", flexShrink: 0 }}
                  />
                </div>
              ))}
              {!collapsed && sortedParticipants.length > 5 && (
                <div className="show-more" onClick={() => setShowAll(!showAll)}>
                  <Icon
                    name="chevron-down"
                    size={14}
                    style={{
                      transform: showAll ? "rotate(180deg)" : "none",
                      transition: "transform 150ms",
                    }}
                  />
                  <span>{showAll ? "Show less" : `Show more (${sortedParticipants.length - 5})`}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="sidebar-footer">
        <NavItem
          item={{ id: "settings", label: "Settings", icon: "settings" }}
          active={activeTab === "settings"}
          collapsed={collapsed}
          onClick={() => setActiveTab("settings")}
        />
      </div>
    </aside>
  );
}
