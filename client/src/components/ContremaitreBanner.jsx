import { useEffect, useState } from 'react';

/**
 * Bandeau Contremaître / message matin — Chantier.
 */
export default function ContremaitreBanner() {
  const [data, setData] = useState(null);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { apiPost, apiGet } = await import('../lib/api.js');
        // Prefer existing active suggestion; optionally refresh matin
        const active = await apiGet('/contremaitre/active');
        let payload = { contremaitre: active, message: null };
        try {
          const matin = await apiPost('/ai/message-matin', {});
          payload = matin;
        } catch {
          // soft — endpoint IA peut être off
          if (active) payload.message = `Suggestion : ${active.ressource_titre}`;
        }
        if (!cancelled) setData(payload);
      } catch (err) {
        if (!cancelled) setErreur(err.message);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function feedback(statut) {
    if (!data?.contremaitre?.id) return;
    try {
      const { apiPost } = await import('../lib/api.js');
      await apiPost(`/contremaitre/${data.contremaitre.id}/feedback`, { statut });
      setData({ ...data, contremaitre: null, message: data.message });
    } catch (err) {
      setErreur(err.message);
    }
  }

  if (!data && !erreur) return null;
  if (!data?.contremaitre && !data?.message) return null;

  return (
    <aside
      className="os-panel chrome-edge"
      style={{ marginBottom: 16, borderColor: 'rgba(255, 210, 63, 0.35)' }}
      aria-label="Contremaître"
    >
      <div className="os-panel__bar">
        <span>CONTREMAÎTRE · MATIN</span>
        <span className="compteur-dot">MAX 1</span>
      </div>
      <div className="os-panel__body">
        {erreur && <p className="annotation-manuscrite">{erreur}</p>}
        {data?.message && (
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, marginBottom: 10, fontSize: '0.9rem' }}>
            {data.message}
          </p>
        )}
        {data?.contremaitre && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
            <span className="compteur" style={{ color: 'var(--jaune)' }}>
              {data.contremaitre.ressource_titre}
            </span>
            {data.contremaitre.ressource_url && (
              <a
                href={data.contremaitre.ressource_url}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost"
                style={{ fontSize: '0.7rem' }}
              >
                Ouvrir
              </a>
            )}
            <button type="button" className="btn-ghost" style={{ fontSize: '0.7rem' }} onClick={() => feedback('utile')}>
              Utile
            </button>
            <button type="button" className="btn-ghost" style={{ fontSize: '0.7rem' }} onClick={() => feedback('pas_utile')}>
              Pas utile
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
