import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../lib/api.js';
import { useSecretLoginClick } from '../lib/useSecretLoginClick.js';
import MoodboardPatchwork from '../components/MoodboardPatchwork.jsx';

export default function Home() {
  const onSecretLogin = useSecretLoginClick();
  const [stats, setStats] = useState({ projets: 0, instrus: 0, arcs: 3 });

  useEffect(() => {
    Promise.all([
      apiGet('/projets', { auth: false }).catch(() => []),
      apiGet('/instrumentaux', { auth: false }).catch(() => []),
      apiGet('/arcs', { auth: false }).catch(() => []),
    ]).then(([projets, instrus, arcs]) => {
      setStats({
        projets: (projets || []).length,
        instrus: (instrus || []).length,
        arcs: (arcs || []).length || 3,
      });
    });
  }, []);

  const lookN = String(stats.projets + stats.instrus).padStart(2, '0');

  return (
    <div className="hud-frame registre-quotidien" style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <div className="halftone-overlay halftone-live" />
      <div className="grain grain-live" style={{ position: 'fixed' }} />
      <div
        aria-hidden
        className="atmosphere-void void-grid atmosphere-breathe"
        style={{ position: 'absolute', inset: 0 }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(122,24,48,0.32), transparent 42%), radial-gradient(ellipse at 12% 70%, rgba(255,61,58,0.1), transparent 40%), radial-gradient(ellipse at 88% 65%, rgba(45,107,255,0.08), transparent 42%), linear-gradient(165deg, #0e0c10, #1a1416 42%, #24181a)',
        }}
      />
      <MoodboardPatchwork variant="home" />

      <span className="hud-corner hud-corner--tl" aria-hidden />
      <span className="hud-corner hud-corner--tr" aria-hidden />
      <span className="hud-corner hud-corner--bl" aria-hidden />
      <span className="hud-corner hud-corner--br" aria-hidden />

      <header
        className="anim-split"
        style={{
          position: 'relative',
          zIndex: 2,
          padding: 'var(--space-4)',
        }}
      >
        <p className="compteur" style={{ marginBottom: 8 }}>
          <span className="caret-blink" aria-hidden>›</span> LOOK {lookN} / ARCHIVE
          <span style={{ color: 'rgba(255,210,63,0.5)' }}> • </span>
          HUD 1440
        </p>
        <p
          className="title-dither title-wide title-ghost-wrap"
          data-ghost="THE WORLD IS YOURS"
          onClick={onSecretLogin}
          style={{
            fontSize: 'clamp(1.75rem, 5.5vw, 2.7rem)',
            margin: 0,
            lineHeight: 0.9,
            cursor: 'default',
            userSelect: 'none',
          }}
        >
          THE WORLD IS YOURS
        </p>
        <p className="compteur" style={{ marginTop: 10 }}>
          PUBLIC PROOF
          <span style={{ color: 'rgba(255,210,63,0.5)' }}> • </span>
          CODE / SOUND
        </p>
        <div className="chrome-bar chrome-bar--thin" aria-hidden style={{ marginTop: 14, maxWidth: 180 }} />
      </header>

      <div
        className="anim-split proof-stats chrome-edge"
        style={{ position: 'relative', zIndex: 2, animationDelay: '40ms' }}
      >
        <div>
          <p className="compteur">SHIPPÉS</p>
          <p className="proof-stats__n">{String(stats.projets).padStart(2, '0')}</p>
        </div>
        <div>
          <p className="compteur">SHOWCASE</p>
          <p className="proof-stats__n">{String(stats.instrus).padStart(2, '0')}</p>
        </div>
        <div>
          <p className="compteur">ARCS</p>
          <p className="proof-stats__n">{String(stats.arcs).padStart(2, '0')}</p>
        </div>
      </div>

      <main
        className="home-split registre-fort home-split--fort"
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          minHeight: 'calc(100vh - 200px)',
        }}
      >
        <div className="home-split__fort-wash" aria-hidden />
        <Link
          to="/catalogue/projets"
          className="anim-split home-pane home-pane--code registre-fort"
          style={{ animationDelay: '80ms', textDecoration: 'none', color: 'var(--text)' }}
        >
          <div className="blueprint-grid" aria-hidden style={{ position: 'absolute', inset: 0, opacity: 0.4 }} />
          <div className="scanlines scanlines-live" aria-hidden style={{ opacity: 0.3 }} />
          <div style={{ position: 'relative', textAlign: 'center', padding: 'var(--space-4)' }}>
            <p className="compteur" style={{ marginBottom: 12 }}>01 • BLUEPRINT</p>
            <h1 className="home-pane__title title-ghost-wrap" data-ghost="CODE">CODE</h1>
            <p className="compteur" style={{ marginTop: 20 }}>Projets • Preuves • Ship</p>
          </div>
        </Link>

        <Link
          to="/catalogue/instrus"
          className="anim-split home-pane home-pane--sound chrome-edge chrome-edge-live registre-fort"
          style={{ animationDelay: '160ms', textDecoration: 'none', color: 'var(--text)' }}
        >
          <img
            src="/brand/vinyl-chrome.png"
            alt=""
            aria-hidden
            className="home-pane__vinyl"
          />
          <div className="scanlines scanlines-live" aria-hidden style={{ opacity: 0.35 }} />
          <div style={{ position: 'relative', textAlign: 'center', padding: 'var(--space-4)' }}>
            <p className="compteur" style={{ marginBottom: 12, color: 'var(--chrome)' }}>02 • CHROME</p>
            <h1 className="home-pane__title title-ghost-wrap" data-ghost="SOUND">SOUND</h1>
            <p className="compteur" style={{ marginTop: 20 }}>Instrumentaux • Sessions • Drops</p>
          </div>
        </Link>
      </main>
    </div>
  );
}
