import { useState, useEffect, useCallback } from "react";
import { Icon } from "../Shared/Icon";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PromptFile {
  name: string;
  path: string;
  size: number;
  modified: number;
}

// ---------------------------------------------------------------------------
// Mock data for browser mode
// ---------------------------------------------------------------------------

const MOCK_PROMPTS: PromptFile[] = [
  { name: "SC-Initial-Assessment-Prompt.md", path: "/mock/SC-Initial-Assessment-Prompt.md", size: 2048, modified: Date.now() - 3600000 },
  { name: "Plan-Review-Report-Template.md", path: "/mock/Plan-Review-Report-Template.md", size: 3200, modified: Date.now() - 86400000 },
  { name: "Service-Agreement-Email.md", path: "/mock/Service-Agreement-Email.md", size: 1500, modified: Date.now() - 172800000 },
  { name: "Risk-Assessment-System-Prompt.md", path: "/mock/Risk-Assessment-System-Prompt.md", size: 4100, modified: Date.now() - 259200000 },
  { name: "Progress-Note-Generator.md", path: "/mock/Progress-Note-Generator.md", size: 2800, modified: Date.now() - 345600000 },
];

const MOCK_CONTENT = `# Support Coordination Prompt

You are a Support Coordinator assistant helping to draft NDIS documentation.

## Context
- Participant plans, service agreements, and case notes
- NDIS Pricing Arrangements and Price Limits
- NDIS Practice Standards

## Instructions
1. Review the participant's current plan and goals
2. Identify relevant support categories and line items
3. Draft documentation that aligns with NDIS guidelines
4. Flag any areas requiring human review

## Output Format
- Use clear, professional language
- Include relevant NDIS line item references
- Highlight any compliance considerations
`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_FOLDER = "~/Desktop/Jin-Obsidian/SupportCoordination/Prompt-Engineering-for-Support-Coordination/";

