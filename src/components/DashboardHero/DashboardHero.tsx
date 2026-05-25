import { useStore } from "../../store";

function isFilled(v: string | boolean | undefined): boolean {
  return v !== undefined && v !== "" && v !== false;
}

export function DashboardHero() {
  const { fields, fieldValues, editability, path, uploadedPath, filledPath } = useStore();

  const total = fields.length;
  const filled = fields.filter((f) => isFilled(fieldValues[f.id])).length;
  const pct = total ? Math.round((filled / total) * 100) : 0;

  const stage = filledPath
    ? "Filled"
    : total
      ? "Schema ready"
      : uploadedPath
        ? "Analyzing"
        : "Idle";
  const pathLabel =
    path === "direct" ? "Filling original" : path === "replicate" ? "Filling replica" : "No document";

  return (
    <section className="hero-grid">
      <div className="hero-card gauge-card">
        <span className="eyebrow">Completion</span>
        <div className="gauge" style={{ ["--pct" as never]: pct } as React.CSSProperties}>
          <div className="gauge-center">
            <strong>
              {pct}
              <span>%</span>
            </strong>
            <small>filled</small>
          </div>
        </div>
        <div className="gauge-foot">
          {filled} of {total || "—"} fields
        </div>
      </div>

      <div className="hero-card stat-card">
        <span className="eyebrow">Document</span>
        <strong className="stat-big">{editability ?? "No file"}</strong>
        <span className="stat-sub">{pathLabel}</span>
      </div>

      <div className="hero-card stat-card">
        <span className="eyebrow">Fields detected</span>
        <strong className="stat-big">{total}</strong>
        <span className="stat-sub">{filled} populated</span>
      </div>

      <div className="hero-card stat-card">
        <span className="eyebrow">Pipeline</span>
        <strong className="stat-big">{stage}</strong>
        <span className="stat-sub">{uploadedPath ? "document loaded" : "awaiting upload"}</span>
      </div>
    </section>
  );
}
