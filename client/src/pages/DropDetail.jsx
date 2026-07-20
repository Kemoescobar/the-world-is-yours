import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGet } from '../lib/api.js';
import { playImpact } from '../lib/sounds.js';
import GlobeHandVivant from '../components/GlobeHandVivant.jsx';

function exportDropCard({ detail, typeFait, date }) {
  const w = 1080;
  const h = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#1a0f0d');
  g.addColorStop(0.45, '#2b1512');
  g.addColorStop(1, '#4a231d');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // Magenta/cyan iridescent accents (registre fort)
  const iris = ctx.createRadialGradient(w * 0.3, h * 0.2, 40, w * 0.3, h * 0.2, 420);
  iris.addColorStop(0, 'rgba(255,43,214,0.35)');
  iris.addColorStop(1, 'transparent');
  ctx.fillStyle = iris;
  ctx.fillRect(0, 0, w, h);

  const iris2 = ctx.createRadialGradient(w * 0.8, h * 0.75, 20, w * 0.8, h * 0.75, 380);
  iris2.addColorStop(0, 'rgba(45,226,230,0.28)');
  iris2.addColorStop(1, 'transparent');
  ctx.fillStyle = iris2;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = '#a89484';
  ctx.font = '28px monospace';
  ctx.fillText(`${String(typeFait || 'drop').toUpperCase()} · ${date || ''}`, 72, 120);

  ctx.fillStyle = '#f5c542';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('THE WORLD IS YOURS', 72, 180);

  ctx.fillStyle = '#f2e8da';
  ctx.font = 'bold 72px sans-serif';
  const words = String(detail || 'Drop').split(/\s+/);
  let line = '';
  let y = 320;
  const maxW = w - 144;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, 72, y);
      line = word;
      y += 88;
      if (y > h - 200) break;
    } else {
      line = test;
    }
  }
  if (line && y <= h - 200) ctx.fillText(line, 72, y);

  ctx.fillStyle = '#ff5a3c';
  ctx.font = 'italic 36px Georgia, serif';
  ctx.fillText('shippé.', 72, h - 120);

  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `twiy-drop-${(date || 'card').slice(0, 10)}.png`;
    a.click();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

export default function DropDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);

  useEffect(() => {
    apiGet('/entrees')
      .then((list) => setItem((list || []).find((e) => e.id === id) || null))
      .catch(() => setItem(null));
  }, [id]);

  useEffect(() => {
    if (item) playImpact();
  }, [item]);

  if (!item) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', gap: 12 }}>
        <p className="compteur">Drop introuvable</p>
        <Link to="/drops" style={{ color: 'var(--jaune)' }}>Retour</Link>
      </div>
    );
  }

  const date = String(item.cree_le).slice(0, 10);

  return (
    <div
      className="anim-drop collage-frame registre-fort drop-reveal-fort"
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 'var(--space-4)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <img
        src="/brand/drop-reveal-fort.png"
        alt=""
        aria-hidden
        className="drop-reveal-fort__bg"
      />
      <div className="drop-reveal-fort__wash" aria-hidden />
      <div className="halftone-overlay halftone-live" style={{ position: 'absolute', opacity: 0.22 }} />
      <div className="grain grain-live" />
      <GlobeHandVivant side="right" opacity={0.52} />
      <span
        className="annotation-manuscrite annotation-pop"
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
          {item.type_fait} · {date}
        </p>
        <h1
          className="title-dither"
          style={{
            fontSize: 'clamp(2.8rem, 9vw, 5.5rem)',
            margin: 'var(--space-3) 0',
            lineHeight: 0.92,
          }}
        >
          {item.detail || 'Drop'}
        </h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: 420, margin: '0 auto' }}>
          Brouillon de post — jamais auto-publié. Preuve datée, à partager toi-même.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 'var(--space-4)' }}>
          <button
            type="button"
            className="btn-poster"
            onClick={() => exportDropCard({ detail: item.detail, typeFait: item.type_fait, date })}
          >
            › Exporter carte
          </button>
          <Link
            to="/drops"
            className="btn-ghost"
            style={{ display: 'inline-flex', textDecoration: 'none' }}
          >
            ← Drops
          </Link>
        </div>
      </article>
    </div>
  );
}