function formatDate(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function stripExtension(name: string): string {
  return name.replace(/\.md$/i, "");
}

function decodeUtf8(bytes: number[]): string {
  return new TextDecoder("utf-8").decode(new Uint8Array(bytes));
}

// ---------------------------------------------------------------------------
// PromptsView (exported as both PromptsView and DraftsView for compatibility)
// ---------------------------------------------------------------------------

export function PromptsView() {
  const [folderPath, setFolderPath] = useState<string>(DEFAULT_FOLDER);
  const [files, setFiles] = useState<PromptFile[]>([]);
  const [activeIdx, setActiveIdx] = useState<number>(0);
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const api = window.api;

  // ── Collect .md files from a single directory ─────────────────────
  const collectMdFiles = async (dirPath: string): Promise<PromptFile[]> => {
    const result = await api.listParticipantFiles(dirPath);
    if (!result?.files) return [];
    return result.files.filter(f => f.name.toLowerCase().endsWith(".md"));
  };

  // ── Scan folder for .md files (up to 2 levels deep) ──────────────
  const scanFolder = useCallback(async (folder: string) => {
    setLoading(true);
    if (!api?.listParticipantFiles) {
      // Browser fallback: use mock data
      setFiles(MOCK_PROMPTS);
      setActiveIdx(0);
      setContent(MOCK_CONTENT);
      setLoading(false);
      return;
    }

    try {
      // Level 0: .md files in the root folder
      const allFiles: PromptFile[] = await collectMdFiles(folder);

      // Level 1 + 2: discover subdirectories, then scan each
      if (api.listSubdirs) {
        const { dirs: level1Dirs } = await api.listSubdirs(folder);
        for (const sub of level1Dirs) {
          const subPath = folder.replace(/\/$/, "") + "/" + sub;
          const subFiles = await collectMdFiles(subPath);
          allFiles.push(...subFiles);

          // Level 2: one more level deeper
          const { dirs: level2Dirs } = await api.listSubdirs(subPath);
          for (const sub2 of level2Dirs) {
            const sub2Path = subPath + "/" + sub2;
            const sub2Files = await collectMdFiles(sub2Path);
            allFiles.push(...sub2Files);
          }
        }
      }

      // Sort by modified date, newest first
      allFiles.sort((a, b) => b.modified - a.modified);
      setFiles(allFiles);
      setActiveIdx(0);

      // Load content of first file
      if (allFiles.length > 0) {
        await loadFileContent(allFiles[0].path);
      } else {
        setContent("");
      }
    } catch (e) {
      console.error("Failed to scan folder:", e);
      setFiles([]);
      setContent("");
    }
    setLoading(false);
  }, [api]);

  // ── Load file content ────────────────────────────────────────────
  const loadFileContent = async (filePath: string) => {
    if (!api?.readFile) {
      setContent(MOCK_CONTENT);
      return;
    }
    try {
      const bytes: number[] = await api.readFile(filePath);
      const text = decodeUtf8(bytes);
      setContent(text);
    } catch (e) {
      console.error("Failed to read file:", e);
      setContent("Error reading file.");
    }
  };

  // ── Initial scan ─────────────────────────────────────────────────
  useEffect(() => {
    scanFolder(folderPath);
  }, []);

  // ── Select a file ────────────────────────────────────────────────
  const selectFile = async (idx: number) => {
    setActiveIdx(idx);
    const f = files[idx];
    if (f) {
      await loadFileContent(f.path);
    }
  };

  // ── Change folder ────────────────────────────────────────────────
  const changeFolder = async () => {
    if (!api?.openFolder) return;
    const selected = await api.openFolder();
    if (selected) {
      setFolderPath(selected);
      await scanFolder(selected);
    }
  };

  // ── Copy content ─────────────────────────────────────────────────
  const copyContent = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement("textarea");
      textarea.value = content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ── Send via email ───────────────────────────────────────────────
  const sendEmail = () => {
    window.open("mailto:?body=" + encodeURIComponent(content));
  };

  // ── Delete file ──────────────────────────────────────────────────
  const deleteFile = async () => {
    const active = files[activeIdx];
    if (!active) return;

    const confirmed = window.confirm(`Delete "${active.name}"? This cannot be undone.`);
    if (!confirmed) return;

    if (!api?.deleteFile) {
      alert("Delete not available in browser mode");
      return;
    }

    try {
      const result = await api.deleteFile(active.path);
      if (result?.success) {
        // Remove from list and select next file
        const newFiles = files.filter((_, i) => i !== activeIdx);
        setFiles(newFiles);
        const newIdx = Math.min(activeIdx, newFiles.length - 1);
        setActiveIdx(Math.max(0, newIdx));
        if (newFiles.length > 0) {
          await loadFileContent(newFiles[Math.max(0, newIdx)].path);
        } else {
          setContent("");
        }
      } else {
        alert("Failed to delete: " + (result?.error || "Unknown error"));
      }
    } catch (e) {
      alert("Failed to delete file: " + String(e));
    }
  };

  // ── Render ───────────────────────────────────────────────────────
  const active = files[activeIdx];

  return (
    <div className="drafts-layout">
      <div className="draft-list">
        {/* Folder path config row */}
        <div style={{
          padding: "10px 14px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 11,
          color: "var(--text-faint)",
        }}>
          <Icon name="folder" size={14} />
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={folderPath}>
            {folderPath}
          </span>
          <button
            className="btn small"
            onClick={changeFolder}
            style={{ flexShrink: 0, fontSize: 11, padding: "2px 8px" }}
          >
            Change
          </button>
        </div>

        {loading ? (
          <div style={{ padding: 20, textAlign: "center", color: "var(--text-faint)" }}>
            Scanning...
          </div>
        ) : files.length === 0 ? (
          <div style={{ padding: 20, textAlign: "center", color: "var(--text-faint)" }}>
            No .md files found in this folder.
          </div>
        ) : (
          files.map((f, i) => (
            <div
              key={f.path}
              className={"draft-row " + (i === activeIdx ? "active" : "")}
              onClick={() => selectFile(i)}
            >
              <div className="draft-row-top">
                <span className="draft-row-name">{stripExtension(f.name)}</span>
                <span className="draft-row-date">{formatDate(f.modified)}</span>
              </div>
              <div className="draft-row-sub">{formatSize(f.size)}</div>
            </div>
          ))
        )}
      </div>

      <div className="draft-preview">
        {active ? (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 18 }}>
              <div>
                <h1>{stripExtension(active.name)}</h1>
                <div className="muted">{formatDate(active.modified)} · {formatSize(active.size)} · Markdown</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn small" onClick={copyContent}>
                  <Icon name="copy" size={13} />{copied ? "Copied!" : "Copy"}
                </button>
                <button className="btn small" onClick={sendEmail}>
                  <Icon name="share" size={13} />Send via Email
                </button>
                <button className="btn small danger" onClick={deleteFile}>
                  <Icon name="trash" size={13} />
                </button>
              </div>
            </div>

            <div style={{ whiteSpace: "pre-wrap", fontFamily: "var(--font-mono, monospace)", fontSize: 13, lineHeight: 1.7 }}>
              {content}
            </div>
          </>
        ) : (
          <div style={{ padding: 40, textAlign: "center", color: "var(--text-faint)" }}>
            {loading ? "Loading..." : "No prompt selected"}
          </div>
        )}
      </div>
    </div>
  );
}

// Keep DraftsView as an alias for backward compatibility
export const DraftsView = PromptsView;
