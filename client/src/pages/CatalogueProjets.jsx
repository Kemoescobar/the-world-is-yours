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
      <h1>Projets</h1>
      <p className="compteur">
        {items.length} shippés
        {editable ? ' · studio' : (
          <> · <Link to="/login" style={{ color: 'var(--jaune)' }}>connexion</Link> pour ajouter</>
        )}
      </p>

      {editable && (
        <form onSubmit={creer} className="blueprint-grid" style={{ background: 'var(--bg-1)', padding: 'var(--space-3)', borderRadius: 4, margin: 'var(--space-4) 0', display: 'grid', gap: 10 }}>
          <p className="compteur">NOUVEAU PROJET</p>
          {['titre', 'description', 'lien_github', 'lien_live', 'capture_url', 'stack'].map((k) => (
            <input
              key={k}
              required={k === 'titre'}
              value={form[k]}
              onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
              placeholder={k === 'stack' ? 'stack (virgules)' : k}
              style={{ padding: 10, background: 'var(--bg-2)', color: 'var(--text)', border: '1px solid var(--bg-3)', borderRadius: 4 }}
            />
          ))}
          {erreur && <p className="annotation-manuscrite">{erreur}</p>}
          <button type="submit" style={{ padding: 10, border: 'none', borderRadius: 4, background: 'var(--jaune)', color: '#060a1a', fontWeight: 700, cursor: 'pointer' }}>
            Ajouter
          </button>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
        {items.map((p) => (
          <article key={p.id} className="blueprint-grid" style={{ background: 'var(--bg-1)', padding: 'var(--space-3)', borderRadius: 4 }}>
            {p.capture_url && (
              <img src={p.capture_url} alt="" loading="lazy" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 4, marginBottom: 10 }} />
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
    </div>
  );
}
