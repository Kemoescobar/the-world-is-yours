import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../lib/api.js';

const DROP_TYPES = new Set(['certif', 'instru', 'projet', 'quete']);

export default function Drops() {
  const [items, setItems] = useState([]);
  const [mode, setMode] = useState('spiral');

  useEffect(() => {
    apiGet('/entrees')
      .then((data) => setItems((data || []).filter((e) => DROP_TYPES.has(e.type_fait))))
      .catch(() => setItems([]));
  }, []);

  return (
    <div style={{ padding: 'var(--space-4)', minHeight: '80vh' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <h1>Drops</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          {['spiral', 'liste'].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              style={{
                padding: '6px 10px', borderRadius: 4, cursor: 'pointer', textTransform: 'uppercase',
                fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
                border: '1px solid var(--bg-3)',
                background: mode === m ? 'var(--jaune)' : 'transparent',
                color: mode === m ? '#060a1a' : 'var(--text-muted)',
              }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {mode === 'liste' ? (
        <div style={{ display: 'grid', gap: 10, marginTop: 'var(--space-4)' }}>
          {items.map((e) => (
            <Link key={e.id} to={`/drops/${e.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <article className="blueprint-grid" style={{ background: 'var(--bg-1)', padding: 'var(--space-3)', borderRadius: 4 }}>
                <p className="compteur">{e.type_fait} · {String(e.cree_le).slice(0, 10)}</p>
                <h2 style={{ fontSize: '1.2rem' }}>{e.detail || 'Drop'}</h2>
              </article>
            </Link>
          ))}
          {!items.length && <p className="compteur">Aucun drop encore — valide une quête ou capture un fait.</p>}
        </div>
      ) : (
        <div style={{ position: 'relative', height: 520, marginTop: 'var(--space-4)' }}>
          {items.map((e, i) => {
            const angle = (i / Math.max(items.length, 1)) * Math.PI * 2;
            const radius = 120 + (i % 5) * 28;
            const x = 50 + Math.cos(angle) * (radius / 6);
            const y = 45 + Math.sin(angle) * (radius / 7);
            const depth = 0.7 + ((i % 4) * 0.1);
            return (
              <Link
                key={e.id}
                to={`/drops/${e.id}`}
                style={{
                  position: 'absolute',
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: `translate(-50%, -50%) scale(${depth})`,
                  width: 180,
                  padding: 12,
                  background: 'var(--bg-2)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 6,
                  boxShadow: `0 ${12 * depth}px ${30 * depth}px rgba(0,0,0,0.35)`,
                  zIndex: Math.round(depth * 10),
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <p className="compteur">{e.type_fait}</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem' }}>{e.detail || 'Drop'}</p>
              </Link>
            );
          })}
          {!items.length && <p className="compteur" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>Spiral vide — les paliers apparaîtront ici.</p>}
        </div>
      )}
    </div>
  );
}
