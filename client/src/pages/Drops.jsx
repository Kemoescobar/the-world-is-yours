import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import OsHeader from '../components/OsHeader.jsx';
import { apiGet } from '../lib/api.js';

const DROP_TYPES = new Set(['certif', 'instru', 'projet', 'quete', 'bilan_ere']);

/** Spiral layout that avoids heavy overlap + truncates detail text. */
function spiralPosition(index, total) {
  const n = Math.max(total, 1);
  const t = index / n;
  const angle = t * Math.PI * 2 - Math.PI / 2;
  // Expanding radius so cards fan out instead of stacking on center
  const radiusPct = 18 + (index % 6) * 5.5 + Math.floor(index / 6) * 3;
  const x = 50 + Math.cos(angle) * radiusPct * 0.95;
  const y = 50 + Math.sin(angle) * radiusPct * 0.72;
  return {
    left: `${Math.min(92, Math.max(8, x))}%`,
    top: `${Math.min(90, Math.max(10, y))}%`,
    zIndex: 10 + (index % 8),
  };
}

function truncate(text, max = 72) {
  const s = String(text || 'Drop').trim();
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

export default function Drops() {
  const [items, setItems] = useState([]);
  const [mode, setMode] = useState('spiral');
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    apiGet('/entrees')
      .then((data) => setItems((data || []).filter((e) => DROP_TYPES.has(e.type_fait))))
      .catch((err) => {
        setItems([]);
        setErreur(err.message || 'échec');
      });
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

      {erreur && <p className="annotation-manuscrite" style={{ marginBottom: 12 }}>{erreur}</p>}

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
        <div className="drop-spiral void-grid" style={{ position: 'relative', minHeight: 560 }}>
          {items.map((e, i) => {
            const pos = spiralPosition(i, items.length);
            return (
              <Link
                key={e.id}
                to={`/drops/${e.id}`}
                className="drop-spiral-card chrome-edge"
                style={{
                  position: 'absolute',
                  left: pos.left,
                  top: pos.top,
                  transform: 'translate(-50%, -50%)',
                  zIndex: pos.zIndex,
                }}
                title={e.detail || 'Drop'}
              >
                <p className="compteur drop-spiral-card__type">{e.type_fait}</p>
                <p className="drop-spiral-card__detail">
                  {truncate(e.detail)}
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
