import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <div className="halftone-overlay" />
      <div className="grain" style={{ position: 'fixed' }} />
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
          <p
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: 'clamp(1.4rem, 4vw, 2rem)',
              letterSpacing: '-0.04em',
              margin: 0,
              lineHeight: 1,
            }}
          >
            THE WORLD IS YOURS
          </p>
          <p className="compteur" style={{ marginTop: 8 }}>
            <span className="caret-blink">›</span> PUBLIC PROOF · CODE / SOUND
          </p>
        </div>
        <Link
          to="/login"
          className="btn-ghost"
          style={{ textDecoration: 'none', padding: '10px 14px' }}
        >
          Entrer
        </Link>
      </header>

      <main
        className="home-split"
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          minHeight: 'calc(100vh - 120px)',
        }}
      >
        <Link
          to="/catalogue/projets"
          className="anim-split"
          style={{
            display: 'grid',
            placeItems: 'center',
            textDecoration: 'none',
            color: 'var(--text)',
            borderRight: '1px solid rgba(255,255,255,0.1)',
            position: 'relative',
            overflow: 'hidden',
            animationDelay: '80ms',
          }}
        >
          <div
            className="blueprint-grid"
            aria-hidden
            style={{ position: 'absolute', inset: 0, opacity: 0.45 }}
          />
          <div style={{ position: 'relative', textAlign: 'center', padding: 'var(--space-4)' }}>
            <p className="compteur" style={{ marginBottom: 12 }}>01 · BLUEPRINT</p>
            <h1 style={{ fontSize: 'clamp(3.5rem, 12vw, 7rem)', lineHeight: 0.85 }}>CODE</h1>
            <p className="compteur" style={{ marginTop: 16 }}>Projets · Preuves · Ship</p>
          </div>
        </Link>

        <Link
          to="/catalogue/instrus"
          className="anim-split"
          style={{
            display: 'grid',
            placeItems: 'center',
            textDecoration: 'none',
            color: 'var(--text)',
            position: 'relative',
            overflow: 'hidden',
            animationDelay: '160ms',
          }}
        >
          <img
            src="/brand/vinyl-chrome.png"
            alt=""
            aria-hidden
            style={{
              position: 'absolute',
              width: 'min(55vw, 420px)',
              opacity: 0.22,
              filter: 'saturate(0.8)',
              transform: 'rotate(-18deg)',
              pointerEvents: 'none',
            }}
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
            <h1 style={{ fontSize: 'clamp(3.5rem, 12vw, 7rem)', lineHeight: 0.85 }}>SOUND</h1>
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
          bottom: '8%',
          transform: 'translateX(-50%)',
          width: 'min(28vw, 220px)',
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
