import { useEffect, useMemo, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { supabase } from '../lib/supabase.js';
import { apiGet, apiPost, apiPatch } from '../lib/api.js';
import { uploadCapture } from '../lib/storageUpload.js';
import CoverFlow from '../components/CoverFlow.jsx';
import MoodboardPatchwork, { MOODBOARD } from '../components/MoodboardPatchwork.jsx';

function flattenPeaks(peaks) {
  if (Array.isArray(peaks?.[0])) return peaks[0];
  if (Array.isArray(peaks)) return peaks;
  return [];
}

function Player({ url, peaks, onEnergy }) {
  const ref = useRef(null);
  const ws = useRef(null);
  const raf = useRef(0);
  const peaksFlat = useRef(flattenPeaks(peaks));
  const audioGraph = useRef(null); // { ctx, source, analyser, connected }
  const onEnergyRef = useRef(onEnergy);
  onEnergyRef.current = onEnergy;

  // Keep peak buffer fresh without remounting WaveSurfer (parent often wraps peaks in a new []).
  useEffect(() => {
    peaksFlat.current = flattenPeaks(peaks);
  }, [peaks]);

  useEffect(() => {
    if (!ref.current || !url) return undefined;

    ws.current = WaveSurfer.create({
      container: ref.current,
      waveColor: '#a89484',
      progressColor: '#f5c542',
      cursorColor: '#ff5a3c',
      height: 48,
      barWidth: 2,
      url,
      peaks: peaksFlat.current.length ? [peaksFlat.current] : undefined,
    });

    const teardownAudio = () => {
      const g = audioGraph.current;
      if (!g) return;
      try { g.source?.disconnect(); } catch { /* already gone */ }
      try { g.analyser?.disconnect(); } catch { /* already gone */ }
      if (g.ctx && g.ctx.state !== 'closed') {
        g.ctx.close().catch(() => {});
      }
      audioGraph.current = null;
    };

    /** One MediaElementSource per element — try once; fall back to peaks if blocked. */
    const ensureAnalyser = () => {
      if (audioGraph.current) return audioGraph.current.analyser ? 'live' : 'peaks';
      const media = ws.current?.getMediaElement?.();
      if (!media) return 'peaks';
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) {
          audioGraph.current = { ctx: null, source: null, analyser: null, connected: false };
          return 'peaks';
        }
        const ctx = new AC();
        const source = ctx.createMediaElementSource(media);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.72;
        source.connect(analyser);
        analyser.connect(ctx.destination);
        audioGraph.current = { ctx, source, analyser, connected: true };
        return 'live';
      } catch {
        // Already attached elsewhere, or autoplay/policy blocked the graph
        audioGraph.current = { ctx: null, source: null, analyser: null, connected: false };
        return 'peaks';
      }
    };

    const freqBuf = new Uint8Array(128);

    const sampleEnergy = () => {
      const inst = ws.current;
      const emit = onEnergyRef.current;
      if (!inst || !emit) return;

      const mode = ensureAnalyser();
      const g = audioGraph.current;
      if (mode === 'live' && g?.analyser) {
        if (g.ctx?.state === 'suspended') g.ctx.resume().catch(() => {});
        g.analyser.getByteFrequencyData(freqBuf);
        let sum = 0;
        // Bias mid/high bands for punchier tint response
        const n = freqBuf.length;
        for (let i = 2; i < n; i += 1) sum += freqBuf[i];
        const avg = sum / Math.max(1, n - 2) / 255;
        emit(Math.min(1, avg * 1.85));
      } else {
        const dur = inst.getDuration?.() || 0;
        const t = inst.getCurrentTime?.() || 0;
        const arr = peaksFlat.current;
        if (arr.length && dur > 0) {
          const i = Math.min(arr.length - 1, Math.floor((t / dur) * arr.length));
          const v = Math.abs(arr[i] || 0);
          emit(Math.min(1, v * 2.2));
        } else {
          emit(0.25 + 0.35 * Math.abs(Math.sin(t * 5.5)));
        }
      }
      raf.current = requestAnimationFrame(sampleEnergy);
    };

    const onPlay = () => {
      cancelAnimationFrame(raf.current);
      ensureAnalyser();
      const g = audioGraph.current;
      if (g?.ctx?.state === 'suspended') g.ctx.resume().catch(() => {});
      raf.current = requestAnimationFrame(sampleEnergy);
    };
    const onPause = () => {
      cancelAnimationFrame(raf.current);
      onEnergyRef.current?.(0);
    };

    ws.current.on('play', onPlay);
    ws.current.on('pause', onPause);
    ws.current.on('finish', onPause);

    return () => {
      cancelAnimationFrame(raf.current);
      teardownAudio();
      ws.current?.destroy();
      ws.current = null;
    };
    // Remount only when the track URL changes. peaks/onEnergy update via refs —
    // otherwise each energy frame (setState) destroyed WaveSurfer + closed AudioContext.
  }, [url]);

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
    <div className={`cover-sleeve cover-sleeve--vinyl chrome-specular registre-fort${cover ? ' has-cover' : ''}`}>
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
            src={MOODBOARD.sleeve}
            alt=""
            aria-hidden
            className="cover-sleeve__vinyl-fallback cover-sleeve__fort-fallback"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/brand/vinyl-chrome.png';
              e.currentTarget.classList.remove('cover-sleeve__fort-fallback');
            }}
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
  const [playEnergy, setPlayEnergy] = useState(0);

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
  const listeningPeaks = useMemo(() => {
    const wave = listening?.waveform_data;
    return wave ? [wave] : undefined;
  }, [listening?.waveform_data]);

  return (
    <div className="catalogue-instrus-shell" style={{ padding: 'var(--space-4)', maxWidth: 1100, margin: '0 auto', position: 'relative' }}>
      <MoodboardPatchwork variant="instrus" />
      <header className="catalogue-header hud-frame" style={{ position: 'relative', zIndex: 1 }}>
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
          {editable ? ' • studio' : null}
        </p>
        <div className="chrome-bar chrome-bar--thin" aria-hidden />
      </header>

      <div style={{ position: 'relative', zIndex: 1 }}>
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
            src={MOODBOARD.sleeve}
            alt=""
            aria-hidden
            style={{ position: 'absolute', right: 24, bottom: 16, width: 140, opacity: 0.35, transform: 'rotate(-20deg)' }}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = '/brand/vinyl-chrome.png';
            }}
          />
          <p className="compteur">MUR DE PREUVES • SOUND</p>
          <h2 style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', margin: '12px 0' }}>Aucune instru encore</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 360 }}>
            Le catalogue est une vitrine waveform — pas une page vide. Upload la première session depuis le studio.
          </p>
          <span className="annotation-manuscrite" style={{ marginTop: 16, display: 'block' }}>à venir…</span>
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
            <div
              className="chrome-panel chrome-edge registre-fort instru-deck"
              style={{
                padding: 'var(--space-3)',
                marginTop: 'var(--space-3)',
                ['--instru-energy']: String(playEnergy),
                boxShadow: playEnergy > 0.05
                  ? `0 0 ${24 + playEnergy * 48}px rgba(255,42,74,${0.12 + playEnergy * 0.35}), 0 0 ${18 + playEnergy * 36}px rgba(45,107,255,${0.1 + playEnergy * 0.3})`
                  : undefined,
                borderColor: playEnergy > 0.08
                  ? `rgba(45, 107, 255, ${0.25 + playEnergy * 0.45})`
                  : undefined,
              }}
            >
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
                  <Player
                    url={listening.fichier_url}
                    peaks={listeningPeaks}
                    onEnergy={setPlayEnergy}
                  />
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
                          src="/brand/moodboard/asake-sleeve.png"
                          alt=""
                          aria-hidden
                          style={{ width: 56, height: 56, objectFit: 'contain', opacity: 0.7 }}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/brand/vinyl-chrome.png';
                          }}
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
    </div>
  );
}
