import { useState, useEffect } from "react";
import { Icon } from "../Shared/Icon";
import { MOCK_TEMPLATES } from "../../lib/mockData";
import { PdfPreview } from "../Shared/PdfPreview";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TemplateFile {
  id: string;
  name: string;
  path: string;
  provider: string;
  fields: string;
  type: string;
  size: number;
  modified: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function classifyTemplate(name: string): { type: string; provider: string } {
  const n = name.toLowerCase();
  let type = "report";
  let provider = "";
  if (n.includes("agreement") || n.includes("consent")) type = "agreement";
  else if (n.includes("review") || n.includes("reassess")) type = "review";
  else if (n.includes("claim") || n.includes("travel") || n.includes("invoice")) type = "claim";
  else if (n.includes("risk") || n.includes("incident")) type = "risk";
  else if (n.includes("sil") || n.includes("sda")) type = "sil";
  else if (n.includes("bsp") || n.includes("behav")) type = "behaviour";
  else if (n.includes("referral") || n.includes("enquiry")) type = "agreement";

  if (n.includes("glowing")) provider = "Glowing Therapy";
  else if (n.includes("cdss") || n.includes("cervino")) provider = "Cervino CDSS";
  else if (n.includes("ndis") || n.includes("ndia")) provider = "NDIS";
  else if (n.includes("mpm") || n.includes("plan manager")) provider = "Plan Manager";
  else provider = "General";

  return { type, provider };
}

const typeColors: Record<string, string> = {
  agreement: "#8a64ff", report: "#60a5fa", review: "#e74c8a",
  claim: "#34d399", risk: "#f6b73c", behaviour: "#c4b5ff",
  sil: "#a084ff", incident: "#fb5168",
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
};

// ---------------------------------------------------------------------------
// TemplatesView
// ---------------------------------------------------------------------------

export function TemplatesView() {
  const [templates, setTemplates] = useState<TemplateFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingTemplate, setViewingTemplate] = useState<TemplateFile | null>(null);

  useEffect(() => {
    async function scan() {
      if (window.api?.listParticipantFiles) {
        try {
          const result = await window.api.listParticipantFiles(
            "/Users/sharan/Desktop/Forms-To-FillOut"
          );
          const files: TemplateFile[] = (result.files || [])
            .filter((f: any) => f.name.toLowerCase().endsWith(".pdf") || f.name.toLowerCase().endsWith(".docx"))
            .map((f: any, i: number) => {
              const { type, provider } = classifyTemplate(f.name);
              return {
                id: `tpl-${i}`,
                name: f.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
                path: f.path,
                provider,
                fields: formatSize(f.size),
                type,
                size: f.size,
                modified: f.modified,
              };
            });
          setTemplates(files);
        } catch {
          setTemplates([]);
        }
      }
      setLoading(false);
    }
    scan();
  }, []);

  // Maximized PDF view
  if (viewingTemplate) {
    return (
      <PdfPreview
        filePath={viewingTemplate.path}
        fileName={viewingTemplate.name}
        subtitle={viewingTemplate.provider}
        onMinimize={() => setViewingTemplate(null)}
      />
    );
  }

  const hasReal = templates.length > 0;

  return (
    <div>
      <div className="section-head" style={{ marginTop: 0 }}>
        <div>
          <div className="section-title">Template library</div>
          <div className="section-sub">
            {loading ? "Scanning..." : hasReal ? `${templates.length} templates in Forms-To-FillOut` : "Drop a PDF on any template to use it as a fillable form"}
          </div>
        </div>
        <button className="btn primary" onClick={async () => {
          if (window.api?.openFile) {
            await window.api.openFile();
          }
        }}>
          <Icon name="upload" size={14} />Import template
        </button>
      </div>
      <div className="form-grid">
        {hasReal ? templates.map((t) => {
          const c = typeColors[t.type] || "#8a64ff";
          return (
            <div key={t.id} className="form-card" style={{ cursor: "pointer" }} onClick={() => {
              if (t.path.toLowerCase().endsWith(".pdf")) {
                setViewingTemplate(t);
              }
            }}>
              <div className="form-thumb">
                <div className="form-thumb-stripes" style={{
                  background: `repeating-linear-gradient(135deg, ${c}33 0 12px, rgba(255,255,255,0.02) 12px 24px), linear-gradient(180deg, ${c}40, ${c}15)`
                }}></div>
                <div className="form-thumb-pdf">
                  <div className="row head"></div>
                  <div className="row med"></div>
                  <div className="row short"></div>
                  <div className="row"></div>
                  <div className="row med"></div>
                  <div className="row short"></div>
                </div>
                <div className="form-duration">{t.fields}</div>
              </div>
              <div className="form-body">
                <div className="form-icon" style={{ background: `linear-gradient(135deg, ${c}, var(--primary-2))` }}>
                  <Icon name="template" size={15} />
                </div>
                <div className="form-meta">
                  <div className="form-title">{t.name}</div>
                  <div className="form-sub">{t.provider}</div>
                  <div className="form-stats">
                    <span>Click to preview &rarr;</span>
                  </div>
                </div>
              </div>
            </div>
          );
        }) : (
          MOCK_TEMPLATES.map((t: any) => {
            const c = typeColors[t.type] || "#8a64ff";
            return (
              <div key={t.id} className="form-card">
                <div className="form-thumb">
                  <div className="form-thumb-stripes" style={{
                    background: `repeating-linear-gradient(135deg, ${c}33 0 12px, rgba(255,255,255,0.02) 12px 24px), linear-gradient(180deg, ${c}40, ${c}15)`
                  }}></div>
                  <div className="form-thumb-pdf">
                    <div className="row head"></div><div className="row med"></div><div className="row short"></div>
                    <div className="row"></div><div className="row med"></div><div className="row short"></div>
                  </div>
                  <div className="form-duration">{t.fields} fields</div>
                </div>
                <div className="form-body">
                  <div className="form-icon" style={{ background: `linear-gradient(135deg, ${c}, var(--primary-2))` }}><Icon name="template" size={15} /></div>
                  <div className="form-meta">
                    <div className="form-title">{t.name}</div>
                    <div className="form-sub">{t.provider}</div>
                    <div className="form-stats"><span>Tap to use &rarr;</span></div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
