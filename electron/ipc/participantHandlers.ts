import { ipcMain } from 'electron';
import fs from 'node:fs';
import path from 'node:path';

const SC_ROOT = path.join(process.env.HOME || '', 'Desktop', 'Support-Coordination');
const SKIP_DIRS = ['_Audit-Prep-2026', 'Archived', 'AGENTS.md', 'CLAUDE.md', 'MEMORY.md'];

export interface ScannedParticipant {
  id: string;
  name: string;
  initials: string;
  folderPath: string;
  folderName: string;
  subfolders: string[];
  fileCount: number;
  hasIntakeForm: boolean;
  hasServiceAgreement: boolean;
  hasCaseNotes: boolean;
  recentFiles: { name: string; path: string; modified: number }[];
}

function getInitials(name: string): string {
  return name.split(/[\s-]+/).map(w => w[0]?.toUpperCase() || '').join('').slice(0, 2);
}

function scanParticipantFolder(folderPath: string, folderName: string): ScannedParticipant {
  const subfolders: string[] = [];
  let fileCount = 0;
  let hasIntakeForm = false;
  let hasServiceAgreement = false;
  let hasCaseNotes = false;
  const recentFiles: { name: string; path: string; modified: number }[] = [];

  // Read top-level contents
  const entries = fs.readdirSync(folderPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      subfolders.push(entry.name);
      if (entry.name === 'Case-Notes') hasCaseNotes = true;
      // Scan subdirectory for files
      try {
        const subPath = path.join(folderPath, entry.name);
        const subEntries = fs.readdirSync(subPath, { withFileTypes: true });
        for (const sub of subEntries) {
          if (sub.isFile() && !sub.name.startsWith('.')) {
            fileCount++;
            const filePath = path.join(subPath, sub.name);
            const stat = fs.statSync(filePath);
            recentFiles.push({ name: sub.name, path: filePath, modified: stat.mtimeMs });
            if (sub.name.toLowerCase().includes('intake')) hasIntakeForm = true;
            if (sub.name.toLowerCase().includes('service-agreement') || sub.name.toLowerCase().includes('cdss-sc')) hasServiceAgreement = true;
          }
        }
      } catch {}
    } else if (entry.isFile() && !entry.name.startsWith('.')) {
      fileCount++;
      const filePath = path.join(folderPath, entry.name);
      const stat = fs.statSync(filePath);
      recentFiles.push({ name: entry.name, path: filePath, modified: stat.mtimeMs });
    }
  }

  // Sort by most recent, keep top 5
  recentFiles.sort((a, b) => b.modified - a.modified);
  const top5 = recentFiles.slice(0, 5);

  const name = folderName.replace(/-/g, ' ');

  return {
    id: folderName.toLowerCase().replace(/\s+/g, '-'),
    name,
    initials: getInitials(name),
    folderPath,
    folderName,
    subfolders,
    fileCount,
    hasIntakeForm,
    hasServiceAgreement,
    hasCaseNotes,
    recentFiles: top5,
  };
}

export function registerParticipantIPC() {
  // Scan all participant folders
  ipcMain.handle('participants:scan', async () => {
    try {
      const entries = fs.readdirSync(SC_ROOT, { withFileTypes: true });
      const participants: ScannedParticipant[] = [];
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        if (SKIP_DIRS.includes(entry.name)) continue;
        if (entry.name.startsWith('.')) continue;
        const folderPath = path.join(SC_ROOT, entry.name);
        participants.push(scanParticipantFolder(folderPath, entry.name));
      }
      return { participants, root: SC_ROOT };
    } catch (e) {
      return { participants: [], root: SC_ROOT, error: String(e) };
    }
  });

  // List files in a participant's subfolder
  ipcMain.handle('participants:listFiles', async (_event, folderPath: string, subfolder?: string) => {
    try {
      const target = subfolder ? path.join(folderPath, subfolder) : folderPath;
      const entries = fs.readdirSync(target, { withFileTypes: true });
      const files = entries
        .filter(e => e.isFile() && !e.name.startsWith('.'))
        .map(e => {
          const fp = path.join(target, e.name);
          const stat = fs.statSync(fp);
          return { name: e.name, path: fp, size: stat.size, modified: stat.mtimeMs };
        })
        .sort((a, b) => b.modified - a.modified);
      return { files };
    } catch (e) {
      return { files: [], error: String(e) };
    }
  });

  // Copy a file into a participant's folder
  ipcMain.handle('participants:importFile', async (_event, sourcePath: string, participantFolder: string, subfolder: string) => {
    try {
      const destDir = path.join(participantFolder, subfolder);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      const fileName = path.basename(sourcePath);
      const destPath = path.join(destDir, fileName);
      fs.copyFileSync(sourcePath, destPath);
      return { success: true, destPath };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  });
}
