import { useState } from "react";
import { Icon } from "../Shared/Icon";
import { MOCK_PARTICIPANTS } from "../../lib/mockData";

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
  { id: "drafts", label: "Drafts", icon: "draft" },
];

const NAV_TOOLS: NavItemData[] = [
  { id: "rag", label: "RAG Search", icon: "rag" },
  { id: "templates", label: "Templates", icon: "template" },
  { id: "reports", label: "Reports", icon: "report" },
  { id: "providers", label: "Providers", icon: "provider" },
];

const NAV_DATA: NavItemData[] = [
  { id: "lightrag", label: "LightRAG", icon: "database" },
  { id: "files", label: "Local Files", icon: "folder" },
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
  const recents = MOCK_PARTICIPANTS.slice(0, showAll ? 8 : 5);

  return (
    <aside className="sidebar">
      <div className="traffic-lights">
        <span className="tl-dot red"></span>
        <span className="tl-dot yellow"></span>
        <span className="tl-dot green"></span>
      </div>

      <div className="sidebar-brand">
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

        <div className="nav-section recents-section">
          <div className="nav-label">Recent participants</div>
          <div className="recent-list">
            {recents.map((p) => (
              <div
                key={p.id}
                className="recent-item"
                title={collapsed ? p.name : ""}
              >
                <div
                  className="recent-avatar"
                  style={{ background: p.color }}
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
            {!collapsed && (
              <div className="show-more" onClick={() => setShowAll(!showAll)}>
                <Icon
                  name="chevron-down"
                  size={14}
                  style={{
                    transform: showAll ? "rotate(180deg)" : "none",
                    transition: "transform 150ms",
                  }}
                />
                <span>{showAll ? "Show less" : "Show more"}</span>
              </div>
            )}
          </div>
        </div>
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
