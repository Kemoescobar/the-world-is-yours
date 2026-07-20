import { useEffect, useState } from 'react';

/**
 * Typewriter / subtle glitch reveal for Chronique text.
 * Respects prefers-reduced-motion → full text immediately.
 */
export default function TypeReveal({ text = '', className = '', as: Tag = 'p' }) {
  const [shown, setShown] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const full = String(text || '');
    const reduce =
      typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce || !full) {
      setShown(full);
      setDone(true);
      return undefined;
    }

    setShown('');
    setDone(false);
    let i = 0;
    const step = Math.max(1, Math.floor(full.length / 90));
    const id = window.setInterval(() => {
      i = Math.min(full.length, i + step);
      setShown(full.slice(0, i));
      if (i >= full.length) {
        window.clearInterval(id);
        setDone(true);
      }
    }, 28);

    return () => window.clearInterval(id);
  }, [text]);

  return (
    <Tag
      className={`${className}${done ? '' : ' type-reveal--live'}`.trim()}
      data-revealing={done ? '0' : '1'}
    >
      {shown}
      {!done && <span className="type-reveal__caret caret-blink" aria-hidden>▌</span>}
    </Tag>
  );
}
