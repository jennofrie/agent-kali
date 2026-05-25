export {};

declare global {
  interface Window {
    api: {
      sidecar: <T>(method: string, path: string, body?: unknown) => Promise<{ ok: boolean; status: number; data: T }>;
      ragQuery: (query: string, workspace?: string) => Promise<string>;
      openFile: () => Promise<string | null>;
      openFolder: () => Promise<string | null>;
      saveFile: (defaultName: string) => Promise<string | null>;
      readFile: (filePath: string) => Promise<number[]>;
    };
  }
}
