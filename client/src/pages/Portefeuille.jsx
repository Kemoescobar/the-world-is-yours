import { useEffect, useState } from 'react';
import OsHeader from '../components/OsHeader.jsx';
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
    <div className="os-page">
      <OsHeader
        kicker="OS · PORTEFEUILLE"
        title="PORTEFEUILLE"
        meta="Solde · mouvements · objectifs d’épargne"
      />

      <div className="os-panel chrome-edge blueprint-grid" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="os-panel__bar">
          <span>SOLDE</span>
          <span className="compteur-dot">LEDGER</span>
        </div>
        <div className="os-panel__body">
          <p className="os-stat-rail__n" style={{ fontSize: 'clamp(1.8rem, 5vw, 2.4rem)' }}>
            {(solde.MGA ?? 0).toLocaleString('fr-FR')} Ar
          </p>
          <p className="compteur" style={{ marginTop: 8 }}>
            ≈ {(solde.USD ?? 0).toLocaleString('fr-FR')} $ (mouvements USD)
          </p>
        </div>
      </div>

      <form onSubmit={ajouterMouvement} className="os-panel chrome-edge os-form" style={{ marginBottom: 'var(--space-4)' }}>
        <div className="os-panel__bar">
          <span>NOUVEAU MOUVEMENT</span>
          <span className="compteur-dot">IN / OUT</span>
        </div>
        <div className="os-panel__body os-form">
          <input
            required
            type="number"
            step="any"
            className="os-input"
            value={mouvement.montant}
            onChange={(e) => setMouvement((m) => ({ ...m, montant: e.target.value }))}
            placeholder="Montant (+entrée / -sortie)"
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <select
              className="os-input"
              value={mouvement.devise}
              onChange={(e) => setMouvement((m) => ({ ...m, devise: e.target.value }))}
            >
              <option value="MGA">MGA</option>
              <option value="USD">USD</option>
            </select>
            <select
              className="os-input"
              value={mouvement.categorie}
              onChange={(e) => setMouvement((m) => ({ ...m, categorie: e.target.value }))}
            >
              {['freelance', 'vente_instru', 'materiel', 'abonnement', 'epargne', 'autre'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <input
            className="os-input"
            value={mouvement.description}
            onChange={(e) => setMouvement((m) => ({ ...m, description: e.target.value }))}
            placeholder="Description"
          />
          <button type="submit" className="btn-poster">Enregistrer</button>
        </div>
      </form>

      <h2 style={{ fontSize: '1.1rem', textTransform: 'uppercase', marginBottom: 12 }}>Objectifs d’épargne</h2>
      <form onSubmit={ajouterObjectif} className="os-form--inline" style={{ marginBottom: 'var(--space-3)' }}>
        <input
          required
          className="os-input"
          value={objectif.nom}
          onChange={(e) => setObjectif((o) => ({ ...o, nom: e.target.value }))}
          placeholder="Nom"
        />
        <input
          required
          type="number"
          className="os-input"
          style={{ flex: '0 0 140px', minWidth: 120 }}
          value={objectif.montant_cible}
          onChange={(e) => setObjectif((o) => ({ ...o, montant_cible: e.target.value }))}
          placeholder="Cible"
        />
        <button type="submit" className="btn-poster">Créer</button>
      </form>

      <div className="os-stack">
        {objectifs.map((o) => (
          <div key={o.id} className="os-panel blueprint-grid">
            <div className="os-panel__bar">
              <span>{o.nom}</span>
              <span className="compteur-dot">{o.devise}</span>
            </div>
            <div className="os-panel__body">
              <div style={{ height: 4, background: 'var(--bg-3)' }}>
                <div
                  style={{
                    width: `${Math.min(100, ((o.montant_actuel || 0) / (o.montant_cible || 1)) * 100)}%`,
                    height: '100%',
                    background: 'repeating-linear-gradient(90deg, var(--jaune) 0 6px, transparent 6px 10px)',
                  }}
                />
              </div>
              <p className="compteur" style={{ marginTop: 10 }}>
                {o.montant_actuel || 0} / {o.montant_cible} {o.devise}
              </p>
            </div>
          </div>
        ))}
        {!objectifs.length && (
          <p className="compteur">Aucun objectif — crée le premier ci-dessus.</p>
        )}
      </div>
    </div>
  );
}
