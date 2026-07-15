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

export default function Nav() {
  const { signOut, session } = useAuth();
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '.');

  return (
    <nav className="nav-primary nav-chrome nav-os chrome-edge chrome-edge-live chrome-specular" aria-label="Navigation privée">
      <div className="chrome-bar--nav" aria-hidden style={{ top: 0, bottom: 'auto' }} />
      <Link to="/" className="nav-brand" style={{ marginRight: 2 }}>
        TWIY
      </Link>
      <span className="compteur" style={{ color: 'rgba(138,149,184,0.7)', fontSize: '0.58rem' }}>
        {stamp}
      </span>

      <div className="nav-os__rail">
        {primaire.map((l) => (
          <NavLink key={l.to} to={l.to}>
            {l.label}
          </NavLink>
        ))}
      </div>

      <span className="nav-os__sep" aria-hidden>
        •
      </span>

      <div className="nav-os__rail">
        {outils.map((l) => (
          <NavLink key={l.to} to={l.to}>
            {l.label}
          </NavLink>
        ))}
      </div>

      <div className="nav-os__meta">
        <span className="nav-os__email" title={session?.user?.email || ''}>
          {session?.user?.email}
        </span>
        <button
          type="button"
          onClick={() => signOut()}
          className="btn-ghost"
          style={{ padding: '4px 8px', fontSize: '0.62rem' }}
        >
          Out
        </button>
      </div>
    </nav>
  );
}
