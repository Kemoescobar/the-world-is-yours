import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

const primaire = [
  { to: '/chantier', label: 'Chantier' },
  { to: '/studio/instrus', label: 'Instrus' },
  { to: '/studio/projets', label: 'Projets' },
  { to: '/drops', label: 'Drops' },
  { to: '/streaks', label: 'Streaks' },
];

const outils = [
  { to: '/freelance', label: 'Freelance' },
  { to: '/portefeuille', label: 'Portefeuille' },
  { to: '/insights', label: 'Insights' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/revue', label: 'Revue' },
  { to: '/parametres', label: 'Paramètres' },
];

const linkStyle = ({ isActive }) => ({
  color: isActive ? 'var(--jaune)' : 'var(--text-muted)',
  textDecoration: 'none',
});

export default function Nav() {
  const { signOut, session } = useAuth();

  return (
    <nav
      className="nav-primary"
      style={{
        display: 'flex',
        gap: 'var(--space-3)',
        padding: 'var(--space-3)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.72rem',
        textTransform: 'uppercase',
        alignItems: 'center',
        flexWrap: 'wrap',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(6,10,26,0.85)',
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 20,
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
          marginRight: 4,
        }}
      >
        TWIY
      </Link>

      {primaire.map((l) => (
        <NavLink key={l.to} to={l.to} style={linkStyle}>
          {l.label}
        </NavLink>
      ))}

      <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>

      {outils.map((l) => (
        <NavLink key={l.to} to={l.to} style={linkStyle}>
          {l.label}
        </NavLink>
      ))}

      <span style={{ marginLeft: 'auto', color: 'var(--text-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {session?.user?.email}
      </span>
      <button
        type="button"
        onClick={() => signOut()}
        className="btn-ghost"
        style={{ padding: '4px 8px', fontSize: '0.65rem' }}
      >
        Out
      </button>
    </nav>
  );
}
