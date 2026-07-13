export default function ArcCard({ nom, streak, progression, quetes = [], enRetard, badge, onValider }) {
  return (
    <div className="blueprint-grid" style={{ background: 'var(--bg-1)', padding: 'var(--space-3)', borderRadius: 4, position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 }}>
        <h2>{nom}</h2>
        {badge && (
          <span className="annotation-manuscrite" style={{ fontSize: '0.95rem' }}>
            {badge}
          </span>
        )}
      </div>
      <p className="compteur">STREAK {streak ?? 0}J</p>
      <div style={{ height: 4, background: 'var(--bg-3)', borderRadius: 2, margin: 'var(--space-2) 0' }}>
        <div style={{ width: `${progression ?? 0}%`, height: '100%', background: 'var(--jaune)', borderRadius: 2 }} />
      </div>
      <ul style={{ listStyle: 'none', padding: 0, fontFamily: 'var(--font-body)', fontSize: '0.85rem' }}>
        {quetes.map((q) => {
          const faite = q.statut === 'fait';
          const retardQuete = !faite && q.date_prevue && q.date_prevue < new Date().toISOString().slice(0, 10);
          return (
            <li key={q.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8, opacity: faite ? 0.45 : 1 }}>
              <input
                type="checkbox"
                checked={faite}
                disabled={faite || !onValider}
                onChange={() => onValider?.(q.id)}
                style={{ marginTop: 3, accentColor: 'var(--jaune)' }}
                aria-label={q.titre}
              />
              <span style={{ textDecoration: faite ? 'line-through' : 'none', color: retardQuete ? 'var(--rouge)' : undefined }}>
                {q.titre}
              </span>
            </li>
          );
        })}
      </ul>
      {enRetard && !badge && <span className="annotation-manuscrite">en retard !</span>}
    </div>
  );
}
