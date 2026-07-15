import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
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

export default function ArcDetail() {
  const { arc } = useParams();
  const dispatch = useDispatch();
  const [chapitres, setChapitres] = useState([]);
  const [quetes, setQuetes] = useState([]);
  const [competences, setCompetences] = useState([]);
  const [preuvesMap, setPreuvesMap] = useState({});
  const [preuveForm, setPreuveForm] = useState({ competence_id: '', type: 'cert_externe', url: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    apiGet(`/chapitres?arc=${arc}`).then(setChapitres).catch(() => setChapitres([]));
    apiGet(`/quetes?type=${arc}`).then(setQuetes).catch(() => setQuetes([]));
    apiGet(`/competences?arc=${arc}`).then(async (list) => {
      setCompetences(list || []);
      const map = {};
      await Promise.all((list || []).slice(0, 40).map(async (c) => {
        try {
          const detail = await apiGet(`/competences/${c.id}`);
          map[c.id] = detail.preuves || [];
        } catch {
          map[c.id] = [];
        }
      }));
      setPreuvesMap(map);
    }).catch(() => setCompetences([]));
  }, [arc]);

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

  const parNiveau = useMemo(() => {
    const g = { initiation: [], pratique: [], maitrise: [], autre: [] };
    for (const c of competences) {
      const k = g[c.niveau_requis] ? c.niveau_requis : 'autre';
      g[k].push(c);
    }
    return g;
  }, [competences]);

  async function ajouterPreuve(e) {
    e.preventDefault();
    setMsg('');
    try {
      await apiPost(`/competences/${preuveForm.competence_id}/preuves`, {
        type: preuveForm.type,
        url: preuveForm.url || null,
      });
      const detail = await apiGet(`/competences/${preuveForm.competence_id}`);
      setPreuvesMap((m) => ({ ...m, [preuveForm.competence_id]: detail.preuves || [] }));
      setPreuveForm({ ...preuveForm, url: '' });
      setMsg('Preuve enregistrée');
    } catch (err) {
      setMsg(err.message);
    }
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
        meta={`${faites}/${quetes.length} quêtes · ${competences.length} compétences`}
      />

      {sansObjectif > 0 && (
        <p className="annotation-manuscrite" style={{ marginBottom: 12 }}>
          {sansObjectif} quête(s) sans lien Ère — flag doux
        </p>
      )}

      <section className="os-panel chrome-edge blueprint-grid" style={{ marginBottom: 24, maxWidth: 720 }}>
        <div className="os-panel__bar">
          <span>ARBRE DE COMPÉTENCES</span>
          <span className="compteur-dot">ROADMAP</span>
        </div>
        <div className="os-panel__body">
          {!competences.length && (
            <p className="compteur">Aucune compétence seedée pour cet arc</p>
          )}
          {['initiation', 'pratique', 'maitrise', 'autre'].map((niv) => (
            parNiveau[niv]?.length ? (
              <div key={niv} style={{ marginBottom: 16 }}>
                <p className="compteur" style={{ marginBottom: 6 }}>{niv.toUpperCase()}</p>
                <ul className="os-list">
                  {parNiveau[niv].map((c) => {
                    const preuves = preuvesMap[c.id] || [];
                    const url = extractFirstUrl(c.description);
                    return (
                      <li key={c.id} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 4 }}>
                        <span>
                          <span style={{ color: preuves.length ? 'var(--jaune)' : 'var(--text-muted)' }}>
                            {preuves.length ? '●' : '○'}
                          </span>
                          {' '}{c.titre}
                          {c.source_roadmap && (
                            <span className="compteur" style={{ marginLeft: 8 }}>{c.source_roadmap}</span>
                          )}
                        </span>
                        {url && (
                          <a href={url} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            ressource roadmap
                          </a>
                        )}
                        {preuves.length > 0 && (
                          <span className="compteur">{preuves.length} preuve(s)</span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ) : null
          ))}

          {competences.length > 0 && (
            <form onSubmit={ajouterPreuve} style={{ display: 'grid', gap: 8, marginTop: 12 }}>
              <p className="compteur">AJOUTER UNE PREUVE</p>
              <select
                required
                value={preuveForm.competence_id}
                onChange={(e) => setPreuveForm({ ...preuveForm, competence_id: e.target.value })}
              >
                <option value="">Compétence…</option>
                {competences.map((c) => (
                  <option key={c.id} value={c.id}>{c.titre}</option>
                ))}
              </select>
              <select
                value={preuveForm.type}
                onChange={(e) => setPreuveForm({ ...preuveForm, type: e.target.value })}
              >
                <option value="cert_externe">Cert externe (URL)</option>
                <option value="repo">Repo (UUID projet)</option>
                <option value="track">Track (UUID instru)</option>
              </select>
              <input
                placeholder="URL preuve"
                value={preuveForm.url}
                onChange={(e) => setPreuveForm({ ...preuveForm, url: e.target.value })}
              />
              <button type="submit" className="btn-ghost">Enregistrer preuve</button>
              {msg && <p className="compteur">{msg}</p>}
            </form>
          )}
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
        {!parChapitre.length && (
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
