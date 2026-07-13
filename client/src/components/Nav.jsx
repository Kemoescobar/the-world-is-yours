import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

const liens = [
  { to: '/chantier', label: 'Chantier' },
  { to: '/studio/instrus', label: 'Instrus' },
  { to: '/studio/projets', label: 'Projets' },
  { to: '/drops', label: 'Drops' },
  { to: '/freelance', label: 'Freelance' },
  { to: '/portefeuille', label: 'Portefeuille' },
  { to: '/streaks', label: 'Streaks' },
  { to: '/insights', label: 'Insights' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/revue', label: 'Revue' },
  { to: '/parametres', label: 'Paramètres' },
];

export default function Nav() {
  const { signOut, session } = useAuth();

  return (
    <nav style={{
      display: 'flex', gap: 'var(--space-3)', padding: 'var(--space-3)',
      fontFamily: 'var(--font-mono)', fontSize: '0.75rem', textTransform: 'uppercase',
      alignItems: 'center', flexWrap: 'wrap', borderBottom: '1px solid rgba(255,255,255,0.06)',
    }}>
      <Link to="/" style={{ color: 'var(--text)', textDecoration: 'none', marginRight: 8 }}>TWIY</Link>
      {liens.map((l) => (
        <NavLink key={l.to} to={l.to} style={({ isActive }) => ({ color: isActive ? 'var(--jaune)' : 'var(--text-muted)', textDecoration: 'none' })}>
          {l.label}
        </NavLink>
      ))}
      <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
        {session?.user?.email}
      </span>
      <button
        type="button"
        onClick={() => signOut()}
        style={{ background: 'transparent', border: '1px solid var(--bg-3)', color: 'var(--text-muted)', borderRadius: 4, padding: '4px 8px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}
      >
        Déconnexion
      </button>
    </nav>
  );
}
