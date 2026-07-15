import { useEffect, useMemo, useState } from 'react';
import OsHeader from '../components/OsHeader.jsx';
import { apiGet } from '../lib/api.js';

export default function Analytics() {
  const [entrees, setEntrees] = useState([]);
  const [prospects, setProspects] = useState([]);

  useEffect(() => {
    apiGet('/entrees').then(setEntrees).catch(() => setEntrees([]));
    apiGet('/prospects').then(setProspects).catch(() => setProspects([]));
  }, []);

  const parJour = useMemo(() => {
    const map = {};
    for (const e of entrees) {
      const j = String(e.cree_le || '').slice(0, 10);
      if (!j) continue;
      map[j] = (map[j] || 0) + 1;
    }
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).slice(-21);
  }, [entrees]);

  const max = Math.max(1, ...parJour.map(([, n]) => n));
  const pipeline = prospects.reduce((acc, p) => {
    acc[p.statut] = (acc[p.statut] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="os-page">
      <OsHeader
        kicker="OS · ANALYTICS"
        title="ANALYTICS"
        meta="21 derniers jours · pipeline freelance"
      />

      <section className="os-panel chrome-edge">
        <div className="os-panel__bar">
          <span>ACTIVITÉ</span>
          <span className="compteur-dot">{entrees.length} ENTRÉES</span>
        </div>
        <div className="os-chart">
          {parJour.map(([jour, n]) => (
            <div key={jour} className="os-chart__bar" title={`${jour}: ${n}`}>
              <div className="os-chart__fill" style={{ height: `${(n / max) * 120}px` }} />
              <span className="compteur" style={{ fontSize: '0.55rem' }}>{jour.slice(5)}</span>
            </div>
          ))}
          {!parJour.length && <p className="compteur">Pas encore de données.</p>}
        </div>
      </section>

      <h2 style={{ marginTop: 'var(--space-4)', marginBottom: 12, fontSize: '1.1rem', textTransform: 'uppercase' }}>
        Pipeline freelance
      </h2>
      <div className="os-stat-rail">
        {['prospect', 'proposal_envoye', 'client', 'paye'].map((s) => (
          <div key={s}>
            <p className="compteur">{s}</p>
            <p className="os-stat-rail__n">{pipeline[s] || 0}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
