import { useEffect, useState } from 'react';

/**
 * Bandeau Contremaître / message matin + note Ravitaillement auto — Chantier.
 * Ravitaillement : refill automatique à 3 actifs (Dev + Beatmaker), sans Accepter/Refuser.
 */
export default function ContremaitreBanner() {
  const [data, setData] = useState(null);
  const [noteRav, setNoteRav] = useState('');
  const [signauxTerminee, setSignauxTerminee] = useState([]);
  const [erreur, setErreur] = useState('');

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

        let note = '';
        let terminees = [];
        try {
          const auto = await apiPost('/ravitaillement/auto', {});
          const n = auto?.total_ajoutees || 0;
          for (const s of auto?.signaux || []) {
            if (s.roadmap_terminee && s.message) terminees.push(s.message);
          }
          for (const m of auto?.roadmap_terminees || []) {
            if (m) terminees.push(m);
          }
          terminees = [...new Set(terminees)];

          if (n > 0) {
            note = auto.message || `Ravitaillement auto · ${n} quête${n > 1 ? 's' : ''} ajoutée${n > 1 ? 's' : ''}`;
            window.dispatchEvent(new CustomEvent('twiy:quetes-changed'));
          } else if (terminees.length) {
            note = '';
          } else if (auto?.message) {
            note = auto.message;
          }
        } catch {
          // soft — table / route peut manquer avant migration
        }

        if (!cancelled) {
          setData(payload);
          setNoteRav(note);
          setSignauxTerminee(terminees);
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

  const hasContre = Boolean(data?.contremaitre || data?.message);
  const hasRav = Boolean(noteRav) || signauxTerminee.length > 0;
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

        {noteRav && (
          <p
            className="compteur"
            style={{
              borderTop: hasContre || signauxTerminee.length ? '1px solid rgba(255,210,63,0.2)' : undefined,
              paddingTop: hasContre || signauxTerminee.length ? 12 : 0,
              marginBottom: 0,
              color: noteRav.includes('ajoutée') ? 'var(--jaune)' : undefined,
            }}
            role="status"
          >
            {noteRav}
          </p>
        )}
      </div>
    </aside>
  );
}
