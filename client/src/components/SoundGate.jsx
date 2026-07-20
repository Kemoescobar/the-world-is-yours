import { playEnter, setSoundEnabled } from '../lib/sounds.js';
import MoodboardPatchwork from './MoodboardPatchwork.jsx';

export default function SoundGate({ onEnter }) {
  function enter(withSound) {
    setSoundEnabled(withSound);
    if (withSound) playEnter();
    onEnter?.(withSound);
  }

  return (
    <div
      className="anim-gate chrome-edge chrome-edge-live hud-frame"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 2000,
        background: 'var(--bg-0)',
        overflow: 'hidden',
        display: 'grid',
        placeItems: 'center',
      }}
    >
      <div
        aria-hidden
        className="atmosphere-void void-grid atmosphere-breathe"
        style={{ position: 'absolute', inset: 0 }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 72% 38%, rgba(122,24,48,0.42), transparent 52%), radial-gradient(ellipse at 18% 78%, rgba(255,61,58,0.12), transparent 45%), radial-gradient(ellipse at 50% 100%, rgba(14,12,16,0.9), transparent 50%)',
        }}
      />
      <MoodboardPatchwork variant="gate" />
      <img
        src="/brand/globe-hand.png"
        alt=""
        aria-hidden
        className="sticker-cutout"
        style={{
          position: 'absolute',
          right: '-6%',
          bottom: '-10%',
          width: 'min(68vw, 600px)',
          opacity: 0.58,
          zIndex: 2,
          filter: 'contrast(1.12) saturate(1.08)',
          maskImage: 'linear-gradient(to left, black 45%, transparent 96%)',
          WebkitMaskImage: 'linear-gradient(to left, black 45%, transparent 96%)',
          pointerEvents: 'none',
          boxShadow: 'none',
          clipPath: 'none',
        }}
      />
      <div className="grain grain-live" />
      <div className="scanlines scanlines-live" />
      <div className="halftone-overlay halftone-live" style={{ position: 'absolute', zIndex: 3, opacity: 0.24 }} />

      <span className="hud-corner hud-corner--tl" aria-hidden />
      <span className="hud-corner hud-corner--tr" aria-hidden />
      <span className="hud-corner hud-corner--bl" aria-hidden />
      <span className="hud-corner hud-corner--br" aria-hidden />

      <div style={{ position: 'relative', zIndex: 4, textAlign: 'center', padding: 'var(--space-4)', maxWidth: 680 }}>
        <p className="compteur" style={{ marginBottom: 'var(--space-3)' }}>
          <span className="caret-blink">›</span> SYSTEM READY
          <span style={{ color: 'rgba(255,210,63,0.45)' }}> • </span>
          LOOK 00 / BOOT
          <span style={{ color: 'rgba(255,210,63,0.45)' }}> • </span>
          PRESS START
        </p>
        <div className="chrome-bar chrome-bar--thin" aria-hidden style={{ margin: '0 auto 18px', maxWidth: 160 }} />
        <h1
          className="title-dither title-wide title-ghost-wrap"
          data-ghost="THE WORLD IS YOURS"
          style={{ fontSize: 'clamp(2.8rem, 11vw, 5.5rem)', lineHeight: 0.88, marginBottom: 'var(--space-2)' }}
        >
          THE WORLD
          <br />
          IS YOURS
        </h1>
        <p className="compteur" style={{ marginBottom: 'var(--space-4)', color: 'var(--text-muted)' }}>
          Chroniques • Chantier • Preuves
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          <button type="button" className="btn-poster" onClick={() => enter(true)}>
            <span className="caret-blink">›</span> Enter with sound
          </button>
          <button type="button" className="btn-ghost" onClick={() => enter(false)}>
            Enter muted
          </button>
        </div>
      </div>
    </div>
  );
}
