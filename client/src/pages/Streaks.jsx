import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '../lib/api.js';

const PISTES = [
  { id: 'dev', label: 'Dev' },
  { id: 'miprod', label: 'Miprod' },
  { id: 'sport', label: 'Sport' },
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
      return false;
    }).length;
    return Math.min(4, count);
  }

  return (
    <div style={{ padding: 'var(--space-4)' }}>
      <h1>Streaks</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)', margin: 'var(--space-4) 0' }}>
        {PISTES.map((p) => {
          const s = streaks.find((x) => x.id === p.id) || { jours_consecutifs: 0, record: 0 };
          return (
            <div key={p.id} className="blueprint-grid" style={{ background: 'var(--bg-1)', padding: 'var(--space-3)', borderRadius: 4 }}>
              <p className="compteur">{p.label}</p>
              <p style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem' }}>{s.jours_consecutifs}j</p>
              <p className="compteur">record {s.record}j</p>
            </div>
          );
        })}
      </div>

      {PISTES.map((p) => (
        <section key={p.id} style={{ marginBottom: 'var(--space-4)' }}>
          <p className="compteur" style={{ marginBottom: 8 }}>{p.label} — 12 semaines</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(28, 1fr)', gap: 3, overflowX: 'auto' }}>
            {jours.map((d) => {
              const level = intensite(d, p.id);
              const alpha = [0.12, 0.28, 0.45, 0.7, 1][level];
              return (
                <div
                  key={`${p.id}-${d}`}
                  title={`${d} · ${level}`}
                  style={{ aspectRatio: '1', borderRadius: 2, background: `rgba(255, 210, 63, ${alpha})`, minWidth: 8 }}
                />
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
