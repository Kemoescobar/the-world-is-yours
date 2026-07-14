import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../lib/api.js';

export default function Home() {
  const [stats, setStats] = useState({ projets: 0, instrus: 0, arcs: 3 });

  useEffect(() => {
    Promise.all([
      apiGet('/projets', { auth: false }).catch(() => []),
      apiGet('/instrumentaux', { auth: false }).catch(() => []),
      apiGet('/arcs', { auth: false }).catch(() => []),
    ]).then(([projets, instrus, arcs]) => {
      setStats({
        projets: (projets || []).length,
        instrus: (instrus || []).length,
        arcs: (arcs || []).length || 3,
      });
    });
  }, []);

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <div className="halftone-overlay halftone-live" />
      <div className="grain grain-live" style={{ position: 'fixed' }} />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(91,45,158,0.28), transparent 45%), radial-gradient(ellipse at 15% 60%, rgba(19,39,90,0.85), transparent 50%), radial-gradient(ellipse at 85% 70%, rgba(10,17,40,0.95), transparent 45%), linear-gradient(165deg, #060a1a, #0a1128 40%, #0d1b3e)',
        }}
      />

      <header
        className="anim-split"
        style={{
          position: 'relative',
          zIndex: 2,
          padding: 'var(--space-4)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
        }}
      >
        <div>
          <p className="title-dither" style={{ fontSize: 'clamp(1.6rem, 5vw, 2.4rem)', margin: 0, lineHeight: 1 }}>
            THE WORLD IS YOURS
          </p>
          <p className="compteur" style={{ marginTop: 8 }}>
            <span className="caret-blink">›</span> PUBLIC PROOF · CODE / SOUND
          </p>
        </div>
        <Link to="/login" className="btn-ghost" style={{ textDecoration: 'none', padding: '10px 14px' }}>
          Entrer
        </Link>
      </header>

      <div
        className="anim-split proof-stats"
        style={{ position: 'relative', zIndex: 2, animationDelay: '40ms' }}
      >
        <div>
          <p className="compteur">SHIPPÉS</p>
          <p className="proof-stats__n">{stats.projets}</p>
        </div>
        <div>
          <p className="compteur">SHOWCASE</p>
          <p className="proof-stats__n">{stats.instrus}</p>
        </div>
        <div>
          <p className="compteur">ARCS</p>
          <p className="proof-stats__n">{stats.arcs}</p>
        </div>
      </div>

      <main
        className="home-split"
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          minHeight: 'calc(100vh - 200px)',
        }}
      >
        <Link
          to="/catalogue/projets"
          className="anim-split home-pane home-pane--code"
          style={{ animationDelay: '80ms', textDecoration: 'none', color: 'var(--text)' }}
        >
          <div className="blueprint-grid" aria-hidden style={{ position: 'absolute', inset: 0, opacity: 0.45 }} />
          <div style={{ position: 'relative', textAlign: 'center', padding: 'var(--space-4)' }}>
            <p className="compteur" style={{ marginBottom: 12 }}>01 · BLUEPRINT</p>
            <h1 className="home-pane__title">CODE</h1>
            <p className="compteur" style={{ marginTop: 16 }}>Projets · Preuves · Ship</p>
          </div>
        </Link>

        <Link
          to="/catalogue/instrus"
          className="anim-split home-pane home-pane--sound"
          style={{ animationDelay: '160ms', textDecoration: 'none', color: 'var(--text)' }}
        >
          <img
            src="/brand/vinyl-chrome.png"
            alt=""
            aria-hidden
            className="home-pane__vinyl"
          />
          <div
            aria-hidden
            style={{
              position: 'absolute',
              inset: 0,
              background: 'radial-gradient(circle at 60% 50%, rgba(200,220,255,0.12), transparent 55%)',
            }}
          />
          <div style={{ position: 'relative', textAlign: 'center', padding: 'var(--space-4)' }}>
            <p className="compteur" style={{ marginBottom: 12, color: 'var(--chrome)' }}>02 · CHROME</p>
            <h1 className="home-pane__title">SOUND</h1>
            <p className="compteur" style={{ marginTop: 16 }}>Instrumentaux · Sessions · Drops</p>
          </div>
        </Link>
      </main>

      <img
        src="/brand/globe-youth.png"
        alt=""
        aria-hidden
        style={{
          position: 'absolute',
          left: '50%',
          bottom: '6%',
          transform: 'translateX(-50%)',
          width: 'min(26vw, 200px)',
          opacity: 0.35,
          zIndex: 1,
          pointerEvents: 'none',
          filter: 'contrast(1.05)',
          mixBlendMode: 'screen',
        }}
      />
    </div>
  );
}
