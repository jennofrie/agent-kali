import type { RealParticipant } from "../mockData";

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
      scanParticipants: () => Promise<{
        participants: RealParticipant[];
        root: string;
        error?: string;
      }>;
      listParticipantFiles: (folderPath: string, subfolder?: string) => Promise<{
        files: Array<{ name: string; path: string; size: number; modified: number }>;
        error?: string;
      }>;
      importFileToParticipant: (sourcePath: string, participantFolder: string, subfolder: string) => Promise<{
        success: boolean;
        destPath?: string;
        error?: string;
      }>;
    };
  }
}
