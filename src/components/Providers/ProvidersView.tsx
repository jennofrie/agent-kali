import { useState, useEffect, useMemo } from "react";
import { Icon } from "../Shared/Icon";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ParsedProvider {
  id: string;
  name: string;
  phone: string;
  email: string;
  website: string;
  websiteUrl: string;
  location: string;
  services: string;
  ndis: string;
  category: string;
}

type CategoryKey = "All" | "OT" | "Physio" | "Psychology" | "Exercise Physiology" | "Dietitian" | "Art Therapy";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CATEGORIES: CategoryKey[] = [
  "All", "OT", "Physio", "Psychology", "Exercise Physiology", "Dietitian", "Art Therapy",
];

const CATEGORY_COLORS: Record<string, string> = {
  OT: "#a855f7",
  Physio: "#3b82f6",
  Psychology: "#22c55e",
  "Exercise Physiology": "#f97316",
  Dietitian: "#ec4899",
  "Art Therapy": "#eab308",
};

function resolveNdisBadge(ndis: string): { cls: string; label: string } {
  const val = ndis.toLowerCase().trim();
  if (val.startsWith("yes")) return { cls: "done", label: "NDIS Registered" };
  if (val === "tbc") return { cls: "pending", label: "NDIS TBC" };
  if (val.includes("community")) return { cls: "review", label: "Community" };
  if (val.includes("plan-managed") || val.includes("self/plan")) return { cls: "progress", label: "Plan-Managed Only" };
  if (val.includes("ndis") || val.includes("certified")) return { cls: "done", label: ndis.trim() };
  if (!val) return { cls: "pending", label: "Unknown" };
  return { cls: "pending", label: ndis.trim() };
}

const FILENAME_TO_CATEGORY: Record<string, string> = {
  "ArtTherapy": "Art Therapy",
  "Dietitian": "Dietitian",
  "EP": "Exercise Physiology",
  "OT": "OT",
  "Physio": "Physio",
  "Psychologist": "Psychology",
};

// ---------------------------------------------------------------------------
// Mock fallback data (for browser mode without Electron API)
// ---------------------------------------------------------------------------

const MOCK_FALLBACK: ParsedProvider[] = [
  { id: "mock-1", name: "Better Rehab Werribee", phone: "(03) 8001 6103", email: "admin@betterrehab.com.au", website: "betterrehab.com.au", websiteUrl: "https://betterrehab.com.au", location: "5 Wedge St South, Werribee 3030", services: "Physio, Speech, Behaviour Support, Exercise Physiology", ndis: "Yes", category: "OT" },
  { id: "mock-2", name: "Little Movers Physiotherapy", phone: "0438 028 220", email: "Via website", website: "littlemoversphysio.com.au", websiteUrl: "https://www.littlemoversphysio.com.au", location: "98 Somerville Rd, Yarraville 3013", services: "Paediatric physio, neuro, developmental, home visits", ndis: "Yes", category: "Physio" },
  { id: "mock-3", name: "TreeHaus / Living Without Boundaries", phone: "(03) 9397 4499", email: "reception@treehauswilliamstown.com.au", website: "treehauswilliamstown.com.au", websiteUrl: "https://treehauswilliamstown.com.au", location: "95 Ferguson St, Williamstown", services: "Psychology, Speech, Art Therapy, Psychiatry, Sensory Gym", ndis: "Yes", category: "Psychology" },
  { id: "mock-4", name: "Healthstin - Brimbank", phone: "1300 090 931", email: "hello@healthstin.com.au", website: "healthstin.com.au", websiteUrl: "https://www.healthstin.com.au", location: "Brimbank Aquatic & Wellness Centre, Sunshine", services: "EP, physio, hydrotherapy, gym", ndis: "Yes", category: "Exercise Physiology" },
  { id: "mock-5", name: "Hub & Spoke Health", phone: "1800 166 167", email: "admin@hubandspoke.health", website: "hubandspoke.health", websiteUrl: "https://hubandspoke.health", location: "Hobsons Bay, Maribyrnong, Moonee Valley, Wyndham", services: "EP, physio, OT, dietetics, art therapy, music therapy", ndis: "Yes", category: "Art Therapy" },
  { id: "mock-6", name: "Tilegne Therapy Services", phone: "(03) 9067 6888", email: "info@tilegnetherapy.com.au", website: "tilegnetherapy.com.au", websiteUrl: "https://tilegnetherapy.com.au", location: "17 Pickett St, Footscray 3011", services: "Speech, Music Therapy, Dietetics", ndis: "Yes", category: "Dietitian" },
];

// ---------------------------------------------------------------------------
// Markdown table parser
// ---------------------------------------------------------------------------

