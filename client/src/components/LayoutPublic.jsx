import { Link } from 'react-router-dom';

/** Layout vitrine — pas de QuickCapture, pas de nav dashboard. */
export default function LayoutPublic({ children }) {
  return (
    <div className="layout">
      <div className="halftone-overlay" />
      <nav style={{
        display: 'flex', gap: 16, padding: 'var(--space-3)',
        fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textTransform: 'uppercase',
        borderBottom: '1px solid rgba(255,255,255,0.06)', alignItems: 'center',
      }}>
        <Link to="/" style={{ color: 'var(--text)', textDecoration: 'none' }}>TWIY</Link>
        <Link to="/catalogue/projets" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Code</Link>
        <Link to="/catalogue/instrus" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Sound</Link>
        <Link to="/login" style={{ marginLeft: 'auto', color: 'var(--jaune)', textDecoration: 'none' }}>Entrer</Link>
      </nav>
      <main>{children}</main>
    </div>
  );
}
