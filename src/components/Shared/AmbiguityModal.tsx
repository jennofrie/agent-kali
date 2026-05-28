import { useState } from "react";
import { Icon } from "./Icon";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AmbiguityModalProps {
  onClose: () => void;
}

interface Choice {
  label: string;
  conf: string;
  source: string;
  confLabel: string;
}

// ---------------------------------------------------------------------------
// AmbiguityModal
// ---------------------------------------------------------------------------

export function AmbiguityModal({ onClose }: AmbiguityModalProps) {
  const [pick, setPick] = useState<number>(0);
  const choices: Choice[] = [
    { label: "24 hours", conf: "high", source: "Hearthside Provider T&C v4 \u00A76.2", confLabel: "92%" },
    { label: "7 days (168 hours)", conf: "med", source: "Plan PDF, p.18 \u2014 legacy clause", confLabel: "61%" },
    { label: "48 hours", conf: "med", source: "NDIS Pricing 2026 default", confLabel: "55%" },
    { label: "Enter custom value\u2026", conf: "", source: "Manual entry", confLabel: "\u2014" },
  ];
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-icon"><Icon name="warning" size={18} /></div>
          <div>
            <h3>Resolve ambiguous field</h3>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>Cancellation Notice (Hrs)</div>
          </div>
          <button className="btn small ghost" style={{ marginLeft: "auto" }} onClick={onClose}><Icon name="x" size={14} /></button>
        </div>
        <div className="modal-body">
          <div style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 14 }}>
            Three sources gave different values. Pick the one to write, or enter a custom value.
          </div>
          {choices.map((c, i) => (
            <div key={i} className={"choice-card " + (pick === i ? "selected" : "")} onClick={() => setPick(i)}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", border: pick === i ? "5px solid var(--primary)" : "1px solid var(--border)", flexShrink: 0 }}></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "var(--text-hi)", fontWeight: 600, fontSize: 13.5 }}>{c.label}</div>
                <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 2 }}>{c.source}</div>
              </div>
              <span className={"conf " + c.conf}>{c.confLabel}</span>
            </div>
          ))}
        </div>
        <div className="modal-foot">
          <button className="btn ghost" onClick={onClose}>Skip for now</button>
          <button className="btn primary" onClick={onClose}><Icon name="check" size={13} />Apply selection</button>
        </div>
      </div>
    </div>
  );
}
