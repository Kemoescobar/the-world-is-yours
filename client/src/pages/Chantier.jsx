import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchArcs } from '../store/slices/arcsSlice.js';
import { fetchQuetes, validerQuete } from '../store/slices/questsSlice.js';
import ArcCard from '../components/ArcCard.jsx';
import { apiGet } from '../lib/api.js';

const streakParArc = { dev: 'dev', beatmaker: 'miprod', croisement: null };

export default function Chantier() {
  const dispatch = useDispatch();
  const arcs = useSelector((s) => s.arcs.items);
  const quetes = useSelector((s) => s.quetes.items);
  const [streaks, setStreaks] = useState([]);

  useEffect(() => {
    dispatch(fetchArcs());
    dispatch(fetchQuetes());
    apiGet('/streaks').then(setStreaks).catch(() => setStreaks([]));
  }, [dispatch]);

  function quetesPourArc(arcId) {
    return quetes.filter((q) => {
      if (arcId === 'dev') return q.type === 'dev' || q.type === 'routine' || q.type === 'freelance';
      return q.type === arcId;
    });
  }

  function progression(liste) {
    if (!liste.length) return 0;
    const faites = liste.filter((q) => q.statut === 'fait').length;
    return Math.round((faites / liste.length) * 100);
  }

  function streakPour(arcId) {
    const id = streakParArc[arcId];
    if (!id) return 0;
    return streaks.find((s) => s.id === id)?.jours_consecutifs ?? 0;
  }

  return (
    <div style={{ padding: 'var(--space-4)' }}>
      <p className="compteur">CHAPITRE 0 — AMORÇAGE</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
        {arcs.map((a) => {
          const liste = quetesPourArc(a.id);
          return (
            <div key={a.id}>
              <ArcCard
                nom={a.nom}
                streak={streakPour(a.id)}
                progression={progression(liste)}
                quetes={liste}
                onValider={(id) => dispatch(validerQuete(id))}
              />
              <Link to={`/chantier/${a.id}`} style={{ display: 'inline-block', marginTop: 8, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                Voir l’arc →
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
