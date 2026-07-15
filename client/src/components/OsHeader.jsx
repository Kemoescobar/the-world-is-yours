/** En-tête console privée — titre ghost + compteur archive. */
export default function OsHeader({ kicker = 'OS · PRIVATE', title, meta, actions, children }) {
  return (
    <header className="os-header anim-split">
      {kicker && (
        <p className="compteur os-header__kicker">
          <span className="caret-blink" aria-hidden>
            ›
          </span>{' '}
          {kicker}
        </p>
      )}
      <h1 className="title-dither title-ghost-wrap os-header__title" data-ghost={title}>
        {title}
      </h1>
      {meta && <p className="compteur os-header__meta">{meta}</p>}
      {actions && <div className="os-header__actions">{actions}</div>}
      {children}
    </header>
  );
}
