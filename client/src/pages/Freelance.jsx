import { useEffect, useMemo, useState } from 'react';
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
    <div style={{ padding: 'var(--space-4)' }}>
      <h1>Freelance</h1>
      <form onSubmit={creer} style={{ display: 'flex', gap: 10, margin: 'var(--space-4) 0', flexWrap: 'wrap' }}>
        <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom prospect" required
          style={{ flex: 1, minWidth: 180, padding: 10, background: 'var(--bg-1)', color: 'var(--text)', border: '1px solid var(--bg-3)', borderRadius: 4 }} />
        <input value={montant} onChange={(e) => setMontant(e.target.value)} placeholder="Montant" type="number"
          style={{ width: 140, padding: 10, background: 'var(--bg-1)', color: 'var(--text)', border: '1px solid var(--bg-3)', borderRadius: 4 }} />
        <button type="submit" style={{ padding: '10px 14px', border: 'none', borderRadius: 4, background: 'var(--jaune)', color: '#060a1a', fontWeight: 700, cursor: 'pointer' }}>
          Ajouter
        </button>
      </form>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 'var(--space-3)' }}>
        {COLONNES.map((col) => (
          <section key={col.id} className="blueprint-grid" style={{ background: 'var(--bg-1)', padding: 'var(--space-3)', borderRadius: 4, minHeight: 280 }}>
            <p className="compteur">{col.label} · {parCol[col.id].length}</p>
            <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
              {parCol[col.id].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => avancer(p)}
                  title="Avancer d'une colonne"
                  style={{
                    textAlign: 'left', padding: 10, borderRadius: 4, cursor: 'pointer',
                    background: 'var(--bg-2)', border: '1px solid var(--bg-3)', color: 'var(--text)',
                  }}
                >
                  <div>{p.nom}</div>
                  <div className="compteur">{p.montant ? `${p.montant}` : '—'}</div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
