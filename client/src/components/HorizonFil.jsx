import { Link } from 'react-router-dom';

/**
 * Fil légende : aujourd’hui → chapitre → ère.
 * Affiche accumulation / objectifs, pas seulement les cases du jour.
 */
export default function HorizonFil({
  aujourdhui,
  chapitre,
  ere,
  faitsChapitre = 0,
  quetesChapitreFaites = 0,
  quetesChapitreTotal = 0,
  sansObjectif = 0,
}) {
  const titreChap = chapitre?.titre && !/amor[cç]age|chapitre\s*0/i.test(chapitre.titre)
    ? chapitre.titre
    : (chapitre ? `${chapitre.semaine || 'Chapitre'} · ${chapitre.arc_id || ''}` : 'Chapitre —');

  const objectifs = Array.isArray(ere?.objectifs) ? ere.objectifs : [];
  let progresEre = null;
  if (objectifs.length) {
    const scores = objectifs.map((o) => {
      const cible = Number(o.metrique_cible);
      const actuelle = Number(o.metrique_actuelle) || 0;
      if (!cible || Number.isNaN(cible)) return actuelle > 0 ? 1 : 0;
      return Math.min(1, actuelle / cible);
    });
    progresEre = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100);
  }

  return (
    <nav className="horizon-fil" aria-label="Horizon du chantier">
      <div className="horizon-fil__row">
        <span className="horizon-fil__node">
          <span className="compteur">AUJOURD’HUI</span>
          <strong>{aujourdhui}</strong>
        </span>
        <span className="horizon-fil__sep" aria-hidden>→</span>
        <span className="horizon-fil__node">
          <span className="compteur">CHAPITRE</span>
          <strong title={titreChap}>{titreChap}</strong>
          <span className="horizon-fil__meta">
            {quetesChapitreFaites}/{quetesChapitreTotal || '—'} quêtes · {faitsChapitre} fait{faitsChapitre !== 1 ? 's' : ''}
          </span>
        </span>
        <span className="horizon-fil__sep" aria-hidden>→</span>
        <span className="horizon-fil__node">
          <span className="compteur">ÈRE</span>
          {ere?.nom ? (
            <>
              <strong>
                <Link to="/ere" style={{ color: 'inherit', textDecoration: 'none' }}>{ere.nom}</Link>
              </strong>
              <span className="horizon-fil__meta">
                {progresEre != null ? `${progresEre}% objectifs` : `${objectifs.length} objectif${objectifs.length !== 1 ? 's' : ''}`}
                {sansObjectif > 0 ? ` · ${sansObjectif} quête(s) hors fil` : ''}
              </span>
            </>
          ) : (
            <>
              <strong style={{ opacity: 0.55 }}>—</strong>
              <span className="horizon-fil__meta">
                <Link to="/ere" style={{ color: 'var(--jaune)' }}>Ouvrir une ère</Link>
              </span>
            </>
          )}
        </span>
      </div>
      {ere?.nom && sansObjectif > 0 && (
        <p className="horizon-fil__prompt">
          Relie tes quêtes actives à un objectif d’ère —{' '}
          <Link to="/ere">voir Ère</Link>
          {' '}(sinon le fil reste une checklist du jour).
        </p>
      )}
    </nav>
  );
}
