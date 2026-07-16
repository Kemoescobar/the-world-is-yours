import { useEffect, useRef, useState } from 'react';
import { apiPost } from '../lib/api.js';

const TYPES = [
  { value: 'commit', label: 'Commit', arc: 'dev' },
  { value: 'session_prod', label: 'Session prod', arc: 'beatmaker' },
  { value: 'sport', label: 'Sport', arc: null },
  { value: 'proposal', label: 'Proposal', arc: null },
  { value: 'instru', label: 'Instru', arc: 'beatmaker' },
  { value: 'projet', label: 'Projet', arc: 'dev' },
  { value: 'certif', label: 'Certif', arc: 'dev' },
  { value: 'quete', label: 'Quête / autre', arc: null },
];

function signalerCirculation(detail = {}) {
  window.dispatchEvent(new CustomEvent('twiy:entrees-changed', { detail }));
  window.dispatchEvent(new CustomEvent('twiy:quetes-changed', { detail }));
  window.dispatchEvent(new CustomEvent('twiy:chronique-refresh', { detail }));
}

export default function QuickCapture() {
  const [ouvert, setOuvert] = useState(false);
  const [mode, setMode] = useState('fait'); // fait | checkin
  const [typeFait, setTypeFait] = useState('commit');
  const [detail, setDetail] = useState('');
  const [statut, setStatut] = useState('idle');
  const [erreur, setErreur] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [brouillons, setBrouillons] = useState([]);
  const inputRef = useRef(null);

  function ouvrir(opts = {}) {
    setOuvert(true);
    setErreur('');
    setConfirmation('');
    setBrouillons([]);
    setStatut('idle');
    if (opts.mode === 'checkin' || opts.mode === 'fait') setMode(opts.mode);
    if (opts.prefill) setDetail(opts.prefill);
  }

  function fermer() {
    setOuvert(false);
    setStatut('idle');
    setErreur('');
    setConfirmation('');
    setBrouillons([]);
  }

  useEffect(() => {
    function onOpen(e) {
      ouvrir(e.detail || {});
    }
    window.addEventListener('twiy:open-capture', onOpen);
    return () => window.removeEventListener('twiy:open-capture', onOpen);
  }, []);

  useEffect(() => {
    if (!ouvert) return undefined;
    const t = setTimeout(() => inputRef.current?.focus?.(), 40);
    function onKey(e) {
      if (e.key === 'Escape') fermer();
    }
    window.addEventListener('keydown', onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener('keydown', onKey);
    };
  }, [ouvert]);

  async function soumettreFait(e) {
    e.preventDefault();
    if (!detail.trim() || statut === 'envoi') return;
    setStatut('envoi');
    setErreur('');
    setConfirmation('');
    const meta = TYPES.find((t) => t.value === typeFait);
    try {
      const entree = await apiPost('/entrees', {
        type_fait: typeFait,
        detail: detail.trim(),
        arc_id: meta?.arc || null,
      });
      setDetail('');
      setConfirmation(`Capturé · ${typeFait}${entree?.id ? '' : ''}`);
      setStatut('ok');
      signalerCirculation({ kind: 'fait', entree });
      setTimeout(fermer, 900);
    } catch (err) {
      setErreur(err.message || 'échec capture');
      setStatut('idle');
    }
  }

  async function soumettreCheckin(e) {
    e.preventDefault();
    if (!detail.trim() || statut === 'envoi') return;
    setStatut('envoi');
    setErreur('');
    setConfirmation('');
    setBrouillons([]);
    try {
      const data = await apiPost('/ai/checkin', { texte: detail.trim(), creer: true });
      const n = data.creees?.length || 0;
      const src = data.source === 'ia' ? 'IA' : 'heuristique';
      setBrouillons(data.apprentissages_brouillon || []);
      setDetail('');
      setConfirmation(
        n > 0
          ? `${n} fait${n > 1 ? 's' : ''} entré${n > 1 ? 's' : ''} (${src})`
          : `Check-in lu (${src}) — aucun fait créé`,
      );
      setStatut('ok');
      signalerCirculation({ kind: 'checkin', ...data });
      setTimeout(fermer, n > 0 ? 1400 : 2200);
    } catch (err) {
      setErreur(err.message || 'échec check-in');
      setStatut('idle');
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => ouvrir({ mode: 'fait' })}
        aria-label="Capture rapide"
        title="Capture rapide (+)"
        className="capture-fab"
      >
        +
      </button>
      {ouvert && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="capture-title"
          className="capture-modal"
          onClick={fermer}
        >
          <form
            onSubmit={mode === 'fait' ? soumettreFait : soumettreCheckin}
            onClick={(e) => e.stopPropagation()}
            className="poster-panel chrome-edge chrome-edge-live os-panel capture-sheet"
          >
            <div className="os-panel__bar">
              <span id="capture-title">CAPTURE</span>
              <span className="compteur-dot">SANG · OS</span>
            </div>
            <div className="os-panel__body">
              <div className="mode-toggle" role="group" aria-label="Mode capture">
                <button
                  type="button"
                  aria-pressed={mode === 'fait'}
                  onClick={() => { setMode('fait'); setErreur(''); }}
                >
                  Fait
                </button>
                <button
                  type="button"
                  aria-pressed={mode === 'checkin'}
                  onClick={() => { setMode('checkin'); setErreur(''); }}
                >
                  Soir — t’as fait quoi ?
                </button>
              </div>

              {mode === 'fait' ? (
                <>
                  <label className="os-label" htmlFor="capture-type" style={{ marginTop: 'var(--space-3)' }}>
                    Type
                  </label>
                  <select
                    id="capture-type"
                    className="os-input"
                    value={typeFait}
                    onChange={(e) => setTypeFait(e.target.value)}
                  >
                    {TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                  <label className="os-label" htmlFor="capture-detail" style={{ marginTop: 'var(--space-3)' }}>
                    Détail
                  </label>
                  <input
                    ref={inputRef}
                    id="capture-detail"
                    className="os-input"
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    placeholder="Ex. push auth + capture"
                    autoComplete="off"
                  />
                </>
              ) : (
                <>
                  <label className="os-label" htmlFor="checkin-text" style={{ marginTop: 'var(--space-3)' }}>
                    T’as fait quoi aujourd’hui ?
                  </label>
                  <textarea
                    ref={inputRef}
                    id="checkin-text"
                    className="os-input"
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    rows={4}
                    placeholder="Ex. 2 commits auth, session drum 40min, relancé un prospect…"
                  />
                  <p className="compteur" style={{ marginTop: 8, opacity: 0.75 }}>
                    Heuristique toujours — Claude enrichit si clé présente
                  </p>
                </>
              )}

              {erreur && (
                <p className="annotation-manuscrite" style={{ marginTop: 'var(--space-2)' }} role="alert">
                  {erreur}
                </p>
              )}
              {confirmation && (
                <p className="compteur" style={{ marginTop: 10, color: 'var(--jaune)' }} role="status">
                  › {confirmation}
                </p>
              )}
              {brouillons.length > 0 && (
                <ul className="os-list os-list--dense" style={{ marginTop: 10 }}>
                  {brouillons.map((b, i) => (
                    <li key={`${b.titre}-${i}`}>
                      <span style={{ color: 'var(--jaune)' }}>›</span>
                      <span>Brouillon · {b.type} — {b.titre}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
                <button
                  type="submit"
                  disabled={statut === 'envoi' || !detail.trim()}
                  className="btn-poster"
                  style={{ flex: 1 }}
                >
                  {statut === 'ok' ? 'OK' : statut === 'envoi' ? '…' : (mode === 'checkin' ? 'Entrer dans le système' : 'Capturer')}
                </button>
                <button type="button" onClick={fermer} className="btn-ghost">
                  Fermer
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
