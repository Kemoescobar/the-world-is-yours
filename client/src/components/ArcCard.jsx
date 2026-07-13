// Carte d'arc pour le dashboard — streak en gros chiffre mono, barre pointillée blueprint,
// annotation manuscrite rouge si retard (spec 7bis + 8bis).
export default function ArcCard({ nom, streak, progression, quetes = [], enRetard, onValider }) {
  return (
    <div className="blueprint-grid" style={{ background: 'var(--bg-1)', padding: 'var(--space-3)', borderRadius: 4, position: 'relative' }}>
      <h2>{nom}</h2>
      <p className="compteur">STREAK {streak ?? 0}J</p>
      <div style={{ height: 4, background: 'var(--bg-3)', borderRadius: 2, margin: 'var(--space-2) 0' }}>
        <div style={{ width: `${progression ?? 0}%`, height: '100%', background: 'var(--jaune)', borderRadius: 2 }} />
      </div>
      <ul style={{ listStyle: 'none', padding: 0, fontFamily: 'var(--font-body)', fontSize: '0.85rem' }}>
        {quetes.map((q) => {
          const faite = q.statut === 'fait';
          return (
            <li key={q.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8, opacity: faite ? 0.45 : 1 }}>
              <input
                type="checkbox"
                checked={faite}
                disabled={faite || !onValider}
                onChange={() => onValider?.(q.id)}
                style={{ marginTop: 3, accentColor: 'var(--jaune)' }}
              />
              <span style={{ textDecoration: faite ? 'line-through' : 'none' }}>{q.titre}</span>
            </li>
          );
        })}
      </ul>
      {enRetard && <span className="annotation-manuscrite">en retard !</span>}
    </div>
  );
}
