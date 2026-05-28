import { useState, useEffect } from "react";
import { Sidebar } from "./components/Layout/Sidebar";
import { TopBar } from "./components/Layout/TopBar";
import { DashboardView } from "./components/Dashboard/DashboardView";
import { FormsView } from "./components/Forms/FormsView";
import { ParticipantsView } from "./components/Participants/ParticipantsView";
import { DraftsView } from "./components/Drafts/DraftsView";
import { RagView } from "./components/Rag/RagView";
import { TemplatesView } from "./components/Templates/TemplatesView";
import { ReportsView } from "./components/Reports/ReportsView";
import { ProvidersView } from "./components/Providers/ProvidersView";
import { LightRagView } from "./components/LightRag/LightRagView";
import { FilesView } from "./components/Files/FilesView";
import { SettingsView } from "./components/Settings/SettingsView";
import { AmbiguityModal } from "./components/Shared/AmbiguityModal";

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [pillIdx, setPillIdx] = useState(0);
  const [showModal, setShowModal] = useState(false);

  // Reset pill index when tab changes
  useEffect(() => {
    setPillIdx(0);
  }, [activeTab]);

  function renderView() {
    switch (activeTab) {
      case "dashboard":
        return <DashboardView setActiveTab={setActiveTab} />;
      case "forms":
        return <FormsView onResolveAmbiguity={() => setShowModal(true)} />;
      case "participants":
        return <ParticipantsView />;
      case "drafts":
        return <DraftsView />;
      case "rag":
        return <RagView />;
      case "templates":
        return <TemplatesView />;
      case "reports":
        return <ReportsView />;
      case "providers":
        return <ProvidersView />;
      case "lightrag":
        return <LightRagView />;
      case "files":
        return <FilesView />;
      case "settings":
        return <SettingsView />;
      default:
        return <DashboardView setActiveTab={setActiveTab} />;
    }
  }

  return (
    <div className={"app " + (collapsed ? "collapsed" : "")}>
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />
      <main className="workspace">
        <TopBar
          activeTab={activeTab}
          pillIdx={pillIdx}
          setPillIdx={setPillIdx}
        />
        <div className="content">
          {renderView()}
        </div>
      </main>
      {showModal && <AmbiguityModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
