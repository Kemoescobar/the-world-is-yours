import { useEffect, useMemo, useState } from 'react';
import OsHeader from '../components/OsHeader.jsx';
import { apiGet } from '../lib/api.js';

const PISTES = [
  { id: 'dev', label: 'Dev' },
  { id: 'miprod', label: 'Miprod' },
  { id: 'sport', label: 'Sport' },
  { id: 'rayonnement', label: 'Rayonnement' },
];

function joursBack(n = 84) {
  const out = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export default function Streaks() {
  const [streaks, setStreaks] = useState([]);
  const [entrees, setEntrees] = useState([]);

  useEffect(() => {
    apiGet('/streaks').then(setStreaks).catch(() => setStreaks([]));
    apiGet('/entrees').then(setEntrees).catch(() => setEntrees([]));
  }, []);

  const jours = useMemo(() => joursBack(84), []);

  function intensite(date, piste) {
    const count = entrees.filter((e) => {
      const jour = String(e.cree_le || '').slice(0, 10);
      if (jour !== date) return false;
      if (piste === 'dev') return e.arc_id === 'dev' || e.type_fait === 'commit' || e.type_fait === 'projet';
      if (piste === 'miprod') return e.arc_id === 'beatmaker' || e.type_fait === 'session_prod' || e.type_fait === 'instru';
      if (piste === 'sport') return e.type_fait === 'sport';
      if (piste === 'rayonnement') return e.type_fait === 'bilan_ere';
      return false;
    }).length;
    return Math.min(4, count);
  }

  return (
    <div className="os-page">
      <OsHeader
        kicker="OS · STREAKS"
        title="STREAKS"
        meta="Pistes · heatmaps 12 semaines · archive mono"
      />

      <div className="os-stat-rail">
        {PISTES.map((p) => {
          const s = streaks.find((x) => x.id === p.id) || { jours_consecutifs: 0, record: 0 };
          return (
            <div key={p.id}>
              <p className="compteur">{p.label}</p>
              <p className="os-stat-rail__n">{s.jours_consecutifs}j</p>
              <p className="compteur" style={{ marginTop: 6 }}>record {s.record}j</p>
            </div>
          );
        })}
      </div>

      <div className="os-stack">
        {PISTES.map((p) => (
          <section key={p.id} className="os-panel chrome-edge">
            <div className="os-panel__bar">
              <span>{p.label} · 12 semaines</span>
              <span className="compteur-dot">HEAT</span>
            </div>
            <div className="os-heat" aria-label={`Heatmap ${p.label}`}>
              {jours.map((d) => {
                const level = intensite(d, p.id);
                const alpha = [0.12, 0.28, 0.45, 0.7, 1][level];
                return (
                  <div
                    key={`${p.id}-${d}`}
                    className="os-heat__cell"
                    title={`${d} · ${level}`}
                    style={{ background: `rgba(255, 210, 63, ${alpha})` }}
                  />
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
