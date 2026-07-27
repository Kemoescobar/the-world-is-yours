import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import TypeReveal from './TypeReveal.jsx';
import ChroniqueCollage from './ChroniqueCollage.jsx';

/**
 * Bloc Chronique — données depuis le store dashboard (pas d’API directe).
 */
export default function ChroniquePanel() {
  const statut = useSelector((s) => s.dashboard.statut);
  const chroniqueJour = useSelector((s) => s.dashboard.chroniqueJour);
  const chapitreActif = useSelector((s) => s.dashboard.chapitreActif);
  const entrees = useSelector((s) => s.dashboard.entrees);
  const quetes = useSelector((s) => s.dashboard.quetes);
  const erreurs = useSelector((s) => s.dashboard.erreurs || []);

  const data = useMemo(() => {
    const preferChap = chapitreActif?.corps && chapitreActif?.chapitre;
    if (!chroniqueJour && !chapitreActif) return null;
    return {
      titre: preferChap
        ? (chapitreActif.titre || chroniqueJour?.titre)
        : (chroniqueJour?.titre || chapitreActif?.titre),
      corps: preferChap
        ? chapitreActif.corps
        : (chroniqueJour?.corps || chapitreActif?.corps),
      source: preferChap
        ? chapitreActif.source
        : (chroniqueJour?.source || chapitreActif?.source || 'heuristic'),
      chapitre: chapitreActif?.chapitre || null,
      titre_mis_a_jour: Boolean(chapitreActif?.titre_mis_a_jour),
    };
  }, [chroniqueJour, chapitreActif]);

  const week = useMemo(() => {
    const debut = new Date();
    debut.setDate(debut.getDate() - 7);
    return {
      entrees: (entrees || []).filter((e) => new Date(e.cree_le) >= debut),
      quetes: quetes || [],
    };
  }, [entrees, quetes]);

  const errChronique = erreurs.find(
    (e) => e.cle === 'chroniqueJour' || e.cle === 'chapitreActif',
  );

  if (statut === 'chargement' || statut === 'idle') {
    return (
      <article className="chronique-poster chrome-edge" aria-busy="true">
        <div className="chronique-poster__bar">
          <span>CHRONIQUE</span>
          <span className="compteur-dot">…</span>
        </div>
        <div className="chronique-poster__body">
          <p className="compteur">› récit en cours…</p>
        </div>
      </article>
    );
  }

  if (errChronique && !data?.corps) {
    return (
      <article className="chronique-poster chrome-edge">
        <div className="chronique-poster__bar">
          <span>CHRONIQUE</span>
          <span className="compteur-dot">OFF</span>
        </div>
        <div className="chronique-poster__body">
          <p className="annotation-manuscrite">{errChronique.message || 'chronique indisponible'}</p>
          <button
            type="button"
            className="btn-ghost"
            style={{ marginTop: 10 }}
            onClick={() => window.dispatchEvent(new CustomEvent('twiy:open-capture', { detail: { mode: 'checkin' } }))}
          >
            › Check-in du soir
          </button>
        </div>
      </article>
    );
  }

  if (!data?.corps) {
    return (
      <article className="chronique-poster chrome-edge">
        <div className="chronique-poster__bar">
          <span>CHRONIQUE</span>
          <span className="compteur-dot">OFF</span>
        </div>
        <div className="chronique-poster__body">
          <p className="annotation-manuscrite">Pas de récit — capture un fait (+).</p>
          <button
            type="button"
            className="btn-ghost"
            style={{ marginTop: 10 }}
            onClick={() => window.dispatchEvent(new CustomEvent('twiy:open-capture', { detail: { mode: 'checkin' } }))}
          >
            › Check-in du soir
          </button>
        </div>
      </article>
    );
  }

  return (
    <article className="chronique-poster chrome-edge chrome-edge-live" aria-label="Chronique du chantier" style={{ position: 'relative', overflow: 'hidden' }}>
      <img
        src="/brand/moodboard/ukiyo-sun.png"
        alt=""
        aria-hidden
        className="chronique-poster__scrap"
        loading="lazy"
      />
      <div className="chronique-poster__bar">
        <span>CHRONIQUE</span>
        <span className="compteur-dot">
          {data.source === 'ia' ? 'HEURISTIQUE' : (data.source || 'HEURISTIQUE').toUpperCase()}
          {data.titre_mis_a_jour ? ' · TITRE ↑' : ''}
        </span>
      </div>
      <ChroniqueCollage
        compact
        entrees={week.entrees}
        quetes={week.quetes}
        titre={data.titre}
        corps={data.corps}
      />
      <div className="chronique-poster__body">
        <TypeReveal as="h2" className="chronique-poster__titre title-wide" text={data.titre} />
        <TypeReveal as="p" className="chronique-poster__corps type-reveal--glitch" text={data.corps} />
        <div className="chronique-poster__actions">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => window.dispatchEvent(new CustomEvent('twiy:open-capture', { detail: { mode: 'checkin' } }))}
          >
            › T’as fait quoi aujourd’hui ?
          </button>
        </div>
      </div>
    </article>
  );
}
