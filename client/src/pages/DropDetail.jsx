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
    <div style={{
      minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 'var(--space-4)',
      background: 'radial-gradient(circle at 30% 20%, #13275a, #060a1a 60%)',
    }}>
      <div className="halftone-overlay" />
      <article style={{ position: 'relative', zIndex: 1, maxWidth: 640, textAlign: 'center' }}>
        <p className="compteur">{item.type_fait} · {String(item.cree_le).slice(0, 10)}</p>
        <h1 style={{ fontSize: 'clamp(2rem, 6vw, 4rem)', margin: 'var(--space-3) 0' }}>{item.detail || 'Drop'}</h1>
        <p style={{ color: 'var(--text-muted)' }}>Brouillon de post — jamais auto-publié.</p>
        <Link to="/drops" style={{ color: 'var(--jaune)', display: 'inline-block', marginTop: 'var(--space-4)' }}>Retour aux drops</Link>
      </article>
    </div>
  );
}
