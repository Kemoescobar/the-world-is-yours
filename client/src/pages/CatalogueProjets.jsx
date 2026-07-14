import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, apiPost } from '../lib/api.js';

const empty = {
  titre: '',
  description: '',
  lien_github: '',
  lien_live: '',
  capture_url: '',
  stack: '',
  statut: 'shippe',
};

export default function CatalogueProjets({ mode = 'public' }) {
  const editable = mode === 'edit';
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [erreur, setErreur] = useState('');

  async function charger() {
    setItems(await apiGet('/projets', { auth: editable }) || []);
  }

  useEffect(() => { charger().catch(() => setItems([])); }, [editable]);

  async function creer(e) {
    e.preventDefault();
    setErreur('');
    try {
      await apiPost('/projets', {
        ...form,
        stack: form.stack ? form.stack.split(',').map((s) => s.trim()).filter(Boolean) : [],
        lien_github: form.lien_github || null,
        lien_live: form.lien_live || null,
        capture_url: form.capture_url || null,
      });
      setForm(empty);
      await charger();
    } catch (err) {
      setErreur(err.message);
    }
  }

  return (
    <div style={{ padding: 'var(--space-4)' }}>
      <p className="compteur" style={{ marginBottom: 8 }}>01 · CODE · BLUEPRINT</p>
      <h1 style={{ fontSize: 'clamp(2rem, 6vw, 3.2rem)' }}>Projets</h1>
      <p className="compteur" style={{ marginTop: 8 }}>
        {items.length} shippés
        {editable ? ' · studio' : (
          <> · <Link to="/login" style={{ color: 'var(--jaune)' }}>connexion</Link> pour ajouter</>
        )}
      </p>

      {editable && (
        <form onSubmit={creer} className="poster-panel blueprint-grid" style={{ padding: 'var(--space-3)', margin: 'var(--space-4) 0', display: 'grid', gap: 10 }}>
          <p className="compteur">NOUVEAU PROJET</p>
          {['titre', 'description', 'lien_github', 'lien_live', 'capture_url', 'stack'].map((k) => (
            <input
              key={k}
              required={k === 'titre'}
              value={form[k]}
              onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
              placeholder={k === 'stack' ? 'stack (virgules)' : k}
              style={{ padding: 10, background: 'var(--bg-2)', color: 'var(--text)', border: '1px solid var(--bg-3)' }}
            />
          ))}
          {erreur && <p className="annotation-manuscrite">{erreur}</p>}
          <button type="submit" className="btn-poster">
            Ajouter
          </button>
        </form>
      )}

      {!items.length ? (
        <div className="empty-wall" style={{ marginTop: 'var(--space-4)' }}>
          <div className="blueprint-grid" aria-hidden style={{ position: 'absolute', inset: 0, opacity: 0.35 }} />
          <p className="compteur" style={{ position: 'relative' }}>MUR DE PREUVES · CODE</p>
          <h2 style={{ position: 'relative', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', margin: '12px 0' }}>Aucun projet shippé</h2>
          <p style={{ position: 'relative', color: 'var(--text-muted)', maxWidth: 360 }}>
            La vitrine CODE attend des captures et des liens live — pas une grille vide.
          </p>
          <span className="annotation-manuscrite" style={{ position: 'relative', marginTop: 16, display: 'block' }}>en construction</span>
          {editable ? null : (
            <Link to="/login" className="btn-poster" style={{ position: 'relative', marginTop: 20, textDecoration: 'none', display: 'inline-flex' }}>
              Entrer pour ajouter
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
          {items.map((p) => (
            <article key={p.id} className="poster-panel blueprint-grid" style={{ padding: 'var(--space-3)' }}>
              {p.capture_url && (
                <img src={p.capture_url} alt="" loading="lazy" style={{ width: '100%', height: 140, objectFit: 'cover', marginBottom: 10 }} />
              )}
              <h2 style={{ fontSize: '1.15rem' }}>{p.titre}</h2>
              {p.description && <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{p.description}</p>}
              <p className="compteur">{(p.stack || []).join(' · ') || '—'}</p>
              <div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
                {p.lien_live && <a href={p.lien_live} target="_blank" rel="noreferrer" style={{ color: 'var(--jaune)' }}>Live</a>}
                {p.lien_github && <a href={p.lien_github} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)' }}>GitHub</a>}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
