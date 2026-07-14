import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGet } from '../lib/api.js';

export default function DropDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);

  useEffect(() => {
    apiGet('/entrees')
      .then((list) => setItem((list || []).find((e) => e.id === id) || null))
      .catch(() => setItem(null));
  }, [id]);

  if (!item) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', gap: 12 }}>
        <p className="compteur">Drop introuvable</p>
        <Link to="/drops" style={{ color: 'var(--jaune)' }}>Retour</Link>
      </div>
    );
  }

  return (
    <div
      className="anim-drop collage-frame"
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 'var(--space-4)',
        position: 'relative',
        overflow: 'hidden',
        background:
          'radial-gradient(circle at 25% 20%, rgba(91,45,158,0.45), transparent 40%), radial-gradient(circle at 80% 70%, #13275a, #060a1a 55%)',
      }}
    >
      <div className="halftone-overlay" style={{ position: 'absolute', opacity: 0.2 }} />
      <div className="grain" />
      <span
        className="annotation-manuscrite"
        style={{
          position: 'absolute',
          top: '12%',
          left: '8%',
          fontSize: 'clamp(1.4rem, 4vw, 2.2rem)',
          transform: 'rotate(-8deg)',
          zIndex: 2,
        }}
      >
        shippé.
      </span>
      <span
        aria-hidden
        style={{
          position: 'absolute',
          top: '18%',
          right: '10%',
          color: 'var(--rouge)',
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 'clamp(2rem, 8vw, 4rem)',
          opacity: 0.55,
          transform: 'rotate(12deg)',
          zIndex: 2,
        }}
      >
        ×
      </span>

      <article style={{ position: 'relative', zIndex: 3, maxWidth: 720, textAlign: 'center' }}>
        <p className="compteur">
          {item.type_fait} · {String(item.cree_le).slice(0, 10)}
        </p>
        <h1
          style={{
            fontSize: 'clamp(2.4rem, 8vw, 5rem)',
            margin: 'var(--space-3) 0',
            lineHeight: 0.95,
            textShadow: '0 12px 40px rgba(0,0,0,0.45)',
          }}
        >
          {item.detail || 'Drop'}
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: 420, margin: '0 auto' }}>
          Brouillon de post — jamais auto-publié. Preuve datée, à partager toi-même.
        </p>
        <Link
          to="/drops"
          className="btn-ghost"
          style={{ display: 'inline-flex', marginTop: 'var(--space-4)', textDecoration: 'none' }}
        >
          ← Drops
        </Link>
      </article>
    </div>
  );
}
