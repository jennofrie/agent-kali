import { Sidebar } from "./components/Sidebar/Sidebar";
import { DocumentViewer } from "./components/DocumentViewer/DocumentViewer";

export default function App() {
  return (
    <div className="flex h-screen w-screen">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden">
        <DocumentViewer />
      </main>
    </div>
  );
}
