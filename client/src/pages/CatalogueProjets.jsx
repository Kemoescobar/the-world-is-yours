import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, apiPost } from '../lib/api.js';
import CoverFlow from '../components/CoverFlow.jsx';

const empty = {
  titre: '',
  description: '',
  lien_github: '',
  lien_live: '',
  capture_url: '',
  stack: '',
  statut: 'shippe',
};

function ProjetSleeve({ projet, index }) {
  const n = String(index + 1).padStart(2, '0');
  return (
    <div className="cover-sleeve cover-sleeve--code chrome-specular">
      <div className="cover-sleeve__media">
        {projet.capture_url ? (
          <img
            src={projet.capture_url}
            alt={projet.titre ? `Capture — ${projet.titre}` : 'Capture projet'}
            loading="lazy"
          />
        ) : (
          <div className="blueprint-grid" aria-hidden style={{ position: 'absolute', inset: 0, opacity: 0.55 }} />
        )}
        <span className="compteur" style={{ position: 'relative', zIndex: 1, color: 'var(--jaune)' }}>
          {n} / SHIPPÉ
        </span>
      </div>
      <div className="cover-sleeve__body">
        <p className="compteur">CASE · CODE · BLUEPRINT</p>
        <h2 className="cover-sleeve__title">{projet.titre}</h2>
        <p className="compteur">
          {(projet.stack || []).slice(0, 3).join(' · ') || 'stack'}
          {projet.lien_live ? ' · LIVE' : ''}
        </p>
      </div>
    </div>
  );
}

