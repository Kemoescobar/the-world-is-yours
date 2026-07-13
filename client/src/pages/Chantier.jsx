import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchArcs } from '../store/slices/arcsSlice.js';
import { fetchQuetes, validerQuete } from '../store/slices/questsSlice.js';
import ArcCard from '../components/ArcCard.jsx';
import { apiGet } from '../lib/api.js';

const streakParArc = { dev: 'dev', beatmaker: 'miprod', croisement: null };

function jourISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function Chantier() {
  const dispatch = useDispatch();
  const arcs = useSelector((s) => s.arcs.items);
  const quetes = useSelector((s) => s.quetes.items);
  const [streaks, setStreaks] = useState([]);
  const [chapitres, setChapitres] = useState([]);

  useEffect(() => {
    dispatch(fetchArcs());
    dispatch(fetchQuetes());
    apiGet('/streaks').then(setStreaks).catch(() => setStreaks([]));
    apiGet('/chapitres').then(setChapitres).catch(() => setChapitres([]));
  }, [dispatch]);

  const aujourdhui = jourISO();

  function quetesPourArc(arcId) {
    return quetes.filter((q) => {
      if (arcId === 'dev') return q.type === 'dev' || q.type === 'routine' || q.type === 'freelance';
      return q.type === arcId;
    });
  }

  function chapitrePourArc(arcId) {
    return chapitres
      .filter((c) => c.arc_id === arcId)
      .sort((a, b) => String(b.date_debut).localeCompare(String(a.date_debut)))[0];
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

  function enRetard(liste) {
    return liste.some((q) => q.statut !== 'fait' && q.date_prevue && q.date_prevue < aujourdhui);
  }

  const titreGlobal = useMemo(() => {
    const c0 = chapitres.find((c) => c.semaine === 'S1');
    return c0?.titre || 'Chapitre 0 — Amorçage';
  }, [chapitres]);

  return (
    <div style={{ padding: 'var(--space-4)' }}>
      <p className="compteur">{titreGlobal.toUpperCase()}</p>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: 'var(--space-3)',
        marginTop: 'var(--space-3)',
      }}>
        {arcs.map((a) => {
          const liste = quetesPourArc(a.id);
          const chap = chapitrePourArc(a.id);
          const rompu = chap?.statut === 'rompu';
          const reprise = chap?.statut === 'reprise';
          return (
            <div key={a.id}>
              <ArcCard
                nom={a.nom}
                streak={streakPour(a.id)}
                progression={progression(liste)}
                quetes={liste}
                enRetard={enRetard(liste) || rompu}
                badge={rompu ? 'rompu' : reprise ? 'reprise' : null}
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
