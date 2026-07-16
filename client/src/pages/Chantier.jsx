import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchArcs } from '../store/slices/arcsSlice.js';
import { fetchQuetes, validerQuete } from '../store/slices/questsSlice.js';
import ArcCard from '../components/ArcCard.jsx';
import OsHeader from '../components/OsHeader.jsx';
import ContremaitreBanner from '../components/ContremaitreBanner.jsx';
import { apiGet } from '../lib/api.js';
import { useAuth } from '../auth/AuthContext.jsx';

const streakParArc = { dev: 'dev', beatmaker: 'miprod', croisement: null };

const ROUTINES = ['Aube', 'Miprod', 'Dev', 'Étude', 'Odin', 'Miprod+'];

function jourISO() {
  return new Date().toISOString().slice(0, 10);
}

function blocRoutineActuel() {
  const h = new Date().getHours();
  if (h < 8) return 0;
  if (h < 11) return 1;
  if (h < 14) return 2;
  if (h < 17) return 3;
  if (h < 20) return 4;
  return 5;
}

export default function Chantier() {
  const dispatch = useDispatch();
  const { session, loading: authLoading } = useAuth();
  const arcs = useSelector((s) => s.arcs.items);
  const arcsStatut = useSelector((s) => s.arcs.statut);
  const arcsErreur = useSelector((s) => s.arcs.erreur);
  const quetes = useSelector((s) => s.quetes.items);
  const quetesStatut = useSelector((s) => s.quetes.statut);
  const quetesErreur = useSelector((s) => s.quetes.erreur);
  const [streaks, setStreaks] = useState([]);
  const [chapitres, setChapitres] = useState([]);
  const [dispersion, setDispersion] = useState(null);
  const [sideErreur, setSideErreur] = useState('');
  const [sideStatut, setSideStatut] = useState('idle');
  const actuel = blocRoutineActuel();

  useEffect(() => {
    // RequireAuth already gates, but never dispatch until JWT exists —
    // api.js throws 401 before fetch when token missing (zero Network tab).
    if (authLoading || !session) return undefined;

    const arcsAction = dispatch(fetchArcs());
    const quetesAction = dispatch(fetchQuetes());

    let cancelled = false;
    setSideErreur('');
    setSideStatut('chargement');
    (async () => {
      try {
        const [s, c, d] = await Promise.all([
          apiGet('/streaks'),
          apiGet('/chapitres'),
          apiGet('/eres/dispersion?jours=14'),
        ]);
        if (cancelled) return;
        setStreaks(Array.isArray(s) ? s : []);
        setChapitres(Array.isArray(c) ? c : []);
        setDispersion(d && typeof d === 'object' ? d : null);
        setSideStatut('pret');
      } catch (err) {
        if (!cancelled) {
          setStreaks([]);
          setChapitres([]);
          setDispersion(null);
          setSideErreur(err.message || 'échec chargement annexes');
          setSideStatut('erreur');
        }
      }
    })();

    function onQuetesChanged() {
      dispatch(fetchQuetes());
    }
    window.addEventListener('twiy:quetes-changed', onQuetesChanged);

    return () => {
      cancelled = true;
      arcsAction.abort?.();
      quetesAction.abort?.();
      window.removeEventListener('twiy:quetes-changed', onQuetesChanged);
    };
  }, [dispatch, session, authLoading]);

  const aujourdhui = jourISO();
  const chargement =
    authLoading
    || arcsStatut === 'chargement'
    || quetesStatut === 'chargement'
    || arcsStatut === 'idle'
    || quetesStatut === 'idle'
    || sideStatut === 'chargement'
    || sideStatut === 'idle';
  const erreurPrincipale = arcsErreur || quetesErreur || sideErreur;

  function quetesPourArc(arcId) {
    return quetes.filter((q) => {
      if (arcId === 'dev') return q.type === 'dev' || q.type === 'routine' || q.type === 'freelance';
      return q.type === arcId;
    });
  }

  function chapitrePourArc(arcId) {
    return chapitres
      .filter((c) => c.arc_id === arcId)
      .sort((a, b) => String(b.date_debut).localeCompare(String(a.date_debut)))[0];
  }

  function progression(liste) {
    if (!liste.length) return 0;
    const faites = liste.filter((q) => q.statut === 'fait').length;
    return Math.round((faites / liste.length) * 100);
  }

  function streakPour(arcId) {
    const id = streakParArc[arcId];
    if (!id) return 0;
    return streaks.find((s) => s.id === id)?.jours_consecutifs ?? 0;
  }

  function enRetard(liste) {
    return liste.some((q) => q.statut !== 'fait' && q.date_prevue && q.date_prevue < aujourdhui);
  }

  const titreGlobal = useMemo(() => {
    const c0 = chapitres.find((c) => c.semaine === 'S1');
    return c0?.titre || 'Chapitre 0 — Amorçage';
  }, [chapitres]);

  const faites = quetes.filter((q) => q.statut === 'fait').length;
  const totalStreak = streaks.reduce((acc, s) => acc + (s.jours_consecutifs || 0), 0);

  // Banner only when an active Ère exists AND dispersion is flagged
  const showDispersion = Boolean(dispersion?.ere && dispersion?.dispersion);

  return (
    <div className="os-page">
      <OsHeader
        kicker="OS · CHANTIER"
        title="CHANTIER"
        meta={`${titreGlobal.toUpperCase()} · ${aujourdhui}`}
      />

      <ContremaitreBanner />

      {chargement && (
        <p className="compteur" style={{ marginBottom: 12 }}>› chargement quêtes…</p>
      )}

      {erreurPrincipale && (
        <p className="annotation-manuscrite" style={{ marginBottom: 12 }}>
          API — {erreurPrincipale}
        </p>
      )}

      {showDispersion && (
        <p className="annotation-manuscrite" style={{ marginBottom: 12 }}>
          Dispersion — {dispersion.sans_objectif?.length || 0} quête(s) hors objectif d’ère (14j).{' '}
          <Link to="/ere" style={{ color: 'inherit' }}>Voir Ère</Link>
        </p>
      )}

      <div className="os-stat-rail" aria-label="Compteurs chantier">
        <div>
          <p className="compteur">ARCS</p>
          <p className="os-stat-rail__n">{chargement ? '…' : (arcs.length || 0)}</p>
        </div>
        <div>
          <p className="compteur">QUÊTES</p>
          <p className="os-stat-rail__n">
            {chargement ? '…/…' : `${faites}/${quetes.length || 0}`}
          </p>
        </div>
        <div>
          <p className="compteur">STREAK Σ</p>
          <p className="os-stat-rail__n">{chargement ? '…' : totalStreak}</p>
        </div>
      </div>

      <div className="routine-frise" aria-label="Routine du jour">
        {ROUTINES.map((label, i) => (
          <span key={label} className={i === actuel ? 'actuel' : undefined}>
            {label}
          </span>
        ))}
      </div>

      {!chargement && !erreurPrincipale && !arcs.length && (
        <div className="empty-wall" style={{ marginTop: 16, textAlign: 'center' }}>
          <p className="compteur">ARCS</p>
          <h2 style={{ margin: '12px 0' }}>Aucun arc depuis l’API</h2>
          <p style={{ color: 'var(--text-muted)' }}>Pas de données inventées — vérifie Railway /seed.</p>
        </div>
      )}

      <div className="os-arcs">
        {arcs.map((a) => {
          const liste = quetesPourArc(a.id);
          const chap = chapitrePourArc(a.id);
          const rompu = chap?.statut === 'rompu';
          const reprise = chap?.statut === 'reprise';
          return (
            <div key={a.id}>
              <ArcCard
                nom={a.nom}
                streak={streakPour(a.id)}
                progression={progression(liste)}
                quetes={liste}
                enRetard={enRetard(liste) || rompu}
                badge={rompu ? 'rompu' : reprise ? 'reprise' : null}
                onValider={(id) => dispatch(validerQuete(id))}
              />
              <Link to={`/chantier/${a.id}`} className="arc-console__link">
                › Voir l’arc
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
