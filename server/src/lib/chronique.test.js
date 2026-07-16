/**
 * Smoke tests — chronique / titres / revue heuristiques.
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  assezDeFaitsPourTitre,
  estTitreGenerique,
  genererChroniqueHeuristique,
  genererRevueHeuristique,
  genererTitreChapitreHeuristique,
} from './chronique.js';

describe('chronique heuristique', () => {
  it('détecte titres génériques seed', () => {
    assert.equal(estTitreGenerique('Chapitre 0 — Amorçage'), true);
    assert.equal(estTitreGenerique('CHAPITRE 0 — AMORÇAGE DEV'), true);
    assert.equal(estTitreGenerique(''), true);
    assert.equal(estTitreGenerique('fCC Responsive / Drum session'), false);
  });

  it('exige assez de faits pour un titre', () => {
    assert.equal(assezDeFaitsPourTitre({ quetesFaites: [] }), false);
    assert.equal(assezDeFaitsPourTitre({ quetesFaites: [{ titre: 'A' }, { titre: 'B' }] }), true);
    assert.equal(assezDeFaitsPourTitre({ entrees: [{}, {}, {}] }), true);
  });

  it('titre basé sur quêtes réelles, pas inventé', () => {
    const { titre, resume_public } = genererTitreChapitreHeuristique({
      chapitre: { arc_id: 'dev', semaine: 'S1' },
      quetesFaites: [
        { titre: 'fCC Responsive Web Design' },
        { titre: 'Bloc Dev — auth JWT' },
      ],
      entrees: [],
    });
    assert.match(titre, /fCC|Responsive|auth|JWT/i);
    assert.ok(!/amor[cç]age/i.test(titre));
    assert.match(resume_public, /2 quête/);
  });

  it('chronique raconte, pas un dump brut', () => {
    const { titre, corps } = genererChroniqueHeuristique({
      mode: 'jour',
      quetesFaites: [{ titre: 'Session drum pattern' }],
      quetesActives: [{ titre: 'Mix court' }],
      entrees: [{ detail: 'commit auth' }],
      streaks: [{ id: 'dev', jours_consecutifs: 4 }],
      apprentissages: [{ type: 'declic', titre: 'Preuve avant cert' }],
      ere: { nom: 'Ship TWIY' },
    });
    assert.ok(titre.length > 2);
    assert.ok(corps.split(/[.!?]/).filter(Boolean).length >= 2);
    assert.match(corps, /Session drum|commit auth|streaks|Preuve|Ship TWIY/i);
    assert.ok(!corps.includes('QUÊTES:'));
  });

  it('revue heuristique toujours produite', () => {
    const texte = genererRevueHeuristique({
      entrees: [{ detail: 'cert fCC' }],
      quetes: [
        { statut: 'fait', titre: 'cert fCC' },
        { statut: 'a_faire', titre: 'mix' },
      ],
      streaks: [{ id: 'miprod', jours_consecutifs: 2 }],
      apprentissages: [],
    });
    assert.match(texte, /Revue/);
    assert.match(texte, /cert fCC/i);
    assert.ok(texte.length > 80);
  });
});
