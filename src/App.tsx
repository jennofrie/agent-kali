import { useEffect, useState } from "react";
import { sidecar } from "./lib/ipc/sidecar";

export default function App() {
  const [status, setStatus] = useState("...");
  useEffect(() => {
    sidecar.get<{ status: string }>("/health").then(r => setStatus(r.data.status));
  }, []);
  return <div className="p-8 text-2xl">sidecar: {status}</div>;
}
