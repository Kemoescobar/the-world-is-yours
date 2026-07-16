import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { validerQuete } from '../store/slices/questsSlice.js';
import OsHeader from '../components/OsHeader.jsx';
import { apiGet, apiPost } from '../lib/api.js';
import { playTick } from '../lib/sounds.js';

function extractFirstUrl(desc) {
  if (!desc) return null;
  const m = desc.match(/<([^>\s]+)>/) || desc.match(/(https?:\/\/[^\s;]+)/);
  return m ? m[1] : null;
}

function roadmapOrder(source) {
  if (!source) return [9999, 0];
  const week =
    source.match(/LearnByDoing-S(\d+)/)?.[1] ||
    source.match(/SS(\d+)/)?.[1];
  const course = source.match(/-C(\d+)$/)?.[1];
  return [week ? Number(week) : 9999, course ? Number(course) : 0];
}

function emptyPreuveForm(competenceId = '') {
  return {
    competence_id: competenceId,
    type: 'cert_externe',
    url: '',
    reference_id: '',
  };
}

export default function ArcDetail() {
  const { arc } = useParams();
  const dispatch = useDispatch();
  const [chapitres, setChapitres] = useState([]);
  const [quetes, setQuetes] = useState([]);
  const [competences, setCompetences] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [preuveForm, setPreuveForm] = useState(emptyPreuveForm());
  const [projets, setProjets] = useState([]);
  const [instrumentaux, setInstrumentaux] = useState([]);
  const [msg, setMsg] = useState('');
  const [preuveBusy, setPreuveBusy] = useState(false);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  async function loadCompetences() {
    const comps = await apiGet(`/competences?arc=${arc}`);
    if (!Array.isArray(comps)) throw new Error('réponse /competences invalide');
    setCompetences(comps);
    return comps;
  }

  useEffect(() => {
    let cancelled = false;
    setChargement(true);
    setErreur('');
    setChapitres([]);
    setQuetes([]);
    setCompetences([]);
    setExpandedId(null);

    (async () => {
      try {
        const [chaps, qs, comps] = await Promise.all([
          apiGet(`/chapitres?arc=${arc}`),
          apiGet(`/quetes?type=${arc}`),
          apiGet(`/competences?arc=${arc}`),
        ]);
        if (cancelled) return;
        if (!Array.isArray(comps)) throw new Error('réponse /competences invalide');
        setChapitres(Array.isArray(chaps) ? chaps : []);
        setQuetes(Array.isArray(qs) ? qs : []);
        setCompetences(comps);

        // Catalogue pour lier preuves repo/track (best-effort)
        const [projs, instrus] = await Promise.all([
          apiGet('/projets').catch(() => []),
          apiGet('/instrumentaux').catch(() => []),
        ]);
        if (!cancelled) {
          setProjets(Array.isArray(projs) ? projs : []);
          setInstrumentaux(Array.isArray(instrus) ? instrus : []);
        }
      } catch (err) {
        if (!cancelled) {
          setErreur(err.message || 'échec chargement arc');
          setChapitres([]);
          setQuetes([]);
          setCompetences([]);
        }
      } finally {
        if (!cancelled) setChargement(false);
      }
    })();

    return () => { cancelled = true; };
  }, [arc]);

  const byId = useMemo(() => {
    const map = {};
    for (const c of competences) map[c.id] = c;
    return map;
  }, [competences]);

  const prouveeIds = useMemo(() => {
    const set = new Set();
    for (const c of competences) {
      if ((c.preuves || []).length > 0 || c.prouvee) set.add(c.id);
    }
    return set;
  }, [competences]);

  function isUnlocked(c) {
    const prereqs = c.prerequis || [];
    if (!prereqs.length) return true;
    return prereqs.every((id) => prouveeIds.has(id));
  }

  function isProuvee(c) {
    return (c.preuves || []).length > 0 || !!c.prouvee;
  }

  const sortedCompetences = useMemo(() => {
    return [...competences].sort((a, b) => {
      const [wa, ca] = roadmapOrder(a.source_roadmap);
      const [wb, cb] = roadmapOrder(b.source_roadmap);
      if (wa !== wb) return wa - wb;
      if (ca !== cb) return ca - cb;
      return String(a.titre).localeCompare(String(b.titre));
    });
  }, [competences]);

  const parChapitre = useMemo(() => {
    const map = {};
    for (const c of chapitres) map[c.id] = { chapitre: c, quetes: [] };
    for (const q of quetes) {
      if (!map[q.chapitre_id]) continue;
      map[q.chapitre_id].quetes.push(q);
    }
    return Object.values(map).sort((a, b) => String(a.chapitre.semaine).localeCompare(String(b.chapitre.semaine)));
  }, [chapitres, quetes]);

  const faites = quetes.filter((q) => q.statut === 'fait').length;
  const sansObjectif = quetes.filter((q) => q.statut !== 'fait' && !q.ere_objectif_id).length;
  const prouveesCount = competences.filter(isProuvee).length;

  function toggleExpand(c) {
    if (expandedId === c.id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(c.id);
    setPreuveForm(emptyPreuveForm(c.id));
    setMsg('');
  }

  async function ajouterPreuve(e) {
    e.preventDefault();
    setMsg('');
    setPreuveBusy(true);
    try {
      const payload = { type: preuveForm.type };
      if (preuveForm.type === 'cert_externe') {
        if (!preuveForm.url?.trim()) throw new Error('URL requise pour une cert externe');
        payload.url = preuveForm.url.trim();
      } else {
        if (!preuveForm.reference_id) {
          throw new Error(preuveForm.type === 'repo' ? 'Choisis un projet (repo)' : 'Choisis un instrumental (track)');
        }
        payload.reference_id = preuveForm.reference_id;
        if (preuveForm.url?.trim()) payload.url = preuveForm.url.trim();
      }
      await apiPost(`/competences/${preuveForm.competence_id}/preuves`, payload);
      await loadCompetences();
      setPreuveForm(emptyPreuveForm(preuveForm.competence_id));
      setMsg('Preuve enregistrée — compétence prouvée');
    } catch (err) {
      setMsg(err.message);
    } finally {
      setPreuveBusy(false);
    }
  }

  // Croisement mis de côté — redirect UI (DB inchangée)
  if (arc === 'croisement') {
    return <Navigate to="/chantier" replace />;
  }

  return (
    <div className="os-page">
      <p className="compteur" style={{ marginBottom: 8 }}>
        <Link to="/chantier" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
          ← Chantier
        </Link>
      </p>
      <OsHeader
        kicker={`OS · ARC · ${String(arc || '').toUpperCase()}`}
        title={String(arc || 'ARC').toUpperCase()}
        meta={chargement
          ? 'chargement…'
          : `${faites}/${quetes.length} quêtes · ${prouveesCount}/${competences.length} compétences prouvées`}
      />

      {chargement && (
        <p className="compteur" style={{ marginBottom: 12 }}>› chargement API (/competences?arc=…)…</p>
      )}
      {erreur && (
        <p className="annotation-manuscrite" style={{ marginBottom: 12 }}>API — {erreur}</p>
      )}

      {sansObjectif > 0 && (
        <p className="annotation-manuscrite" style={{ marginBottom: 12 }}>
          {sansObjectif} quête(s) sans lien Ère — flag doux
        </p>
      )}

      <section className="os-panel chrome-edge blueprint-grid" style={{ marginBottom: 24, maxWidth: 720 }}>
        <div className="os-panel__bar">
          <span>ARBRE DE COMPÉTENCES</span>
          <span className="compteur-dot">{chargement ? '…' : 'API'}</span>
        </div>
        <div className="os-panel__body">
          {!chargement && !erreur && (
            <p className="compteur" style={{ marginBottom: 12 }}>
              Clique une ligne · acquise seulement avec ≥1 preuve · × = prérequis non prouvés
            </p>
          )}
          {!chargement && !erreur && !sortedCompetences.length && (
            <p className="compteur">Aucune compétence en base pour cet arc (table competences)</p>
          )}
          <ul className="os-list">
            {sortedCompetences.map((c, idx) => {
              const preuves = c.preuves || [];
              const prouvee = isProuvee(c);
              const unlocked = isUnlocked(c);
              const open = expandedId === c.id;
              const url = extractFirstUrl(c.description);
              const prereqList = (c.prerequis || []).map((id) => byId[id]).filter(Boolean);
              const prev = idx > 0 ? sortedCompetences[idx - 1] : null;
              const connected = prev && (c.prerequis || []).includes(prev.id);

              return (
                <li
                  key={c.id}
                  style={{
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    gap: 0,
                    opacity: unlocked ? 1 : 0.72,
                    paddingLeft: connected ? 14 : 0,
                    borderLeft: connected ? '2px solid rgba(255,255,255,0.12)' : undefined,
                    marginLeft: connected ? 6 : 0,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => toggleExpand(c)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      width: '100%',
                      textAlign: 'left',
                      background: 'transparent',
                      border: 'none',
                      padding: '4px 0',
                      cursor: 'pointer',
                      color: 'inherit',
                      font: 'inherit',
                    }}
                    aria-expanded={open}
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        marginTop: 1,
                        color: !unlocked ? 'var(--text-muted)' : prouvee ? 'var(--jaune)' : 'var(--text-muted)',
                      }}
                      aria-hidden
                    >
                      {!unlocked ? '×' : prouvee ? '●' : '○'}
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ color: prouvee ? 'var(--jaune)' : 'var(--text)' }}>
                        {c.titre}
                      </span>
                      <span className="compteur" style={{ display: 'block', marginTop: 2 }}>
                        {prouvee ? 'prouvée' : 'listée'}
                        {!unlocked && ' · verrouillée'}
                        {c.niveau_requis && ` · ${c.niveau_requis}`}
                        {c.source_roadmap && ` · ${c.source_roadmap}`}
                      </span>
                    </span>
                    <span className="compteur" style={{ flexShrink: 0 }}>
                      {open ? '▴' : '▾'}
                    </span>
                  </button>

                  {open && (
                    <div
                      style={{
                        marginTop: 8,
                        marginBottom: 4,
                        padding: '12px 12px 10px',
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        display: 'grid',
                        gap: 10,
                      }}
                    >
                      {c.description && (
                        <p style={{
                          margin: 0,
                          fontFamily: 'var(--font-body)',
                          fontSize: '0.85rem',
                          lineHeight: 1.45,
                          color: 'var(--text)',
                          whiteSpace: 'pre-wrap',
                        }}
                        >
                          {c.description}
                        </p>
                      )}

                      <div className="compteur" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {c.source_roadmap && <span>source: {c.source_roadmap}</span>}
                        {url && (
                          <a href={url} target="_blank" rel="noreferrer" style={{ color: 'var(--jaune)' }}>
                            ressource roadmap ↗
                          </a>
                        )}
                      </div>

                      <div>
                        <p className="compteur" style={{ marginBottom: 4 }}>PRÉREQUIS</p>
                        {!prereqList.length ? (
                          <p className="compteur" style={{ opacity: 0.7 }}>Aucun — point d&apos;entrée</p>
                        ) : (
                          <ul style={{ margin: 0, paddingLeft: 16, fontFamily: 'var(--font-body)', fontSize: '0.85rem' }}>
                            {prereqList.map((p) => {
                              const ok = prouveeIds.has(p.id);
                              return (
                                <li key={p.id} style={{ marginBottom: 4 }}>
                                  <button
                                    type="button"
                                    className="btn-ghost"
                                    style={{ padding: '2px 8px', fontSize: '0.75rem' }}
                                    onClick={() => {
                                      setExpandedId(p.id);
                                      setPreuveForm(emptyPreuveForm(p.id));
                                    }}
                                  >
                                    {ok ? '●' : '○'} {p.titre}
                                  </button>
                                  <span className="compteur" style={{ marginLeft: 6 }}>
                                    {ok ? 'prouvée' : 'manquante'}
                                  </span>
                                </li>
                              );
                            })}
                          </ul>
                        )}
                      </div>

                      <div>
                        <p className="compteur" style={{ marginBottom: 4 }}>
                          PREUVES ({preuves.length}) — obligatoire pour « prouvée »
                        </p>
                        {!preuves.length ? (
                          <p className="compteur" style={{ opacity: 0.7 }}>Aucune preuve — statut listée</p>
                        ) : (
                          <ul style={{ margin: 0, paddingLeft: 16, fontFamily: 'var(--font-body)', fontSize: '0.85rem' }}>
                            {preuves.map((pr) => (
                              <li key={pr.id} style={{ marginBottom: 4 }}>
                                <span className="compteur">{pr.type}</span>
                                {' '}
                                {pr.url ? (
                                  <a href={pr.url} target="_blank" rel="noreferrer" style={{ color: 'var(--jaune)' }}>
                                    {pr.url}
                                  </a>
                                ) : (
                                  <span>{pr.reference_id?.slice(0, 8)}…</span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <form onSubmit={ajouterPreuve} style={{ display: 'grid', gap: 8 }}>
                        <p className="compteur">AJOUTER UNE PREUVE</p>
                        <select
                          value={preuveForm.type}
                          onChange={(e) => setPreuveForm({
                            ...preuveForm,
                            type: e.target.value,
                            reference_id: '',
                            url: '',
                          })}
                        >
                          <option value="cert_externe">Cert externe (URL)</option>
                          {arc !== 'beatmaker' && <option value="repo">Repo (projet_dev)</option>}
                          {arc !== 'dev' && <option value="track">Track (instrumental)</option>}
                        </select>

                        {preuveForm.type === 'cert_externe' && (
                          <input
                            required
                            type="url"
                            placeholder="https://…"
                            value={preuveForm.url}
                            onChange={(e) => setPreuveForm({ ...preuveForm, url: e.target.value })}
                          />
                        )}

                        {preuveForm.type === 'repo' && (
                          <select
                            required
                            value={preuveForm.reference_id}
                            onChange={(e) => setPreuveForm({ ...preuveForm, reference_id: e.target.value })}
                          >
                            <option value="">Projet…</option>
                            {projets.map((p) => (
                              <option key={p.id} value={p.id}>{p.titre || p.id}</option>
                            ))}
                          </select>
                        )}

                        {preuveForm.type === 'track' && (
                          <select
                            required
                            value={preuveForm.reference_id}
                            onChange={(e) => setPreuveForm({ ...preuveForm, reference_id: e.target.value })}
                          >
                            <option value="">Instrumental…</option>
                            {instrumentaux.map((t) => (
                              <option key={t.id} value={t.id}>{t.titre || t.id}</option>
                            ))}
                          </select>
                        )}

                        <button type="submit" className="btn-ghost" disabled={preuveBusy}>
                          {preuveBusy ? 'Enregistrement…' : 'Enregistrer preuve'}
                        </button>
                        {msg && preuveForm.competence_id === c.id && (
                          <p className="compteur">{msg}</p>
                        )}
                      </form>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <div className="os-stack" style={{ maxWidth: 720 }}>
        {parChapitre.map(({ chapitre, quetes: qs }) => (
          <section key={chapitre.id} className="os-panel chrome-edge blueprint-grid">
            <div className="os-panel__bar">
              <span>{chapitre.semaine} · {chapitre.statut}</span>
              <span className="compteur-dot">{qs.filter((q) => q.statut === 'fait').length}/{qs.length}</span>
            </div>
            <div className="os-panel__body">
              <h2 style={{ fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                {chapitre.titre || 'Sans titre'}
              </h2>
              <ul className="os-list" style={{ marginTop: 8, fontFamily: 'var(--font-body)', fontSize: '0.9rem' }}>
                {qs.map((q) => (
                  <li key={q.id} style={{ opacity: q.statut === 'fait' ? 0.5 : 1, color: 'var(--text)', letterSpacing: 0 }}>
                    <input
                      type="checkbox"
                      className="quest-check"
                      checked={q.statut === 'fait'}
                      disabled={q.statut === 'fait'}
                      onChange={async () => {
                        playTick();
                        try {
                          await dispatch(validerQuete(q.id)).unwrap();
                        } catch (err) {
                          setMsg(err?.message || String(err));
                        }
                        setQuetes(await apiGet(`/quetes?type=${arc}`));
                      }}
                      style={{ accentColor: 'var(--jaune)' }}
                    />
                    <span style={{ textDecoration: q.statut === 'fait' ? 'line-through' : 'none' }}>
                      {q.titre}
                      {!q.ere_objectif_id && q.statut !== 'fait' && (
                        <span className="compteur" style={{ marginLeft: 6, opacity: 0.6 }}>sans ère</span>
                      )}
                    </span>
                  </li>
                ))}
                {!qs.length && <li className="compteur">Aucune quête</li>}
              </ul>
            </div>
          </section>
        ))}
        {!parChapitre.length && !chargement && (
          <div className="empty-wall" style={{ display: 'grid', placeItems: 'center', textAlign: 'center' }}>
            <p className="compteur">CHAPITRES</p>
            <h2 style={{ margin: '12px 0' }}>Pas encore de chapitre</h2>
            <span className="annotation-manuscrite">vide pour l’instant</span>
          </div>
        )}
      </div>
    </div>
  );
}
