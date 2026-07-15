import { useEffect, useState } from 'react';
import OsHeader from '../components/OsHeader.jsx';
import { apiGet, apiPost } from '../lib/api.js';

const TYPES = [
  { id: 'article', label: 'Article' },
  { id: 'repo_etoile', label: 'Repo étoilé' },
  { id: 'ecoute_milestone', label: 'Écoutes' },
  { id: 'prise_de_parole', label: 'Prise de parole' },
  { id: 'contribution_open_source', label: 'OSS' },
];

export default function Rayonnement() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState(null);
  const [form, setForm] = useState({
    type: 'article',
    titre: '',
    url: '',
    arc_id: '',
    metrique: '',
    date_evenement: new Date().toISOString().slice(0, 10),
  });
  const [erreur, setErreur] = useState('');

  async function reload() {
    const [list, s] = await Promise.all([
      apiGet('/rayonnement'),
      apiGet('/rayonnement/stats'),
    ]);
    setItems(list || []);
    setStats(s);
  }

  useEffect(() => {
    reload().catch((e) => setErreur(e.message));
  }, []);

  async function creer(e) {
    e.preventDefault();
    setErreur('');
    try {
      await apiPost('/rayonnement', {
        type: form.type,
        titre: form.titre,
        url: form.url || null,
        arc_id: form.arc_id || null,
        metrique: form.metrique === '' ? null : Number(form.metrique),
        date_evenement: form.date_evenement,
      });
      setForm({
        ...form,
        titre: '',
        url: '',
        metrique: '',
      });
      await reload();
    } catch (err) {
      setErreur(err.message);
    }
  }

  const streak = stats?.streak;

  return (
    <div className="os-page" style={{ maxWidth: 720 }}>
      <OsHeader
        kicker="OS · RAYONNEMENT"
        title="RAYONNEMENT"
        meta="Visibilité externe · streak dédié"
      />
      {erreur && <p className="annotation-manuscrite" style={{ marginBottom: 12 }}>{erreur}</p>}

      <div className="os-stat-rail" aria-label="Agrégats rayonnement">
        <div>
          <p className="compteur">TOTAL</p>
          <p className="os-stat-rail__n">{stats?.total ?? 0}</p>
        </div>
        <div>
          <p className="compteur">STREAK</p>
          <p className="os-stat-rail__n">{streak?.jours_consecutifs ?? 0}j</p>
        </div>
        <div>
          <p className="compteur">ARTICLES</p>
          <p className="os-stat-rail__n">{stats?.parType?.article ?? 0}</p>
        </div>
        <div>
          <p className="compteur">PAROLES</p>
          <p className="os-stat-rail__n">{stats?.parType?.prise_de_parole ?? 0}</p>
        </div>
      </div>

      <form onSubmit={creer} className="os-panel chrome-edge" style={{ marginBottom: 20 }}>
        <div className="os-panel__bar">
          <span>NOUVEL ÉVÉNEMENT</span>
          <span className="compteur-dot">LOG</span>
        </div>
        <div className="os-panel__body" style={{ display: 'grid', gap: 8 }}>
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
            {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
          <input
            required
            placeholder="Titre"
            value={form.titre}
            onChange={(e) => setForm({ ...form, titre: e.target.value })}
          />
          <input
            placeholder="URL (optionnel)"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <select value={form.arc_id} onChange={(e) => setForm({ ...form, arc_id: e.target.value })}>
              <option value="">Arc —</option>
              <option value="dev">Dev</option>
              <option value="beatmaker">Beatmaker</option>
              <option value="croisement">Croisement</option>
            </select>
            <input
              type="number"
              placeholder="Métrique"
              value={form.metrique}
              onChange={(e) => setForm({ ...form, metrique: e.target.value })}
            />
            <input
              type="date"
              required
              value={form.date_evenement}
              onChange={(e) => setForm({ ...form, date_evenement: e.target.value })}
            />
          </div>
          <button type="submit" className="btn-poster">Enregistrer</button>
        </div>
      </form>

      <ul className="os-list">
        {items.map((e) => (
          <li key={e.id}>
            <span style={{ color: 'var(--jaune)' }}>›</span>
            <span>
              {e.date_evenement} · {e.type} · {e.titre}
              {e.metrique != null ? ` · ${e.metrique}` : ''}
              {e.url ? (
                <>
                  {' · '}
                  <a href={e.url} target="_blank" rel="noreferrer" style={{ color: 'var(--text-muted)' }}>lien</a>
                </>
              ) : null}
            </span>
          </li>
        ))}
        {!items.length && <li>Aucun événement — logue ta première preuve de visibilité</li>}
      </ul>
    </div>
  );
}
