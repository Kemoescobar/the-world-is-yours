import { useEffect, useMemo, useState } from 'react';
import OsHeader from '../components/OsHeader.jsx';
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
    <div className="os-page" style={{ maxWidth: 720 }}>
      <OsHeader
        kicker="OS · REVUE"
        title="REVUE"
        meta="Hebdo · Claude (Phase 3)"
        actions={(
          <button type="button" className="btn-poster" onClick={generer} disabled={statut === 'gen'}>
            {statut === 'gen' ? 'Génération…' : '› Générer la revue IA'}
          </button>
        )}
      />
      {erreur && <p className="annotation-manuscrite" style={{ marginTop: -8, marginBottom: 16 }}>{erreur}</p>}

      <article className="os-panel chrome-edge blueprint-grid">
        <div className="os-panel__bar">
          <span>{revue ? 'REVUE IA' : 'RÉSUMÉ LOCAL'}</span>
          <span className="compteur-dot">HEBDO</span>
        </div>
        <div className="os-panel__body">
          {(revue ? revue.split('\n') : semaine.resumeLocal).map((l, i) => (
            <p key={`${i}-${l.slice(0, 24)}`} style={{ marginBottom: 12, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{l}</p>
          ))}
        </div>
      </article>

      <h2 style={{ marginTop: 'var(--space-4)', marginBottom: 8, fontSize: '1.1rem', textTransform: 'uppercase' }}>
        Faits récents
      </h2>
      <ul className="os-list">
        {semaine.recentes.slice(0, 12).map((e) => (
          <li key={e.id}>
            <span style={{ color: 'var(--jaune)' }}>›</span>
            <span>{String(e.cree_le).slice(0, 10)} · {e.type_fait} · {e.detail}</span>
          </li>
        ))}
        {!semaine.recentes.length && <li>Aucun fait cette semaine</li>}
      </ul>
    </div>
  );
}
