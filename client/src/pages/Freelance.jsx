import { useEffect, useMemo, useState } from 'react';
import OsHeader from '../components/OsHeader.jsx';
import { apiGet, apiPost, apiPatch } from '../lib/api.js';

const COLONNES = [
  { id: 'prospect', label: 'Prospect' },
  { id: 'proposal_envoye', label: 'Proposal' },
  { id: 'client', label: 'Client' },
  { id: 'paye', label: 'Payé' },
];

export default function Freelance() {
  const [items, setItems] = useState([]);
  const [nom, setNom] = useState('');
  const [montant, setMontant] = useState('');

  async function charger() {
    setItems(await apiGet('/prospects'));
  }

  useEffect(() => { charger().catch(() => setItems([])); }, []);

  const parCol = useMemo(() => {
    const map = Object.fromEntries(COLONNES.map((c) => [c.id, []]));
    for (const p of items) {
      const key = map[p.statut] ? p.statut : 'prospect';
      map[key].push(p);
    }
    return map;
  }, [items]);

  async function creer(e) {
    e.preventDefault();
    if (!nom.trim()) return;
    await apiPost('/prospects', {
      nom: nom.trim(),
      montant: montant ? Number(montant) : null,
      statut: 'prospect',
    });
    setNom('');
    setMontant('');
    await charger();
  }

  async function avancer(p) {
    const idx = COLONNES.findIndex((c) => c.id === p.statut);
    const next = COLONNES[Math.min(COLONNES.length - 1, Math.max(0, idx) + 1)];
    if (!next || next.id === p.statut) return;
    await apiPatch(`/prospects/${p.id}`, { statut: next.id });
    await charger();
  }

  return (
    <div className="os-page">
      <OsHeader
        kicker="OS · FREELANCE"
        title="FREELANCE"
        meta="Pipeline · prospect → payé · clic pour avancer"
      />

      <form onSubmit={creer} className="os-form--inline" style={{ marginBottom: 'var(--space-4)' }}>
        <input
          className="os-input"
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Nom prospect"
          required
        />
        <input
          className="os-input"
          style={{ flex: '0 0 140px', minWidth: 120 }}
          value={montant}
          onChange={(e) => setMontant(e.target.value)}
          placeholder="Montant"
          type="number"
        />
        <button type="submit" className="btn-poster">Ajouter</button>
      </form>

      <div className="os-pipeline chrome-edge">
        {COLONNES.map((col) => (
          <section key={col.id} className="os-pipeline__col blueprint-grid">
            <p className="compteur">
              {col.label} · {parCol[col.id].length}
            </p>
            <div>
              {parCol[col.id].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className="os-pipeline__item"
                  onClick={() => avancer(p)}
                  title="Avancer d'une colonne"
                >
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>{p.nom}</div>
                  <div className="compteur" style={{ marginTop: 4 }}>{p.montant ? `${p.montant}` : '—'}</div>
                </button>
              ))}
              {!parCol[col.id].length && (
                <p className="compteur" style={{ marginTop: 16, opacity: 0.6 }}>vide</p>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
