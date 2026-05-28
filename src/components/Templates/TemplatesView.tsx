import { Icon } from "../Shared/Icon";
import { MOCK_TEMPLATES } from "../../lib/mockData";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TemplateData {
  id: string;
  name: string;
  provider: string;
  fields: number;
  type: string;
}

interface TemplateCardProps {
  t: TemplateData;
}

// ---------------------------------------------------------------------------
// TemplateCard
// ---------------------------------------------------------------------------

export function TemplateCard({ t }: TemplateCardProps) {
  const typeColors: Record<string, string> = { agreement: "#8a64ff", report: "#60a5fa", review: "#e74c8a", claim: "#34d399", risk: "#f6b73c", behaviour: "#c4b5ff", sil: "#a084ff", incident: "#fb5168" };
  const c = typeColors[t.type] || "#8a64ff";
  return (
    <div className="form-card">
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
        <div className="form-duration">{t.fields} fields</div>
      </div>
      <div className="form-body">
        <div className="form-icon" style={{ background: `linear-gradient(135deg, ${c}, var(--primary-2))` }}><Icon name="template" size={15} /></div>
        <div className="form-meta">
          <div className="form-title">{t.name}</div>
          <div className="form-sub">{t.provider}</div>
          <div className="form-stats">
            <span>Tap to use &rarr;</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// TemplatesView
// ---------------------------------------------------------------------------

export function TemplatesView() {
  return (
    <div>
      <div className="section-head" style={{ marginTop: 0 }}>
        <div>
          <div className="section-title">Template library</div>
          <div className="section-sub">Drop a PDF on any template to use it as a fillable form</div>
        </div>
        <button className="btn primary"><Icon name="upload" size={14} />Import template</button>
      </div>
      <div className="form-grid">
        {MOCK_TEMPLATES.map((t: TemplateData) => <TemplateCard key={t.id} t={t} />)}
      </div>
    </div>
  );
}
