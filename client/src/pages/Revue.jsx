import { useEffect, useMemo, useState } from 'react';
import { apiGet, apiPost } from '../lib/api.js';

export default function Revue() {
  const [entrees, setEntrees] = useState([]);
  const [quetes, setQuetes] = useState([]);
  const [streaks, setStreaks] = useState([]);
  const [revue, setRevue] = useState('');
  const [statut, setStatut] = useState('idle');
  const [erreur, setErreur] = useState('');

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
      resumeLocal: [
        `Cette semaine : ${recentes.length} faits capturés.`,
        `Quêtes closes : ${faites.length}/${quetes.length}.`,
        `Streaks — ${streaks.map((s) => `${s.id}:${s.jours_consecutifs}j`).join(' · ') || 'n/a'}.`,
      ],
    };
  }, [entrees, quetes, streaks]);

  async function generer() {
    setStatut('gen');
    setErreur('');
    try {
      const data = await apiPost('/ai/revue', {});
      setRevue(data.revue || '');
      setStatut('ok');
    } catch (err) {
      setErreur(err.message);
      setStatut('idle');
    }
  }

  return (
    <div style={{ padding: 'var(--space-4)', maxWidth: 720 }}>
      <h1>Revue</h1>
      <p className="compteur" style={{ marginTop: 8 }}>Hebdo · Claude (Phase 3)</p>

      <div style={{ display: 'flex', gap: 10, marginTop: 'var(--space-3)', flexWrap: 'wrap' }}>
        <button type="button" className="btn-poster" onClick={generer} disabled={statut === 'gen'}>
          {statut === 'gen' ? 'Génération…' : '› Générer la revue IA'}
        </button>
      </div>
      {erreur && <p className="annotation-manuscrite" style={{ marginTop: 12 }}>{erreur}</p>}

      <article className="poster-panel blueprint-grid" style={{ padding: 'var(--space-4)', marginTop: 'var(--space-4)' }}>
        {(revue ? revue.split('\n') : semaine.resumeLocal).map((l, i) => (
          <p key={`${i}-${l.slice(0, 24)}`} style={{ marginBottom: 12, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{l}</p>
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
