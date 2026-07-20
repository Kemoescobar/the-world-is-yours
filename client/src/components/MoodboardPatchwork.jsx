/**
 * Layered moodboard scraps — public fort collage + calm OS atmosphere.
 * Variants: gate | home | drop | drops | instrus | projets | os | login | strip
 */

const MB = '/brand/moodboard';

/** Curated pool for card thumbs / cycling accents */
export const MOODBOARD_SCRAPS = [
  `${MB}/cosmic-face.png`,
  `${MB}/youth-globe.png`,
  `${MB}/twiy-globe.png`,
  `${MB}/afro-punk.png`,
  `${MB}/asake-sleeve.png`,
  `${MB}/ukiyo-sun.png`,
  `${MB}/lebron-wine.png`,
  `${MB}/rodman-red.png`,
  `${MB}/cloud-tunnel.png`,
  `${MB}/prism-cloud.png`,
  `${MB}/silver-surfer.png`,
  `${MB}/islands-sunrise.png`,
];

export function moodboardThumb(seed = 0) {
  const i = Math.abs(Number(seed) || 0) % MOODBOARD_SCRAPS.length;
  return MOODBOARD_SCRAPS[i];
}

const VARIANTS = {
  gate: [
    { src: `${MB}/twiy-globe.png`, className: 'moodboard-scrap moodboard-scrap--gate-a' },
    { src: `${MB}/ukiyo-sun.png`, className: 'moodboard-scrap moodboard-scrap--gate-b' },
    { src: `${MB}/cloud-tunnel.png`, className: 'moodboard-scrap moodboard-scrap--gate-c' },
  ],
  home: [
    { src: `${MB}/youth-globe.png`, className: 'moodboard-scrap moodboard-scrap--home-hero' },
    { src: `${MB}/silver-surfer.png`, className: 'moodboard-scrap moodboard-scrap--home-code' },
    { src: `${MB}/afro-punk.png`, className: 'moodboard-scrap moodboard-scrap--home-sound' },
    { src: `${MB}/lebron-wine.png`, className: 'moodboard-scrap moodboard-scrap--home-wine' },
    { src: `${MB}/twiy-globe.png`, className: 'moodboard-scrap moodboard-scrap--home-mark' },
    { src: `${MB}/islands-sunrise.png`, className: 'moodboard-scrap moodboard-scrap--home-isle' },
  ],
  drop: [
    { src: `${MB}/cosmic-face.png`, className: 'moodboard-scrap moodboard-scrap--drop-base' },
    { src: `${MB}/prism-cloud.png`, className: 'moodboard-scrap moodboard-scrap--drop-prism' },
    { src: `${MB}/ukiyo-sun.png`, className: 'moodboard-scrap moodboard-scrap--drop-sun' },
    { src: `${MB}/twiy-globe.png`, className: 'moodboard-scrap moodboard-scrap--drop-mark' },
  ],
  drops: [
    { src: `${MB}/cosmic-face.png`, className: 'moodboard-scrap moodboard-scrap--drops-a' },
    { src: `${MB}/afro-punk.png`, className: 'moodboard-scrap moodboard-scrap--drops-b' },
    { src: `${MB}/rodman-red.png`, className: 'moodboard-scrap moodboard-scrap--drops-c' },
    { src: `${MB}/prism-cloud.png`, className: 'moodboard-scrap moodboard-scrap--drops-d' },
  ],
  instrus: [
    { src: `${MB}/asake-sleeve.png`, className: 'moodboard-scrap moodboard-scrap--instru-a' },
    { src: `${MB}/rodman-red.png`, className: 'moodboard-scrap moodboard-scrap--instru-b' },
    { src: `${MB}/afro-punk.png`, className: 'moodboard-scrap moodboard-scrap--instru-c' },
    { src: `${MB}/lebron-wine.png`, className: 'moodboard-scrap moodboard-scrap--instru-d' },
  ],
  projets: [
    { src: `${MB}/silver-surfer.png`, className: 'moodboard-scrap moodboard-scrap--proj-a' },
    { src: `${MB}/cloud-tunnel.png`, className: 'moodboard-scrap moodboard-scrap--proj-b' },
    { src: `${MB}/ukiyo-sun.png`, className: 'moodboard-scrap moodboard-scrap--proj-c' },
    { src: `${MB}/youth-globe.png`, className: 'moodboard-scrap moodboard-scrap--proj-d' },
  ],
  /** Calm OS shell — low opacity, behind content */
  os: [
    { src: `${MB}/twiy-globe.png`, className: 'moodboard-scrap moodboard-scrap--os-a' },
    { src: `${MB}/ukiyo-sun.png`, className: 'moodboard-scrap moodboard-scrap--os-b' },
    { src: `${MB}/cloud-tunnel.png`, className: 'moodboard-scrap moodboard-scrap--os-c' },
    { src: `${MB}/lebron-wine.png`, className: 'moodboard-scrap moodboard-scrap--os-d' },
  ],
  /** Chantier header atmosphere — readable */
  chantier: [
    { src: `${MB}/youth-globe.png`, className: 'moodboard-scrap moodboard-scrap--chantier-a' },
    { src: `${MB}/islands-sunrise.png`, className: 'moodboard-scrap moodboard-scrap--chantier-b' },
    { src: `${MB}/prism-cloud.png`, className: 'moodboard-scrap moodboard-scrap--chantier-c' },
  ],
  login: [
    { src: `${MB}/twiy-globe.png`, className: 'moodboard-scrap moodboard-scrap--login-a' },
    { src: `${MB}/cosmic-face.png`, className: 'moodboard-scrap moodboard-scrap--login-b' },
    { src: `${MB}/ukiyo-sun.png`, className: 'moodboard-scrap moodboard-scrap--login-c' },
  ],
  strip: [
    { src: `${MB}/afro-punk.png`, className: 'moodboard-scrap moodboard-scrap--strip-a' },
    { src: `${MB}/asake-sleeve.png`, className: 'moodboard-scrap moodboard-scrap--strip-b' },
    { src: `${MB}/rodman-red.png`, className: 'moodboard-scrap moodboard-scrap--strip-c' },
    { src: `${MB}/silver-surfer.png`, className: 'moodboard-scrap moodboard-scrap--strip-d' },
    { src: `${MB}/lebron-wine.png`, className: 'moodboard-scrap moodboard-scrap--strip-e' },
  ],
};

export default function MoodboardPatchwork({ variant = 'home', className = '' }) {
  const scraps = VARIANTS[variant] || VARIANTS.home;
  return (
    <div className={`moodboard-patchwork moodboard-patchwork--${variant} ${className}`.trim()} aria-hidden>
      {scraps.map((scrap) => (
        <img key={scrap.className} src={scrap.src} alt="" className={scrap.className} loading="lazy" decoding="async" />
      ))}
      <div className="moodboard-patchwork__grain" />
      <div className="moodboard-patchwork__blocks" />
    </div>
  );
}

export const MOODBOARD = {
  sleeve: `${MB}/asake-sleeve.png`,
  drop: `${MB}/cosmic-face.png`,
  hero: `${MB}/youth-globe.png`,
  mark: `${MB}/twiy-globe.png`,
  scraps: MOODBOARD_SCRAPS,
};
