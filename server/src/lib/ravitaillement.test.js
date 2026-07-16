/**
 * Smoke tests purs (sans DB) pour la logique ravitaillement.
 * Usage: node --test src/lib/ravitaillement.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  sortCompetencesRoadmap,
  choisirCompetence,
  genererDrafts,
  preparerPropositionArc,
  quetesActivesArc,
  preuveSetFromRows,
  ACTIVES_TARGET,
  LOT_SIZE,
} from './ravitaillement.js';

const comps = [
  {
    id: 'c2',
    arc_id: 'dev',
    titre: 'fCC — JS Algorithms',
    niveau_requis: 'initiation',
    source_roadmap: 'LearnByDoing-S3-C1',
    prerequis: ['c1'],
    description: 'Certification active',
  },
  {
    id: 'c1',
    arc_id: 'dev',
    titre: 'fCC — Responsive Web Design',
    niveau_requis: 'initiation',
    source_roadmap: 'LearnByDoing-S1',
    prerequis: [],
    description: 'Certification active semaine S1',
  },
  {
    id: 'c3',
    arc_id: 'dev',
    titre: 'LangChain',
    niveau_requis: 'pratique',
    source_roadmap: 'LearnByDoing-S4-C3',
    prerequis: ['c2'],
    description: 'Certification active',
  },
];

describe('ravitaillement', () => {
  it('ordonne par niveau puis roadmap', () => {
    const ordered = sortCompetencesRoadmap(comps);
    assert.equal(ordered[0].id, 'c1');
    assert.equal(ordered[1].id, 'c2');
    assert.equal(ordered[2].id, 'c3');
  });

  it('choisit la première sans prereq / non couverte', () => {
    const c = choisirCompetence(comps, [], new Set());
    assert.equal(c.id, 'c1');
  });

  it('respecte les prerequis (preuves)', () => {
    const preuves = preuveSetFromRows([{ competence_id: 'c1' }]);
    // c1 couverte → saute à c2 si prereq ok
    const quetes = [{ competence_id: 'c1', statut: 'fait', type: 'dev' }];
    const c = choisirCompetence(comps, quetes, preuves);
    assert.equal(c.id, 'c2');
  });

  it('génère des titres concrets ≠ titre compétence', () => {
    const drafts = genererDrafts(comps[1], 3);
    assert.ok(drafts.length >= 2);
    for (const d of drafts) {
      assert.equal(d.competence_id, 'c1');
      assert.notEqual(d.titre.toLowerCase(), comps[1].titre.toLowerCase());
    }
  });

  it('trigger si actifs < 3 et lot exact de 3 quand vide', () => {
    const prep = preparerPropositionArc({
      arcId: 'dev',
      competences: comps,
      quetes: [],
      preuves: [],
    });
    assert.equal(prep.trigger, true);
    assert.equal(prep.drafts.length, LOT_SIZE);
    assert.equal(prep.cible, ACTIVES_TARGET);
    assert.equal(prep.competence.id, 'c1');
  });

  it('refill partiel jusqu’à 3 si déjà 1 actif', () => {
    const quetes = [{ type: 'dev', statut: 'a_faire', titre: 'A' }];
    const prep = preparerPropositionArc({
      arcId: 'dev',
      competences: comps,
      quetes,
      preuves: [],
    });
    assert.equal(prep.trigger, true);
    assert.equal(prep.drafts.length, 2);
  });

  it('pas de trigger si assez d’actifs (≥3)', () => {
    const quetes = [
      { type: 'dev', statut: 'a_faire', titre: 'A' },
      { type: 'dev', statut: 'en_cours', titre: 'B' },
      { type: 'dev', statut: 'a_faire', titre: 'C' },
    ];
    assert.equal(quetesActivesArc(quetes, 'dev').length, 3);
    const prep = preparerPropositionArc({
      arcId: 'dev',
      competences: comps,
      quetes,
      preuves: [],
    });
    assert.equal(prep.trigger, false);
  });

  it('signale roadmap terminée', () => {
    const preuves = new Set(['c1', 'c2', 'c3']);
    const quetes = [
      { competence_id: 'c1', statut: 'fait', type: 'dev' },
      { competence_id: 'c2', statut: 'fait', type: 'dev' },
      { competence_id: 'c3', statut: 'fait', type: 'dev' },
    ];
    const prep = preparerPropositionArc({
      arcId: 'dev',
      competences: comps,
      quetes,
      preuves: [...preuves].map((id) => ({ competence_id: id })),
    });
    assert.equal(prep.roadmap_terminee, true);
    assert.match(prep.message, /roadmap Dev terminée/);
  });
});
