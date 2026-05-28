import { useState } from "react";
import { Icon } from "../Shared/Icon";
import { StatCard } from "../Dashboard/DashboardView";

// ---------------------------------------------------------------------------
// LightRagView — connected to real RAG endpoints
// ---------------------------------------------------------------------------

interface WorkspaceData {
  name: string;
  url: string;
  status: "connected" | "checking" | "error";
  statusMsg: string;
}

export function LightRagView() {
  const [workspaces, setWorkspaces] = useState<WorkspaceData[]>([
    { name: "NDIS", url: "https://ndis.profexer.cloud", status: "connected", statusMsg: "Via Tailscale VPN" },
    { name: "Technical", url: "https://rag.profexer.cloud", status: "connected", statusMsg: "Via Tailscale VPN" },
  ]);
  const [testResult, setTestResult] = useState<string>("");

  const testConnection = async (ws: WorkspaceData, idx: number) => {
    const updated = [...workspaces];
    updated[idx] = { ...ws, status: "checking", statusMsg: "Testing..." };
    setWorkspaces(updated);

    try {
      if (window.api?.ragQuery) {
        const result = await window.api.ragQuery("test connection", ws.name.toLowerCase());
        updated[idx] = { ...ws, status: "connected", statusMsg: `OK — ${result.length} chars returned` };
        setTestResult(`${ws.name}: Connected successfully`);
      } else {
        updated[idx] = { ...ws, status: "error", statusMsg: "RAG API not available (browser mode)" };
      }
    } catch (e) {
      updated[idx] = { ...ws, status: "error", statusMsg: String(e) };
      setTestResult(`${ws.name}: ${e}`);
    }
    setWorkspaces(updated);
  };

  return (
    <div>
      <div className="stat-grid">
        <StatCard label="NDIS Workspace" value="ndis.profexer.cloud" icon="database" meta="Tailscale VPN" />
        <StatCard label="Technical Workspace" value="rag.profexer.cloud" icon="database" meta="Tailscale VPN" />
        <StatCard label="CLI Path" value="lightrag" icon="zap" meta="/Users/sharan/.local/bin/lightrag" />
        <StatCard label="Default Workspace" value="ndis" icon="sparkles" meta="Used for participant queries" />
      </div>

      <div className="section-head">
        <div>
          <div className="section-title">RAG Workspaces</div>
          <div className="section-sub">Self-hosted LightRAG instances behind Tailscale VPN</div>
        </div>
      </div>

      {workspaces.map((w, idx) => (
        <div key={w.name} className="card" style={{ padding: "14px 18px", marginBottom: 10, display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(138,100,255,0.14)", color: "var(--primary)", display: "grid", placeItems: "center", flexShrink: 0 }}>
            <Icon name="database" size={18} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, color: "var(--text-hi)", fontSize: 14 }}>{w.name}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              {w.url}
            </div>
            <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 2 }}>{w.statusMsg}</div>
          </div>
          <span className={"status-chip " + (w.status === "connected" ? "done" : w.status === "checking" ? "progress" : "pending")}>
            {w.status}
          </span>
          <button className="btn small" onClick={() => testConnection(w, idx)}>
            Test
          </button>
        </div>
      ))}

      <div className="section-head" style={{ marginTop: 24 }}>
        <div>
          <div className="section-title">Configuration</div>
          <div className="section-sub">From config/agent.config.json</div>
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ display: "grid", gap: 10, fontSize: 12.5 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-muted)" }}>CLI command</span>
            <code style={{ color: "var(--accent-soft)", fontFamily: "var(--font-mono, monospace)" }}>lightrag query ndis "[query]"</code>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: 10 }}>
            <span style={{ color: "var(--text-muted)" }}>API Key</span>
            <span style={{ color: "var(--text-faint)" }}>Configured in ~/.rag/config.env</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: 10 }}>
            <span style={{ color: "var(--text-muted)" }}>VPS IP</span>
            <code style={{ color: "var(--accent-soft)", fontFamily: "var(--font-mono, monospace)" }}>100.87.171.113</code>
          </div>
        </div>
      </div>

      {testResult && (
        <div style={{ marginTop: 12, padding: "10px 14px", borderRadius: 8, background: "rgba(138,100,255,0.08)", fontSize: 12, color: "var(--accent-soft)" }}>
          {testResult}
        </div>
      )}
    </div>
  );
}
