import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiGet } from '../lib/api.js';
import { playTick } from '../lib/sounds.js';

const PRIORITE_LABEL = {
  retard: 'en retard',
  streak: 'streak',
  en_cours: 'en cours',
  active: '',
};

/**
 * Emploi du temps intelligent — HUD timeline Matin / Après-midi / Soir.
 * Données : GET /api/emploi-du-temps (heuristique TZ Madagascar).
 */
export default function EmploiDuTemps({ onValider, refreshKey = 0 }) {
  const [plan, setPlan] = useState(null);
  const [statut, setStatut] = useState('idle');
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    let cancelled = false;
    setStatut('chargement');
    setErreur('');
    (async () => {
      try {
        const data = await apiGet('/emploi-du-temps');
        if (!cancelled) {
          setPlan(data);
          setStatut('pret');
        }
      } catch (err) {
        if (!cancelled) {
          setPlan(null);
          setErreur(err.message || 'échec emploi du temps');
          setStatut('erreur');
        }
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey]);

  async function valider(queteId) {
    if (!queteId || !onValider) return;
    playTick();
    await onValider(queteId);
  }

  return (
    <section className="edt" aria-label="Emploi du temps">
      <div className="edt__bar">
        <span>EMPLOI DU TEMPS</span>
        <span className="compteur-dot">
          {plan?.heure ? `${plan.heure} · ${plan.tz?.replace('Indian/', '') || 'Tana'}` : '—'}
        </span>
      </div>

      {statut === 'chargement' && (
        <p className="compteur" style={{ padding: '12px 14px', margin: 0 }}>› calcul du jour…</p>
      )}

      {erreur && (
        <p className="annotation-manuscrite" style={{ padding: '12px 14px', margin: 0 }}>
          {erreur}
        </p>
      )}

      {plan && statut === 'pret' && (
        <div className="edt__body">
          {(plan.note_contexte || (plan.streaks_a_risque || []).length > 0) && (
            <div className="edt__contexte">
              {plan.note_contexte && (
                <p className="compteur" style={{ margin: 0, color: 'var(--jaune)' }}>
                  › {plan.note_contexte}
                </p>
              )}
              {(plan.streaks_a_risque || []).slice(0, 3).map((s) => (
                <p key={s.id} className="compteur" style={{ margin: '4px 0 0', color: 'var(--text-muted)' }}>
                  › {s.raison}
                </p>
              ))}
            </div>
          )}

          {plan.vide ? (
            <p className="edt__vide compteur" role="status">
              {plan.message_vide || 'Aucune quête active — rien à planifier.'}
            </p>
          ) : (
            <ol className="edt__slots">
              {plan.slots.map((slot) => (
                <li
                  key={slot.id}
                  className={`edt__slot${slot.actuel ? ' edt__slot--actuel' : ''}`}
                  aria-current={slot.actuel ? 'true' : undefined}
                >
                  <div className="edt__slot-head">
                    <span className="edt__slot-label">
                      {slot.actuel ? '› ' : ''}
                      {slot.label}
                    </span>
                    <span className="edt__slot-meta">
                      {slot.fenetre} · {slot.focus}
                    </span>
                  </div>
                  {slot.actions.length === 0 ? (
                    <p className="compteur edt__slot-empty">— libre</p>
                  ) : (
                    <ul className="edt__actions">
                      {slot.actions.map((a, i) => {
                        const tag = PRIORITE_LABEL[a.priorite] || '';
                        return (
                          <li key={a.quete_id || `${a.streak_id}-${i}`} className="edt__action">
                            {a.quete_id ? (
                              <label className="edt__check">
                                <input
                                  type="checkbox"
                                  className="quest-check"
                                  disabled={!onValider}
                                  onChange={() => valider(a.quete_id)}
                                  aria-label={`Valider ${a.titre}`}
                                />
                                <span>
                                  {a.titre}
                                  {tag && (
                                    <em className={`edt__tag edt__tag--${a.priorite}`}>{tag}</em>
                                  )}
                                </span>
                              </label>
                            ) : (
                              <Link to={a.deep_link || '/streaks'} className="edt__link">
                                › {a.titre}
                                {tag && <em className={`edt__tag edt__tag--${a.priorite}`}>{tag}</em>}
                              </Link>
                            )}
                            {a.quete_id && a.deep_link && (
                              <Link to={a.deep_link} className="edt__deep" title="Voir l’arc">
                                ↗
                              </Link>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              ))}
            </ol>
          )}

          <p className="edt__source compteur">
            source · {plan.source === 'heuristic+ia' ? 'heuristique + conseil IA' : 'heuristique'}
            {plan.conseil_ia ? ` — ${plan.conseil_ia}` : ''}
          </p>
        </div>
      )}
    </section>
  );
}
