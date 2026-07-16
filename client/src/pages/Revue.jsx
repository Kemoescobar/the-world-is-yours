import { useEffect, useMemo, useState } from 'react';
import OsHeader from '../components/OsHeader.jsx';
import { apiGet, apiPost } from '../lib/api.js';

export default function Revue() {
  const [entrees, setEntrees] = useState([]);
  const [quetes, setQuetes] = useState([]);
  const [streaks, setStreaks] = useState([]);
  const [apprentissages, setApprentissages] = useState([]);
  const [contremaitre, setContremaitre] = useState(null);
  const [revue, setRevue] = useState('');
  const [source, setSource] = useState('');
  const [statut, setStatut] = useState('idle');
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    apiGet('/entrees').then(setEntrees).catch(() => setEntrees([]));
    apiGet('/quetes').then(setQuetes).catch(() => setQuetes([]));
    apiGet('/streaks').then(setStreaks).catch(() => setStreaks([]));
    const debut = new Date();
    debut.setDate(debut.getDate() - 7);
    apiGet(`/apprentissages?depuis=${debut.toISOString()}`).then(setApprentissages).catch(() => setApprentissages([]));
    apiGet('/contremaitre/active').then(setContremaitre).catch(() => setContremaitre(null));
  }, []);

  const semaine = useMemo(() => {
    const debut = new Date();
    debut.setDate(debut.getDate() - 7);
    const recentes = entrees.filter((e) => new Date(e.cree_le) >= debut);
    const faites = quetes.filter((q) => q.statut === 'fait');
    return {
      recentes,
      faites,
      statsSecondaires: [
        `${recentes.length} faits · ${faites.length}/${quetes.length} quêtes`,
        `Streaks — ${streaks.map((s) => `${s.id}:${s.jours_consecutifs}j`).join(' · ') || 'n/a'}`,
        `Apprentissages : ${apprentissages.length}`,
      ],
    };
  }, [entrees, quetes, streaks, apprentissages]);

  async function generer() {
    setStatut('gen');
    setErreur('');
    try {
      const data = await apiPost('/ai/revue', {});
      setRevue(data.revue || '');
      setSource(data.source || (data.revue ? 'ia' : 'heuristic'));
      if (data.apprentissages) setApprentissages(data.apprentissages);
      if (data.contremaitre !== undefined) setContremaitre(data.contremaitre);
      setStatut('ok');
    } catch (err) {
      setErreur(err.message);
      setStatut('idle');
    }
  }

  async function feedback(statutFb) {
    if (!contremaitre?.id) return;
    try {
      await apiPost(`/contremaitre/${contremaitre.id}/feedback`, { statut: statutFb });
      setContremaitre(null);
    } catch (err) {
      setErreur(err.message);
    }
  }

  return (
    <div className="os-page" style={{ maxWidth: 720 }}>
      <OsHeader
        kicker="OS · REVUE"
        title="REVUE"
        meta="Récit hebdo · apprentissages · Contremaître"
        actions={(
          <button type="button" className="btn-poster" onClick={generer} disabled={statut === 'gen'}>
            {statut === 'gen' ? 'Génération…' : '› Générer le récit'}
          </button>
        )}
      />
      {erreur && <p className="annotation-manuscrite" style={{ marginTop: -8, marginBottom: 16 }}>{erreur}</p>}

      {contremaitre && (
        <article className="os-panel chrome-edge" style={{ marginBottom: 16 }}>
          <div className="os-panel__bar">
            <span>CONTREMAÎTRE</span>
            <span className="compteur-dot">{contremaitre.declencheur_type}</span>
          </div>
          <div className="os-panel__body">
            <p style={{ marginBottom: 8 }}>{contremaitre.ressource_titre}</p>
            {contremaitre.ressource_url && (
              <a href={contremaitre.ressource_url} target="_blank" rel="noreferrer" className="compteur">
                {contremaitre.ressource_url}
              </a>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button type="button" className="btn-ghost" onClick={() => feedback('utile')}>Utile</button>
              <button type="button" className="btn-ghost" onClick={() => feedback('pas_utile')}>Pas utile</button>
            </div>
          </div>
        </article>
      )}

      <article className="os-panel chrome-edge blueprint-grid chronique-poster" style={{ marginBottom: 16 }}>
        <div className="os-panel__bar">
          <span>{revue ? 'RÉCIT' : 'EN ATTENTE DU RÉCIT'}</span>
          <span className="compteur-dot">{source ? source.toUpperCase() : 'HEBDO'}</span>
        </div>
        <div className="os-panel__body">
          {revue ? (
            revue.split('\n').map((l, i) => (
              <p key={`${i}-${l.slice(0, 24)}`} style={{ marginBottom: 12, lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>{l}</p>
            ))
          ) : (
            <p style={{ lineHeight: 1.55, color: 'var(--text-muted)' }}>
              Génère le récit de la semaine — prose toujours disponible (heuristique sans Claude).
              Les compteurs restent secondaires, en bas.
            </p>
          )}
        </div>
      </article>

      <div className="os-stat-rail" aria-label="Stats secondaires" style={{ marginBottom: 24 }}>
        {semaine.statsSecondaires.map((s) => (
          <div key={s}>
            <p className="compteur">STAT</p>
            <p style={{ margin: '4px 0 0', fontSize: '0.85rem', lineHeight: 1.35 }}>{s}</p>
          </div>
        ))}
      </div>

      <h2 style={{ marginTop: 'var(--space-4)', marginBottom: 8, fontSize: '1.1rem', textTransform: 'uppercase' }}>
        Ce que tu as appris
      </h2>
      <ul className="os-list">
        {apprentissages.map((a) => (
          <li key={a.id}>
            <span style={{ color: 'var(--jaune)' }}>›</span>
            <span>{a.type} · {a.titre}</span>
          </li>
        ))}
        {!apprentissages.length && <li>Aucun apprentissage cette semaine — check-in peut proposer des brouillons</li>}
      </ul>

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
        {!semaine.recentes.length && (
          <li>
            Aucun fait cette semaine —{' '}
            <button
              type="button"
              className="btn-ghost"
              onClick={() => window.dispatchEvent(new CustomEvent('twiy:open-capture', { detail: { mode: 'checkin' } }))}
            >
              check-in
            </button>
          </li>
        )}
      </ul>
    </div>
  );
}
