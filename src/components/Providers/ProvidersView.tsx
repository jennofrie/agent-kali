// React import not needed with JSX transform
import { Icon } from "../Shared/Icon";
import { MOCK_PROVIDERS } from "../../lib/mockData";
import { ProviderCard } from "../Participants/ParticipantsView";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProviderData {
  id: string;
  name: string;
  service: string;
  location: string;
  capacity: string;
}

// ---------------------------------------------------------------------------
// ProvidersView
// ---------------------------------------------------------------------------

export function ProvidersView() {
  return (
    <div>
      <div className="section-head" style={{ marginTop: 0 }}>
        <div>
          <div className="section-title">Provider network</div>
          <div className="section-sub">108 onboarded · 12 with current capacity</div>
        </div>
        <button className="btn primary"><Icon name="plus" size={14} />Add provider</button>
      </div>
      <div className="participants-grid">
        {MOCK_PROVIDERS.map((p: ProviderData) => <ProviderCard key={p.id} p={p} />)}
      </div>
    </div>
  );
}
