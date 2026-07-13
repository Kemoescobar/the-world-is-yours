import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '../lib/api.js';

export default function Revue() {
  const [entrees, setEntrees] = useState([]);
  const [quetes, setQuetes] = useState([]);
  const [streaks, setStreaks] = useState([]);

  useEffect(() => {
    apiGet('/entrees').then(setEntrees).catch(() => setEntrees([]));
    apiGet('/quetes').then(setQuetes).catch(() => setQuetes([]));
    apiGet('/streaks').then(setStreaks).catch(() => setStreaks([]));
  }, []);

  const semaine = useMemo(() => {
    const debut = new Date();
    debut.setDate(debut.getDate() - 7);
    const recentes = entrees.filter((e) => new Date(e.cree_le) >= debut);
    const faites = quetes.filter((q) => q.statut === 'fait');
    return {
      recentes,
      faites,
      brouillon: [
        `Cette semaine : ${recentes.length} faits capturés.`,
        `Quêtes closes : ${faites.length}/${quetes.length}.`,
        `Streaks — ${streaks.map((s) => `${s.id}:${s.jours_consecutifs}j`).join(' · ') || 'n/a'}.`,
        'Titre Claude + revue narrative : Phase 3 (ANTHROPIC_API_KEY).',
      ],
    };
  }, [entrees, quetes, streaks]);

  return (
    <div style={{ padding: 'var(--space-4)', maxWidth: 720 }}>
      <h1>Revue</h1>
      <p className="compteur">Brouillon hebdo (IA — Phase 3)</p>
      <article className="blueprint-grid" style={{ background: 'var(--bg-1)', padding: 'var(--space-4)', borderRadius: 4, marginTop: 'var(--space-4)' }}>
        {semaine.brouillon.map((l) => (
          <p key={l} style={{ marginBottom: 12, lineHeight: 1.5 }}>{l}</p>
        ))}
      </article>
      <h2 style={{ marginTop: 'var(--space-4)' }}>Faits récents</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {semaine.recentes.slice(0, 12).map((e) => (
          <li key={e.id} className="compteur" style={{ marginBottom: 8 }}>
            {String(e.cree_le).slice(0, 10)} · {e.type_fait} · {e.detail}
          </li>
        ))}
      </ul>
    </div>
  );
}
