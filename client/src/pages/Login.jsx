import { useState } from 'react';
import { Navigate, useLocation, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

const LOGIN_ATTEMPTS_KEY = 'twiy_login_attempts';
const LOGIN_MAX = 8;
const LOGIN_WINDOW_MS = 15 * 60 * 1000;

function loginRateLimited() {
  try {
    const raw = sessionStorage.getItem(LOGIN_ATTEMPTS_KEY);
    const data = raw ? JSON.parse(raw) : { n: 0, t: Date.now() };
    if (Date.now() - data.t > LOGIN_WINDOW_MS) return false;
    return data.n >= LOGIN_MAX;
  } catch {
    return false;
  }
}

function recordLoginFailure() {
  try {
    const raw = sessionStorage.getItem(LOGIN_ATTEMPTS_KEY);
    let data = raw ? JSON.parse(raw) : { n: 0, t: Date.now() };
    if (Date.now() - data.t > LOGIN_WINDOW_MS) data = { n: 0, t: Date.now() };
    data.n += 1;
    sessionStorage.setItem(LOGIN_ATTEMPTS_KEY, JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

export default function Login() {
  const { session, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [erreur, setErreur] = useState('');
  const [envoi, setEnvoi] = useState(false);

  if (session) {
    return <Navigate to={location.state?.from || '/chantier'} replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (loginRateLimited()) {
      setErreur('Trop de tentatives — réessaie dans quelques minutes');
      return;
    }
    setEnvoi(true);
    setErreur('');
    try {
      await signIn(email.trim(), password);
      sessionStorage.removeItem(LOGIN_ATTEMPTS_KEY);
      navigate(location.state?.from || '/chantier', { replace: true });
    } catch (err) {
      recordLoginFailure();
      setErreur(err.message || 'Connexion impossible');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div
      className="hud-frame"
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 'var(--space-4)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div className="atmosphere-void void-grid atmosphere-breathe" aria-hidden style={{ position: 'absolute', inset: 0 }} />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 70% 20%, rgba(138,61,50,0.38), transparent 50%), radial-gradient(ellipse at 20% 80%, rgba(255,90,60,0.1), transparent 45%), var(--bg-0)',
        }}
      />
      <div className="halftone-overlay halftone-live" style={{ position: 'absolute', opacity: 0.18 }} />
      <div className="grain grain-live" style={{ position: 'absolute' }} />
      <div className="scanlines scanlines-live" style={{ opacity: 0.5 }} />
      <span className="hud-corner hud-corner--tl" aria-hidden />
      <span className="hud-corner hud-corner--tr" aria-hidden />
      <span className="hud-corner hud-corner--bl" aria-hidden />
      <span className="hud-corner hud-corner--br" aria-hidden />

      <form
        onSubmit={onSubmit}
        className="anim-gate chrome-panel chrome-edge chrome-edge-live os-panel capture-sheet"
        style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 2 }}
      >
        <div className="os-panel__bar">
          <span>ACCESS · PRIVATE OS</span>
          <span className="compteur-dot">AUTH</span>
        </div>
        <div className="os-panel__body">
          <p className="compteur">
            <span className="caret-blink">›</span> LOOK 00 / GATE
          </p>
          <h1
            className="title-dither title-wide title-ghost-wrap"
            data-ghost="THE WORLD IS YOURS"
            style={{ fontSize: 'clamp(1.6rem, 5vw, 2.1rem)', marginTop: 10 }}
          >
            THE WORLD IS YOURS
          </h1>
          <p className="compteur" style={{ marginTop: 8 }}>Chroniques · Chantier</p>
          <div className="chrome-bar chrome-bar--thin" aria-hidden style={{ margin: '14px 0 4px', maxWidth: 120 }} />

          <label className="os-label" htmlFor="login-email" style={{ marginTop: 'var(--space-3)' }}>
            Email
          </label>
          <input
            id="login-email"
            type="email"
            required
            className="os-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
          />
          <label className="os-label" htmlFor="login-password" style={{ marginTop: 'var(--space-3)' }}>
            Mot de passe
          </label>
          <input
            id="login-password"
            type="password"
            required
            className="os-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {erreur && <p className="annotation-manuscrite" style={{ marginTop: 'var(--space-2)' }}>{erreur}</p>}
          <button type="submit" disabled={envoi} className="btn-poster" style={{ width: '100%', marginTop: 'var(--space-4)' }}>
            {envoi ? '…' : '› Enter'}
          </button>
          <p className="compteur" style={{ marginTop: 14, textAlign: 'center' }}>
            <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>‹ Retour public</Link>
          </p>
        </div>
      </form>
    </div>
  );
}
