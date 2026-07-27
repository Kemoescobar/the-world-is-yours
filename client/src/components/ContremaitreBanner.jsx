import { useSelector, useDispatch } from 'react-redux';
import {
  clearContremaitre,
  formatDirectiveStamp,
  selectMessageMatin,
  selectPrioritesJour,
  texteDirective,
} from '../store/slices/dashboardSlice.js';
import { apiPost } from '../lib/api.js';

/**
 * Bandeau matin / priorités — UNIQUEMENT depuis directives (dashboard).
 * Pas de conseil généré ni hardcodé en fallback.
 */
export default function ContremaitreBanner() {
  const dispatch = useDispatch();
  const statut = useSelector((s) => s.dashboard.statut);
  const contremaitre = useSelector((s) => s.dashboard.contremaitre);
  const ravitaillement = useSelector((s) => s.dashboard.ravitaillement);
  const messageDir = useSelector(selectMessageMatin);
  const prioritesDir = useSelector(selectPrioritesJour);
  const erreurs = useSelector((s) => s.dashboard.erreurs || []);

  const messageTexte = texteDirective(messageDir);
  const prioritesTexte = texteDirective(prioritesDir);
  const stamp = formatDirectiveStamp(messageDir?.cree_le || prioritesDir?.cree_le);

  const noteRav = ravitaillement?.total_ajoutees > 0
    ? (ravitaillement.message || `Ravitaillement auto · ${ravitaillement.total_ajoutees} quête(s) ajoutée(s)`)
    : (ravitaillement?.message || '');

  const signauxTerminee = (ravitaillement?.signaux || [])
    .filter((s) => (s.roadmap_terminee || s.bloque_prereqs) && s.message)
    .map((s) => s.message)
    .filter((msg, i, arr) => arr.indexOf(msg) === i)
    .filter((msg) => !noteRav.includes(msg));

  const errPartielle = erreurs.find((e) => e.cle === 'directives' || e.cle === 'contremaitre');

  async function feedback(statutFb) {
    if (!contremaitre?.id) return;
    try {
      await apiPost(`/contremaitre/${contremaitre.id}/feedback`, { statut: statutFb });
      dispatch(clearContremaitre());
    } catch {
      /* soft */
    }
  }

  const hasDirective = Boolean(messageTexte || prioritesTexte);
  const hasContre = Boolean(contremaitre);
  const hasRav = Boolean(noteRav) || signauxTerminee.length > 0;
  const chargement = statut === 'chargement' || statut === 'idle';

  return (
    <aside
      className="os-panel chrome-edge"
      style={{ marginBottom: 16, borderColor: 'rgba(255, 210, 63, 0.35)' }}
      aria-label="Contremaître"
    >
      <div className="os-panel__bar">
        <span>CONTREMAÎTRE</span>
        <span className="compteur-dot">
          {stamp || (hasDirective ? 'DIRECTIVE' : 'EN ATTENTE DU CHECK-IN')}
        </span>
      </div>
      <div className="os-panel__body">
        {errPartielle && (
          <p className="annotation-manuscrite">{errPartielle.cle} — {errPartielle.message}</p>
        )}

        {chargement && (
          <p className="compteur" style={{ marginBottom: 8 }}>› …</p>
        )}

        {!chargement && !hasDirective && (
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, marginBottom: 10, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            EN ATTENTE DU CHECK-IN
          </p>
        )}

        {messageTexte && (
          <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5, marginBottom: 10, fontSize: '0.9rem' }}>
            {messageTexte}
          </p>
        )}

        {prioritesTexte && (
          <p className="compteur" style={{ marginBottom: 10, color: 'var(--jaune)' }}>
            › {prioritesTexte}
          </p>
        )}

        {contremaitre && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: hasRav ? 14 : 0 }}>
            <span className="compteur" style={{ color: 'var(--jaune)' }}>
              {contremaitre.ressource_titre}
            </span>
            {contremaitre.ressource_url && (
              <a
                href={contremaitre.ressource_url}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost"
                style={{ fontSize: '0.7rem' }}
              >
                Ouvrir
              </a>
            )}
            <button type="button" className="btn-ghost" style={{ fontSize: '0.7rem' }} onClick={() => feedback('utile')}>
              Utile
            </button>
            <button type="button" className="btn-ghost" style={{ fontSize: '0.7rem' }} onClick={() => feedback('pas_utile')}>
              Pas utile
            </button>
          </div>
        )}

        {signauxTerminee.map((msg) => (
          <p key={msg} className="compteur" style={{ color: 'var(--jaune)', marginBottom: 8 }}>
            {msg}
          </p>
        ))}

        {noteRav && (
          <p
            className="compteur"
            style={{
              borderTop: hasContre || hasDirective || signauxTerminee.length ? '1px solid rgba(255,210,63,0.2)' : undefined,
              paddingTop: hasContre || hasDirective || signauxTerminee.length ? 12 : 0,
              marginBottom: 0,
              color: noteRav.includes('ajoutée') ? 'var(--jaune)' : undefined,
            }}
            role="status"
          >
            {noteRav}
          </p>
        )}

        <p style={{ marginTop: 12, marginBottom: 0 }}>
          <button
            type="button"
            className="btn-ghost"
            style={{ fontSize: '0.7rem' }}
            onClick={() => window.dispatchEvent(new CustomEvent('twiy:open-capture', { detail: { mode: 'checkin' } }))}
          >
            › Soir — t’as fait quoi aujourd’hui ?
          </button>
        </p>
      </div>
    </aside>
  );
}
