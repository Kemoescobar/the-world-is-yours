import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '../lib/api.js';

export default function Insights() {
  const [entrees, setEntrees] = useState([]);
  const [quetes, setQuetes] = useState([]);

  useEffect(() => {
    apiGet('/entrees').then(setEntrees).catch(() => setEntrees([]));
    apiGet('/quetes').then(setQuetes).catch(() => setQuetes([]));
  }, []);

  const stats = useMemo(() => {
    const parType = {};
    for (const e of entrees) parType[e.type_fait] = (parType[e.type_fait] || 0) + 1;
    const faites = quetes.filter((q) => q.statut === 'fait').length;
    return {
      totalEntrees: entrees.length,
      faites,
      restantes: quetes.length - faites,
      topTypes: Object.entries(parType).sort((a, b) => b[1] - a[1]).slice(0, 5),
    };
  }, [entrees, quetes]);

  return (
    <div style={{ padding: 'var(--space-4)' }}>
      <h1>Insights</h1>
      <p className="compteur">Corrélations locales (IA Claude — Phase 3)</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
        <div className="blueprint-grid" style={{ background: 'var(--bg-1)', padding: 'var(--space-3)', borderRadius: 4 }}>
          <p className="compteur">Entrées</p>
          <p style={{ fontSize: '2rem', fontFamily: 'var(--font-display)' }}>{stats.totalEntrees}</p>
        </div>
        <div className="blueprint-grid" style={{ background: 'var(--bg-1)', padding: 'var(--space-3)', borderRadius: 4 }}>
          <p className="compteur">Quêtes faites</p>
          <p style={{ fontSize: '2rem', fontFamily: 'var(--font-display)' }}>{stats.faites}</p>
        </div>
        <div className="blueprint-grid" style={{ background: 'var(--bg-1)', padding: 'var(--space-3)', borderRadius: 4 }}>
          <p className="compteur">Restantes</p>
          <p style={{ fontSize: '2rem', fontFamily: 'var(--font-display)' }}>{stats.restantes}</p>
        </div>
      </div>
      <h2 style={{ marginTop: 'var(--space-4)' }}>Types de faits</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {stats.topTypes.map(([type, n]) => (
          <li key={type} className="compteur" style={{ marginBottom: 8 }}>{type} — {n}</li>
        ))}
      </ul>
    </div>
  );
}
