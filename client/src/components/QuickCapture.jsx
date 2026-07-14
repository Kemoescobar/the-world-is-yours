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
        onClick={() => setOuvert(true)}
        aria-label="Capture rapide"
        style={{
          position: 'fixed', bottom: 24, right: 24, width: 56, height: 56, borderRadius: '50%',
          background: 'var(--rouge)', color: '#fff', fontSize: '1.5rem', border: 'none', cursor: 'pointer', zIndex: 1000,
        }}
      >
        +
      </button>
      {ouvert && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="capture-title"
          style={{ position: 'fixed', inset: 0, background: 'rgba(6,10,26,0.9)', display: 'grid', placeItems: 'center', zIndex: 1001 }}
          onClick={() => setOuvert(false)}
          onKeyDown={(e) => e.key === 'Escape' && setOuvert(false)}
        >
          <form
            onSubmit={mode === 'fait' ? soumettreFait : soumettreCheckin}
            onClick={(e) => e.stopPropagation()}
            className="poster-panel"
            style={{ background: 'var(--bg-2)', padding: 'var(--space-4)', minWidth: 320, maxWidth: 440, width: '90%' }}
          >
            <p id="capture-title" className="compteur">CAPTURE · PHASE 3</p>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button type="button" className={mode === 'fait' ? 'btn-poster' : 'btn-ghost'} style={{ padding: '6px 10px' }} onClick={() => setMode('fait')}>
                Fait
              </button>
              <button type="button" className={mode === 'checkin' ? 'btn-poster' : 'btn-ghost'} style={{ padding: '6px 10px' }} onClick={() => setMode('checkin')}>
                Check-in IA
              </button>
            </div>

            {mode === 'fait' ? (
              <>
                <label htmlFor="capture-type" style={{ display: 'block', marginTop: 'var(--space-3)', fontSize: '0.85rem' }}>
                  Type
                  <select
                    id="capture-type"
                    value={typeFait}
                    onChange={(e) => setTypeFait(e.target.value)}
                    style={{
                      display: 'block', width: '100%', marginTop: 6, padding: 10,
                      background: 'var(--bg-1)', color: 'var(--text)', border: '1px solid var(--bg-3)',
                    }}
                  >
                    {TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </label>
                <label htmlFor="capture-detail" style={{ display: 'block', marginTop: 'var(--space-3)', fontSize: '0.85rem' }}>
                  Détail
                  <input
                    id="capture-detail"
                    autoFocus
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    placeholder="Ex. push auth + capture"
                    style={{
                      display: 'block', width: '100%', marginTop: 6, padding: 10,
                      background: 'var(--bg-1)', color: 'var(--text)', border: '1px solid var(--bg-3)',
                    }}
                  />
                </label>
              </>
            ) : (
              <label htmlFor="checkin-text" style={{ display: 'block', marginTop: 'var(--space-3)', fontSize: '0.85rem' }}>
                Qu’as-tu fait aujourd’hui ?
                <textarea
                  id="checkin-text"
                  autoFocus
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  rows={4}
                  placeholder="Ex. 2 commits auth, session drum 40min, relancé un prospect…"
                  style={{
                    display: 'block', width: '100%', marginTop: 6, padding: 10, resize: 'vertical',
                    background: 'var(--bg-1)', color: 'var(--text)', border: '1px solid var(--bg-3)',
                    fontFamily: 'var(--font-body)',
                  }}
                />
              </label>
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
          </form>
        </div>
      )}
    </>
  );
}
