import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const COMMANDS = [
  { id: 'chantier', label: 'Chantier', path: '/chantier', hint: 'OS' },
  { id: 'capture', label: 'Capture', action: 'capture', hint: 'FAB' },
  { id: 'revue', label: 'Revue', path: '/revue', hint: 'Hebdo' },
  { id: 'studio-instrus', label: 'Studio · Instrus', path: '/studio/instrus', hint: 'Edit' },
  { id: 'studio-projets', label: 'Studio · Projets', path: '/studio/projets', hint: 'Edit' },
  { id: 'ere', label: 'Ère', path: '/ere', hint: 'Objectifs' },
  { id: 'rayonnement', label: 'Rayonnement', path: '/rayonnement', hint: 'Proof' },
  { id: 'arc-dev', label: 'Arc Dev', path: '/chantier/dev', hint: 'CODE' },
  { id: 'arc-beat', label: 'Arc Beatmaker', path: '/chantier/beatmaker', hint: 'SOUND' },
  { id: 'parametres', label: 'Paramètres', path: '/parametres', hint: 'Probes' },
];

/**
 * Cmd/Ctrl+K command palette — quick jump across private OS.
 */
export default function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return COMMANDS;
    return COMMANDS.filter(
      (c) => c.label.toLowerCase().includes(needle) || c.hint.toLowerCase().includes(needle),
    );
  }, [q]);

  useEffect(() => {
    setIdx(0);
  }, [q, open]);

  const close = useCallback(() => {
    setOpen(false);
    setQ('');
    setIdx(0);
  }, []);

  const run = useCallback(
    (cmd) => {
      if (!cmd) return;
      close();
      if (cmd.action === 'capture') {
        window.dispatchEvent(new CustomEvent('twiy:open-capture', { detail: { mode: 'default' } }));
        return;
      }
      if (cmd.path) navigate(cmd.path);
    },
    [close, navigate],
  );

  useEffect(() => {
    function onKey(e) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
        return;
      }
      if (!open) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setIdx((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        run(filtered[idx]);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, filtered, idx, close, run]);

  useEffect(() => {
    if (open) {
      const t = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(t);
    }
    return undefined;
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="cmdk"
      role="dialog"
      aria-modal="true"
      aria-label="Palette de commandes"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="cmdk__sheet chrome-edge os-panel">
        <div className="cmdk__bar">
          <span className="compteur">⌘K · JUMP</span>
          <span className="compteur-dot">ESC</span>
        </div>
        <input
          ref={inputRef}
          className="os-input cmdk__input"
          type="search"
          placeholder="Chantier, Capture, Revue, Studio…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-autocomplete="list"
          aria-controls="cmdk-list"
        />
        <ul id="cmdk-list" className="cmdk__list" role="listbox">
          {filtered.map((c, i) => (
            <li key={c.id} role="option" aria-selected={i === idx}>
              <button
                type="button"
                className={`cmdk__item${i === idx ? ' is-active' : ''}`}
                onClick={() => run(c)}
                onMouseEnter={() => setIdx(i)}
              >
                <span>{c.label}</span>
                <span className="compteur">{c.hint}</span>
              </button>
            </li>
          ))}
          {!filtered.length && (
            <li className="cmdk__empty compteur">Aucun résultat</li>
          )}
        </ul>
      </div>
    </div>
  );
}
