import { Link } from 'react-router-dom';

/** Layout vitrine — pas de QuickCapture, pas de nav dashboard. */
export default function LayoutPublic({ children }) {
  return (
    <div className="layout" style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
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
            letterSpacing: '-0.04em',
            textTransform: 'uppercase',
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
      <main style={{ position: 'relative', zIndex: 1, flex: 1 }}>{children}</main>
      <footer
        style={{
          position: 'relative',
          zIndex: 2,
          padding: 'var(--space-3) var(--space-4)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.68rem',
          textTransform: 'uppercase',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          color: 'var(--text-muted)',
          background: 'rgba(6,10,26,0.75)',
        }}
      >
        <span>THE WORLD IS YOURS</span>
        <Link to="/mentions" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
          Mentions légales
        </Link>
        <Link to="/confidentialite" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
          Confidentialité
        </Link>
      </footer>
    </div>
  );
}
