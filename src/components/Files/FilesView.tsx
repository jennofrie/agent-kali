// React import not needed with JSX transform
import { Icon } from "../Shared/Icon";

// ---------------------------------------------------------------------------
// FilesView
// ---------------------------------------------------------------------------

export function FilesView() {
  return (
    <div className="empty-state">
      <div className="glyph"><Icon name="folder" size={28} /></div>
      <div style={{ color: "var(--text-hi)", fontWeight: 600, fontSize: 15, marginBottom: 4 }}>Local file browser</div>
      <div>Browse, watch and tag the folders that feed your RAG workspaces.</div>
      <button className="btn primary" style={{ marginTop: 16 }}><Icon name="folder" size={14} />Choose folder…</button>
    </div>
  );
}
