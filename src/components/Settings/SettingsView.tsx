import { useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ToggleState {
  telemetry: boolean;
  autosave: boolean;
  beta: boolean;
  watch: boolean;
}

// ---------------------------------------------------------------------------
// SettingsView
// ---------------------------------------------------------------------------

export function SettingsView() {
  const [tog, setTog] = useState<ToggleState>({ telemetry: false, autosave: true, beta: true, watch: true });
  return (
    <div className="settings-wrap">
      <div className="settings-section">
        <h3>Profile</h3>
        <div className="desc">Your coordinator details appear on filled forms and outgoing drafts.</div>
        <div className="settings-row">
          <div>
            <div className="settings-label">Display name</div>
            <div className="settings-help">Shown in signature blocks</div>
          </div>
          <input className="field-input" defaultValue="Jordan Davies" />
        </div>
        <div className="settings-row">
          <div><div className="settings-label">Email</div></div>
          <input className="field-input" defaultValue="jordan@northstar-sc.au" />
        </div>
        <div className="settings-row">
          <div><div className="settings-label">Provider number</div></div>
          <input className="field-input" defaultValue="4-409-117-2" />
        </div>
      </div>

      <div className="settings-section">
        <h3>Python sidecar</h3>
        <div className="desc">FastAPI service that handles PDF ingest, schema, fill and export.</div>
        <div className="settings-row">
          <div><div className="settings-label">Sidecar URL</div><div className="settings-help">Default localhost:8801</div></div>
          <input className="field-input" defaultValue="http://127.0.0.1:8801" />
        </div>
        <div className="settings-row">
          <div><div className="settings-label">Claude API key</div></div>
          <input className="field-input" type="password" defaultValue="sk-ant-•••••••••••••••••" />
        </div>
        <div className="settings-row">
          <div><div className="settings-label">Status</div></div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--success)", boxShadow: "0 0 8px var(--success)" }}></span>
            <span style={{ color: "var(--text-hi)", fontWeight: 600 }}>Connected · 12ms RTT</span>
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Paths &amp; storage</h3>
        <div className="settings-row">
          <div><div className="settings-label">Documents root</div></div>
          <input className="field-input" defaultValue="/Users/jordan/Documents/NDIS" />
        </div>
        <div className="settings-row">
          <div><div className="settings-label">RAG storage</div></div>
          <input className="field-input" defaultValue="./rag_storage" />
        </div>
        <div className="settings-row">
          <div><div className="settings-label">Auto-watch source folders</div></div>
          <div className={"toggle " + (tog.watch ? "on" : "")} onClick={() => setTog({...tog, watch: !tog.watch})}></div>
        </div>
      </div>

      <div className="settings-section">
        <h3>Preferences</h3>
        <div className="settings-row">
          <div><div className="settings-label">Autosave drafts</div><div className="settings-help">Every 30s during editing</div></div>
          <div className={"toggle " + (tog.autosave ? "on" : "")} onClick={() => setTog({...tog, autosave: !tog.autosave})}></div>
        </div>
        <div className="settings-row">
          <div><div className="settings-label">Anonymous telemetry</div></div>
          <div className={"toggle " + (tog.telemetry ? "on" : "")} onClick={() => setTog({...tog, telemetry: !tog.telemetry})}></div>
        </div>
        <div className="settings-row">
          <div><div className="settings-label">Enable beta features</div><div className="settings-help">Vision pre-fill, agent autopilot</div></div>
          <div className={"toggle " + (tog.beta ? "on" : "")} onClick={() => setTog({...tog, beta: !tog.beta})}></div>
        </div>
      </div>
    </div>
  );
}
