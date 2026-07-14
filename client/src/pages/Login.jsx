import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';

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
    setEnvoi(true);
    setErreur('');
    try {
      await signIn(email.trim(), password);
      navigate(location.state?.from || '/chantier', { replace: true });
    } catch (err) {
      setErreur(err.message || 'Connexion impossible');
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: 'var(--space-4)',
        position: 'relative',
        overflow: 'hidden',
        background:
          'radial-gradient(ellipse at 70% 20%, rgba(91,45,158,0.35), transparent 50%), var(--bg-0)',
      }}
    >
      <div className="halftone-overlay" style={{ position: 'absolute', opacity: 0.16 }} />
      <div className="scanlines" />
      <form
        onSubmit={onSubmit}
        className="anim-gate poster-panel"
        style={{ width: '100%', maxWidth: 400, padding: 'var(--space-4)', position: 'relative', zIndex: 2 }}
      >
        <p className="compteur"><span className="caret-blink">›</span> ACCESS</p>
        <h1 style={{ fontSize: 'clamp(1.6rem, 5vw, 2rem)', marginTop: 8 }}>THE WORLD IS YOURS</h1>
        <p className="compteur" style={{ marginTop: 'var(--space-2)' }}>Chroniques</p>

        <label style={{ display: 'block', marginTop: 'var(--space-4)', fontSize: '0.85rem' }}>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              display: 'block', width: '100%', marginTop: 6, padding: 10,
              background: 'var(--bg-1)', color: 'var(--text)', border: '1px solid var(--bg-3)',
            }}
          />
        </label>
        <label style={{ display: 'block', marginTop: 'var(--space-3)', fontSize: '0.85rem' }}>
          Mot de passe
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              display: 'block', width: '100%', marginTop: 6, padding: 10,
              background: 'var(--bg-1)', color: 'var(--text)', border: '1px solid var(--bg-3)',
            }}
          />
        </label>
        {erreur && <p className="annotation-manuscrite" style={{ marginTop: 'var(--space-2)' }}>{erreur}</p>}
        <button type="submit" disabled={envoi} className="btn-poster" style={{ width: '100%', marginTop: 'var(--space-4)' }}>
          {envoi ? '…' : '› Enter'}
        </button>
      </form>
    </div>
  );
}
