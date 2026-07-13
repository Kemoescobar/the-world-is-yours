import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '../lib/api.js';

export default function Portefeuille() {
  const [solde, setSolde] = useState({ MGA: 0, USD: 0 });
  const [objectifs, setObjectifs] = useState([]);
  const [mouvement, setMouvement] = useState({ montant: '', devise: 'MGA', categorie: 'freelance', description: '' });
  const [objectif, setObjectif] = useState({ nom: '', montant_cible: '', devise: 'MGA' });

  async function charger() {
    setSolde(await apiGet('/portefeuille/solde'));
    setObjectifs(await apiGet('/portefeuille/objectifs'));
  }

  useEffect(() => { charger().catch(() => {}); }, []);

  async function ajouterMouvement(e) {
    e.preventDefault();
    await apiPost('/portefeuille/mouvements', {
      ...mouvement,
      montant: Number(mouvement.montant),
    });
    setMouvement({ montant: '', devise: 'MGA', categorie: 'freelance', description: '' });
    await charger();
  }

  async function ajouterObjectif(e) {
    e.preventDefault();
    await apiPost('/portefeuille/objectifs', {
      nom: objectif.nom,
      montant_cible: Number(objectif.montant_cible),
      devise: objectif.devise,
    });
    setObjectif({ nom: '', montant_cible: '', devise: 'MGA' });
    await charger();
  }

  return (
    <div style={{ padding: 'var(--space-4)' }}>
      <h1>Portefeuille</h1>
      <div className="blueprint-grid" style={{ background: 'var(--bg-1)', padding: 'var(--space-3)', borderRadius: 4, marginBottom: 'var(--space-4)' }}>
        <p className="compteur">SOLDE</p>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '2rem' }}>
          {(solde.MGA ?? 0).toLocaleString('fr-FR')} Ar
        </p>
        <p className="compteur">≈ {(solde.USD ?? 0).toLocaleString('fr-FR')} $ (mouvements USD)</p>
      </div>

      <form onSubmit={ajouterMouvement} className="blueprint-grid" style={{ background: 'var(--bg-1)', padding: 'var(--space-3)', borderRadius: 4, display: 'grid', gap: 8, marginBottom: 'var(--space-4)' }}>
        <p className="compteur">NOUVEAU MOUVEMENT</p>
        <input required type="number" step="any" value={mouvement.montant} onChange={(e) => setMouvement((m) => ({ ...m, montant: e.target.value }))} placeholder="Montant (+entrée / -sortie)"
          style={{ padding: 10, background: 'var(--bg-2)', color: 'var(--text)', border: '1px solid var(--bg-3)', borderRadius: 4 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <select value={mouvement.devise} onChange={(e) => setMouvement((m) => ({ ...m, devise: e.target.value }))}
            style={{ padding: 10, background: 'var(--bg-2)', color: 'var(--text)', border: '1px solid var(--bg-3)', borderRadius: 4 }}>
            <option value="MGA">MGA</option>
            <option value="USD">USD</option>
          </select>
          <select value={mouvement.categorie} onChange={(e) => setMouvement((m) => ({ ...m, categorie: e.target.value }))}
            style={{ padding: 10, background: 'var(--bg-2)', color: 'var(--text)', border: '1px solid var(--bg-3)', borderRadius: 4 }}>
            {['freelance', 'vente_instru', 'materiel', 'abonnement', 'epargne', 'autre'].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <input value={mouvement.description} onChange={(e) => setMouvement((m) => ({ ...m, description: e.target.value }))} placeholder="Description"
          style={{ padding: 10, background: 'var(--bg-2)', color: 'var(--text)', border: '1px solid var(--bg-3)', borderRadius: 4 }} />
        <button type="submit" style={{ padding: 10, border: 'none', borderRadius: 4, background: 'var(--jaune)', color: '#060a1a', fontWeight: 700, cursor: 'pointer' }}>Enregistrer</button>
      </form>

      <h2>Objectifs d'épargne</h2>
      <form onSubmit={ajouterObjectif} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: 'var(--space-3) 0' }}>
        <input required value={objectif.nom} onChange={(e) => setObjectif((o) => ({ ...o, nom: e.target.value }))} placeholder="Nom"
          style={{ flex: 1, minWidth: 160, padding: 10, background: 'var(--bg-1)', color: 'var(--text)', border: '1px solid var(--bg-3)', borderRadius: 4 }} />
        <input required type="number" value={objectif.montant_cible} onChange={(e) => setObjectif((o) => ({ ...o, montant_cible: e.target.value }))} placeholder="Cible"
          style={{ width: 140, padding: 10, background: 'var(--bg-1)', color: 'var(--text)', border: '1px solid var(--bg-3)', borderRadius: 4 }} />
        <button type="submit" style={{ padding: '10px 14px', border: 'none', borderRadius: 4, background: 'var(--jaune)', color: '#060a1a', fontWeight: 700, cursor: 'pointer' }}>Créer</button>
      </form>

      <div style={{ display: 'grid', gap: 'var(--space-3)' }}>
        {objectifs.map((o) => (
          <div key={o.id} className="blueprint-grid" style={{ background: 'var(--bg-1)', padding: 'var(--space-3)', borderRadius: 4 }}>
            <p>{o.nom}</p>
            <div style={{ height: 4, background: 'var(--bg-3)', borderRadius: 2, margin: 'var(--space-2) 0' }}>
              <div style={{
                width: `${Math.min(100, ((o.montant_actuel || 0) / (o.montant_cible || 1)) * 100)}%`,
                height: '100%', background: 'var(--jaune)', borderRadius: 2,
              }} />
            </div>
            <p className="compteur">{o.montant_actuel || 0} / {o.montant_cible} {o.devise}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
