import { execFile } from 'node:child_process';

/** Liste les familles de polices installées, sans binaire embarqué. */
function run(cmd: string, args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(cmd, args, { maxBuffer: 16 * 1024 * 1024, timeout: 20000, windowsHide: true }, (err, stdout) => {
      if (err) reject(err);
      else resolve(stdout);
    });
  });
}

const MAC_JXA =
  'ObjC.import("AppKit"); ' +
  '$.NSFontManager.sharedFontManager.availableFontFamilies.js.map(function (f) { return f.js; }).join("\\n")';

const WIN_PS =
  '[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; ' +
  'Add-Type -AssemblyName System.Drawing; ' +
  '(New-Object System.Drawing.Text.InstalledFontCollection).Families | ForEach-Object { $_.Name }';

let cache: string[] | null = null;

export async function listFonts(): Promise<string[]> {
  if (cache) return cache;
  let raw = '';
  try {
    if (process.platform === 'darwin') {
      raw = await run('osascript', ['-l', 'JavaScript', '-e', MAC_JXA]);
    } else if (process.platform === 'win32') {
      raw = await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', WIN_PS]);
    } else {
      raw = await run('fc-list', ['--format', '%{family[0]}\\n']);
    }
  } catch {
    raw = '';
  }
  const names = new Set<string>();
  for (const line of raw.split(/\r?\n/)) {
    const name = line.trim();
    // Les familles système cachées commencent par un point (macOS)
    if (name && !name.startsWith('.')) names.add(name);
  }
  cache = [...names].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  return cache;
}
