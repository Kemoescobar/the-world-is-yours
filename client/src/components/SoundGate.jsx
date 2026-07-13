// Gate d'entrée — ne pas return null (sinon flash page blanche).
export default function SoundGate({ onEnter }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-0)', display: 'grid', placeItems: 'center', zIndex: 2000 }}>
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: 'var(--space-3)' }}>THE WORLD IS YOURS</h1>
        <button
          type="button"
          onClick={() => onEnter?.(true)}
          style={{ marginRight: 8, padding: '10px 14px', cursor: 'pointer', background: 'var(--jaune)', color: '#060a1a', border: 'none', borderRadius: 4, fontWeight: 700 }}
        >
          Entrer avec le son
        </button>
        <button
          type="button"
          onClick={() => onEnter?.(false)}
          style={{ padding: '10px 14px', cursor: 'pointer', background: 'transparent', color: 'var(--text)', border: '1px solid var(--bg-3)', borderRadius: 4 }}
        >
          Entrer sans le son
        </button>
      </div>
    </div>
  );
}
