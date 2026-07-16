/**
 * Smoke tests purs pour l'emploi du temps heuristique.
 * Usage: node --test src/lib/emploiDuTemps.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  blocActuelId,
  construireEmploiDuTemps,
  quetesActivesPlanifiables,
  scoreQuete,
  streaksARisque,
  trierQuetes,
} from './emploiDuTemps.js';

describe('emploiDuTemps', () => {
  it('filtre croisement et quêtes faites', () => {
    const q = quetesActivesPlanifiables([
      { id: '1', type: 'dev', statut: 'a_faire' },
      { id: '2', type: 'croisement', statut: 'a_faire' },
      { id: '3', type: 'beatmaker', statut: 'fait' },
      { id: '4', type: 'beatmaker', statut: 'en_cours' },
    ]);
    assert.deepEqual(q.map((x) => x.id), ['1', '4']);
  });

  it('priorise les retards', () => {
    const jour = '2026-07-16';
    const sorted = trierQuetes(
      [
        { id: 'a', type: 'dev', statut: 'a_faire', titre: 'B', date_prevue: jour },
        { id: 'b', type: 'dev', statut: 'a_faire', titre: 'A', date_prevue: '2026-07-10' },
        { id: 'c', type: 'dev', statut: 'en_cours', titre: 'C', date_prevue: jour },
      ],
      jour,
    );
    assert.equal(sorted[0].id, 'b');
    assert.ok(scoreQuete(sorted[0], jour) > scoreQuete(sorted[1], jour));
  });

  it('détecte streaks à risque (pas touchés aujourd\'hui)', () => {
    const risques = streaksARisque(
      [
        { id: 'dev', jours_consecutifs: 5, dernier_jour: '2026-07-15' },
        { id: 'miprod', jours_consecutifs: 2, dernier_jour: '2026-07-16' },
        { id: 'sport', jours_consecutifs: 0, dernier_jour: null },
      ],
      '2026-07-16',
    );
    assert.equal(risques.length, 2);
    assert.equal(risques[0].id, 'dev');
    assert.ok(risques.some((r) => r.id === 'sport'));
  });

  it('répartit Dev le matin et Beatmaker l\'après-midi', () => {
    // 2026-07-16T08:00:00+03:00 → matin Antananarivo
    const maintenant = new Date('2026-07-16T05:00:00.000Z'); // 08:00 EAT
    const plan = construireEmploiDuTemps({
      maintenant,
      quetes: [
        { id: 'd1', type: 'dev', statut: 'a_faire', titre: 'Cert fCC', date_prevue: '2026-07-16' },
        { id: 'd2', type: 'dev', statut: 'a_faire', titre: 'Retard Dev', date_prevue: '2026-07-01' },
        { id: 'b1', type: 'beatmaker', statut: 'en_cours', titre: 'Session drum', date_prevue: '2026-07-16' },
        { id: 'b2', type: 'beatmaker', statut: 'a_faire', titre: 'Mix court', date_prevue: '2026-07-16' },
      ],
      streaks: [
        { id: 'dev', jours_consecutifs: 3, dernier_jour: '2026-07-15' },
        { id: 'miprod', jours_consecutifs: 1, dernier_jour: '2026-07-16' },
      ],
    });

    assert.equal(plan.source, 'heuristic');
    assert.equal(plan.bloc_actuel, 'matin');
    assert.equal(plan.vide, false);

    const matin = plan.slots.find((s) => s.id === 'matin');
    const aprem = plan.slots.find((s) => s.id === 'apres_midi');
    assert.ok(matin.actuel);
    assert.ok(matin.actions.some((a) => a.quete_id === 'd2')); // retard d'abord
    assert.ok(matin.actions.every((a) => a.type === 'dev' || a.type === 'freelance'));
    assert.ok(aprem.actions.some((a) => a.type === 'beatmaker'));
    assert.ok(plan.streaks_a_risque.some((s) => s.id === 'dev'));
  });

  it('état vide honnête sans quêtes', () => {
    const plan = construireEmploiDuTemps({
      maintenant: new Date('2026-07-16T10:00:00.000Z'),
      quetes: [],
      streaks: [{ id: 'dev', jours_consecutifs: 1, dernier_jour: '2026-07-16' }],
    });
    assert.equal(plan.vide, true);
    assert.ok(plan.message_vide);
  });

  it('blocActuelId couvre matin / après-midi / soir / nuit', () => {
    // Rely on heureEntiereLocal — smoke that function returns one of known ids
    const id = blocActuelId(new Date());
    assert.ok(['matin', 'apres_midi', 'soir', 'nuit'].includes(id));
  });
});
