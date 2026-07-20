import { Link, NavLink } from 'react-router-dom';
import { useSecretLoginClick } from '../lib/useSecretLoginClick.js';
import MoodboardPatchwork from './MoodboardPatchwork.jsx';

/** Layout vitrine — pas de QuickCapture, pas de nav dashboard. */
export default function LayoutPublic({ children }) {
  const onSecretLogin = useSecretLoginClick();

  return (
    <div className="layout registre-quotidien" style={{ position: 'relative', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div className="halftone-overlay halftone-live" />
      <div className="grain grain-live" style={{ position: 'fixed', opacity: 0.12, zIndex: 1 }} aria-hidden />
      <nav
        className="nav-chrome nav-public chrome-specular"
        aria-label="Navigation publique"
        style={{ position: 'relative', overflow: 'hidden' }}
      >
        <MoodboardPatchwork variant="strip" />
        <div className="chrome-bar--nav" aria-hidden style={{ top: 0, bottom: 'auto' }} />
        <Link to="/" className="nav-brand nav-public__brand" style={{ position: 'relative', zIndex: 1 }}>
          <span className="nav-os__brand-mark">TWIY</span>
          <span className="nav-os__brand-full">THE WORLD IS YOURS</span>
        </Link>
        <span className="nav-os__tick" aria-hidden style={{ position: 'relative', zIndex: 1 }}>
          › PUBLIC
        </span>
        <span className="nav-os__sep" aria-hidden style={{ position: 'relative', zIndex: 1 }}>
          •
        </span>
        <div className="nav-public__rail" style={{ position: 'relative', zIndex: 1 }}>
          <NavLink to="/catalogue/projets" className="nav-os__link">
            Code
          </NavLink>
          <span className="nav-os__sep" aria-hidden>
            •
          </span>
          <NavLink to="/catalogue/instrus" className="nav-os__link">
            Sound
          </NavLink>
        </div>
        <div className="chrome-bar--nav chrome-bar--thin" aria-hidden />
      </nav>
      <main style={{ position: 'relative', zIndex: 1, flex: 1 }}>{children}</main>
      <footer
        className="nav-chrome nav-public__foot"
      >
        <span
          onClick={onSecretLogin}
          style={{ cursor: 'default', userSelect: 'none' }}
        >
          THE WORLD IS YOURS
        </span>
        <span className="nav-os__sep" aria-hidden>
          •
        </span>
        <Link to="/mentions" className="nav-os__link">
          Mentions légales
        </Link>
        <Link to="/confidentialite" className="nav-os__link">
          Confidentialité
        </Link>
      </footer>
    </div>
  );
}
