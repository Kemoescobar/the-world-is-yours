import { Link } from 'react-router-dom';

/** Mentions légales — site personnel / vitrine soft-public (Madagascar). */
export default function MentionsLegales() {
  return (
    <article style={{ padding: 'var(--space-4)', maxWidth: 720, margin: '0 auto' }}>
      <p className="compteur" style={{ marginBottom: 8 }}>LÉGAL</p>
      <h1 style={{ fontSize: 'clamp(1.8rem, 5vw, 2.6rem)' }}>Mentions légales</h1>
      <p style={{ color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.55 }}>
        Site personnel « THE WORLD IS YOURS » (TWIY) — chroniques, vitrine de projets et
        instrumentaux. Édité à titre individuel, depuis Madagascar. Pas de société commerciale
        ni d’offre de vente en ligne au moment de la publication de cette page.
      </p>

      <h2 style={{ fontSize: '1.25rem', marginTop: 'var(--space-4)' }}>Éditeur</h2>
      <p style={{ color: 'var(--text-muted)', lineHeight: 1.55 }}>
        Personne physique — contact via le formulaire ou l’adresse indiquée sur les profils
        publics liés au projet (GitHub / présence professionnelle). Pour toute demande
        relative au site : utiliser la page{' '}
        <Link to="/confidentialite" style={{ color: 'var(--jaune)' }}>confidentialité</Link>
        {' '}(coordonnées et droits).
      </p>

      <h2 style={{ fontSize: '1.25rem', marginTop: 'var(--space-4)' }}>Hébergement</h2>
      <ul style={{ color: 'var(--text-muted)', lineHeight: 1.7, paddingLeft: 18 }}>
        <li>Interface (SPA) : Vercel Inc. — vercel.com</li>
        <li>API : Railway Corp. — railway.app</li>
        <li>Base de données &amp; auth : Supabase Inc. — supabase.com</li>
      </ul>

      <h2 style={{ fontSize: '1.25rem', marginTop: 'var(--space-4)' }}>Propriété intellectuelle</h2>
      <p style={{ color: 'var(--text-muted)', lineHeight: 1.55 }}>
        Textes, code présenté, captures et contenus originaux restent la propriété de
        l’éditeur, sauf mention contraire. Les marques et outils tiers cités appartiennent
        à leurs titulaires. Les samples audio éventuellement utilisés dans les
        instrumentaux font l’objet d’une clearance distincte avant diffusion large.
      </p>

      <h2 style={{ fontSize: '1.25rem', marginTop: 'var(--space-4)' }}>Responsabilité</h2>
      <p style={{ color: 'var(--text-muted)', lineHeight: 1.55 }}>
        Le site est fourni « en l’état » pour usage personnel et vitrine. L’éditeur s’efforce
        d’en assurer la disponibilité sans garantie d’absence d’interruption ou d’erreur.
      </p>

      <p className="compteur" style={{ marginTop: 'var(--space-5)' }}>
        <Link to="/" style={{ color: 'var(--jaune)' }}>← Accueil</Link>
      </p>
    </article>
  );
}
