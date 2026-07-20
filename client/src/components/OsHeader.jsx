import MoodboardPatchwork from './MoodboardPatchwork.jsx';

/** En-tête console privée — titre ghost + compteur archive + HUD + scrap strip. */
export default function OsHeader({ kicker = 'OS · PRIVATE', title, meta, actions, children }) {
  return (
    <header className="os-header anim-split hud-frame" style={{ position: 'relative', overflow: 'hidden' }}>
      <MoodboardPatchwork variant="strip" className="os-header__strip" />
      {kicker && (
        <p className="compteur os-header__kicker" style={{ position: 'relative', zIndex: 1 }}>
          <span className="caret-blink" aria-hidden>
            ›
          </span>{' '}
          {kicker}
        </p>
      )}
      <h1 className="title-dither title-wide title-ghost-wrap os-header__title" data-ghost={title} style={{ position: 'relative', zIndex: 1 }}>
        {title}
      </h1>
      {meta && <p className="compteur os-header__meta" style={{ position: 'relative', zIndex: 1 }}>{meta}</p>}
      <div className="chrome-bar chrome-bar--thin" aria-hidden style={{ marginTop: 12, maxWidth: 140, position: 'relative', zIndex: 1 }} />
      {actions && <div className="os-header__actions" style={{ position: 'relative', zIndex: 1 }}>{actions}</div>}
      {children}
    </header>
  );
}
