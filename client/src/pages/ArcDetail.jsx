import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { validerQuete } from '../store/slices/questsSlice.js';
import { apiGet } from '../lib/api.js';

export default function ArcDetail() {
  const { arc } = useParams();
  const dispatch = useDispatch();
  const [chapitres, setChapitres] = useState([]);
  const [quetes, setQuetes] = useState([]);

  useEffect(() => {
    apiGet(`/chapitres?arc=${arc}`).then(setChapitres).catch(() => setChapitres([]));
    apiGet(`/quetes?type=${arc}`).then(setQuetes).catch(() => setQuetes([]));
  }, [arc]);

  const parChapitre = useMemo(() => {
    const map = {};
    for (const c of chapitres) map[c.id] = { chapitre: c, quetes: [] };
    for (const q of quetes) {
      if (!map[q.chapitre_id]) continue;
      map[q.chapitre_id].quetes.push(q);
    }
    return Object.values(map).sort((a, b) => String(a.chapitre.semaine).localeCompare(String(b.chapitre.semaine)));
  }, [chapitres, quetes]);

  return (
    <div className="blueprint-grid" style={{ padding: 'var(--space-4)', minHeight: '80vh' }}>
      <p className="compteur"><Link to="/chantier" style={{ color: 'var(--text-muted)' }}>← Chantier</Link></p>
      <h1 style={{ textTransform: 'uppercase' }}>{arc}</h1>
      <p className="compteur">{quetes.filter((q) => q.statut === 'fait').length}/{quetes.length} quêtes</p>

      <div style={{ display: 'grid', gap: 'var(--space-3)', marginTop: 'var(--space-4)', maxWidth: 720 }}>
        {parChapitre.map(({ chapitre, quetes: qs }) => (
          <section key={chapitre.id} style={{ background: 'var(--bg-1)', padding: 'var(--space-3)', borderRadius: 4 }}>
            <p className="compteur">{chapitre.semaine} · {chapitre.statut}</p>
            <h2 style={{ fontSize: '1.2rem' }}>{chapitre.titre || 'Sans titre'}</h2>
            <ul style={{ listStyle: 'none', padding: 0, marginTop: 12 }}>
              {qs.map((q) => (
                <li key={q.id} style={{ display: 'flex', gap: 8, marginBottom: 8, opacity: q.statut === 'fait' ? 0.5 : 1 }}>
                  <input
                    type="checkbox"
                    checked={q.statut === 'fait'}
                    disabled={q.statut === 'fait'}
                    onChange={async () => {
                      await dispatch(validerQuete(q.id));
                      setQuetes(await apiGet(`/quetes?type=${arc}`));
                    }}
                  />
                  <span>{q.titre}</span>
                </li>
              ))}
              {!qs.length && <li className="compteur">Aucune quête</li>}
            </ul>
          </section>
        ))}
        {!parChapitre.length && <p className="compteur">Pas encore de chapitre pour cet arc.</p>}
      </div>
    </div>
  );
}
