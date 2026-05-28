import { useState } from "react";
import { Icon } from "../Shared/Icon";
import { MOCK_DRAFTS } from "../../lib/mockData";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Draft {
  id: string;
  participant: string;
  title: string;
  date: string;
  type: string;
}

// ---------------------------------------------------------------------------
// DraftsView
// ---------------------------------------------------------------------------

export function DraftsView() {
  const [activeId, setActiveId] = useState<string>(MOCK_DRAFTS[0].id);
  const active = MOCK_DRAFTS.find((d: Draft) => d.id === activeId)!;
  return (
    <div className="drafts-layout">
      <div className="draft-list">
        {MOCK_DRAFTS.map((d: Draft) => (
          <div key={d.id} className={"draft-row " + (d.id === activeId ? "active" : "")} onClick={() => setActiveId(d.id)}>
            <div className="draft-row-top">
              <span className="draft-row-name">{d.title}</span>
              <span className="draft-row-date">{d.date}</span>
            </div>
            <div className="draft-row-sub">{d.participant}</div>
            <span className="status-chip progress">{d.type}</span>
          </div>
        ))}
      </div>

      <div className="draft-preview">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 18 }}>
          <div>
            <h1>{active.title}</h1>
            <div className="muted">{active.participant} · {active.date} · Markdown draft</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn small"><Icon name="copy" size={13} />Copy</button>
            <button className="btn small"><Icon name="share" size={13} />Send</button>
            <button className="btn small danger"><Icon name="trash" size={13} /></button>
          </div>
        </div>

        <p><strong>To:</strong> Care Team, Hearthside Care Co-op<br/>
        <strong>From:</strong> Jordan Davies, Support Coordinator<br/>
        <strong>Re:</strong> Service Booking Confirmation — {active.participant}</p>

        <h2>Overview</h2>
        <p>This draft confirms the service booking for {active.participant} effective <strong>1 April 2026</strong>. All field values have been extracted from the participant's current plan PDF, intake form, and the NDIS Pricing 2026 schedule.</p>

        <h2>Service Specifications</h2>
        <ul>
          <li>Service Category: <strong>Daily Living — Core Supports</strong></li>
          <li>Weekly hours: <strong>14h (weekdays) + 6h (weekends)</strong></li>
          <li>Hourly rate: <strong>$67.56 (weekday) · $94.21 (Saturday)</strong></li>
          <li>Cancellation notice: <strong>&#x26A0; flagged for review — see note below</strong></li>
          <li>Termination notice: <strong>14 days written</strong></li>
        </ul>

        <h2>Flagged for review</h2>
        <p>One field — <em>Cancellation notice (hours)</em> — could not be extracted with high confidence. The plan document references the legacy 7-day policy, while the provider's current standard is 24h. Recommendation: confirm with the provider before exporting.</p>

        <h2>Next steps</h2>
        <ul>
          <li>Confirm cancellation notice with Hearthside ops <span className="muted">(by Fri)</span></li>
          <li>Sign &amp; counter-sign in person on Tuesday</li>
          <li>Lodge in NDIS portal under Schedule A</li>
        </ul>
      </div>
    </div>
  );
}
