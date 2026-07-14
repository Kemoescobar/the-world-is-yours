export default function SoundGate({ onEnter }) {
  return (
    <div
      className="anim-gate"
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
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 70% 40%, rgba(91,45,158,0.45), transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(19,39,90,0.9), transparent 50%), #060a1a',
        }}
      />
      <img
        src="/brand/globe-hand.png"
        alt=""
        aria-hidden
        style={{
          position: 'absolute',
          right: '-8%',
          bottom: '-12%',
          width: 'min(72vw, 640px)',
          opacity: 0.55,
          filter: 'contrast(1.1) saturate(1.05)',
          maskImage: 'linear-gradient(to left, black 40%, transparent 95%)',
          WebkitMaskImage: 'linear-gradient(to left, black 40%, transparent 95%)',
          pointerEvents: 'none',
        }}
      />
      <div className="grain" />
      <div className="scanlines" />
      <div className="halftone-overlay" style={{ position: 'absolute', zIndex: 3, opacity: 0.18 }} />

      <div style={{ position: 'relative', zIndex: 4, textAlign: 'center', padding: 'var(--space-4)', maxWidth: 560 }}>
        <p className="compteur" style={{ marginBottom: 'var(--space-3)' }}>
          <span className="caret-blink">›</span> SYSTEM READY
        </p>
        <h1
          style={{
            fontSize: 'clamp(2.4rem, 9vw, 4.5rem)',
            lineHeight: 0.92,
            marginBottom: 'var(--space-2)',
            textShadow: '0 0 40px rgba(91,45,158,0.35)',
          }}
        >
          THE WORLD
          <br />
          IS YOURS
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 'var(--space-4)', fontSize: '0.95rem' }}>
          Chroniques · Chantier · Preuves
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center' }}>
          <button type="button" className="btn-poster" onClick={() => onEnter?.(true)}>
            <span className="caret-blink">›</span> Enter with sound
          </button>
          <button type="button" className="btn-ghost" onClick={() => onEnter?.(false)}>
            Enter muted
          </button>
        </div>
      </div>
    </div>
  );
}
