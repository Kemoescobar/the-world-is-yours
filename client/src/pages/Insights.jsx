import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '../lib/api.js';

export default function Insights() {
  const [entrees, setEntrees] = useState([]);
  const [quetes, setQuetes] = useState([]);
  const [texte, setTexte] = useState('');
  const [statut, setStatut] = useState('idle');
  const [erreur, setErreur] = useState('');

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

  async function generer() {
    setStatut('gen');
    setErreur('');
    try {
      const data = await apiPost('/ai/insights', {});
      setTexte(data.insights || '');
      setStatut('ok');
    } catch (err) {
      setErreur(err.message);
      setStatut('idle');
    }
  }

  return (
    <div style={{ padding: 'var(--space-4)', maxWidth: 800 }}>
      <h1>Insights</h1>
      <p className="compteur" style={{ marginTop: 8 }}>Corrélations · Claude (Phase 3)</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--space-3)', marginTop: 'var(--space-4)' }}>
        <div className="poster-panel blueprint-grid" style={{ padding: 'var(--space-3)' }}>
          <p className="compteur">Entrées</p>
          <p style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', margin: 0 }}>{stats.totalEntrees}</p>
        </div>
        <div className="poster-panel blueprint-grid" style={{ padding: 'var(--space-3)' }}>
          <p className="compteur">Quêtes faites</p>
          <p style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', margin: 0 }}>{stats.faites}</p>
        </div>
        <div className="poster-panel blueprint-grid" style={{ padding: 'var(--space-3)' }}>
          <p className="compteur">Restantes</p>
          <p style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', margin: 0 }}>{stats.restantes}</p>
        </div>
      </div>

      <button type="button" className="btn-poster" style={{ marginTop: 'var(--space-4)' }} onClick={generer} disabled={statut === 'gen'}>
        {statut === 'gen' ? 'Analyse…' : '› Corrélations IA'}
      </button>
      {erreur && <p className="annotation-manuscrite" style={{ marginTop: 12 }}>{erreur}</p>}

      {texte && (
        <article className="poster-panel" style={{ padding: 'var(--space-4)', marginTop: 'var(--space-3)', whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
          {texte}
        </article>
      )}

      <h2 style={{ marginTop: 'var(--space-4)' }}>Types de faits</h2>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {stats.topTypes.map(([type, n]) => (
          <li key={type} className="compteur" style={{ marginBottom: 8 }}>{type} — {n}</li>
        ))}
      </ul>
    </div>
  );
}
