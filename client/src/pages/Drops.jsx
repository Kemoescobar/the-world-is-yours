import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import OsHeader from '../components/OsHeader.jsx';
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
    <div className="os-page" style={{ minHeight: '80vh' }}>
      <OsHeader
        kicker="OS · DROPS"
        title="DROPS"
        meta={`${items.length} palier${items.length === 1 ? '' : 's'} · spiral / liste`}
        actions={(
          <div className="mode-toggle" role="group" aria-label="Vue drops">
            {['spiral', 'liste'].map((m) => (
              <button
                key={m}
                type="button"
                aria-pressed={mode === m}
                onClick={() => setMode(m)}
              >
                {m}
              </button>
            ))}
          </div>
        )}
      />

      {mode === 'liste' ? (
        <div className="os-stack">
          {items.map((e, i) => (
            <Link key={e.id} to={`/drops/${e.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <article className="os-row chrome-edge">
                <div>
                  <p className="compteur" style={{ margin: 0 }}>
                    {String(i + 1).padStart(2, '0')} · {e.type_fait} · {String(e.cree_le).slice(0, 10)}
                  </p>
                  <h2 style={{ fontSize: '1.15rem', margin: '6px 0 0', textTransform: 'uppercase' }}>
                    {e.detail || 'Drop'}
                  </h2>
                </div>
                <span className="compteur" style={{ color: 'var(--jaune)' }}>›</span>
              </article>
            </Link>
          ))}
          {!items.length && (
            <div className="empty-wall" style={{ display: 'grid', placeItems: 'center', textAlign: 'center' }}>
              <p className="compteur">ARCHIVE · DROPS</p>
              <h2 style={{ margin: '12px 0' }}>Aucun drop encore</h2>
              <p style={{ color: 'var(--text-muted)' }}>Valide une quête ou capture un fait.</p>
              <span className="annotation-manuscrite">vide pour l’instant</span>
            </div>
          )}
        </div>
      ) : (
        <div style={{ position: 'relative', height: 520 }} className="void-grid">
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
                className="drop-spiral-card chrome-edge"
                style={{
                  position: 'absolute',
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: `translate(-50%, -50%) scale(${depth})`,
                  zIndex: Math.round(depth * 10),
                }}
              >
                <p className="compteur">{e.type_fait}</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: '0.95rem', textTransform: 'uppercase' }}>
                  {e.detail || 'Drop'}
                </p>
              </Link>
            );
          })}
          {!items.length && (
            <div className="empty-wall" style={{ position: 'absolute', inset: 24, display: 'grid', placeItems: 'center' }}>
              <div style={{ textAlign: 'center' }}>
                <p className="compteur">SPIRAL · DROPS</p>
                <h2 style={{ margin: '12px 0' }}>Aucun palier encore</h2>
                <p style={{ color: 'var(--text-muted)' }}>Valide une quête — le Drop apparaît ici.</p>
                <span className="annotation-manuscrite">vide pour l’instant</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
