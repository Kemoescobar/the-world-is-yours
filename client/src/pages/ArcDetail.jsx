import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { validerQuete } from '../store/slices/questsSlice.js';
import OsHeader from '../components/OsHeader.jsx';
import { apiGet } from '../lib/api.js';
import { playTick } from '../lib/sounds.js';

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

  const faites = quetes.filter((q) => q.statut === 'fait').length;

  return (
    <div className="os-page">
      <p className="compteur" style={{ marginBottom: 8 }}>
        <Link to="/chantier" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
          ← Chantier
        </Link>
      </p>
      <OsHeader
        kicker={`OS · ARC · ${String(arc || '').toUpperCase()}`}
        title={String(arc || 'ARC').toUpperCase()}
        meta={`${faites}/${quetes.length} quêtes closes`}
      />

      <div className="os-stack" style={{ maxWidth: 720 }}>
        {parChapitre.map(({ chapitre, quetes: qs }) => (
          <section key={chapitre.id} className="os-panel chrome-edge blueprint-grid">
            <div className="os-panel__bar">
              <span>{chapitre.semaine} · {chapitre.statut}</span>
              <span className="compteur-dot">{qs.filter((q) => q.statut === 'fait').length}/{qs.length}</span>
            </div>
            <div className="os-panel__body">
              <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                {chapitre.titre || 'Sans titre'}
              </h2>
              <ul className="os-list" style={{ marginTop: 8, fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}>
                {qs.map((q) => (
                  <li key={q.id} style={{ opacity: q.statut === 'fait' ? 0.5 : 1, color: 'var(--text)', letterSpacing: 0 }}>
                    <input
                      type="checkbox"
                      className="quest-check"
                      checked={q.statut === 'fait'}
                      disabled={q.statut === 'fait'}
                      onChange={async () => {
                        playTick();
                        await dispatch(validerQuete(q.id));
                        setQuetes(await apiGet(`/quetes?type=${arc}`));
                      }}
                      style={{ accentColor: 'var(--jaune)' }}
                    />
                    <span style={{ textDecoration: q.statut === 'fait' ? 'line-through' : 'none' }}>{q.titre}</span>
                  </li>
                ))}
                {!qs.length && <li className="compteur">Aucune quête</li>}
              </ul>
            </div>
          </section>
        ))}
        {!parChapitre.length && (
          <div className="empty-wall" style={{ display: 'grid', placeItems: 'center', textAlign: 'center' }}>
            <p className="compteur">CHAPITRES</p>
            <h2 style={{ margin: '12px 0' }}>Pas encore de chapitre</h2>
            <span className="annotation-manuscrite">vide pour l’instant</span>
          </div>
        )}
      </div>
    </div>
  );
}
