import { useEffect, useState } from 'react';

/**
 * Bandeau Contremaître / message matin + propositions Ravitaillement — Chantier.
 * Ravitaillement : lots ×3 par arc needy (Dev + Beatmaker), jamais d'injection silencieuse.
 * Une carte : tous les arcs en refill + Accepter tout / Refuser.
 */
export default function ContremaitreBanner() {
  const [data, setData] = useState(null);
  const [ravitaillements, setRavitaillements] = useState([]);
  const [signauxTerminee, setSignauxTerminee] = useState([]);
  const [erreur, setErreur] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { apiPost, apiGet } = await import('../lib/api.js');

        const active = await apiGet('/contremaitre/active');
        let payload = { contremaitre: active, message: null };
        try {
          const matin = await apiPost('/ai/message-matin', {});
          payload = matin;
        } catch {
          if (active) payload.message = `Suggestion : ${active.ressource_titre}`;
        }

        let props = [];
        let terminees = [];
        try {
          const status = await apiGet('/ravitaillement/status');
          props = status?.propositions || [];
          terminees = Object.entries(status?.arcs || {})
            .filter(([, a]) => a.roadmap_terminee)
            .map(([arc, a]) => a.message || `roadmap ${arc} terminée`);

          const besoin = Object.entries(status?.arcs || {}).some(
            ([, a]) => a.besoin_ravitaillement && !a.roadmap_terminee,
          );
          // Propose pour TOUS les arcs needy (Dev + Beatmaker) en un seul appel
          if (besoin && !props.length) {
            const proposed = await apiPost('/ravitaillement/proposer', {});
            props = proposed?.propositions || [];
            for (const s of proposed?.signaux || []) {
              if (s.roadmap_terminee && s.message) terminees.push(s.message);
            }
          }
        } catch {
          // soft — table / route peut manquer avant migration
        }

        if (!cancelled) {
          setData(payload);
          setRavitaillements(props);
          setSignauxTerminee([...new Set(terminees)]);
        }
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

  async function repondreLot(action) {
    if (!ravitaillements.length) return;
    setBusy(true);
    setErreur('');
    try {
      const { apiPost } = await import('../lib/api.js');
      await apiPost('/ravitaillement/repondre-lot', { action });
      setRavitaillements([]);
      if (action === 'accepter') {
        window.dispatchEvent(new CustomEvent('twiy:quetes-changed'));
      }
    } catch (err) {
      setErreur(err.message);
    } finally {
      setBusy(false);
    }
  }

  const hasContre = Boolean(data?.contremaitre || data?.message);
  const hasRav = ravitaillements.length > 0 || signauxTerminee.length > 0;
  if (!data && !erreur && !hasRav) return null;
  if (!hasContre && !hasRav && !erreur) return null;

  const totalDrafts = ravitaillements.reduce(
    (n, p) => n + (Array.isArray(p.drafts) ? p.drafts.length : 0),
    0,
  );

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
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: hasRav ? 14 : 0 }}>
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

        {signauxTerminee.map((msg) => (
          <p key={msg} className="compteur" style={{ color: 'var(--jaune)', marginBottom: 8 }}>
            {msg}
          </p>
        ))}

        {ravitaillements.length > 0 && (
          <div
            style={{
              borderTop: hasContre || signauxTerminee.length ? '1px solid rgba(255,210,63,0.2)' : undefined,
              paddingTop: hasContre || signauxTerminee.length ? 12 : 0,
            }}
          >
            <p className="compteur" style={{ marginBottom: 10 }}>
              RAVITAILLEMENT · {ravitaillements.length} arc
              {ravitaillements.length > 1 ? 's' : ''} · {totalDrafts} quête
              {totalDrafts > 1 ? 's' : ''} (lots ×3)
            </p>

            {ravitaillements.map((prop) => (
              <div key={prop.id} style={{ marginBottom: 12 }}>
                <p className="compteur" style={{ marginBottom: 6, color: 'var(--jaune)' }}>
                  {String(prop.arc_id).toUpperCase()}
                  {prop.note ? ` · ${prop.note}` : ` · lot ×${(prop.drafts || []).length}`}
                </p>
                <ul className="os-list" style={{ marginBottom: 4 }}>
                  {(prop.drafts || []).map((d, i) => (
                    <li key={`${prop.id}-${i}`}>
                      <span style={{ color: 'var(--jaune)' }}>›</span>
                      <span>{d.titre}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              <button
                type="button"
                className="btn-ghost"
                style={{ fontSize: '0.7rem' }}
                disabled={busy}
                onClick={() => repondreLot('accepter')}
              >
                Accepter tout
              </button>
              <button
                type="button"
                className="btn-ghost"
                style={{ fontSize: '0.7rem' }}
                disabled={busy}
                onClick={() => repondreLot('refuser')}
              >
                Refuser
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
