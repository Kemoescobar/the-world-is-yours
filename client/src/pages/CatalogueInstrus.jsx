import { useEffect, useMemo, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { apiGet, apiPost, apiPatch } from '../lib/api.js';
import { uploadCapture } from '../lib/storageUpload.js';
import CoverFlow from '../components/CoverFlow.jsx';

function Player({ url, peaks }) {
  const ref = useRef(null);
  const ws = useRef(null);

  useEffect(() => {
    if (!ref.current || !url) return undefined;
    ws.current = WaveSurfer.create({
      container: ref.current,
      waveColor: '#8a95b8',
      progressColor: '#ffd23f',
      cursorColor: '#ff3b30',
      height: 48,
      barWidth: 2,
      url,
      peaks: peaks || undefined,
    });
    return () => ws.current?.destroy();
  }, [url, peaks]);

  return (
    <div>
      <div ref={ref} />
      <button
        type="button"
        onClick={() => ws.current?.playPause()}
        className="btn-ghost"
        style={{ marginTop: 8, alignSelf: 'flex-start' }}
      >
        › Play / Pause
      </button>
    </div>
  );
}

async function peaksFromFile(file) {
  const audioCtx = new AudioContext();
  const buffer = await audioCtx.decodeAudioData(await file.arrayBuffer());
  const raw = buffer.getChannelData(0);
  const samples = 200;
  const block = Math.floor(raw.length / samples);
  const peaks = [];
  for (let i = 0; i < samples; i += 1) {
    let sum = 0;
    for (let j = 0; j < block; j += 1) sum += Math.abs(raw[i * block + j] || 0);
    peaks.push(sum / block);
  }
  await audioCtx.close();
  return peaks;
}

function InstruSleeve({ item, index, focused }) {
  const n = String(index + 1).padStart(2, '0');
  const cover = item.cover_url;
  return (
    <div className={`cover-sleeve cover-sleeve--vinyl chrome-specular${cover ? ' has-cover' : ''}`}>
      <div className="cover-sleeve__media">
        {cover ? (
          <img
            src={cover}
            alt={item.titre ? `Pochette — ${item.titre}` : 'Pochette'}
            loading="lazy"
            className="cover-sleeve__art"
          />
        ) : (
          <img
            src="/brand/vinyl-chrome.png"
            alt=""
            aria-hidden
            className="cover-sleeve__vinyl-fallback"
          />
        )}
        <span className="compteur cover-sleeve__badge" style={{ color: 'var(--jaune)' }}>
          {n} / SHOWCASE
        </span>
      </div>
      <div className="cover-sleeve__body">
        <p className="compteur">CASE · SOUND · CHROME</p>
        <h2 className="cover-sleeve__title">{item.titre}</h2>
        <p className="compteur">
          {[item.bpm && `${item.bpm} BPM`, item.genre].filter(Boolean).join(' · ') || 'session'}
          {focused ? ' · LIVE' : ''}
        </p>
      </div>
    </div>
  );
}

function InstruEditForm({ item, onSaved }) {
  const [titre, setTitre] = useState(item.titre || '');
  const [bpm, setBpm] = useState(item.bpm != null ? String(item.bpm) : '');
  const [genre, setGenre] = useState(item.genre || '');
  const [statut, setStatut] = useState(item.statut || 'showcase');
  const [coverUrl, setCoverUrl] = useState(item.cover_url || '');
  const [busy, setBusy] = useState(false);
  const [erreur, setErreur] = useState('');

  async function onCover(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setErreur('');
    try {
      const url = await uploadCapture(file, `covers/${item.id}`);
      setCoverUrl(url);
    } catch (err) {
      setErreur(err.message);
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  }

  async function sauver(e) {
    e.preventDefault();
    setBusy(true);
    setErreur('');
    try {
      const updated = await apiPatch(`/instrumentaux/${item.id}`, {
        titre: titre.trim(),
        bpm: bpm ? Number(bpm) : null,
        genre: genre || null,
        statut,
        cover_url: coverUrl || null,
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
      <p className="compteur">ÉDITER · {item.titre}</p>
      <input
        required
        value={titre}
        onChange={(e) => setTitre(e.target.value)}
        placeholder="Titre"
        className="os-input"
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <input
          value={bpm}
          onChange={(e) => setBpm(e.target.value)}
          placeholder="BPM"
          type="number"
          className="os-input"
        />
        <input
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
          placeholder="Genre"
          className="os-input"
        />
      </div>
      <select
        value={statut}
        onChange={(e) => setStatut(e.target.value)}
        className="os-input"
      >
        <option value="showcase">showcase</option>
        <option value="prive">privé</option>
      </select>
      <div>
        <p className="compteur" style={{ marginBottom: 8 }}>POCHETTE · SLEEVE</p>
        {coverUrl ? (
          <div className="capture-thumbs">
            <div className="capture-thumbs__item">
              <img src={coverUrl} alt="Pochette" />
              <button type="button" className="btn-ghost" onClick={() => setCoverUrl('')}>
                ×
              </button>
            </div>
          </div>
        ) : (
          <p className="compteur" style={{ opacity: 0.55 }}>chrome vinyl si vide</p>
        )}
        <input type="file" accept="image/*" disabled={busy} onChange={onCover} style={{ marginTop: 8 }} />
      </div>
      {erreur && <p className="annotation-manuscrite">{erreur}</p>}
      <button type="submit" className="btn-poster" disabled={busy}>
        {busy ? 'Enregistrement…' : 'Enregistrer'}
      </button>
    </form>
  );
}

export default function CatalogueInstrus({ mode = 'public' }) {
  const editable = mode === 'edit';
  const [items, setItems] = useState([]);
  const [titre, setTitre] = useState('');
  const [bpm, setBpm] = useState('');
  const [genre, setGenre] = useState('');
  const [fichier, setFichier] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [statut, setStatut] = useState('idle');
  const [erreur, setErreur] = useState('');
  const [actif, setActif] = useState(null);
  const [focusItem, setFocusItem] = useState(null);
  const [editingId, setEditingId] = useState(null);

  async function charger() {
    const data = await apiGet('/instrumentaux', { auth: editable });
    setItems(data || []);
  }

  useEffect(() => { charger().catch(() => setItems([])); }, [editable]);

  const showcase = useMemo(
    () => (editable ? items : items.filter((i) => i.statut !== 'prive')),
    [items, editable],
  );

  async function uploader(e) {
    e.preventDefault();
    if (!fichier || !titre.trim()) return;
    setStatut('envoi');
    setErreur('');
    try {
      const peaks = await peaksFromFile(fichier);
      const path = `${Date.now()}-${fichier.name.replace(/\s+/g, '-')}`;
      const { error: upErr } = await supabase.storage.from('instrumentaux').upload(path, fichier, {
        contentType: fichier.type || 'audio/mpeg',
        upsert: false,
      });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from('instrumentaux').getPublicUrl(path);
      let cover_url = null;
      if (coverFile) {
        cover_url = await uploadCapture(coverFile, 'covers');
      }
      await apiPost('/instrumentaux', {
        titre: titre.trim(),
        bpm: bpm ? Number(bpm) : null,
        genre: genre || null,
        statut: 'showcase',
        fichier_url: pub.publicUrl,
        cover_url,
        waveform_data: peaks,
      });
      setTitre('');
      setBpm('');
      setGenre('');
      setFichier(null);
      setCoverFile(null);
      await charger();
      setStatut('ok');
    } catch (err) {
      setErreur(err.message);
      setStatut('idle');
    }
  }

  const listening = actif ? showcase.find((i) => i.id === actif) : focusItem;

  return (
    <div style={{ padding: 'var(--space-4)', maxWidth: 1100, margin: '0 auto' }}>
      <header className="catalogue-header hud-frame">
        <p className="compteur" style={{ marginBottom: 8 }}>
          <span className="caret-blink" aria-hidden>›</span> 02 • SOUND • CHROME
          <span style={{ color: 'rgba(255,210,63,0.45)' }}> • </span>
          LOOKBOOK
        </p>
        <h1 className="title-wide title-dither title-ghost-wrap" data-ghost="INSTRUMENTAUX" style={{ fontSize: 'clamp(2.2rem, 7vw, 3.6rem)' }}>
          Instrumentaux
        </h1>
        <p className="compteur" style={{ marginTop: 10 }}>
          {String(showcase.length).padStart(2, '0')} / {String(Math.max(showcase.length, 1)).padStart(2, '0')} showcase
          {editable ? ' • studio' : (
            <> • <Link to="/login" style={{ color: 'var(--jaune)' }}>connexion</Link> pour publier</>
          )}
        </p>
        <div className="chrome-bar chrome-bar--thin" aria-hidden />
      </header>

      {editable && (
        <form onSubmit={uploader} className="chrome-panel" style={{ padding: 'var(--space-3)', margin: 'var(--space-4) 0', display: 'grid', gap: 10 }}>
          <p className="compteur">NOUVEL UPLOAD</p>
          <input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Titre" required
            className="os-input" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input value={bpm} onChange={(e) => setBpm(e.target.value)} placeholder="BPM" type="number"
              className="os-input" />
            <input value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Genre"
              className="os-input" />
          </div>
          <label className="compteur" style={{ display: 'grid', gap: 6 }}>
            Audio
            <input type="file" accept="audio/*" onChange={(e) => setFichier(e.target.files?.[0] || null)} />
          </label>
          <label className="compteur" style={{ display: 'grid', gap: 6 }}>
            Pochette (optionnel)
            <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} />
          </label>
          {erreur && <p className="annotation-manuscrite">{erreur}</p>}
          <button type="submit" disabled={statut === 'envoi'} className="btn-poster">
            {statut === 'envoi' ? 'Upload…' : 'Publier'}
          </button>
        </form>
      )}

      {!showcase.length ? (
        <div className="empty-wall" style={{ marginTop: 'var(--space-4)' }}>
          <img
            src="/brand/vinyl-chrome.png"
            alt=""
            aria-hidden
            style={{ position: 'absolute', right: 24, bottom: 16, width: 140, opacity: 0.35, transform: 'rotate(-20deg)' }}
          />
          <p className="compteur">MUR DE PREUVES • SOUND</p>
          <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', margin: '12px 0' }}>Aucune instru encore</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 360 }}>
            Le catalogue est une vitrine waveform — pas une page vide. Upload la première session depuis le studio.
          </p>
          <span className="annotation-manuscrite" style={{ marginTop: 16, display: 'block' }}>à venir…</span>
          {editable ? null : (
            <Link to="/login" className="btn-poster" style={{ marginTop: 20, textDecoration: 'none', display: 'inline-flex' }}>
              Entrer pour publier
            </Link>
          )}
        </div>
      ) : (
        <>
          <CoverFlow
            items={showcase}
            label="Instrumentaux showcase"
            counterPrefix="LOOK"
            onFocusChange={(_, item) => {
              setFocusItem(item);
              if (item && actif && item.id !== actif) setActif(null);
            }}
            renderSleeve={(item, { index, focused }) => (
              <InstruSleeve item={item} index={index} focused={focused} />
            )}
          />

          {listening && (
            <div className="chrome-panel chrome-edge" style={{ padding: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', flexWrap: 'wrap' }}>
                <p className="compteur">
                  <span className="caret-blink" aria-hidden>›</span> DECK · {listening.titre}
                </p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                  {actif !== listening.id ? (
                    <button type="button" className="btn-ghost" onClick={() => setActif(listening.id)}>
                      › Écouter
                    </button>
                  ) : null}
                  {editable && (
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => setEditingId(editingId === listening.id ? null : listening.id)}
                    >
                      {editingId === listening.id ? '› Fermer' : '› Éditer'}
                    </button>
                  )}
                </div>
              </div>
              <p className="compteur" style={{ marginTop: 8 }}>
                {[listening.bpm && `${listening.bpm} BPM`, listening.genre, listening.statut].filter(Boolean).join(' · ')}
              </p>
              {actif === listening.id ? (
                <div style={{ marginTop: 12 }}>
                  <Player url={listening.fichier_url} peaks={listening.waveform_data ? [listening.waveform_data] : undefined} />
                </div>
              ) : null}
              {editable && editingId === listening.id && (
                <div style={{ marginTop: 16 }}>
                  <InstruEditForm
                    key={`${listening.id}-${listening.cover_url || ''}`}
                    item={listening}
                    onSaved={(updated) => {
                      setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
                      setFocusItem(updated);
                      setEditingId(null);
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {editable && (
            <div className="instru-index" style={{ marginTop: 'var(--space-4)' }}>
              <p className="compteur" style={{ marginBottom: 12 }}>INDEX · STUDIO</p>
              {showcase.map((item, i) => {
                const n = String(i + 1).padStart(2, '0');
                return (
                  <article key={item.id} className="instru-ship">
                    <div className="instru-ship__wave">
                      {item.cover_url ? (
                        <img
                          src={item.cover_url}
                          alt=""
                          style={{ width: 72, height: 72, objectFit: 'cover', border: '1px solid rgba(200,220,255,0.2)' }}
                        />
                      ) : (
                        <img
                          src="/brand/vinyl-chrome.png"
                          alt=""
                          aria-hidden
                          style={{ width: 56, height: 56, objectFit: 'contain', opacity: 0.7 }}
                        />
                      )}
                      <span className="compteur" style={{ color: 'var(--jaune)' }}>{n} / SHOWCASE</span>
                      {actif === item.id ? (
                        <Player url={item.fichier_url} peaks={item.waveform_data ? [item.waveform_data] : undefined} />
                      ) : (
                        <button type="button" onClick={() => setActif(item.id)} className="btn-ghost">
                          › Écouter
                        </button>
                      )}
                    </div>
                    <div className="instru-ship__body">
                      <p className="compteur">CASE · SOUND · CHROME</p>
                      <h2 style={{ fontSize: '1.25rem', lineHeight: 1.05 }}>{item.titre}</h2>
                      <p className="compteur">
                        {[item.bpm && `${item.bpm} BPM`, item.genre].filter(Boolean).join(' · ') || 'session'}
                      </p>
                      <button
                        type="button"
                        className="btn-ghost"
                        style={{ marginTop: 8, alignSelf: 'flex-start' }}
                        onClick={() => {
                          setFocusItem(item);
                          setEditingId(item.id);
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
