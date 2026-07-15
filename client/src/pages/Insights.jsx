import { useEffect, useMemo, useState } from 'react';
import OsHeader from '../components/OsHeader.jsx';
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
    <div className="os-page" style={{ maxWidth: 800 }}>
      <OsHeader
        kicker="OS · INSIGHTS"
        title="INSIGHTS"
        meta="Corrélations · Claude (Phase 3)"
        actions={(
          <button type="button" className="btn-poster" onClick={generer} disabled={statut === 'gen'}>
            {statut === 'gen' ? 'Analyse…' : '› Corrélations IA'}
          </button>
        )}
      />

      <div className="os-stat-rail">
        <div>
          <p className="compteur">Entrées</p>
          <p className="os-stat-rail__n">{stats.totalEntrees}</p>
        </div>
        <div>
          <p className="compteur">Quêtes faites</p>
          <p className="os-stat-rail__n">{stats.faites}</p>
        </div>
        <div>
          <p className="compteur">Restantes</p>
          <p className="os-stat-rail__n">{stats.restantes}</p>
        </div>
      </div>

      {erreur && <p className="annotation-manuscrite" style={{ marginBottom: 12 }}>{erreur}</p>}

      {texte && (
        <article className="os-panel chrome-edge" style={{ marginBottom: 'var(--space-4)' }}>
          <div className="os-panel__bar">
            <span>CORRÉLATIONS IA</span>
            <span className="compteur-dot">OK</span>
          </div>
          <div className="os-panel__body" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
            {texte}
          </div>
        </article>
      )}

      <h2 style={{ marginBottom: 8, fontSize: '1.1rem', textTransform: 'uppercase' }}>Types de faits</h2>
      <ul className="os-list">
        {stats.topTypes.map(([type, n]) => (
          <li key={type}>
            <span style={{ color: 'var(--jaune)' }}>•</span>
            <span>{type} — {n}</span>
          </li>
        ))}
        {!stats.topTypes.length && <li>Aucune entrée encore</li>}
      </ul>
    </div>
  );
}
