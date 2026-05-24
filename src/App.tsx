import { Sidebar } from "./components/Sidebar/Sidebar";
import { DocumentViewer } from "./components/DocumentViewer/DocumentViewer";
import { FieldsPanel } from "./components/FieldsPanel/FieldsPanel";
import { AmbiguityModal } from "./components/AmbiguityModal/AmbiguityModal";

export default function App() {
  return (
    <>
      <div className="flex h-screen w-screen">
        <Sidebar />
        <main className="flex-1 flex overflow-hidden">
          <DocumentViewer />
          <div className="w-80 border-l border-neutral-800 bg-neutral-950 overflow-auto">
            <FieldsPanel />
          </div>
        </main>
      </div>
      <AmbiguityModal />
    </>
  );
}
