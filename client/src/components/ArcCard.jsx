export default function ArcCard({ nom, streak, progression, quetes = [], enRetard, badge, onValider }) {
  return (
    <div
      className="poster-panel blueprint-grid"
      style={{
        padding: 'var(--space-3)',
        position: 'relative',
        minHeight: 220,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <h2 style={{ fontSize: '1.35rem' }}>{nom}</h2>
        {badge && (
          <span className="annotation-manuscrite" style={{ fontSize: '1.1rem' }}>
            {badge}
          </span>
        )}
      </div>

      <p
        className="compteur"
        style={{
          marginTop: 8,
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

      <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.88rem' }}>
        {quetes.slice(0, 4).map((q) => {
          const faite = q.statut === 'fait';
          const retardQuete = !faite && q.date_prevue && q.date_prevue < new Date().toISOString().slice(0, 10);
          return (
            <li
              key={q.id}
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
                marginBottom: 10,
                opacity: faite ? 0.4 : 1,
              }}
            >
              <input
                type="checkbox"
                checked={faite}
                disabled={faite || !onValider}
                onChange={() => onValider?.(q.id)}
                style={{ marginTop: 3, accentColor: 'var(--jaune)' }}
                aria-label={q.titre}
              />
              <span style={{
                textDecoration: faite ? 'line-through' : 'none',
                color: retardQuete ? 'var(--rouge)' : undefined,
              }}>
                {q.titre}
              </span>
            </li>
          );
        })}
      </ul>

      {enRetard && !badge && (
        <span
          className="annotation-manuscrite"
          style={{ position: 'absolute', bottom: 12, right: 14, fontSize: '1.25rem' }}
        >
          en retard !
        </span>
      )}
    </div>
  );
}