function categoryFromFilename(fileName: string): string {
  // e.g. "OT-Western-Melbourne-Directory.md" -> "OT"
  const prefix = fileName.split("-")[0];
  return FILENAME_TO_CATEGORY[prefix] || prefix;
}

function parseMarkdownTable(content: string, category: string): ParsedProvider[] {
  const providers: ParsedProvider[] = [];
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Must be a table data row: starts with | and contains bold name **...**
    if (!line.startsWith("|")) continue;
    if (!line.includes("**")) continue;

    const cells = line.split("|").map((c) => c.trim());
    // cells[0] is empty (before first |), cells[1] is #, cells[2] is Practice, etc.
    if (cells.length < 9) continue;

    const numCell = cells[1];
    // Skip header separator rows and non-data rows
    if (numCell === "#" || numCell.startsWith("---") || numCell === "") continue;
    // Must start with a number
    if (!/^\d+$/.test(numCell)) continue;

    const rawName = cells[2];
    const phone = cells[3] || "";
    const rawEmail = cells[4] || "";
    const rawWebsite = cells[5] || "";
    const location = (cells[6] || "").replace(/\*\*/g, "");
    const services = (cells[7] || "").replace(/\*\*/g, "");
    const ndis = cells[8] || "";

    // Strip bold markers from name
    const name = rawName.replace(/\*\*/g, "").trim();
    if (!name) continue;

    // Parse email - handle "Via website", "Via referral", "Via phone"
    const email = rawEmail.trim();

    // Parse website - handle [text](url) markdown links
    let website = "";
    let websiteUrl = "";
    const linkMatch = rawWebsite.match(/\[([^\]]*)\]\(([^)]*)\)/);
    if (linkMatch) {
      website = linkMatch[1];
      websiteUrl = linkMatch[2];
    } else {
      website = rawWebsite.trim();
      if (website && !website.startsWith("http") && website !== "Via website") {
        websiteUrl = "https://" + website;
      }
    }

    providers.push({
      id: `${category}-${numCell}`,
      name,
      phone: phone.trim(),
      email,
      website,
      websiteUrl,
      location: location.trim(),
      services: services.trim(),
      ndis: ndis.trim(),
      category,
    });
  }

  return providers;
}

// ---------------------------------------------------------------------------
// Service pills splitter
// ---------------------------------------------------------------------------

