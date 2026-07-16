import { useEffect, useState } from 'react';
import OsHeader from '../components/OsHeader.jsx';
import { apiGet, apiPost } from '../lib/api.js';

function newObjectif() {
  return {
    id: crypto.randomUUID(),
    titre: '',
    description: '',
    metrique_cible: '',
    metrique_actuelle: 0,
  };
}

export default function Ere() {
  const [eres, setEres] = useState([]);
  const [active, setActive] = useState(null);
  const [dispersion, setDispersion] = useState(null);
  const [form, setForm] = useState({
    nom: '',
    date_debut: new Date().toISOString().slice(0, 10),
    date_fin: '',
    objectifs: [newObjectif()],
  });
  const [erreur, setErreur] = useState('');
  const [statut, setStatut] = useState('idle');

  async function reload() {
    const [list, act, disp] = await Promise.all([
      apiGet('/eres'),
      apiGet('/eres/active'),
      apiGet('/eres/dispersion?jours=14'),
    ]);
    setEres(list || []);
    setActive(act);
    setDispersion(disp);
  }

  useEffect(() => {
    reload().catch((e) => setErreur(e.message));
  }, []);

  async function creer(e) {
    e.preventDefault();
    setErreur('');
    setStatut('save');
    try {
      const objectifs = (form.objectifs || [])
        .filter((o) => o.titre.trim())
        .map((o) => ({
          id: o.id || crypto.randomUUID(),
          titre: o.titre.trim(),
          description: o.description || '',
          metrique_cible: o.metrique_cible || null,
          metrique_actuelle: Number(o.metrique_actuelle) || 0,
        }));
      await apiPost('/eres', { ...form, objectifs });
      setForm({
        nom: '',
        date_debut: new Date().toISOString().slice(0, 10),
        date_fin: '',
        objectifs: [newObjectif()],
      });
      await reload();
      setStatut('ok');
    } catch (err) {
      setErreur(err.message);
      setStatut('idle');
    }
  }

  async function cloturer(id) {
    if (!window.confirm('Clôturer cette ère et créer un Drop bilan_ere ?')) return;
    try {
      await apiPost(`/eres/${id}/cloturer`, {});
      await reload();
    } catch (err) {
      setErreur(err.message);
    }
  }

  return (
    <div className="os-page" style={{ maxWidth: 720 }}>
      <OsHeader
        kicker="OS · ÈRE"
        title="ÈRE"
        meta="Horizon annuel · objectifs · flag dispersion"
      />
      {erreur && <p className="annotation-manuscrite" style={{ marginBottom: 12 }}>{erreur}</p>}

      {dispersion?.ere && dispersion?.dispersion && (
        <p className="annotation-manuscrite" style={{ marginBottom: 16 }}>
          Dispersion douce — {dispersion.sans_objectif?.length || 0} quête(s) sans objectif d’ère sur {dispersion.jours}j
          (non bloquant)
        </p>
      )}
      {dispersion?.ere && !dispersion?.dispersion && dispersion?.note === 'ère pas encore branchée aux quêtes' && (
        <p className="compteur" style={{ marginBottom: 16, opacity: 0.7 }}>
          Ère active — pas encore branchée aux quêtes (pas de Dispersion)
        </p>
      )}

      {active && (
        <article className="os-panel chrome-edge blueprint-grid" style={{ marginBottom: 20 }}>
          <div className="os-panel__bar">
            <span>ACTIVE · {active.nom}</span>
            <span className="compteur-dot">{active.date_debut} → {active.date_fin}</span>
          </div>
          <div className="os-panel__body">
            <ul className="os-list">
              {(active.objectifs || []).map((o) => (
                <li key={o.id}>
                  <span style={{ color: 'var(--jaune)' }}>›</span>
                  <span>{o.titre} · {o.metrique_actuelle ?? 0}/{o.metrique_cible ?? '—'}</span>
                </li>
              ))}
              {!(active.objectifs || []).length && <li className="compteur">Aucun objectif</li>}
            </ul>
            <button type="button" className="btn-ghost" style={{ marginTop: 12 }} onClick={() => cloturer(active.id)}>
              Clôturer → Drop bilan_ere
            </button>
          </div>
        </article>
      )}

      <form onSubmit={creer} className="os-panel chrome-edge" style={{ marginBottom: 24 }}>
        <div className="os-panel__bar">
          <span>NOUVELLE ÈRE</span>
          <span className="compteur-dot">{statut === 'save' ? '…' : 'CREATE'}</span>
        </div>
        <div className="os-panel__body" style={{ display: 'grid', gap: 10 }}>
          <input
            required
            placeholder="Nom (ex. 2026 — Double référence)"
            value={form.nom}
            onChange={(e) => setForm({ ...form, nom: e.target.value })}
            style={{ fontFamily: 'var(--font-mono)', padding: 8 }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              type="date"
              required
              value={form.date_debut}
              onChange={(e) => setForm({ ...form, date_debut: e.target.value })}
            />
            <input
              type="date"
              required
              value={form.date_fin}
              onChange={(e) => setForm({ ...form, date_fin: e.target.value })}
            />
          </div>
          {(form.objectifs || []).map((o, i) => (
            <input
              key={o.id}
              placeholder={`Objectif ${i + 1}`}
              value={o.titre}
              onChange={(e) => {
                const objectifs = [...form.objectifs];
                objectifs[i] = { ...o, titre: e.target.value };
                setForm({ ...form, objectifs });
              }}
              style={{ fontFamily: 'var(--font-body)', padding: 8 }}
            />
          ))}
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setForm({ ...form, objectifs: [...form.objectifs, newObjectif()] })}
          >
            + Objectif
          </button>
          <button type="submit" className="btn-poster">Créer l’ère</button>
        </div>
      </form>

      <h2 style={{ fontSize: '1rem', textTransform: 'uppercase', marginBottom: 8 }}>Historique</h2>
      <ul className="os-list">
        {eres.map((e) => (
          <li key={e.id}>
            <span style={{ color: e.statut === 'active' ? 'var(--jaune)' : 'var(--text-muted)' }}>›</span>
            <span>{e.nom} · {e.statut} · {(e.objectifs || []).length} obj.</span>
          </li>
        ))}
        {!eres.length && <li>Aucune ère — crée la première ci-dessus</li>}
      </ul>
    </div>
  );
}
