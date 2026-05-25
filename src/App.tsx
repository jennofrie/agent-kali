import { Sidebar } from "./components/Sidebar/Sidebar";
import { DocumentViewer } from "./components/DocumentViewer/DocumentViewer";
import { FieldsPanel } from "./components/FieldsPanel/FieldsPanel";
import { AmbiguityModal } from "./components/AmbiguityModal/AmbiguityModal";
import { DashboardHero } from "./components/DashboardHero/DashboardHero";

export default function App() {
  return (
    <>
      <div className="app-shell">
        <nav className="nav-rail" aria-label="Primary">
          <div className="brand-mark">AF</div>
          <div className="nav-stack">
            <span className="nav-item active">Desk</span>
            <span className="nav-item">Ingest</span>
            <span className="nav-item">Fields</span>
            <span className="nav-item">Export</span>
          </div>
          <div className="nav-footer">
            <span>Local</span>
          </div>
        </nav>
        <Sidebar />
        <main className="workspace">
          <header className="topbar">
            <div>
              <span className="eyebrow">Document automation</span>
              <h1>Agent Form Filler</h1>
            </div>
            <div className="topbar-actions">
              <span className="status-pill">Python sidecar</span>
              <span className="status-pill accent">PDF mode</span>
            </div>
          </header>
          <div className="workspace-scroll">
            <DashboardHero />
            <section className="output-grid">
              <DocumentViewer />
              <aside className="fields-dock">
                <FieldsPanel />
              </aside>
            </section>
          </div>
        </main>
      </div>
      <AmbiguityModal />
    </>
  );
}