function ProjetShip({ projet, index, featured }) {
  const n = String(index + 1).padStart(2, '0');
  const href = projet.lien_live || projet.lien_github || '#';
  const externe = Boolean(projet.lien_live || projet.lien_github);

  const inner = (
    <>
      <div className={`projet-ship__media${projet.capture_url ? '' : ' projet-ship__media--empty blueprint-grid'}`}>
        {projet.capture_url ? (
          <img
            src={projet.capture_url}
            alt={projet.titre ? `Capture — ${projet.titre}` : 'Capture projet'}
            loading="lazy"
          />
        ) : (
          <p className="compteur" style={{ opacity: 0.5 }}>NO CAPTURE</p>
        )}
        <span
          className="compteur"
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            background: 'rgba(6,10,26,0.75)',
            padding: '4px 8px',
            color: 'var(--jaune)',
          }}
        >
          {n} / SHIPPÉ
        </span>
      </div>
      <div className="projet-ship__body blueprint-grid">
        <p className="compteur">CASE · CODE</p>
        <h2 style={{ fontSize: featured ? 'clamp(1.6rem, 4vw, 2.4rem)' : 'clamp(1.25rem, 3vw, 1.7rem)', lineHeight: 1.05 }}>
          {projet.titre}
        </h2>
        {projet.description && (
          <p style={{ color: 'var(--text-muted)', fontSize: featured ? '1rem' : '0.9rem', maxWidth: 42 * 8, margin: 0 }}>
            {projet.description}
          </p>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
          {(projet.stack || []).slice(0, 6).map((s) => (
            <span
              key={s}
              className="compteur"
              style={{
                border: '1px solid rgba(255,255,255,0.14)',
                padding: '3px 7px',
                color: 'var(--text)',
              }}
            >
              {s}
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 8, alignItems: 'center' }}>
          {projet.lien_live && (
            <span style={{ color: 'var(--jaune)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.06em' }}>
              › LIVE
            </span>
          )}
          {projet.lien_github && (
            <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', letterSpacing: '0.06em' }}>
              › GITHUB
            </span>
          )}
          {!projet.lien_live && !projet.lien_github && (
            <span className="annotation-manuscrite" style={{ fontSize: '1rem' }}>lien à venir</span>
          )}
        </div>
      </div>
    </>
  );

  const className = `projet-ship${featured ? ' projet-ship--featured' : ''}`;

  if (!externe) {
    return <article className={className}>{inner}</article>;
  }

  return (
    <a className={className} href={href} target="_blank" rel="noreferrer">
      {inner}
    </a>
  );
}

export default function CatalogueProjets({ mode = 'public' }) {
  const editable = mode === 'edit';
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [erreur, setErreur] = useState('');
  const [focusItem, setFocusItem] = useState(null);

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

  const deck = focusItem || items[0];

  return (
    <div style={{ padding: 'var(--space-4)', maxWidth: 1100, margin: '0 auto' }}>
      <header className="catalogue-header hud-frame">
        <p className="compteur" style={{ marginBottom: 8 }}>
          <span className="caret-blink" aria-hidden>›</span> 01 • CODE • BLUEPRINT
          <span style={{ color: 'rgba(255,210,63,0.45)' }}> • </span>
          LOOKBOOK
        </p>
        <h1 className="title-wide title-dither title-ghost-wrap" data-ghost="PROJETS SHIPPÉS" style={{ fontSize: 'clamp(2.2rem, 7vw, 3.6rem)' }}>
          Projets shippés
        </h1>
        <p className="compteur" style={{ marginTop: 10 }}>
          {String(items.length).padStart(2, '0')} / {String(Math.max(items.length, 1)).padStart(2, '0')} case{items.length > 1 ? 's' : ''}
          {editable ? ' • studio' : (
            <> • <Link to="/login" style={{ color: 'var(--jaune)' }}>connexion</Link> pour ajouter</>
          )}
        </p>
        <div className="chrome-bar chrome-bar--thin" aria-hidden />
      </header>

      {editable && (
        <form onSubmit={creer} className="chrome-panel chrome-edge" style={{ padding: 'var(--space-3)', margin: 'var(--space-4) 0', display: 'grid', gap: 10 }}>
          <p className="compteur">NOUVEAU PROJET</p>
          {['titre', 'description', 'lien_github', 'lien_live', 'capture_url', 'stack'].map((k) => (
            <input
              key={k}
              required={k === 'titre'}
              value={form[k]}
              onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
              placeholder={k === 'stack' ? 'stack (virgules)' : k === 'capture_url' ? 'capture_url (image)' : k}
              className="os-input"
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
          <p className="compteur" style={{ position: 'relative' }}>MUR DE PREUVES • CODE</p>
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
        <>
          <CoverFlow
            items={items}
            label="Projets shippés"
            counterPrefix="CASE"
            onFocusChange={(_, item) => setFocusItem(item)}
            renderSleeve={(item, { index }) => (
              <ProjetSleeve projet={item} index={index} />
            )}
          />

          {deck && (
            <div className="chrome-panel chrome-edge" style={{ padding: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <p className="compteur">
                  <span className="caret-blink" aria-hidden>›</span> DECK · {deck.titre}
                </p>
                <div style={{ display: 'flex', gap: 12 }}>
                  {deck.lien_live && (
                    <a href={deck.lien_live} target="_blank" rel="noreferrer" className="btn-ghost" style={{ textDecoration: 'none', padding: '6px 10px' }}>
                      › LIVE
                    </a>
                  )}
                  {deck.lien_github && (
                    <a href={deck.lien_github} target="_blank" rel="noreferrer" className="btn-ghost" style={{ textDecoration: 'none', padding: '6px 10px' }}>
                      › GITHUB
                    </a>
                  )}
                </div>
              </div>
              {deck.description && (
                <p style={{ marginTop: 12, color: 'var(--text-muted)', maxWidth: 56 * 8, lineHeight: 1.5 }}>
                  {deck.description}
                </p>
              )}
            </div>
          )}

          {editable && (
            <div className="projet-index" style={{ marginTop: 'var(--space-4)' }}>
              <p className="compteur" style={{ marginBottom: 12 }}>INDEX · STUDIO</p>
              {items.map((p, i) => (
                <ProjetShip key={p.id} projet={p} index={i} featured={i === 0} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
