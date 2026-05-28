import { useState } from "react";
import { Icon } from "../Shared/Icon";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ResearchEntry {
  id: string;
  title: string;
  participant: string;
  source: "rag" | "email" | "sc-folder" | "local" | "manual";
  workspace: string;
  date: number;
  snippet: string;
  fullText: string;
}

const SOURCE_ICONS: Record<string, string> = {
  rag: "database",
  email: "mail",
  "sc-folder": "folder",
  local: "folder",
  manual: "forms",
};

const SOURCE_LABELS: Record<string, string> = {
  rag: "RAG",
  email: "Email",
  "sc-folder": "SC Folder",
  local: "Local Files",
  manual: "Manual",
};

// ---------------------------------------------------------------------------
// Mock research history (real data will come from persistence layer later)
// ---------------------------------------------------------------------------

const MOCK_RESEARCH: ResearchEntry[] = [
  {
    id: "r1",
    title: "Kydan Jaremenko \u2014 Personal Details & Plan",
    participant: "Kydan Jaremenko",
    source: "rag",
    workspace: "NDIS",
    date: Date.now() - 3600000,
    snippet: "DOB: 08/12/2008, NDIS: 541487328, Diagnosis: ASD Level 2, Address: 15 Goulburn Ct Werribee VIC 3030. Mother: Renae Johnson (0400 093 754). Plan managed via Plan Partners.",
    fullText: "Full participant details extracted from LightRAG NDIS workspace.\n\nKydan Jaremenko (17, ASD Level 2) is an NDIS participant in a complex situation. Plan dates: 03/08/2024 \u2013 03/08/2025 (extended). Key providers: Daniel Morrell (Psychology, Inner Western Psychology), Ebony Book (PBS, Everyday Independence), Michiko Donal (OT, Country Therapy). Plan managed by Plan Partners. Mother/nominee: Renae Johnson (renae70s@hotmail.com, 0400 093 754).",
  },
  {
    id: "r2",
    title: "Monica Tulloch \u2014 OT Provider Search",
    participant: "Monica Tulloch",
    source: "email",
    workspace: "Gmail",
    date: Date.now() - 86400000,
    snippet: "5 OT providers contacted in Western Melbourne. The OT Group confirmed availability June 3rd. Better Rehab and Integrated OT did not reply.",
    fullText: "Provider search results across 5 OT services in Western Melbourne for Monica Tulloch (MS, Werribee):\n\n1. The OT Group \u2014 REPLIED, availability June 3rd, referral via website\n2. Beyond Barriers Care \u2014 REPLIED, telehealth only in Melbourne\n3. Ergo Therapy Group \u2014 REPLIED, capacity available but not for SIL/SDA\n4. Better Rehab Werribee \u2014 No reply\n5. Integrated OT \u2014 No reply",
  },
  {
    id: "r3",
    title: "Samuel Donnelly \u2014 Carer Impact Statement",
    participant: "Samuel Donnelly",
    source: "sc-folder",
    workspace: "Support-Coordination/Samuel-Donnelly",
    date: Date.now() - 172800000,
    snippet: "Nicole Donnelly submitted carer impact statement and OT report for Sam's plan review. Sam struggling with school attendance.",
    fullText: "Documents received from Nicole Donnelly (84nicki@gmail.com) on 27 May 2026:\n\n1. Carer's impact statement for Samuel Donnelly (DOCX)\n2. OT NDIS Change of Circumstance report 2026 (PDF)\n\nNicole noted Sam has been having a difficult time with school attendance and appointments. Jay offered to provide NDIS criteria analysis before submitting the final plan reassessment report.",
  },
  {
    id: "r4",
    title: "Amir Gerges \u2014 Specialist SC Referral",
    participant: "Amir Gerges",
    source: "rag",
    workspace: "NDIS",
    date: Date.now() - 259200000,
    snippet: "Spectrum SC declined due to capacity concerns. SageSC confirmed capacity. Service agreement issue identified as barrier.",
    fullText: "Specialist Support Coordination referral history for Amir Gerges (NDIS 431103310):\n\nSpectrum SC (Jimmy/Samantha) declined \u2014 Amir's expectations may exceed available funding/time. Recommended The Housing Hub instead.\n\nSageSC (Nadine/Kelly) confirmed capacity for Specialist SC in Geelong area. Nadine attempted to call Amir.\n\nKey issue: Service agreement refusal from Amir is blocking all provider engagement. Both providers flagged this. NDIS changes now require signed service agreements.",
  },
  {
    id: "r5",
    title: "Tara Ford \u2014 Wheelchair Repair Coordination",
    participant: "Tara Ford",
    source: "email",
    workspace: "Gmail",
    date: Date.now() - 345600000,
    snippet: "Urgoform M5 Permobil armrest and electronic damage. NDIS to fund new chair via plan variation. Repair cancelled.",
    fullText: "Wheelchair repair timeline with Urgoform for Tara Ford:\n\n25 May \u2014 Jay emailed Richard Campion about urgent repair (right armrest damage)\n25 May \u2014 Richard asked for photos\n26 May \u2014 Isla Campion arranged 10:30am technician visit\n26 May \u2014 Richard asked if electronic or armrest problem\n27 May \u2014 Tara confirmed both broken\n27 May \u2014 Jay spoke with Tara: repair cancelled, NDIS funding new chair through plan variation. OT needs to submit report. Tara considering selling the M5.",
  },
  {
    id: "r6",
    title: "Joseph Draper \u2014 Allied Health Reports",
    participant: "Joseph Draper",
    source: "sc-folder",
    workspace: "Support-Coordination/Joseph-Draper",
    date: Date.now() - 432000000,
    snippet: "Connect2Care OT report, walker and wheelchair letters of support from Giancarlo Valdivia. Life with Choice Care service agreement updated.",
    fullText: "Allied health documentation for Joseph Draper's plan review:\n\nConnect2Care (Giancarlo Valdivia, OT):\n\u2014 Letters of support for walker and wheelchair acquisition\n\u2014 Costs within budget, proceed with purchase\n\nLife with Choice Care (Ellen):\n\u2014 Updated service agreement sent 19 May 2026\n\u2014 Weekly Wed shifts 4:30-7pm + adhoc support\n\u2014 Jay reviewed and responded\n\nKnight McConchie (ENT):\n\u2014 Annie confirmed she'd send info, status pending",
  },
  {
    id: "r7",
    title: "Rebecca Ritossa \u2014 NDIS Plan Dates",
    participant: "Rebecca Ritossa",
    source: "rag",
    workspace: "NDIS",
    date: Date.now() - 518400000,
    snippet: "Plan dates corrected in email to Kristen at Newport Counselling. NIB Thrive plan management confirmed.",
    fullText: "Rebecca Ritossa plan information:\n\nNDIS plan managed via NIB Thrive. Jay corrected plan dates in follow-up email to Kristen at Newport Counselling. Service agreement requested from Newport for Salva sessions. Rebecca's appointment with Salva confirmed Mon 25 May at 2:00 PM.",
  },
  {
    id: "r8",
    title: "Nathan Mitchell \u2014 Service Agreement",
    participant: "Nathan Mitchell",
    source: "local",
    workspace: "Forms-To-FillOut",
    date: Date.now() - 604800000,
    snippet: "Docusign service agreement completed. Darko matched as support worker. 4hrs Saturday schedule confirmed by Steph.",
    fullText: "Nathaniel Mitchell service engagement:\n\nService agreement signed via Docusign 20 March 2026. Support worker Darko matched Feb 2026. Steph (plan nominee) confirmed 4hrs Saturday works, 6hrs max for school holidays. Nate settled well with Darko. Jay preparing 90-day implementation report.",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeDate(ms: number): string {
  const diff = Date.now() - ms;
  if (diff < 3600000) return `${Math.round(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.round(diff / 3600000)}h ago`;
  if (diff < 172800000) return "Yesterday";
  if (diff < 604800000) return `${Math.round(diff / 86400000)}d ago`;
  return new Date(ms).toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" });
}

// ---------------------------------------------------------------------------
// ResearchView (exported as RagView for backward compat with App.tsx routing)
// ---------------------------------------------------------------------------

export function RagView() {
  const [filter, setFilter] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filters = ["All", "RAG", "Email", "SC Folder", "Local Files", "Manual"];
  const filterMap: Record<string, string> = {
    "All": "all", "RAG": "rag", "Email": "email",
    "SC Folder": "sc-folder", "Local Files": "local", "Manual": "manual",
  };

  const filtered = filter === "all"
    ? MOCK_RESEARCH
    : MOCK_RESEARCH.filter(r => r.source === filter);

  return (
    <div>
      <div className="section-head" style={{ marginTop: 0 }}>
        <div>
          <div className="section-title">Research History</div>
          <div className="section-sub">Last 20 data extractions across all sources</div>
        </div>
      </div>

      {/* Filter pills */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {filters.map(f => (
          <button
            key={f}
            className={"pill " + ((filterMap[f] || "all") === filter ? "active" : "")}
            onClick={() => setFilter(filterMap[f] || "all")}
          >{f}</button>
        ))}
      </div>

      {/* Research entries */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.slice(0, 20).map(entry => (
          <div
            key={entry.id}
            className="card"
            style={{ padding: 0, cursor: "pointer", overflow: "hidden" }}
            onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
          >
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 18px" }}>
              {/* Source icon */}
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: entry.source === "rag" ? "linear-gradient(135deg, var(--primary), var(--primary-2))"
                  : entry.source === "email" ? "linear-gradient(135deg, #e74c8a, #c026d3)"
                  : entry.source === "sc-folder" ? "linear-gradient(135deg, #34d399, #059669)"
                  : "linear-gradient(135deg, #60a5fa, #3b82f6)",
              }}>
                <Icon name={SOURCE_ICONS[entry.source] || "forms"} size={16} />
              </div>

              {/* Title + participant */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-hi)", marginBottom: 3 }}>{entry.title}</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  {entry.participant} &middot; {entry.workspace}
                </div>
              </div>

              {/* Source badge + date */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                <span className={"status-chip " + (entry.source === "rag" ? "done" : entry.source === "email" ? "review" : "progress")} style={{ fontSize: 10 }}>
                  {SOURCE_LABELS[entry.source]}
                </span>
                <span style={{ fontSize: 11, color: "var(--text-faint)", whiteSpace: "nowrap" }}>
                  {formatRelativeDate(entry.date)}
                </span>
                <Icon
                  name={expandedId === entry.id ? "chevron-down" : "chevron-right"}
                  size={14}
                  style={{ color: "var(--text-faint)" }}
                />
              </div>
            </div>

            {/* Snippet */}
            {expandedId !== entry.id && (
              <div style={{ padding: "0 18px 14px 70px", fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.5 }}>
                {entry.snippet}
              </div>
            )}

            {/* Expanded full text */}
            {expandedId === entry.id && (
              <div style={{
                padding: "0 18px 18px 18px",
                borderTop: "1px solid var(--border)",
                marginTop: 0,
              }}>
                <div style={{ padding: "14px 0", fontSize: 13, color: "var(--text)", lineHeight: 1.65, whiteSpace: "pre-wrap" }}>
                  {entry.fullText}
                </div>
                <div style={{ display: "flex", gap: 8, paddingTop: 10, borderTop: "1px solid var(--border)" }}>
                  <button className="btn small primary" onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(entry.fullText);
                  }}>
                    <Icon name="copy" size={12} /> Copy
                  </button>
                  <button className="btn small" onClick={(e) => {
                    e.stopPropagation();
                  }}>
                    <Icon name="forms" size={12} /> Apply to form
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="glyph"><Icon name="search" size={32} /></div>
            <h3>No research entries</h3>
            <p>Data gathered during form filling will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
