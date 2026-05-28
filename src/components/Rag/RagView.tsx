import { useState } from "react";
import { Icon } from "../Shared/Icon";

// ---------------------------------------------------------------------------
// RagView
// ---------------------------------------------------------------------------

export function RagView() {
  const [mode, setMode] = useState<string>("hybrid");
  const [workspace, setWorkspace] = useState<string>("Participants");
  const [hasResult, _setHasResult] = useState<boolean>(true);
  return (
    <div className="rag-wrap">
      <div className="rag-search">
        <Icon name="sparkles" size={18} style={{ color: "var(--primary)", marginTop: 4, flexShrink: 0 }} />
        <textarea defaultValue="What was Marcus Chen's last reported sensory routine, and which provider initiated it?" />
        <button className="btn primary" style={{ alignSelf: "flex-end" }}><Icon name="send" size={14} />Ask</button>
      </div>

      <div className="rag-opts">
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)", letterSpacing: "0.06em", textTransform: "uppercase", marginRight: 4 }}>Workspace</span>
        {["Participants", "NDIS Pricing 2026", "Internal SOPs", "Provider docs"].map(w => (
          <span key={w} className={"opt-chip " + (workspace === w ? "active" : "")} onClick={() => setWorkspace(w)}>{w}</span>
        ))}
        <span style={{ width: 16 }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)", letterSpacing: "0.06em", textTransform: "uppercase", marginRight: 4 }}>Mode</span>
        {["naive", "local", "global", "hybrid"].map(m => (
          <span key={m} className={"opt-chip " + (mode === m ? "active" : "")} onClick={() => setMode(m)}>{m}</span>
        ))}
      </div>

      {hasResult && (
        <div className="rag-result">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 12, borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)", letterSpacing: "0.06em", textTransform: "uppercase" }}>Answer · 4 sources · 1.2s</div>
            <button className="btn small primary"><Icon name="forms" size={12} />Apply to active form</button>
          </div>
          <p>Marcus Chen's most recent sensory routine was a 12-week graded sensory diet introduced on <strong>11 May 2026</strong>, focusing on proprioceptive input before school and deep-pressure tools at transitions <span className="source-cite">[1]</span> <span className="source-cite">[3]</span>.</p>
          <p>The routine was initiated by <strong>Tessellate OT</strong> (lead clinician: Priya Singh), in collaboration with the participant's family <span className="source-cite">[2]</span>. The plan replaced an earlier, less successful auditory-focused routine from October 2025 <span className="source-cite">[4]</span>.</p>
          <p style={{ marginTop: 14, color: "var(--text-muted)", fontSize: 12.5 }}><strong style={{ color: "var(--text)" }}>Recommendation:</strong> If you're filling a service booking or OT review form, fields <em>"Current intervention"</em> and <em>"Lead clinician"</em> can be auto-populated from this answer. Click <em>Apply to active form</em>.</p>

          <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-faint)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 10 }}>Sources</div>
            {[
              ["[1]", "Case note 2026-05-11 — Provider meeting", "Tessellate OT · Marcus Chen workspace"],
              ["[2]", "Email thread — sensory routine sign-off", "May 14, 2026 · 3 messages"],
              ["[3]", "OT review report Q1 2026", "16 pages · Marcus Chen workspace"],
              ["[4]", "Case note 2025-10-22 — Auditory diet review", "Marcus Chen workspace"],
            ].map(([n, t, s]) => (
              <div key={n} style={{ display: "flex", gap: 12, padding: "8px 0", fontSize: 12.5 }}>
                <span style={{ color: "var(--accent-soft)", fontWeight: 700, fontFamily: "var(--font-mono)" }}>{n}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ color: "var(--text-hi)", fontWeight: 500 }}>{t}</div>
                  <div style={{ color: "var(--text-faint)", fontSize: 11.5 }}>{s}</div>
                </div>
                <Icon name="chevron-right" size={14} style={{ color: "var(--text-faint)", alignSelf: "center" }} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
