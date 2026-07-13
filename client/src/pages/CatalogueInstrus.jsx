import { useEffect, useMemo, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { apiGet, apiPost } from '../lib/api.js';

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
        style={{ marginTop: 8, background: 'transparent', color: 'var(--jaune)', border: '1px solid var(--bg-3)', borderRadius: 4, padding: '6px 10px', cursor: 'pointer' }}
      >
        Lecture
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

export default function CatalogueInstrus({ mode = 'public' }) {
  const editable = mode === 'edit';
  const [items, setItems] = useState([]);
  const [titre, setTitre] = useState('');
  const [bpm, setBpm] = useState('');
  const [genre, setGenre] = useState('');
  const [fichier, setFichier] = useState(null);
  const [statut, setStatut] = useState('idle');
  const [erreur, setErreur] = useState('');
  const [actif, setActif] = useState(null);

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
      await apiPost('/instrumentaux', {
        titre: titre.trim(),
        bpm: bpm ? Number(bpm) : null,
        genre: genre || null,
        statut: 'showcase',
        fichier_url: pub.publicUrl,
        waveform_data: peaks,
      });
      setTitre('');
      setBpm('');
      setGenre('');
      setFichier(null);
      await charger();
      setStatut('ok');
    } catch (err) {
      setErreur(err.message);
      setStatut('idle');
    }
  }

  return (
    <div style={{ padding: 'var(--space-4)' }}>
      <h1>Instrumentaux</h1>
      <p className="compteur">
        {showcase.length} showcase
        {editable ? ' · studio' : (
          <> · <Link to="/login" style={{ color: 'var(--jaune)' }}>connexion</Link> pour publier</>
        )}
      </p>

      {editable && (
        <form onSubmit={uploader} className="blueprint-grid" style={{ background: 'var(--bg-1)', padding: 'var(--space-3)', borderRadius: 4, margin: 'var(--space-4) 0', display: 'grid', gap: 10 }}>
          <p className="compteur">NOUVEL UPLOAD</p>
          <input value={titre} onChange={(e) => setTitre(e.target.value)} placeholder="Titre" required
            style={{ padding: 10, background: 'var(--bg-2)', color: 'var(--text)', border: '1px solid var(--bg-3)', borderRadius: 4 }} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <input value={bpm} onChange={(e) => setBpm(e.target.value)} placeholder="BPM" type="number"
              style={{ padding: 10, background: 'var(--bg-2)', color: 'var(--text)', border: '1px solid var(--bg-3)', borderRadius: 4 }} />
            <input value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Genre"
              style={{ padding: 10, background: 'var(--bg-2)', color: 'var(--text)', border: '1px solid var(--bg-3)', borderRadius: 4 }} />
          </div>
          <input type="file" accept="audio/*" onChange={(e) => setFichier(e.target.files?.[0] || null)} />
          {erreur && <p className="annotation-manuscrite">{erreur}</p>}
          <button type="submit" disabled={statut === 'envoi'}
            style={{ padding: 10, border: 'none', borderRadius: 4, background: 'var(--jaune)', color: '#060a1a', fontWeight: 700, cursor: 'pointer' }}>
            {statut === 'envoi' ? 'Upload…' : 'Publier'}
          </button>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--space-3)', marginTop: 'var(--space-3)' }}>
        {showcase.map((item) => (
          <article key={item.id} className="blueprint-grid" style={{ background: 'var(--bg-1)', padding: 'var(--space-3)', borderRadius: 4 }}>
            <h2 style={{ fontSize: '1.1rem' }}>{item.titre}</h2>
            <p className="compteur">{[item.bpm && `${item.bpm} BPM`, item.genre].filter(Boolean).join(' · ') || '—'}</p>
            {actif === item.id ? (
              <Player url={item.fichier_url} peaks={item.waveform_data ? [item.waveform_data] : undefined} />
            ) : (
              <button type="button" onClick={() => setActif(item.id)}
                style={{ marginTop: 10, background: 'transparent', color: 'var(--text)', border: '1px solid var(--bg-3)', borderRadius: 4, padding: '8px 10px', cursor: 'pointer' }}>
                Écouter
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
