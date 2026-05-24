import { Sidebar } from "./components/Sidebar/Sidebar";

export default function App() {
  return (
    <div className="flex h-screen w-screen">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <p className="text-neutral-400">Open a form to begin.</p>
      </main>
    </div>
  );
}