function splitServices(services: string): string[] {
  if (!services) return [];
  return services
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

// ---------------------------------------------------------------------------
// ProvidersView
// ---------------------------------------------------------------------------

export function ProvidersView() {
  const [providers, setProviders] = useState<ParsedProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<CategoryKey>("All");
  const [search, setSearch] = useState("");
  const [sourceDir, setSourceDir] = useState("");

  // Load provider data on mount
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        if (window.api?.scanProviders) {
          const result = await window.api.scanProviders();
          if (cancelled) return;
          setSourceDir(result.dir);

          const all: ParsedProvider[] = [];
          for (const file of result.files) {
            const category = categoryFromFilename(file.fileName);
            const parsed = parseMarkdownTable(file.content, category);
            all.push(...parsed);
          }
          setProviders(all);
        } else {
          // Browser mode fallback
          setProviders(MOCK_FALLBACK);
        }
      } catch {
        // Fallback on any error
        setProviders(MOCK_FALLBACK);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  // Filter providers
  const filtered = useMemo(() => {
    let list = providers;

    if (activeCategory !== "All") {
      list = list.filter((p) => p.category === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.location.toLowerCase().includes(q) ||
          p.services.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q)
      );
    }

    return list;
  }, [providers, activeCategory, search]);

  // Count by category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: providers.length };
    for (const p of providers) {
      counts[p.category] = (counts[p.category] || 0) + 1;
    }
    return counts;
  }, [providers]);

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
        <Icon name="loader" size={24} className="spin" />
        <div style={{ marginTop: 12 }}>Loading provider directory...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="section-head" style={{ marginTop: 0 }}>
        <div>
          <div className="section-title">Provider Directory</div>
          <div className="section-sub">
            {providers.length} providers from {Object.keys(FILENAME_TO_CATEGORY).length} disciplines
            {sourceDir ? ` \u00B7 ${sourceDir}` : ""}
          </div>
        </div>
      </div>

      {/* Category filter pills */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          const color = cat === "All" ? "var(--text-hi)" : CATEGORY_COLORS[cat] || "#888";
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "5px 14px",
                borderRadius: 999,
                border: isActive ? `2px solid ${color}` : "1px solid var(--border)",
                background: isActive ? `${color}18` : "transparent",
                color: isActive ? color : "var(--text-muted)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {cat} ({categoryCounts[cat] || 0})
            </button>
          );
        })}
      </div>

      {/* Search bar */}
      <div style={{ position: "relative", marginBottom: 18 }}>
        <Icon
          name="search"
          size={15}
          style={{
            position: "absolute",
            left: 12,
            top: "50%",
            transform: "translateY(-50%)",
            color: "var(--text-faint)",
            pointerEvents: "none",
          }}
        />
        <input
          type="text"
          placeholder="Search by name, location, or service..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "9px 14px 9px 36px",
            borderRadius: "var(--radius)",
            border: "1px solid var(--border)",
            background: "var(--surface)",
            color: "var(--text-hi)",
            fontSize: 13,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      </div>

      {/* Results count */}
      <div style={{ fontSize: 12, color: "var(--text-faint)", marginBottom: 12 }}>
        Showing {filtered.length} of {providers.length} providers
      </div>

      {/* Provider cards grid */}
      <div className="participants-grid">
        {filtered.map((p) => (
          <ProviderDirectoryCard key={p.id} p={p} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>
          No providers found matching your criteria.
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProviderDirectoryCard
// ---------------------------------------------------------------------------

function ProviderDirectoryCard({ p }: { p: ParsedProvider }) {
  const color = CATEGORY_COLORS[p.category] || "#888";
  const ndisBadge = resolveNdisBadge(p.ndis);
  const servicePills = splitServices(p.services);
  const isRealEmail = p.email && !p.email.toLowerCase().startsWith("via ");

  return (
    <div
      className="participant-card"
      style={{ "--p-color": color } as React.CSSProperties}
    >
      {/* Top row: avatar + category badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
        <div
          className="p-avatar"
          style={{
            background: `linear-gradient(135deg, ${color}, ${color}99)`,
            fontSize: 13,
            width: 44,
            height: 44,
            flexShrink: 0,
          }}
        >
          {p.name
            .split(" ")
            .filter((w) => w.length > 1 && w[0] !== "(")
            .map((s) => s[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="p-name" style={{ fontSize: 14, lineHeight: 1.3 }}>{p.name}</div>
          <span
            style={{
              display: "inline-block",
              fontSize: 10,
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: 999,
              background: `${color}20`,
              color,
              marginTop: 3,
              textTransform: "uppercase",
              letterSpacing: 0.3,
            }}
          >
            {p.category}
          </span>
        </div>
      </div>

      {/* Location */}
      <div
        className="p-diag"
        style={{ display: "flex", alignItems: "flex-start", gap: 6, marginTop: 8, paddingTop: 8 }}
      >
        <Icon name="map-pin" size={12} style={{ color: "var(--text-faint)", flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: 12, lineHeight: 1.4 }}>{p.location || "Location not listed"}</span>
      </div>

      {/* Phone */}
      {p.phone && p.phone.toLowerCase() !== "via website" && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6, fontSize: 12 }}>
          <Icon name="phone" size={12} style={{ color: "var(--text-faint)", flexShrink: 0 }} />
          <a
            href={`tel:${p.phone.replace(/\s/g, "")}`}
            style={{ color: "var(--text)", textDecoration: "none" }}
          >
            {p.phone}
          </a>
        </div>
      )}

      {/* Email */}
      {p.email && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, fontSize: 12 }}>
          <Icon name="mail" size={12} style={{ color: "var(--text-faint)", flexShrink: 0 }} />
          {isRealEmail ? (
            <a
              href={`mailto:${p.email}`}
              style={{ color: "var(--text)", textDecoration: "none", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
            >
              {p.email}
            </a>
          ) : (
            <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>{p.email}</span>
          )}
        </div>
      )}

      {/* Service pills */}
      {servicePills.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 10 }}>
          {servicePills.slice(0, 4).map((svc, idx) => (
            <span
              key={idx}
              style={{
                fontSize: 10,
                padding: "2px 7px",
                borderRadius: 999,
                background: "var(--surface-raised, rgba(255,255,255,0.05))",
                border: "1px solid var(--border)",
                color: "var(--text-muted)",
                whiteSpace: "nowrap",
              }}
            >
              {svc}
            </span>
          ))}
          {servicePills.length > 4 && (
            <span
              style={{
                fontSize: 10,
                padding: "2px 7px",
                borderRadius: 999,
                background: "var(--surface-raised, rgba(255,255,255,0.05))",
                border: "1px solid var(--border)",
                color: "var(--text-faint)",
              }}
            >
              +{servicePills.length - 4} more
            </span>
          )}
        </div>
      )}

      {/* Footer: NDIS badge */}
      <div className="p-foot">
        <span className={`status-chip ${ndisBadge.cls}`}>{ndisBadge.label}</span>
        {p.phone && p.phone.toLowerCase() !== "via website" && (
          <a
            href={`tel:${p.phone.replace(/\s/g, "")}`}
            className="btn small"
            style={{ textDecoration: "none" }}
          >
            <Icon name="phone" size={12} />
            Call
          </a>
        )}
      </div>
    </div>
  );
}
