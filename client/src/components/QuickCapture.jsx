import { useState } from 'react';
import { apiPost } from '../lib/api.js';

const TYPES = [
  { value: 'commit', label: 'Commit', arc: 'dev' },
  { value: 'session_prod', label: 'Session prod', arc: 'beatmaker' },
  { value: 'sport', label: 'Sport', arc: null },
  { value: 'proposal', label: 'Proposal', arc: null },
  { value: 'instru', label: 'Instru', arc: 'beatmaker' },
  { value: 'projet', label: 'Projet', arc: 'dev' },
  { value: 'certif', label: 'Certif', arc: 'dev' },
];

export default function QuickCapture() {
  const [ouvert, setOuvert] = useState(false);
  const [mode, setMode] = useState('fait'); // fait | checkin
  const [typeFait, setTypeFait] = useState('commit');
  const [detail, setDetail] = useState('');
  const [statut, setStatut] = useState('idle');
  const [erreur, setErreur] = useState('');
  const [suggestion, setSuggestion] = useState(null);

  async function soumettreFait(e) {
    e.preventDefault();
    if (!detail.trim()) return;
    setStatut('envoi');
    setErreur('');
    const meta = TYPES.find((t) => t.value === typeFait);
    try {
      await apiPost('/entrees', {
        type_fait: typeFait,
        detail: detail.trim(),
        arc_id: meta?.arc || null,
      });
      setDetail('');
      setStatut('ok');
      setTimeout(() => {
        setOuvert(false);
        setStatut('idle');
      }, 600);
    } catch (err) {
      setErreur(err.message);
      setStatut('idle');
    }
  }

  async function soumettreCheckin(e) {
    e.preventDefault();
    if (!detail.trim()) return;
    setStatut('envoi');
    setErreur('');
    setSuggestion(null);
    try {
      const data = await apiPost('/ai/checkin', { texte: detail.trim(), creer: true });
      setSuggestion(data);
      setDetail('');
      setStatut('ok');
    } catch (err) {
      setErreur(err.message);
      setStatut('idle');
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOuvert(true)}
        aria-label="Capture rapide"
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
          onClick={() => setOuvert(false)}
          onKeyDown={(e) => e.key === 'Escape' && setOuvert(false)}
        >
          <form
            onSubmit={mode === 'fait' ? soumettreFait : soumettreCheckin}
            onClick={(e) => e.stopPropagation()}
            className="poster-panel chrome-edge chrome-edge-live os-panel capture-sheet"
          >
            <div className="os-panel__bar">
              <span id="capture-title">CAPTURE · PHASE 3</span>
              <span className="compteur-dot">HUD</span>
            </div>
            <div className="os-panel__body">
              <div className="mode-toggle" role="group" aria-label="Mode capture">
                <button
                  type="button"
                  aria-pressed={mode === 'fait'}
                  onClick={() => setMode('fait')}
                >
                  Fait
                </button>
                <button
                  type="button"
                  aria-pressed={mode === 'checkin'}
                  onClick={() => setMode('checkin')}
                >
                  Check-in IA
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
                    id="capture-detail"
                    className="os-input"
                    autoFocus
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    placeholder="Ex. push auth + capture"
                  />
                </>
              ) : (
                <>
                  <label className="os-label" htmlFor="checkin-text" style={{ marginTop: 'var(--space-3)' }}>
                    Qu’as-tu fait aujourd’hui ?
                  </label>
                  <textarea
                    id="checkin-text"
                    className="os-input"
                    autoFocus
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    rows={4}
                    placeholder="Ex. 2 commits auth, session drum 40min, relancé un prospect…"
                  />
                </>
              )}

              {erreur && <p className="annotation-manuscrite" style={{ marginTop: 'var(--space-2)' }}>{erreur}</p>}
              {suggestion?.creees?.length > 0 && (
                <p className="compteur" style={{ marginTop: 10 }}>
                  {suggestion.creees.length} entrée(s) créée(s) par l’IA
                </p>
              )}

              <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
                <button type="submit" disabled={statut === 'envoi' || !detail.trim()} className="btn-poster" style={{ flex: 1 }}>
                  {statut === 'ok' ? 'OK' : statut === 'envoi' ? '…' : (mode === 'checkin' ? 'Parser + créer' : 'Capturer')}
                </button>
                <button type="button" onClick={() => setOuvert(false)} className="btn-ghost">
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
