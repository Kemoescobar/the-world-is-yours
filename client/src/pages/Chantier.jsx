import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchArcs } from '../store/slices/arcsSlice.js';
import { fetchQuetes, validerQuete } from '../store/slices/questsSlice.js';
import OsHeader from '../components/OsHeader.jsx';
import ContremaitreBanner from '../components/ContremaitreBanner.jsx';
import EmploiDuTemps from '../components/EmploiDuTemps.jsx';
import ChroniquePanel from '../components/ChroniquePanel.jsx';
import HorizonFil from '../components/HorizonFil.jsx';
import WaveDashboard from '../components/WaveDashboard.jsx';
import MoodboardPatchwork from '../components/MoodboardPatchwork.jsx';
import { apiGet } from '../lib/api.js';
import { useAuth } from '../auth/AuthContext.jsx';

const streakParArc = { dev: 'dev', beatmaker: 'miprod' };
/** Croisement mis de côté — UI hide seulement (DB inchangée). */
const ARCS_CACHES = new Set(['croisement']);

function jourISO() {
  return new Date().toISOString().slice(0, 10);
}

function estTitreGenerique(titre) {
  if (!titre || !String(titre).trim()) return true;
  return /amor[cç]age|chapitre\s*0|^s\d+\s*[—–-]/i.test(String(titre));
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
  const [ere, setEre] = useState(null);
  const [entreesRecent, setEntreesRecent] = useState([]);
  const [sideErreur, setSideErreur] = useState('');
  const [sideStatut, setSideStatut] = useState('idle');
  const [edtRefresh, setEdtRefresh] = useState(0);
  const [chroniqueRefresh, setChroniqueRefresh] = useState(0);
  const [toast, setToast] = useState('');

  const reloadSide = useCallback(async () => {
    const [s, c, d, e, ent] = await Promise.all([
      apiGet('/streaks'),
      apiGet('/chapitres'),
      apiGet('/eres/dispersion?jours=14'),
      apiGet('/eres/active'),
      apiGet('/entrees'),
    ]);
    setStreaks(Array.isArray(s) ? s : []);
    setChapitres(Array.isArray(c) ? c : []);
    setDispersion(d && typeof d === 'object' ? d : null);
    setEre(e && e.id ? e : null);
    setEntreesRecent(Array.isArray(ent) ? ent.slice(0, 80) : []);
  }, []);

  useEffect(() => {
    if (authLoading || !session) return undefined;

    const arcsAction = dispatch(fetchArcs());
    const quetesAction = dispatch(fetchQuetes());

    let cancelled = false;
    setSideErreur('');
    setSideStatut('chargement');
    (async () => {
      try {
        await reloadSide();
        if (!cancelled) setSideStatut('pret');
      } catch (err) {
        if (!cancelled) {
          setStreaks([]);
          setChapitres([]);
          setDispersion(null);
          setEre(null);
          setEntreesRecent([]);
          setSideErreur(err.message || 'échec chargement annexes');
          setSideStatut('erreur');
        }
      }
    })();

    function onQuetesChanged() {
      dispatch(fetchQuetes());
      setEdtRefresh((n) => n + 1);
      setChroniqueRefresh((n) => n + 1);
    }

    function onEntreesChanged(ev) {
      // Quête créée via capture (type « Quête ») → refresh liste ; sinon faits seulement
      if (ev?.detail?.quete || ev?.detail?.kind === 'quete') {
        dispatch(fetchQuetes());
      }
      setEdtRefresh((n) => n + 1);
      setChroniqueRefresh((n) => n + 1);
      reloadSide().catch(() => {});
      const n = ev?.detail?.creees?.length || (ev?.detail?.entree ? 1 : 0);
      if (n > 0) {
        const label = ev?.detail?.quete
          ? `${n} quête${n > 1 ? 's' : ''} ajoutée${n > 1 ? 's' : ''}`
          : `${n} fait${n > 1 ? 's' : ''} dans le système`;
        setToast(label);
        setTimeout(() => setToast(''), 2200);
      }
    }

    function onChroniqueRefresh() {
      setChroniqueRefresh((n) => n + 1);
      reloadSide().catch(() => {});
    }

    function onTitreChanged() {
      reloadSide().catch(() => {});
    }

    window.addEventListener('twiy:quetes-changed', onQuetesChanged);
    window.addEventListener('twiy:entrees-changed', onEntreesChanged);
    window.addEventListener('twiy:chronique-refresh', onChroniqueRefresh);
    window.addEventListener('twiy:chapitre-titre-changed', onTitreChanged);

    return () => {
      cancelled = true;
      arcsAction.abort?.();
      quetesAction.abort?.();
      window.removeEventListener('twiy:quetes-changed', onQuetesChanged);
      window.removeEventListener('twiy:entrees-changed', onEntreesChanged);
      window.removeEventListener('twiy:chronique-refresh', onChroniqueRefresh);
      window.removeEventListener('twiy:chapitre-titre-changed', onTitreChanged);
    };
  }, [dispatch, session, authLoading, reloadSide]);

  const aujourdhui = jourISO();
  // Ne bloque l’UI que sur le premier chargement — un refetch ne vide plus la carte
  const chargement =
    authLoading
    || arcsStatut === 'chargement'
    || arcsStatut === 'idle'
    || ((quetesStatut === 'chargement' || quetesStatut === 'idle') && !quetes.length)
    || sideStatut === 'chargement'
    || sideStatut === 'idle';
  const erreurPrincipale = arcsErreur || quetesErreur || sideErreur;

  function chapitrePourArc(arcId) {
    return chapitres
      .filter((c) => c.arc_id === arcId)
      .sort((a, b) => String(b.date_debut).localeCompare(String(a.date_debut)))[0];
  }

  function streakPour(arcId) {
    const id = streakParArc[arcId];
    if (!id) return 0;
    return streaks.find((s) => s.id === id)?.jours_consecutifs ?? 0;
  }

  function streakRecord(arcId) {
    const id = streakParArc[arcId];
    if (!id) return 0;
    return streaks.find((s) => s.id === id)?.record ?? 0;
  }

  const chapitreHero = useMemo(() => {
    return chapitrePourArc('dev') || chapitrePourArc('beatmaker') || chapitres[0] || null;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chapitres]);

  const titreGlobal = useMemo(() => {
    if (chapitreHero?.titre && !estTitreGenerique(chapitreHero.titre)) {
      return chapitreHero.titre;
    }
    const c0 = chapitres.find((c) => c.semaine === 'S1');
    if (c0?.titre && !estTitreGenerique(c0.titre)) return c0.titre;
    return c0?.titre || chapitreHero?.titre || 'Chapitre 0 — Amorçage';
  }, [chapitres, chapitreHero]);

  const arcsVisibles = useMemo(
    () => arcs.filter((a) => !ARCS_CACHES.has(a.id)),
    [arcs],
  );

  const faites = quetes.filter((q) => q.statut === 'fait').length;
  const totalStreak = streaks.reduce((acc, s) => acc + (s.jours_consecutifs || 0), 0);

  const quetesHero = chapitreHero
    ? quetes.filter((q) => q.chapitre_id === chapitreHero.id)
    : [];
  const quetesHeroFaites = quetesHero.filter((q) => q.statut === 'fait').length;
  const faitsChapitre = chapitreHero
    ? entreesRecent.filter((e) => e.arc_id === chapitreHero.arc_id).length
    : entreesRecent.length;

  const showDispersion = Boolean(dispersion?.ere && dispersion?.dispersion);
  const erePasBranchee = dispersion?.note === 'ère pas encore branchée aux quêtes';
  const sansObjectif = erePasBranchee ? 0 : (dispersion?.sans_objectif?.length || 0);

  const onTitreChange = useCallback(() => {
    reloadSide().catch(() => {});
  }, [reloadSide]);

  return (
    <div className="os-page chantier-page">
      <div className="chantier-atmosphere" aria-hidden="true">
        <MoodboardPatchwork variant="chantier" />
        <div className="chantier-atmosphere__wash" />
      </div>

      <OsHeader
        kicker="OS · CHANTIER"
        title="CHANTIER"
        meta={`${titreGlobal.toUpperCase()} · ${aujourdhui}`}
        actions={(
          <button
            type="button"
            className="btn-ghost"
            onClick={() => window.dispatchEvent(new CustomEvent('twiy:open-capture', { detail: { mode: 'checkin' } }))}
          >
            › Check-in
          </button>
        )}
      />

      {!authLoading && session && (
        <ChroniquePanel refreshKey={chroniqueRefresh} onTitreChange={onTitreChange} />
      )}

      <HorizonFil
        aujourdhui={aujourdhui}
        chapitre={chapitreHero}
        ere={ere || dispersion?.ere || null}
        faitsChapitre={faitsChapitre}
        quetesChapitreFaites={quetesHeroFaites}
        quetesChapitreTotal={quetesHero.length}
        sansObjectif={sansObjectif}
        erePasBranchee={erePasBranchee}
      />

      <ContremaitreBanner />

      {toast && (
        <p className="chantier-toast" role="status">› {toast}</p>
      )}

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
          <Link to="/chantier/dev" style={{ color: 'inherit' }}>Lier depuis un Arc</Link>
          {' · '}
          <Link to="/ere" style={{ color: 'inherit' }}>Voir Ère</Link>
        </p>
      )}

      <div className="os-stat-rail" aria-label="Compteurs chantier">
        <div>
          <p className="compteur">ARCS</p>
          <p className="os-stat-rail__n">{chargement ? '…' : (arcsVisibles.length || 0)}</p>
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

      {!authLoading && session && (
        <EmploiDuTemps
          refreshKey={edtRefresh}
          onValider={async (id) => {
            await dispatch(validerQuete(id));
            setEdtRefresh((n) => n + 1);
            setChroniqueRefresh((n) => n + 1);
          }}
        />
      )}

      {!chargement && !erreurPrincipale && !arcsVisibles.length && (
        <div className="empty-wall" style={{ marginTop: 16, textAlign: 'center' }}>
          <p className="compteur">ARCS</p>
          <h2 style={{ margin: '12px 0' }}>Aucun arc depuis l’API</h2>
          <p style={{ color: 'var(--text-muted)' }}>Pas de données inventées — vérifie Railway /seed.</p>
        </div>
      )}

      {!chargement && arcsVisibles.length > 0 && (
        <WaveDashboard
          arcs={arcsVisibles}
          quetes={quetes}
          streakPour={streakPour}
          streakRecord={streakRecord}
          onValider={(id) => {
            dispatch(validerQuete(id));
            setChroniqueRefresh((n) => n + 1);
          }}
        />
      )}
    </div>
  );
}
