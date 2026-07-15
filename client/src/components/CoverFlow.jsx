import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Cover Flow horizontal — perspective desktop, scroll-snap mobile.
 * `renderSleeve(item, { index, focused, select })` paints each sleeve.
 */
export default function CoverFlow({
  items = [],
  renderSleeve,
  initialIndex = 0,
  label = 'Catalogue',
  counterPrefix = 'LOOK',
  onFocusChange,
}) {
  const [focus, setFocus] = useState(() =>
    Math.min(Math.max(0, initialIndex), Math.max(0, items.length - 1)),
  );
  const trackRef = useRef(null);
  const mobile = useRef(false);
  const onFocusChangeRef = useRef(onFocusChange);
  onFocusChangeRef.current = onFocusChange;

  useEffect(() => {
    if (!items.length) return;
    setFocus((f) => Math.min(f, items.length - 1));
  }, [items.length]);

  useEffect(() => {
    onFocusChangeRef.current?.(focus, items[focus] ?? null);
  }, [focus, items]);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 720px), (prefers-reduced-motion: reduce)');
    const sync = () => {
      mobile.current = mq.matches;
    };
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const select = useCallback((index) => {
    setFocus(index);
    if (mobile.current && trackRef.current) {
      const el = trackRef.current.children[index];
      el?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, []);

  const onKeyDown = useCallback(
    (e) => {
      if (!items.length) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        select(Math.min(focus + 1, items.length - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        select(Math.max(focus - 1, 0));
      } else if (e.key === 'Home') {
        e.preventDefault();
        select(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        select(items.length - 1);
      }
    },
    [focus, items.length, select],
  );

  const onScroll = useCallback(() => {
    if (!mobile.current || !trackRef.current) return;
    const track = trackRef.current;
    const mid = track.scrollLeft + track.clientWidth / 2;
    let best = 0;
    let bestDist = Infinity;
    Array.from(track.children).forEach((child, i) => {
      const c = child.offsetLeft + child.offsetWidth / 2;
      const d = Math.abs(c - mid);
      if (d < bestDist) {
        bestDist = d;
        best = i;
      }
    });
    setFocus(best);
  }, []);

  if (!items.length) return null;

  const n = String(focus + 1).padStart(2, '0');
  const total = String(items.length).padStart(2, '0');

  return (
    <section
      className="cover-flow"
      aria-roledescription="carousel"
      aria-label={label}
      onKeyDown={onKeyDown}
    >
      <div className="cover-flow__hud">
        <span className="compteur">
          <span className="caret-blink" aria-hidden>
            ›
          </span>{' '}
          {counterPrefix} {n} / {total}
        </span>
        <div className="chrome-bar chrome-bar--thin" aria-hidden />
        <span className="compteur cover-flow__hint" aria-hidden>
          ← →
        </span>
      </div>

      <div className="cover-flow__stage hud-frame chrome-edge">
        <div className="cover-flow__specular" aria-hidden />
        <div
          ref={trackRef}
          className="cover-flow__track"
          onScroll={onScroll}
          tabIndex={0}
          role="listbox"
          aria-activedescendant={items[focus] ? `cover-${items[focus].id ?? focus}` : undefined}
        >
          {items.map((item, index) => {
            const delta = index - focus;
            const abs = Math.abs(delta);
            const focused = delta === 0;
            const ghost = abs >= 1;
            const style = {
              '--cf-i': String(delta),
              '--cf-abs': String(abs),
              zIndex: 40 - abs,
            };
            return (
              <div
                key={item.id ?? index}
                id={`cover-${item.id ?? index}`}
                role="option"
                aria-selected={focused}
                className={[
                  'cover-flow__sleeve',
                  focused ? 'is-focus' : '',
                  ghost ? 'is-ghost' : '',
                  abs > 2 ? 'is-far' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                style={style}
                onClick={() => select(index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    select(index);
                  }
                }}
              >
                {renderSleeve(item, { index, focused, select: () => select(index) })}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
