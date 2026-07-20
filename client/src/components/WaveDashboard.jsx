import { useMemo } from 'react';
import { Link } from 'react-router-dom';

function semaineDebutISO() {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function activiteSemaine(quetes, types) {
  const debut = semaineDebutISO();
  const set = new Set(types);
  const liste = quetes.filter((q) => set.has(q.type));
  const faites = liste.filter((q) => q.statut === 'fait' && (q.date_faite || '').slice(0, 10) >= debut);
  const actives = liste.filter((q) => q.statut === 'a_faire' || q.statut === 'en_cours');
  const score = Math.min(1, (faites.length * 0.35 + actives.length * 0.2) / 2.2);
  return { liste, faites, actives, score, faitesCount: faites.length, activesCount: actives.length };
}

/** Build a continuous polyline from activity intensity (0–1). */
function buildPath(score, seed, width, height, baseline, amp) {
  const pts = [];
  const steps = 48;
  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = t * width;
    const wave =
      Math.sin(t * Math.PI * 4 + seed) * 0.45
      + Math.sin(t * Math.PI * 9 + seed * 1.7) * 0.28
      + Math.sin(t * Math.PI * 2.2) * 0.18;
    const envelope = 0.15 + score * 0.85;
    const y = baseline - wave * amp * envelope;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `M ${pts.join(' L ')}`;
}

/**
 * Continuous Dev / Beatmaker waveform — interference = constructive correlation.
 * Croisement stays hidden; wave sits above a compact quest list.
 */
export default function WaveDashboard({
  arcs = [],
  quetes = [],
  streakPour,
  streakRecord,
  onValider,
}) {
  const width = 720;
  const height = 160;

  const bands = useMemo(() => {
    const byId = Object.fromEntries(arcs.map((a) => [a.id, a]));
    const dev = activiteSemaine(quetes, ['dev', 'routine', 'freelance']);
    const beat = activiteSemaine(quetes, ['beatmaker']);
    const both = dev.score > 0.12 && beat.score > 0.12;
    const silence = dev.score < 0.08 && beat.score < 0.08;
    return {
      byId,
      dev,
      beat,
      both,
      silence,
      interference: both ? Math.min(dev.score, beat.score) : 0,
    };
  }, [arcs, quetes]);

  const pathDev = useMemo(
    () => buildPath(bands.dev.score, 0.4, width, height, 58, 28),
    [bands.dev.score],
  );
  const pathBeat = useMemo(
    () => buildPath(bands.beat.score, 2.1, width, height, 108, 28),
    [bands.beat.score],
  );

  const questesCompactes = useMemo(() => {
    const typesDev = new Set(['dev', 'routine', 'freelance']);
    return quetes
      .filter((q) => q.statut !== 'fait' && q.statut !== 'abandonne')
      .filter((q) => typesDev.has(q.type) || q.type === 'beatmaker')
      .slice(0, 8);
  }, [quetes]);

  const labelDev = bands.byId.dev?.nom || 'Dev';
  const labelBeat = bands.byId.beatmaker?.nom || 'Beatmaker';

  return (
    <section className="wave-dash" aria-label="Onde Dev / Beatmaker">
      <div className="wave-dash__bar">
        <span>ONDE · CORRÉLATION</span>
        <span className="compteur-dot">
          {bands.silence ? 'DISPERSION' : bands.both ? 'INTERFÉRENCE +' : 'MONO-BANDE'}
        </span>
      </div>

      <div className="wave-dash__viz" role="img" aria-label={`Activité ${labelDev} et ${labelBeat} cette semaine`}>
        <svg viewBox={`0 0 ${width} ${height}`} className="wave-dash__svg" preserveAspectRatio="none">
          <defs>
            <linearGradient id="waveDevGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--jaune)" stopOpacity="0.9" />
              <stop offset="100%" stopColor="var(--rouge)" stopOpacity="0.75" />
            </linearGradient>
            <linearGradient id="waveBeatGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--chrome)" stopOpacity="0.85" />
              <stop offset="100%" stopColor="var(--rouge)" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="waveInterGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--jaune)" stopOpacity="0.35" />
              <stop offset="100%" stopColor="var(--rouge)" stopOpacity="0.12" />
            </linearGradient>
          </defs>

          {/* Silence / dispersion soft signal */}
          {bands.silence && (
            <rect
              x="0"
              y="0"
              width={width}
              height={height}
              fill="url(#waveInterGrad)"
              opacity="0.35"
              className="wave-dash__silence"
            />
          )}

          {/* Interference zone — constructive when both arcs active */}
          {bands.both && (
            <rect
              x={width * 0.28}
              y={42}
              width={width * 0.44}
              height={76}
              rx="0"
              fill="url(#waveInterGrad)"
              className="wave-dash__interference"
              opacity={0.45 + bands.interference * 0.4}
            />
          )}

          <path d={pathDev} fill="none" stroke="url(#waveDevGrad)" strokeWidth="2.2" className="wave-dash__path wave-dash__path--dev" />
          <path d={pathBeat} fill="none" stroke="url(#waveBeatGrad)" strokeWidth="2.2" className="wave-dash__path wave-dash__path--beat" />

          <line x1="0" y1="58" x2={width} y2="58" stroke="rgba(242,232,218,0.08)" strokeWidth="1" />
          <line x1="0" y1="108" x2={width} y2="108" stroke="rgba(242,232,218,0.08)" strokeWidth="1" />
        </svg>

        <div className="wave-dash__labels">
          <Link to="/chantier/dev" className="wave-dash__band-link">
            <span className="compteur">{labelDev.toUpperCase()}</span>
            <strong>
              {bands.dev.faitesCount} faites · {bands.dev.activesCount} actives
            </strong>
            <span className="compteur">
              streak {streakPour?.('dev') ?? 0}
              {streakRecord ? ` / rec ${streakRecord('dev')}` : ''}
            </span>
          </Link>
          <Link to="/chantier/beatmaker" className="wave-dash__band-link">
            <span className="compteur">{labelBeat.toUpperCase()}</span>
            <strong>
              {bands.beat.faitesCount} faites · {bands.beat.activesCount} actives
            </strong>
            <span className="compteur">
              streak {streakPour?.('beatmaker') ?? 0}
              {streakRecord ? ` / rec ${streakRecord('beatmaker')}` : ''}
            </span>
          </Link>
        </div>

        {bands.both && (
          <p className="wave-dash__note annotation-manuscrite" aria-live="polite">
            interférence constructive — les deux arcs bougent
          </p>
        )}
        {bands.silence && (
          <p className="wave-dash__note annotation-manuscrite" aria-live="polite">
            silence — signal de dispersion doux
          </p>
        )}
      </div>

      <div className="wave-dash__quests">
        <div className="wave-dash__quests-bar">
          <span>QUÊTES · COMPACT</span>
          <span className="compteur-dot">VALIDER</span>
        </div>
        <ul className="os-list os-list--dense wave-dash__list">
          {questesCompactes.map((q) => (
            <li key={q.id}>
              <button
                type="button"
                className="btn-ghost quest-check"
                style={{ padding: '2px 8px', fontSize: '0.62rem' }}
                onClick={() => onValider?.(q.id)}
                aria-label={`Valider ${q.titre}`}
              >
                ✓
              </button>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span className="compteur" style={{ marginRight: 6 }}>
                  {q.type === 'beatmaker' ? 'BEAT' : 'DEV'}
                </span>
                {q.titre}
              </span>
              <Link to={`/chantier/${q.type === 'beatmaker' ? 'beatmaker' : 'dev'}`} className="arc-console__link" style={{ marginTop: 0 }}>
                ›
              </Link>
            </li>
          ))}
          {!questesCompactes.length && (
            <li>
              <span className="compteur">Aucune quête active — Capture (+) ou Ravitaillement</span>
            </li>
          )}
        </ul>
      </div>
    </section>
  );
}
