import { useEffect, useState } from 'react';

/**
 * Bandeau Contremaître / message matin + propositions Ravitaillement — Chantier.
 * Ravitaillement : jamais d'injection silencieuse — accepter / refuser uniquement.
 */
export default function ContremaitreBanner() {
  const [data, setData] = useState(null);
  const [ravitaillements, setRavitaillements] = useState([]);
  const [signauxTerminee, setSignauxTerminee] = useState([]);
  const [erreur, setErreur] = useState('');
  const [busyId, setBusyId] = useState(null);

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

  async function repondreRavitaillement(id, action) {
    setBusyId(id);
    setErreur('');
    try {
      const { apiPost } = await import('../lib/api.js');
      await apiPost(`/ravitaillement/${id}/repondre`, { action });
      setRavitaillements((prev) => prev.filter((p) => p.id !== id));
      if (action === 'accepter') {
        // Soft reload quêtes via event — Chantier écoute
        window.dispatchEvent(new CustomEvent('twiy:quetes-changed'));
      }
    } catch (err) {
      setErreur(err.message);
    } finally {
      setBusyId(null);
    }
  }

  const hasContre = Boolean(data?.contremaitre || data?.message);
  const hasRav = ravitaillements.length > 0 || signauxTerminee.length > 0;
  if (!data && !erreur && !hasRav) return null;
  if (!hasContre && !hasRav && !erreur) return null;

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

        {ravitaillements.map((prop) => (
          <div
            key={prop.id}
            style={{
              borderTop: hasContre || signauxTerminee.length ? '1px solid rgba(255,210,63,0.2)' : undefined,
              paddingTop: hasContre || signauxTerminee.length ? 12 : 0,
              marginBottom: 12,
            }}
          >
            <p className="compteur" style={{ marginBottom: 6 }}>
              RAVITAILLEMENT · {String(prop.arc_id).toUpperCase()}
              {prop.note ? ` · ${prop.note}` : ''}
            </p>
            <ul className="os-list" style={{ marginBottom: 10 }}>
              {(prop.drafts || []).map((d, i) => (
                <li key={`${prop.id}-${i}`}>
                  <span style={{ color: 'var(--jaune)' }}>›</span>
                  <span>{d.titre}</span>
                </li>
              ))}
            </ul>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button
                type="button"
                className="btn-ghost"
                style={{ fontSize: '0.7rem' }}
                disabled={busyId === prop.id}
                onClick={() => repondreRavitaillement(prop.id, 'accepter')}
              >
                Accepter
              </button>
              <button
                type="button"
                className="btn-ghost"
                style={{ fontSize: '0.7rem' }}
                disabled={busyId === prop.id}
                onClick={() => repondreRavitaillement(prop.id, 'refuser')}
              >
                Refuser
              </button>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
