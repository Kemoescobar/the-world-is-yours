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
  const [typeFait, setTypeFait] = useState('commit');
  const [detail, setDetail] = useState('');
  const [statut, setStatut] = useState('idle');
  const [erreur, setErreur] = useState('');

  async function soumettre(e) {
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
            onSubmit={soumettre}
            onClick={(e) => e.stopPropagation()}
            style={{ background: 'var(--bg-2)', padding: 'var(--space-4)', borderRadius: 8, minWidth: 320, maxWidth: 420, width: '90%' }}
          >
            <p id="capture-title" className="compteur">CAPTURE RAPIDE</p>
            <label htmlFor="capture-type" style={{ display: 'block', marginTop: 'var(--space-3)', fontSize: '0.85rem' }}>
              Type
              <select
                id="capture-type"
                value={typeFait}
                onChange={(e) => setTypeFait(e.target.value)}
                style={{
                  display: 'block', width: '100%', marginTop: 6, padding: 10,
                  background: 'var(--bg-1)', color: 'var(--text)', border: '1px solid var(--bg-3)', borderRadius: 4,
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
                  background: 'var(--bg-1)', color: 'var(--text)', border: '1px solid var(--bg-3)', borderRadius: 4,
                }}
              />
            </label>
            {erreur && <p className="annotation-manuscrite" style={{ marginTop: 'var(--space-2)' }}>{erreur}</p>}
            <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-4)' }}>
              <button
                type="submit"
                disabled={statut === 'envoi' || !detail.trim()}
                style={{
                  flex: 1, padding: '10px 14px', border: 'none', borderRadius: 4, cursor: 'pointer',
                  background: 'var(--jaune)', color: '#060a1a', fontFamily: 'var(--font-display)', fontWeight: 700,
                }}
              >
                {statut === 'ok' ? 'Capturé' : statut === 'envoi' ? '…' : 'Capturer'}
              </button>
              <button
                type="button"
                onClick={() => setOuvert(false)}
                style={{
                  padding: '10px 14px', border: '1px solid var(--bg-3)', borderRadius: 4,
                  background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer',
                }}
              >
                Fermer
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
