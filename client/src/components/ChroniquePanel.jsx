import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api.js';
import TypeReveal from './TypeReveal.jsx';

/**
 * Bloc Chronique — récit hero en tête du Chantier.
 * refreshKey / twiy:chronique-refresh : après capture / check-in / quêtes.
 */
export default function ChroniquePanel({ refreshKey = 0, onTitreChange }) {
  const [data, setData] = useState(null);
  const [statut, setStatut] = useState('idle');
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    let cancelled = false;
    setStatut('chargement');
    setErreur('');
    (async () => {
      try {
        const [jour, chap] = await Promise.all([
          apiGet('/chronique/jour'),
          apiGet('/chronique/chapitre-actif?appliquer_titre=1'),
        ]);
        if (cancelled) return;
        const preferChap = chap?.corps && chap?.chapitre;
        const next = {
          titre: preferChap ? (chap.titre || jour?.titre) : (jour?.titre || chap?.titre),
          corps: preferChap ? chap.corps : (jour?.corps || chap?.corps),
          source: preferChap ? chap.source : (jour?.source || chap?.source || 'heuristic'),
          chapitre: chap?.chapitre || null,
          titre_mis_a_jour: Boolean(chap?.titre_mis_a_jour),
        };
        setData(next);
        setStatut('pret');
        if (chap?.titre_mis_a_jour) {
          onTitreChange?.(chap.chapitre);
          window.dispatchEvent(new CustomEvent('twiy:chapitre-titre-changed', { detail: chap.chapitre }));
        }
      } catch (err) {
        if (!cancelled) {
          setErreur(err.message || 'chronique indisponible');
          setStatut('erreur');
          setData(null);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey, onTitreChange]);

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

  if (statut === 'erreur' || !data?.corps) {
    return (
      <article className="chronique-poster chrome-edge">
        <div className="chronique-poster__bar">
          <span>CHRONIQUE</span>
          <span className="compteur-dot">OFF</span>
        </div>
        <div className="chronique-poster__body">
          <p className="annotation-manuscrite">{erreur || 'Pas de récit — capture un fait (+).'}</p>
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
    <article className="chronique-poster chrome-edge chrome-edge-live" aria-label="Chronique du chantier">
      <div className="chronique-poster__media" aria-hidden="true">
        <img src="/brand/globe-hand.png" alt="" className="chronique-poster__img chronique-poster__img--a" />
        <img src="/brand/vinyl-chrome.png" alt="" className="chronique-poster__img chronique-poster__img--b" />
        <div className="grain" />
        <div className="scanlines" />
      </div>
      <div className="chronique-poster__bar">
        <span>CHRONIQUE</span>
        <span className="compteur-dot">
          {data.source === 'ia' ? 'IA' : 'HEURISTIQUE'}
          {data.titre_mis_a_jour ? ' · TITRE ↑' : ''}
        </span>
      </div>
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
