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
  prerequisSatisfaits,
  messageDepuisSignaux,
  chapitreCourantArc,
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

const chapDev = { id: 'chap-dev-1', arc_id: 'dev', date_debut: '2026-07-01', statut: 'en_cours' };
const chapDevOld = { id: 'chap-dev-0', arc_id: 'dev', date_debut: '2026-06-01', statut: 'complet' };

describe('ravitaillement', () => {
  it('ordonne par source_roadmap (pas niveau-first)', () => {
    const ordered = sortCompetencesRoadmap([
      ...comps,
      {
        id: 'c4',
        arc_id: 'dev',
        titre: 'AI Fluency',
        niveau_requis: 'initiation',
        source_roadmap: 'LearnByDoing-S4-C4',
        prerequis: ['c3'],
        description: 'Certification active',
      },
    ]);
    assert.equal(ordered[0].id, 'c1');
    assert.equal(ordered[1].id, 'c2');
    assert.equal(ordered[2].id, 'c3'); // S4-C3 pratique avant S4-C4 initiation
    assert.equal(ordered[3].id, 'c4');
  });

  it('choisit la première sans prereq / non couverte', () => {
    const c = choisirCompetence(comps, [], new Set());
    assert.equal(c.id, 'c1');
  });

  it('respecte les prerequis (preuves) en mode strict', () => {
    const preuves = preuveSetFromRows([{ competence_id: 'c1' }]);
    const quetes = [{ competence_id: 'c1', statut: 'fait', type: 'dev' }];
    const c = choisirCompetence(comps, quetes, preuves);
    assert.equal(c.id, 'c2');
  });

  it('soft-unlock ravitaillement : prereq via quête faite sans preuve', () => {
    const quetes = [
      { competence_id: 'c1', statut: 'fait', type: 'dev' },
    ];
    // Strict : bloqué (pas de preuve c1)
    assert.equal(prerequisSatisfaits(comps[0], new Set(), {}), false);
    assert.equal(
      choisirCompetence(comps, quetes, new Set()),
      null,
    );
    // Soft : c1 fait → c2 éligible (c1 déjà couverte par quete_faite)
    const c = choisirCompetence(comps, quetes, new Set(), { softUnlockViaQueteFaite: true });
    assert.equal(c.id, 'c2');
  });

  it('génère des titres directs (verbe + livrable), jamais « Avancer le parcours »', () => {
    const drafts = genererDrafts(comps[1], 3);
    assert.ok(drafts.length >= 2);
    for (const d of drafts) {
      assert.equal(d.competence_id, 'c1');
      assert.notEqual(d.titre.toLowerCase(), comps[1].titre.toLowerCase());
      assert.doesNotMatch(d.titre, /Avancer le parcours/i);
      assert.doesNotMatch(d.titre, /^Pratiquer\s*:/i);
      assert.match(d.titre, /^(Terminer|Livrer|Uploader|Valider|Exporter)/i);
    }
  });

  it('Beatmaker : préfère la ligne Projet: comme titre d’action', () => {
    const bm = {
      id: 'bm1',
      arc_id: 'beatmaker',
      titre: "S1 — Anatomie d'un hit — déconstruire pour comprendre",
      niveau_requis: 'initiation',
      source_roadmap: 'Beatmaker-P1-SS1',
      prerequis: [],
      description: "Objectifs: Déconstruire 5 sons\nProjet: Importer 3 sons référence dans FL Studio et annoter chaque section.\nRessources: x",
    };
    const drafts = genererDrafts(bm, 1);
    assert.equal(drafts.length, 1);
    assert.match(drafts[0].titre, /Importer 3 sons référence/i);
    assert.doesNotMatch(drafts[0].titre, /Avancer le parcours|Pratiquer\s*:/i);
  });

  it('lot vide : 3 compétences roadmap (S1→S2→S3), une quête chacune', () => {
    const prep = preparerPropositionArc({
      arcId: 'dev',
      competences: comps,
      quetes: [],
      preuves: [],
      chapitres: [chapDev],
    });
    assert.equal(prep.trigger, true);
    assert.equal(prep.drafts.length, LOT_SIZE);
    assert.equal(prep.cible, ACTIVES_TARGET);
    assert.equal(prep.competence.id, 'c1');
    assert.equal(prep.chapitre_id, chapDev.id);
    assert.deepEqual(
      prep.drafts.map((d) => d.competence_id),
      ['c1', 'c2', 'c3'],
    );
    for (const d of prep.drafts) {
      assert.doesNotMatch(d.titre, /Avancer le parcours/i);
    }
  });

  it('refill partiel jusqu’à 3 si déjà 1 actif (chapitre courant)', () => {
    const quetes = [{ type: 'dev', statut: 'a_faire', titre: 'A', chapitre_id: chapDev.id }];
    const prep = preparerPropositionArc({
      arcId: 'dev',
      competences: comps,
      quetes,
      preuves: [],
      chapitres: [chapDev],
    });
    assert.equal(prep.trigger, true);
    assert.equal(prep.drafts.length, 2);
  });

  it('ignore a_faire hors chapitre courant (ne bloque pas le refill)', () => {
    const quetes = [
      { type: 'dev', statut: 'a_faire', titre: 'old1', chapitre_id: chapDevOld.id },
      { type: 'dev', statut: 'a_faire', titre: 'old2', chapitre_id: chapDevOld.id },
      { type: 'dev', statut: 'a_faire', titre: 'old3', chapitre_id: chapDevOld.id },
      { type: 'dev', statut: 'a_faire', titre: 'orphan', chapitre_id: null },
    ];
    assert.equal(quetesActivesArc(quetes, 'dev').length, 4);
    assert.equal(quetesActivesArc(quetes, 'dev', { chapitreId: chapDev.id }).length, 0);
    assert.equal(chapitreCourantArc([chapDevOld, chapDev], 'dev').id, chapDev.id);

    const prep = preparerPropositionArc({
      arcId: 'dev',
      competences: comps,
      quetes,
      preuves: [],
      chapitres: [chapDevOld, chapDev],
    });
    assert.equal(prep.trigger, true);
    assert.equal(prep.actives, 0);
    assert.equal(prep.drafts.length, LOT_SIZE);
  });

  it('pas de trigger si assez d’actifs (≥3) dans le chapitre courant', () => {
    const quetes = [
      { type: 'dev', statut: 'a_faire', titre: 'A', chapitre_id: chapDev.id },
      { type: 'dev', statut: 'en_cours', titre: 'B', chapitre_id: chapDev.id },
      { type: 'dev', statut: 'a_faire', titre: 'C', chapitre_id: chapDev.id },
    ];
    assert.equal(quetesActivesArc(quetes, 'dev', { chapitreId: chapDev.id }).length, 3);
    const prep = preparerPropositionArc({
      arcId: 'dev',
      competences: comps,
      quetes,
      preuves: [],
      chapitres: [chapDev],
    });
    assert.equal(prep.trigger, false);
    assert.match(prep.note, /assez d'actifs \(3\)/);
  });

  it('compte routine/freelance comme actifs Dev (aligné carte Chantier)', () => {
    const quetes = [
      { type: 'routine', statut: 'a_faire', titre: 'R', chapitre_id: chapDev.id },
      { type: 'freelance', statut: 'en_cours', titre: 'F', chapitre_id: chapDev.id },
      { type: 'dev', statut: 'a_faire', titre: 'D', chapitre_id: chapDev.id },
    ];
    assert.equal(quetesActivesArc(quetes, 'dev', { chapitreId: chapDev.id }).length, 3);
    const prep = preparerPropositionArc({
      arcId: 'dev',
      competences: comps,
      quetes,
      preuves: [],
      chapitres: [chapDev],
    });
    assert.equal(prep.trigger, false);
    assert.equal(prep.actives, 3);
  });

  it('ne compte pas routine sur Beatmaker', () => {
    const quetes = [
      { type: 'routine', statut: 'a_faire', titre: 'R', chapitre_id: 'chap-bm' },
      { type: 'beatmaker', statut: 'a_faire', titre: 'B1', chapitre_id: 'chap-bm' },
    ];
    assert.equal(quetesActivesArc(quetes, 'beatmaker', { chapitreId: 'chap-bm' }).length, 1);
  });

  it('signale roadmap terminée (couverture complète)', () => {
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
      chapitres: [chapDev],
    });
    assert.equal(prep.roadmap_terminee, true);
    assert.equal(prep.bloque_prereqs, false);
    assert.match(prep.message, /roadmap Dev terminée/);
  });

  it('signale bloqué prereqs (pas de preuve ni quête faite sur prereq)', () => {
    // c1 ouverte mais on la skip ; c2/c3 bloqués sans preuve ni quete faite sur c1
    const quetes = [
      { competence_id: 'c1', statut: 'a_faire', type: 'dev', chapitre_id: chapDev.id },
    ];
    // Saturation c1 + soft unlock échoue pour c2 (c1 pas fait)
    const prep = preparerPropositionArc({
      arcId: 'dev',
      competences: comps,
      quetes,
      preuves: [],
      chapitres: [chapDev],
    });
    // 1 actif → besoin 2, mais c1 saturée et c2 bloqué → bloque_prereqs ou drafts vides
    assert.equal(prep.trigger, true);
    assert.equal(prep.drafts.length, 0);
    assert.equal(prep.bloque_prereqs, true);
    assert.match(prep.message, /bloqué prereqs/);
  });

  it('soft-unlock permet refill après quêtes faites sans preuves', () => {
    const quetes = [
      { competence_id: 'c1', statut: 'fait', type: 'dev', chapitre_id: chapDev.id },
    ];
    const prep = preparerPropositionArc({
      arcId: 'dev',
      competences: comps,
      quetes,
      preuves: [],
      chapitres: [chapDev],
    });
    assert.equal(prep.trigger, true);
    assert.equal(prep.roadmap_terminee, false);
    assert.equal(prep.bloque_prereqs, false);
    assert.ok(prep.drafts.length >= 1);
    assert.equal(prep.competence.id, 'c2');
  });

  it('messageDepuisSignaux distingue debounce / actifs / prereqs / créé', () => {
    assert.match(
      messageDepuisSignaux([{ arc_id: 'dev', trigger: false, actives: 3, note: "assez d'actifs (3)" }], 0),
      /assez d'actifs \(3\)/,
    );
    assert.match(
      messageDepuisSignaux([{ arc_id: 'dev', debounce: true, actives: 0, note: 'auto récent (< 10 s) — skip' }], 0),
      /debounce/,
    );
    assert.doesNotMatch(
      messageDepuisSignaux([{ arc_id: 'dev', debounce: true, actives: 0 }], 0),
      /actifs ≥ 3/,
    );
    assert.match(
      messageDepuisSignaux([{ arc_id: 'beatmaker', bloque_prereqs: true }], 0),
      /bloqué prereqs/,
    );
    assert.match(messageDepuisSignaux([], 3), /3 quêtes ajoutées/);
  });
});
