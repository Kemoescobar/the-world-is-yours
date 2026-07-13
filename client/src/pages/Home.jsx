import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <div className="halftone-overlay" />
      <div style={{
        position: 'absolute', inset: 0,
        background:
          'radial-gradient(ellipse at 20% 30%, rgba(19,39,90,0.9), transparent 55%), radial-gradient(ellipse at 80% 70%, rgba(10,17,40,0.95), transparent 50%), linear-gradient(160deg, #060a1a, #0d1b3e)',
      }} />
      <header style={{ position: 'relative', zIndex: 1, padding: 'var(--space-4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p className="compteur">THE WORLD IS YOURS</p>
        <Link to="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
          ENTRER
        </Link>
      </header>
      <main style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', minHeight: 'calc(100vh - 80px)' }}>
        <Link
          to="/catalogue/projets"
          style={{
            display: 'grid', placeItems: 'center', textDecoration: 'none', color: 'var(--text)',
            borderRight: '1px solid rgba(255,255,255,0.08)',
            transition: 'background var(--transition-vue)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', letterSpacing: '-0.03em' }}>CODE</h1>
            <p className="compteur">Projets · Preuves · Ship</p>
          </div>
        </Link>
        <Link
          to="/catalogue/instrus"
          style={{
            display: 'grid', placeItems: 'center', textDecoration: 'none', color: 'var(--text)',
            transition: 'background var(--transition-vue)',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 'clamp(3rem, 8vw, 6rem)', letterSpacing: '-0.03em' }}>SOUND</h1>
            <p className="compteur">Instrumentaux · Sessions · Drops</p>
          </div>
        </Link>
      </main>
    </div>
  );
}
