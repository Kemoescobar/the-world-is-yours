import { useEffect, useMemo, useState } from 'react';
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
    <div style={{ padding: 'var(--space-4)' }}>
      <h1>Analytics</h1>
      <p className="compteur">21 derniers jours d'activité</p>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 160, marginTop: 'var(--space-4)', overflowX: 'auto' }}>
        {parJour.map(([jour, n]) => (
          <div key={jour} title={`${jour}: ${n}`} style={{ flex: 1, minWidth: 18, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}>
            <div style={{ width: '100%', height: `${(n / max) * 120}px`, background: 'var(--jaune)', borderRadius: 2, minHeight: 4 }} />
            <span className="compteur" style={{ fontSize: '0.55rem' }}>{jour.slice(5)}</span>
          </div>
        ))}
        {!parJour.length && <p className="compteur">Pas encore de données.</p>}
      </div>

      <h2 style={{ marginTop: 'var(--space-4)' }}>Pipeline freelance</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginTop: 12 }}>
        {['prospect', 'proposal_envoye', 'client', 'paye'].map((s) => (
          <div key={s} className="blueprint-grid" style={{ background: 'var(--bg-1)', padding: 'var(--space-3)', borderRadius: 4 }}>
            <p className="compteur">{s}</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.6rem' }}>{pipeline[s] || 0}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
