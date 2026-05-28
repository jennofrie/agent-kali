import { useState, useEffect } from "react";
import { Icon } from "../Shared/Icon";
import { PARTICIPANT_COLORS, type RealParticipant } from "../../lib/mockData";

// ---------------------------------------------------------------------------
// FilesView — defaults to ~/Desktop/Support-Coordination/
// ---------------------------------------------------------------------------

const DEFAULT_ROOT = "/Users/sharan/Desktop/Support-Coordination";

export function FilesView() {
  const [participants, setParticipants] = useState<RealParticipant[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [files, setFiles] = useState<{ name: string; path: string; size: number; modified: number }[]>([]);
  const [rootPath, setRootPath] = useState(DEFAULT_ROOT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (window.api?.scanParticipants) {
      window.api.scanParticipants().then((r) => {
        setParticipants((r.participants || []).map((p: RealParticipant, i: number) => ({
          ...p,
          color: p.color || PARTICIPANT_COLORS[i % PARTICIPANT_COLORS.length],
        })));
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const loadFiles = async (folderPath: string, subfolder?: string) => {
    if (!window.api?.listParticipantFiles) return;
    try {
      const result = await window.api.listParticipantFiles(folderPath, subfolder);
      setFiles(result.files || []);
    } catch {
      setFiles([]);
    }
  };

  const formatDate = (ms: number) => {
    return new Date(ms).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  };

  return (
    <div>
      <div className="section-head" style={{ marginTop: 0 }}>
        <div>
          <div className="section-title">Local Files</div>
          <div className="section-sub">{rootPath}</div>
        </div>
        <button className="btn small" onClick={async () => {
          if (window.api?.openFolder) {
            const folder = await window.api.openFolder();
            if (folder) setRootPath(folder);
          }
        }}>
          <Icon name="folder" size={12} /> Change
        </button>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Scanning...</div>
      ) : selectedFolder ? (
        <>
          <button className="btn small ghost" style={{ marginBottom: 12 }} onClick={() => { setSelectedFolder(null); setFiles([]); }}>
            <Icon name="chevron-left" size={13} /> Back to participants
          </button>
          <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-hi)", marginBottom: 12 }}>
            {selectedFolder.split("/").pop()?.replace(/-/g, " ")}
          </div>
          {files.length === 0 ? (
            <div style={{ padding: 20, color: "var(--text-muted)", fontSize: 13 }}>No files found</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {files.map((f, i) => (
                <div key={i} className="card" style={{ padding: "10px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                  <Icon name="forms" size={16} style={{ color: "var(--text-faint)", flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-hi)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</div>
                  </div>
                  <span style={{ fontSize: 11, color: "var(--text-faint)", whiteSpace: "nowrap" }}>{formatSize(f.size)}</span>
                  <span style={{ fontSize: 11, color: "var(--text-faint)", whiteSpace: "nowrap" }}>{formatDate(f.modified)}</span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
          {participants.map(p => (
            <div
              key={p.id}
              className="card"
              style={{ padding: 16, cursor: "pointer" }}
              onClick={() => {
                setSelectedFolder(p.folderPath);
                loadFiles(p.folderPath);
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: "50%", display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: 12,
                  fontWeight: 700, color: "#fff", background: p.color || PARTICIPANT_COLORS[0],
                }}>{p.initials}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-hi)" }}>{p.name}</div>
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                {p.fileCount} files · {p.subfolders.length} folders
              </div>
              <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4, display: "flex", flexWrap: "wrap", gap: 4 }}>
                {p.subfolders.slice(0, 3).map(s => (
                  <span key={s} style={{ background: "rgba(138,100,255,0.08)", padding: "2px 6px", borderRadius: 4 }}>{s}</span>
                ))}
                {p.subfolders.length > 3 && <span style={{ padding: "2px 6px" }}>+{p.subfolders.length - 3}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
