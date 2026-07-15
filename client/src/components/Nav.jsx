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
      className="nav-primary nav-chrome"
      style={{
        display: 'flex',
        gap: 'var(--space-3)',
        padding: 'var(--space-3)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.72rem',
        textTransform: 'uppercase',
        alignItems: 'center',
        flexWrap: 'wrap',
        position: 'sticky',
        top: 0,
        zIndex: 20,
      }}
    >
      <Link to="/" className="nav-brand" style={{ marginRight: 4 }}>
        TWIY
      </Link>

      {primaire.map((l) => (
        <NavLink key={l.to} to={l.to} style={linkStyle}>
          {l.label}
        </NavLink>
      ))}

      <span style={{ color: 'rgba(255,210,63,0.3)' }}>•</span>

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
