import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEMORY_PATH = path.resolve(__dirname, '../../data/coaching-memory.md');

export function lireMemoire() {
  try {
    return fs.readFileSync(MEMORY_PATH, 'utf8');
  } catch {
    return '# Mémoire coaching TWIY\n(vide)\n';
  }
}

export function ecrireMemoire(texte) {
  fs.mkdirSync(path.dirname(MEMORY_PATH), { recursive: true });
  fs.writeFileSync(MEMORY_PATH, texte, 'utf8');
}

export function appendLecon(lecon) {
  const actuel = lireMemoire().trimEnd();
  const ligne = `\n- ${new Date().toISOString().slice(0, 10)} — ${lecon.trim()}\n`;
  ecrireMemoire(`${actuel}${ligne}`);
}
