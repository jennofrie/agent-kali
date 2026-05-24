import { sidecar } from "./ipc/sidecar";

export type LLMAdapterConfig = {
  model?: string;
  apiKeyEnv?: string;
  endpoint?: string;
};

export type RuntimeBinaryConfig = {
  path: string;
  args: string[];
};

export type ClaudeRuntimeConfig = {
  auth: "oauth" | "api";
  oauth_token_path: string;
  default_runtime: string;
  auto_detect: boolean;
  runtimes: Record<string, RuntimeBinaryConfig>;
};

export type AgentConfig = {
  llm: { fill: string; validate: string; adapters: Record<string, LLMAdapterConfig> };
  rag: { cli: string; defaultWorkspace: string; workspaces: Record<string, string> };
  sources: { iMessage: { enabled: boolean; contactFilter: string[] }; folders: string[]; gmail: { enabled: boolean } };
  output: { defaultFolder: string; formats: string[] };
  validation: { dpi: number; fidelityThreshold: number; autoFixMaxIterations: number };
  fillStrategy: "auto" | "direct" | "replicate";
  signatureImage: string;
  claude_runtime: ClaudeRuntimeConfig;
};

export async function loadConfig(): Promise<AgentConfig> {
  const res = await sidecar.get<AgentConfig>("/config");
  return res.data;
}
