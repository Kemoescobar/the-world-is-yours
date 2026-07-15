import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet, apiPost, apiPatch } from '../lib/api.js';
import { uploadCapture } from '../lib/storageUpload.js';
import CoverFlow from '../components/CoverFlow.jsx';

const empty = {
  titre: '',
  description: '',
  lien_github: '',
  lien_live: '',
  stack: '',
  statut: 'shippe',
};

function primaryShot(projet) {
  if (Array.isArray(projet.captures) && projet.captures.length) return projet.captures[0];
  return projet.capture_url || null;
}

function ProjetSleeve({ projet, index }) {
  const n = String(index + 1).padStart(2, '0');
  const shot = primaryShot(projet);
  return (
    <div className="cover-sleeve cover-sleeve--code chrome-specular">
      <div className={`cover-sleeve__media${shot ? '' : ' cover-sleeve__media--placeholder'}`}>
        {shot ? (
          <img
            src={shot}
            alt={projet.titre ? `Capture — ${projet.titre}` : 'Capture projet'}
            loading="lazy"
          />
        ) : (
          <>
            <div className="blueprint-grid" aria-hidden style={{ position: 'absolute', inset: 0, opacity: 0.55 }} />
            <img
              src="/brand/globe-hand.png"
              alt=""
              aria-hidden
              className="cover-sleeve__brand-fallback"
            />
          </>
        )}
        <span className="compteur cover-sleeve__badge" style={{ color: 'var(--jaune)' }}>
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

function ProjetEditForm({ projet, onSaved }) {
  const [form, setForm] = useState({
    titre: projet.titre || '',
    description: projet.description || '',
    lien_github: projet.lien_github || '',
    lien_live: projet.lien_live || '',
    stack: (projet.stack || []).join(', '),
    statut: projet.statut || 'shippe',
  });
  const [captures, setCaptures] = useState(
    Array.isArray(projet.captures) && projet.captures.length
      ? projet.captures
      : (projet.capture_url ? [projet.capture_url] : []),
  );
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState('');

  async function onFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBusy(true);
    setErreur('');
    try {
      const urls = [];
      for (const file of files) {
        urls.push(await uploadCapture(file, `projets/${projet.id}`));
      }
      setCaptures((prev) => [...prev, ...urls].slice(0, 12));
    } catch (err) {
      setErreur(err.message);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  function removeCapture(url) {
    setCaptures((prev) => prev.filter((u) => u !== url));
  }

  async function sauver(e) {
    e.preventDefault();
    setBusy(true);
    setErreur('');
    try {
      const updated = await apiPatch(`/projets/${projet.id}`, {
        titre: form.titre.trim(),
        description: form.description.trim() || null,
        lien_github: form.lien_github || null,
        lien_live: form.lien_live || null,
        stack: form.stack ? form.stack.split(',').map((s) => s.trim()).filter(Boolean) : [],
        statut: form.statut,
        captures,
      });
      onSaved(updated);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={sauver} className="chrome-panel chrome-edge catalogue-edit" style={{ padding: 'var(--space-3)', display: 'grid', gap: 10 }}>
      <p className="compteur">ÉDITER · {projet.titre}</p>
      <input
        required
        value={form.titre}
        onChange={(e) => setForm((f) => ({ ...f, titre: e.target.value }))}
        placeholder="titre"
        className="os-input"
      />
      <textarea
        value={form.description}
        onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
        placeholder="texte de présentation (lookbook)"
        className="os-input"
        rows={4}
        style={{ resize: 'vertical', fontFamily: 'inherit' }}
      />
      <input
        value={form.lien_live}
        onChange={(e) => setForm((f) => ({ ...f, lien_live: e.target.value }))}
        placeholder="lien_live"
        className="os-input"
      />
      <input
        value={form.lien_github}
        onChange={(e) => setForm((f) => ({ ...f, lien_github: e.target.value }))}
        placeholder="lien_github"
        className="os-input"
      />
      <input
        value={form.stack}
        onChange={(e) => setForm((f) => ({ ...f, stack: e.target.value }))}
        placeholder="stack (virgules)"
        className="os-input"
      />
      <div>
        <p className="compteur" style={{ marginBottom: 8 }}>CAPTURES · {captures.length}/12</p>
        {captures.length > 0 && (
          <div className="capture-thumbs">
            {captures.map((url) => (
              <div key={url} className="capture-thumbs__item">
                <img src={url} alt="" />
                <button type="button" className="btn-ghost" onClick={() => removeCapture(url)}>
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={busy || captures.length >= 12}
          onChange={onFiles}
          style={{ marginTop: 8 }}
        />
      </div>
      {erreur && <p className="annotation-manuscrite">{erreur}</p>}
      <button type="submit" className="btn-poster" disabled={busy}>
        {busy ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  );
}

export default function CatalogueProjets({ mode = 'public' }) {
  const editable = mode === 'edit';
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [erreur, setErreur] = useState('');
  const [focusItem, setFocusItem] = useState(null);
  const [editingId, setEditingId] = useState(null);

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
        captures: [],
      });
      setForm(empty);
      await charger();
    } catch (err) {
      setErreur(err.message);
    }
  }

  const deck = focusItem || items[0];
  const deckShots = deck
    ? (Array.isArray(deck.captures) && deck.captures.length
      ? deck.captures
      : (deck.capture_url ? [deck.capture_url] : []))
    : [];

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
          {['titre', 'description', 'lien_github', 'lien_live', 'stack'].map((k) => (
            k === 'description' ? (
              <textarea
                key={k}
                value={form[k]}
                onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                placeholder="texte de présentation"
                className="os-input"
                rows={3}
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            ) : (
              <input
                key={k}
                required={k === 'titre'}
                value={form[k]}
                onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                placeholder={k === 'stack' ? 'stack (virgules)' : k}
                className="os-input"
              />
            )
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
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
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
                  {editable && (
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => setEditingId(editingId === deck.id ? null : deck.id)}
                    >
                      {editingId === deck.id ? '› Fermer' : '› Éditer'}
                    </button>
                  )}
                </div>
              </div>
              {deck.description && (
                <p style={{ marginTop: 12, color: 'var(--text-muted)', maxWidth: 56 * 8, lineHeight: 1.5 }}>
                  {deck.description}
                </p>
              )}
              {(deck.stack || []).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                  {deck.stack.slice(0, 8).map((s) => (
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
              )}
              {deckShots.length > 0 && (
                <div className="capture-thumbs capture-thumbs--deck" style={{ marginTop: 14 }}>
                  {deckShots.map((url) => (
                    <a key={url} href={url} target="_blank" rel="noreferrer" className="capture-thumbs__item">
                      <img src={url} alt={`Capture — ${deck.titre}`} loading="lazy" />
                    </a>
                  ))}
                </div>
              )}
              {editable && editingId === deck.id && (
                <div style={{ marginTop: 16 }}>
                  <ProjetEditForm
                    key={`${deck.id}-${deckShots.join(',')}`}
                    projet={deck}
                    onSaved={(updated) => {
                      setItems((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
                      setFocusItem(updated);
                      setEditingId(null);
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {editable && (
            <div className="projet-index" style={{ marginTop: 'var(--space-4)' }}>
              <p className="compteur" style={{ marginBottom: 12 }}>INDEX · STUDIO</p>
              {items.map((p, i) => {
                const n = String(i + 1).padStart(2, '0');
                const shot = primaryShot(p);
                return (
                  <article key={p.id} className="projet-ship">
                    <div className={`projet-ship__media${shot ? '' : ' projet-ship__media--empty blueprint-grid'}`}>
                      {shot ? (
                        <img src={shot} alt="" loading="lazy" />
                      ) : (
                        <p className="compteur" style={{ opacity: 0.5 }}>NO CAPTURE</p>
                      )}
                      <span className="compteur" style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(6,10,26,0.75)', padding: '4px 8px', color: 'var(--jaune)' }}>
                        {n} / SHIPPÉ
                      </span>
                    </div>
                    <div className="projet-ship__body blueprint-grid">
                      <p className="compteur">CASE · CODE</p>
                      <h2 style={{ fontSize: '1.25rem', lineHeight: 1.05 }}>{p.titre}</h2>
                      {p.description && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: 0 }}>{p.description}</p>
                      )}
                      <button
                        type="button"
                        className="btn-ghost"
                        style={{ marginTop: 8, alignSelf: 'flex-start' }}
                        onClick={() => {
                          setFocusItem(p);
                          setEditingId(p.id);
                        }}
                      >
                        › Éditer
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
