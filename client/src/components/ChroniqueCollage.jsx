import { useEffect, useMemo, useState } from 'react';
import { apiGet } from '../lib/api.js';
import { buildWeekCollage } from '../lib/weekCollage.js';

/**
 * Generative weekly collage from real entrees/quetes — SVG layers, not a fixed image.
 * Works fully without Anthropic (heuristic from API data).
 */
export default function ChroniqueCollage({
  entrees: entreesProp,
  quetes: quetesProp,
  titre,
  corps,
  compact = false,
  className = '',
}) {
  const [entrees, setEntrees] = useState(entreesProp || null);
  const [quetes, setQuetes] = useState(quetesProp || null);

  useEffect(() => {
    if (entreesProp) setEntrees(entreesProp);
  }, [entreesProp]);
  useEffect(() => {
    if (quetesProp) setQuetes(quetesProp);
  }, [quetesProp]);

  useEffect(() => {
    if (entreesProp != null && quetesProp != null) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const debut = new Date();
        debut.setDate(debut.getDate() - 7);
        const [e, q] = await Promise.all([
          apiGet('/entrees').catch(() => []),
          apiGet('/quetes').catch(() => []),
        ]);
        if (cancelled) return;
        const weekE = (e || []).filter((row) => new Date(row.cree_le) >= debut);
        const weekQ = (q || []).filter((row) => {
          if (row.statut === 'fait') {
            const when = row.fait_le || row.maj_le || row.cree_le;
            return when && new Date(when) >= debut;
          }
          return true;
        });
        if (entreesProp == null) setEntrees(weekE);
        if (quetesProp == null) setQuetes(weekQ);
      } catch {
        if (!cancelled) {
          if (entreesProp == null) setEntrees([]);
          if (quetesProp == null) setQuetes([]);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [entreesProp, quetesProp]);

  const model = useMemo(
    () => buildWeekCollage({
      entrees: entrees || [],
      quetes: quetes || [],
      titre,
      corps,
    }),
    [entrees, quetes, titre, corps],
  );

  const h = compact ? 120 : 168;
  const sparkPts = model.spark
    .map((v, i) => {
      const x = 12 + (i / Math.max(model.spark.length - 1, 1)) * 76;
      const y = 88 - (v / model.maxSpark) * 42;
      return `${x},${y}`;
    })
    .join(' ');

  const positions = [
    { x: 6, y: 28 },
    { x: 38, y: 18 },
    { x: 58, y: 42 },
    { x: 14, y: 58 },
    { x: 48, y: 68 },
    { x: 70, y: 32 },
    { x: 28, y: 78 },
  ];

  return (
    <figure
      className={`chronique-collage${compact ? ' chronique-collage--compact' : ''} ${className}`.trim()}
      aria-label={`Collage hebdo — ${model.nEntrees} faits, ${model.nQuetesFaites} quêtes`}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        width="100%"
        height={h}
        role="img"
        aria-hidden
      >
        <defs>
          <linearGradient id={`cc-bg-${model.seed}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(74,35,29,0.55)" />
            <stop offset="55%" stopColor="rgba(26,15,13,0.2)" />
            <stop offset="100%" stopColor="rgba(255,90,60,0.12)" />
          </linearGradient>
          <linearGradient id={`cc-wave-${model.seed}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f5c542" />
            <stop offset="100%" stopColor="#ff5a3c" />
          </linearGradient>
          <filter id={`cc-grain-${model.seed}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={model.seed} />
            <feColorMatrix type="saturate" values="0" />
            <feComponentTransfer>
              <feFuncA type="table" tableValues="0 0.08" />
            </feComponentTransfer>
            <feBlend in="SourceGraphic" mode="overlay" />
          </filter>
        </defs>

        <rect width="100" height="100" fill={`url(#cc-bg-${model.seed})`} />
        <rect width="100" height="100" fill="transparent" filter={`url(#cc-grain-${model.seed})`} opacity="0.5" />

        {/* Brand fragment — geometric echo of hand-globe, not Partie 3 symbols */}
        <g opacity="0.35" transform={`translate(${62 + (model.seed % 5)}, ${8 + (model.seed % 3)})`}>
          <circle cx="18" cy="18" r="14" fill="none" stroke="#a89484" strokeWidth="0.6" />
          <circle cx="18" cy="18" r="7" fill="none" stroke="#f5c542" strokeWidth="0.45" />
          <path
            d="M4 28 Q10 20 18 22 Q26 24 32 30"
            fill="none"
            stroke="#f2e8da"
            strokeWidth="0.7"
            strokeLinecap="round"
          />
        </g>

        {/* Activity sparkline */}
        <polyline
          points={sparkPts}
          fill="none"
          stroke={`url(#cc-wave-${model.seed})`}
          strokeWidth="1.2"
          strokeLinejoin="round"
          strokeLinecap="round"
          opacity="0.85"
        />
        {model.spark.map((v, i) => {
          const x = 12 + (i / Math.max(model.spark.length - 1, 1)) * 76;
          const y = 88 - (v / model.maxSpark) * 42;
          return (
            <circle
              key={`d-${i}`}
              cx={x}
              cy={y}
              r={v > 0 ? 1.4 : 0.7}
              fill={v > 0 ? '#ff5a3c' : '#4a231d'}
            />
          );
        })}

        {/* Text fragments from week */}
        {model.texts.map((t, i) => {
          const p = positions[i % positions.length];
          const fill = t.kind === 'quete' ? '#f5c542' : t.kind === 'titre' ? '#ff5a3c' : '#f2e8da';
          return (
            <text
              key={`${t.kind}-${i}-${t.text}`}
              x={p.x}
              y={p.y}
              fill={fill}
              fontSize={t.kind === 'titre' ? 4.2 : 3.2}
              fontFamily="Space Mono, ui-monospace, monospace"
              transform={`rotate(${t.rot} ${p.x} ${p.y})`}
              opacity={0.72 + (i % 3) * 0.08}
            >
              {t.text.toUpperCase()}
            </text>
          );
        })}

        {model.stamps.map((s) => (
          <text
            key={s.label}
            x={s.x}
            y={s.y}
            fill="#a89484"
            fontSize="2.8"
            fontFamily="Caveat, Georgia, serif"
            transform={`rotate(${s.rot} ${s.x} ${s.y})`}
            opacity="0.55"
          >
            {s.label}
          </text>
        ))}
      </svg>
      <figcaption className="chronique-collage__cap compteur">
        COLLAGE · {model.nEntrees} faits · {model.nQuetesFaites} quêtes · 7j
      </figcaption>
    </figure>
  );
}
