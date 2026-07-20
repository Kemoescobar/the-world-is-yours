/**
 * Animated iridescent hand-globe for registre fort (Drop reveal).
 * Static SoundGate / daily UI keep plain globe-hand.png.
 * Respects prefers-reduced-motion.
 */
export default function GlobeHandVivant({
  className = '',
  style = {},
  opacity = 0.55,
  side = 'right',
}) {
  const sideStyle =
    side === 'left'
      ? { left: '-8%', right: 'auto', transform: 'scaleX(-1)' }
      : { right: '-8%', left: 'auto' };

  return (
    <div
      className={`globe-hand-vivant ${className}`.trim()}
      aria-hidden
      style={{
        position: 'absolute',
        bottom: '-12%',
        width: 'min(62vw, 520px)',
        pointerEvents: 'none',
        zIndex: 1,
        opacity,
        ...sideStyle,
        ...style,
      }}
    >
      <div className="globe-hand-vivant__wash" />
      <img
        src="/brand/globe-hand.png"
        alt=""
        className="globe-hand-vivant__img sticker-cutout"
        draggable={false}
      />
      <div className="globe-hand-vivant__iris" />
    </div>
  );
}
