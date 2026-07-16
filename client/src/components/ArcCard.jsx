import { playTick } from '../lib/sounds.js';

/**
 * Priorise les a_faire / en_cours (toutes visibles), puis quelques fait pour contexte.
 * Évite le bug slice(0,4) qui masquait des actifs derrière d’anciennes quêtes seedées.
 */
function quetesPourAffichage(quetes) {
  const unfinished = [];
  const finished = [];
  for (const q of quetes || []) {
    if (q.statut === 'fait' || q.statut === 'abandonne') finished.push(q);
    else unfinished.push(q);
  }
  const pad = Math.max(0, 4 - unfinished.length);
  return [...unfinished, ...finished.slice(0, pad)];
}

export default function ArcCard({ nom, streak, progression, quetes = [], enRetard, badge, onValider }) {
  const liste = quetesPourAffichage(quetes);

  return (
    <div className="poster-panel blueprint-grid chrome-edge os-panel arc-console">
      <div className="os-panel__bar">
        <span>ARC · CONSOLE</span>
        <span className="compteur-dot">{progression ?? 0}%</span>
      </div>

      <div className="arc-console__head">
        <h2 style={{ fontSize: '1.35rem', letterSpacing: '0.02em', textTransform: 'uppercase' }}>{nom}</h2>
        {badge && (
          <span className="annotation-manuscrite annotation-pop" style={{ fontSize: '1.1rem' }}>
            {badge}
          </span>
        )}
      </div>

      <div className="arc-console__body">
        <p
          className="compteur"
          style={{
            margin: 0,
            fontSize: '1.65rem',
            color: 'var(--text)',
            letterSpacing: '0.02em',
            animation: streak > 0 ? 'streak-glow 1.2s var(--ease-poster) both' : undefined,
          }}
        >
          {streak ?? 0}
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 6 }}>J STREAK</span>
        </p>

        <div
          style={{
            height: 3,
            background: 'var(--bg-3)',
            margin: 'var(--space-2) 0 var(--space-3)',
            position: 'relative',
          }}
        >
          <div
            style={{
              width: `${progression ?? 0}%`,
              height: '100%',
              background: 'repeating-linear-gradient(90deg, var(--jaune) 0 6px, transparent 6px 10px)',
            }}
          />
        </div>

        <ul className="os-list os-list--dense" style={{ fontFamily: 'var(--font-body)', fontSize: '0.88rem' }}>
          {liste.map((q) => {
            const faite = q.statut === 'fait';
            const retardQuete = !faite && q.date_prevue && q.date_prevue < new Date().toISOString().slice(0, 10);
            return (
              <li
                key={q.id}
                style={{
                  opacity: faite ? 0.4 : 1,
                  color: 'var(--text)',
                  letterSpacing: 0,
                }}
              >
                <input
                  type="checkbox"
                  className="quest-check"
                  checked={faite}
                  disabled={faite || !onValider}
                  onChange={() => {
                    playTick();
                    onValider?.(q.id);
                  }}
                  style={{ marginTop: 3, accentColor: 'var(--jaune)' }}
                  aria-label={q.titre}
                />
                <span
                  style={{
                    textDecoration: faite ? 'line-through' : 'none',
                    color: retardQuete ? 'var(--rouge)' : undefined,
                  }}
                >
                  {q.titre}
                </span>
              </li>
            );
          })}
          {!liste.length && (
            <li className="compteur" style={{ border: 'none', paddingTop: 4 }}>
              Aucune quête — capture un fait
            </li>
          )}
        </ul>

        {enRetard && !badge && (
          <span
            className="annotation-manuscrite annotation-pop"
            style={{ position: 'absolute', bottom: 12, right: 14, fontSize: '1.25rem' }}
          >
            en retard !
          </span>
        )}
      </div>
    </div>
  );
}
