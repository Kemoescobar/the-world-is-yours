import { Link } from 'react-router-dom';

/** Layout vitrine — pas de QuickCapture, pas de nav dashboard. */
export default function LayoutPublic({ children }) {
  return (
    <div className="layout" style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="halftone-overlay" />
      <nav
        className="nav-chrome"
        style={{
          display: 'flex',
          gap: 18,
          padding: 'var(--space-3) var(--space-4)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          textTransform: 'uppercase',
          alignItems: 'center',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <Link to="/" className="nav-brand">
          TWIY
        </Link>
        <Link to="/catalogue/projets" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
          Code
        </Link>
        <span aria-hidden style={{ color: 'rgba(255,210,63,0.35)' }}>•</span>
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
        className="nav-chrome"
        style={{
          position: 'relative',
          zIndex: 2,
          padding: 'var(--space-3) var(--space-4)',
          borderTop: '1px solid rgba(200,220,255,0.12)',
          borderBottom: 'none',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.68rem',
          textTransform: 'uppercase',
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
          color: 'var(--text-muted)',
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
