import { Link } from 'react-router-dom';

/** Layout vitrine — pas de QuickCapture, pas de nav dashboard. */
export default function LayoutPublic({ children }) {
  return (
    <div className="layout" style={{ position: 'relative', minHeight: '100vh' }}>
      <div className="halftone-overlay" />
      <nav
        style={{
          display: 'flex',
          gap: 18,
          padding: 'var(--space-3) var(--space-4)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          textTransform: 'uppercase',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          alignItems: 'center',
          position: 'relative',
          zIndex: 2,
          background: 'rgba(6,10,26,0.75)',
        }}
      >
        <Link
          to="/"
          style={{
            color: 'var(--text)',
            textDecoration: 'none',
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '0.95rem',
            letterSpacing: '-0.03em',
          }}
        >
          TWIY
        </Link>
        <Link to="/catalogue/projets" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
          Code
        </Link>
        <Link to="/catalogue/instrus" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
          Sound
        </Link>
        <Link
          to="/login"
          className="btn-ghost"
          style={{ marginLeft: 'auto', textDecoration: 'none', padding: '6px 12px', fontSize: '0.68rem' }}
        >
          Entrer
        </Link>
      </nav>
      <main style={{ position: 'relative', zIndex: 1 }}>{children}</main>
    </div>
  );
}
