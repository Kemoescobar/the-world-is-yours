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
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 'var(--space-4)' }}>
      <form
        onSubmit={onSubmit}
        style={{ width: '100%', maxWidth: 380, background: 'var(--bg-2)', padding: 'var(--space-4)', borderRadius: 8 }}
      >
        <h1 style={{ fontSize: '1.6rem' }}>THE WORLD IS YOURS</h1>
        <p className="compteur" style={{ marginTop: 'var(--space-2)' }}>Accès Chroniques</p>

        <label style={{ display: 'block', marginTop: 'var(--space-4)', fontSize: '0.85rem' }}>
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              display: 'block', width: '100%', marginTop: 6, padding: 10,
              background: 'var(--bg-1)', color: 'var(--text)', border: '1px solid var(--bg-3)', borderRadius: 4,
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
              background: 'var(--bg-1)', color: 'var(--text)', border: '1px solid var(--bg-3)', borderRadius: 4,
            }}
          />
        </label>
        {erreur && <p className="annotation-manuscrite" style={{ marginTop: 'var(--space-2)' }}>{erreur}</p>}
        <button
          type="submit"
          disabled={envoi}
          style={{
            width: '100%', marginTop: 'var(--space-4)', padding: 12, border: 'none', borderRadius: 4,
            background: 'var(--jaune)', color: '#060a1a', fontFamily: 'var(--font-display)', fontWeight: 700, cursor: 'pointer',
          }}
        >
          {envoi ? '…' : 'Entrer'}
        </button>
      </form>
    </div>
  );
}
