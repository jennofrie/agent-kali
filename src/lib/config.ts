import { sidecar } from "./ipc/sidecar";

export type AgentConfig = {
  llm: { fill: string; validate: string; adapters: Record<string, any> };
  rag: { cli: string; defaultWorkspace: string; workspaces: Record<string, string> };
  sources: { iMessage: { enabled: boolean; contactFilter: string[] }; folders: string[]; gmail: { enabled: boolean } };
  output: { defaultFolder: string; formats: string[] };
  validation: { dpi: number; fidelityThreshold: number; autoFixMaxIterations: number };
  fillStrategy: "auto" | "direct" | "replicate";
  signatureImage: string;
  claude_runtime: any;
};

export async function loadConfig(): Promise<AgentConfig> {
  const res = await sidecar.get<AgentConfig>("/config");
  return res.data;
}
