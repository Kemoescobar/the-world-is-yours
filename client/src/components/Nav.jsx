import { useId, useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

const primaire = [
  { to: '/chantier', label: 'Chantier' },
  { to: '/studio/instrus', label: 'Instrus' },
  { to: '/studio/projets', label: 'Projets' },
  { to: '/drops', label: 'Drops' },
  { to: '/streaks', label: 'Streaks' },
  { to: '/rayonnement', label: 'Rayonnement' },
];

const outils = [
  { to: '/ere', label: 'Ère' },
  { to: '/freelance', label: 'Freelance' },
  { to: '/portefeuille', label: 'Portefeuille' },
  { to: '/insights', label: 'Insights' },
  { to: '/analytics', label: 'Analytics' },
  { to: '/revue', label: 'Revue' },
  { to: '/parametres', label: 'Paramètres' },
];

function pad(n) {
  return String(n).padStart(2, '0');
}

export default function Nav() {
  const { signOut, session } = useAuth();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const now = new Date();
  const stamp = `${now.getFullYear()}.${pad(now.getMonth() + 1)}.${pad(now.getDate())}`;
  const archiveIndex = `${pad(primaire.length)} / ${pad(outils.length)}`;

  function closeMenu() {
    setOpen(false);
  }

  return (
    <nav
      className="nav-primary nav-chrome nav-os chrome-edge chrome-edge-live chrome-specular"
      aria-label="Navigation privée"
    >
      <div className="chrome-bar--nav" aria-hidden style={{ top: 0, bottom: 'auto' }} />

      <div className="nav-os__mast">
        <Link to="/" className="nav-brand nav-os__brand" onClick={closeMenu}>
          <span className="nav-os__brand-mark">TWIY</span>
          <span className="nav-os__brand-full">THE WORLD IS YOURS</span>
        </Link>

        <div className="nav-os__status" aria-hidden>
          <span className="nav-os__tick">› PRIVATE</span>
          <span className="nav-os__sep">•</span>
          <span className="compteur nav-os__stamp">{stamp}</span>
          <span className="nav-os__sep">•</span>
          <span className="compteur nav-os__archive">{archiveIndex}</span>
        </div>

        <button
          type="button"
          className="nav-os__burger btn-ghost"
          aria-expanded={open}
          aria-controls={menuId}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Close' : 'Menu'}
        </button>

        <div className="nav-os__meta">
          <span className="nav-os__email" title={session?.user?.email || ''}>
            {session?.user?.email}
          </span>
          <button
            type="button"
            onClick={() => signOut()}
            className="btn-ghost nav-os__out"
          >
            Out
          </button>
        </div>
      </div>

      <div
        id={menuId}
        className={`nav-os__deck${open ? ' is-open' : ''}`}
      >
        <div className="nav-os__group">
          <span className="nav-os__kicker">
            <span aria-hidden>01</span>
            <span className="nav-os__sep">•</span>
            Field
          </span>
          <div className="nav-os__rail">
            {primaire.map((l, i) => (
              <NavLink
                key={l.to}
                to={l.to}
                className="nav-os__link"
                onClick={closeMenu}
              >
                <span className="nav-os__idx" aria-hidden>
                  {pad(i + 1)}
                </span>
                {l.label}
              </NavLink>
            ))}
          </div>
        </div>

        <span className="nav-os__sep nav-os__sep--deck" aria-hidden>
          •
        </span>

        <div className="nav-os__group">
          <span className="nav-os__kicker">
            <span aria-hidden>02</span>
            <span className="nav-os__sep">•</span>
            Sys
          </span>
          <div className="nav-os__rail">
            {outils.map((l, i) => (
              <NavLink
                key={l.to}
                to={l.to}
                className="nav-os__link"
                onClick={closeMenu}
              >
                <span className="nav-os__idx" aria-hidden>
                  {pad(i + 1)}
                </span>
                {l.label}
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      <div className="chrome-bar--nav chrome-bar--thin" aria-hidden />
    </nav>
  );
}
