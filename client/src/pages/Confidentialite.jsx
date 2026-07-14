import { Link } from 'react-router-dom';

/** Politique de confidentialité — vitrine soft-public, cookies session Auth uniquement. */
export default function Confidentialite() {
  return (
    <article style={{ padding: 'var(--space-4)', maxWidth: 720, margin: '0 auto' }}>
      <p className="compteur" style={{ marginBottom: 8 }}>LÉGAL</p>
      <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.6rem)' }}>Politique de confidentialité</h1>
      <p style={{ color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.55 }}>
        Cette page décrit le traitement des données pour le site personnel THE WORLD IS YOURS
        (TWIY), opéré depuis Madagascar, avec visiteurs publics (catalogues) et un accès
        privé authentifié pour l’éditeur.
      </p>

      <h2 style={{ fontSize: '1.25rem', marginTop: 'var(--space-4)' }}>Données collectées</h2>
      <ul style={{ color: 'var(--text-muted)', lineHeight: 1.7, paddingLeft: 18 }}>
        <li>
          <strong style={{ color: 'var(--text)' }}>Visiteurs publics</strong> — journaux
          techniques habituels des hébergeurs (IP, user-agent, horodatage) pour sécurité et
          performance. Pas de bandeau publicité tiers.
        </li>
        <li>
          <strong style={{ color: 'var(--text)' }}>Compte propriétaire</strong> — email et
          session Auth (Supabase) pour accéder au tableau de bord privé (chroniques,
          portefeuille, prospects, etc.).
        </li>
        <li>
          <strong style={{ color: 'var(--text)' }}>Contenu métier</strong> — données saisies
          par l’éditeur (quêtes, entrées, catalogues). Pas de collecte de données clients
          grand public via le site.
        </li>
      </ul>

      <h2 style={{ fontSize: '1.25rem', marginTop: 'var(--space-4)' }}>Finalités</h2>
      <p style={{ color: 'var(--text-muted)', lineHeight: 1.55 }}>
        Afficher une vitrine de projets et instrumentaux ; sécuriser l’accès privé ;
        faire fonctionner l’API et les webhooks (ex. commits GitHub) pour l’usage personnel
        de l’éditeur. Pas de revente de données.
      </p>

      <h2 style={{ fontSize: '1.25rem', marginTop: 'var(--space-4)' }}>Cookies &amp; stockage local</h2>
      <p style={{ color: 'var(--text-muted)', lineHeight: 1.55 }}>
        Session Supabase Auth (cookies / local storage selon le client) pour rester
        connecté. Préférences légères en <code>sessionStorage</code> (gate sonore). Pas de
        cookies publicitaires.
      </p>

      <h2 style={{ fontSize: '1.25rem', marginTop: 'var(--space-4)' }}>Sous-traitants</h2>
      <ul style={{ color: 'var(--text-muted)', lineHeight: 1.7, paddingLeft: 18 }}>
        <li>Vercel — hébergement front</li>
        <li>Railway — hébergement API</li>
        <li>Supabase — base Postgres, Auth, Storage</li>
        <li>Anthropic (optionnel) — génération de texte si une clé API est configurée côté serveur</li>
      </ul>

      <h2 style={{ fontSize: '1.25rem', marginTop: 'var(--space-4)' }}>Durée &amp; sécurité</h2>
      <p style={{ color: 'var(--text-muted)', lineHeight: 1.55 }}>
        Les données privées sont protégées par authentification et une allowlist propriétaire
        côté API. Les journaux hébergeurs suivent leurs politiques respectives. Export JSON
        des données métier disponible pour le compte propriétaire authentifié
        (<code>GET /api/export</code>).
      </p>

      <h2 style={{ fontSize: '1.25rem', marginTop: 'var(--space-4)' }}>Tes droits</h2>
      <p style={{ color: 'var(--text-muted)', lineHeight: 1.55 }}>
        Pour toute demande d’accès, de rectification ou de suppression liée à un compte ou
        à des données te concernant sur ce site, contacte l’éditeur (profils publics liés
        au projet / email du compte Auth propriétaire). La suppression du compte Auth et
        des données associées peut être demandée ; elle sera traitée manuellement côté
        Supabase / base.
      </p>

      <h2 style={{ fontSize: '1.25rem', marginTop: 'var(--space-4)' }}>Mise à jour</h2>
      <p style={{ color: 'var(--text-muted)', lineHeight: 1.55 }}>
        Dernière mise à jour : juillet 2026. En cas de monetisation (vente d’instrus) ou
        d’ouverture large, cette page sera enrichie (CGV, base légale étendue).
      </p>

      <p className="compteur" style={{ marginTop: 'var(--space-5)' }}>
        <Link to="/mentions" style={{ color: 'var(--jaune)' }}>Mentions légales</Link>
        {' · '}
        <Link to="/" style={{ color: 'var(--jaune)' }}>Accueil</Link>
      </p>
    </article>
  );
}
