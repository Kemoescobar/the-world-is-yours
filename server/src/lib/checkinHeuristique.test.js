import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parserCheckinHeuristique } from './checkinHeuristique.js';

describe('checkinHeuristique', () => {
  it('parse commits et sessions', () => {
    const r = parserCheckinHeuristique('2 commits auth JWT et session drum 40min');
    assert.ok(r.entrees.length >= 2);
    assert.ok(r.entrees.some((e) => e.type_fait === 'commit' && e.arc_id === 'dev'));
    assert.ok(r.entrees.some((e) => e.type_fait === 'session_prod' && e.arc_id === 'beatmaker'));
  });

  it('extrait brouillon apprentissage', () => {
    const r = parserCheckinHeuristique('cert fCC. Déclic: preuve avant de cocher la cert');
    assert.ok(r.apprentissages_brouillon.length >= 1);
    assert.equal(r.apprentissages_brouillon[0].type, 'declic');
  });

  it('ne renvoie jamais vide si texte non vide', () => {
    const r = parserCheckinHeuristique('j’ai avancé un peu');
    assert.equal(r.entrees.length, 1);
    assert.equal(r.entrees[0].type_fait, 'quete');
  });
});
