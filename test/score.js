'use strict';

const assert = require('assert');
require('babel-register');
const score = require('../lib/score').default;

describe('String score', () => {
    const pick = (abbr, items) => items
    .map(item => ({item, score: score(abbr, item)}))
    .filter(obj => obj.score)
    .sort((a, b) => b.score - a.score)
    .map(obj => obj.item)
    [0];

    it('compare scores', () => {
        assert.equal(score('aaa', 'aaa'), 1);
        assert.equal(score('baa', 'aaa'), 0);
        
        assert(!score('b', 'aaa'));
        assert(score('a', 'aaa'));
        assert(score('a', 'abc'));
        assert(score('ac', 'abc'));
        assert(score('a', 'aaa') < score('aa', 'aaa'));
        assert(score('ab', 'abc') > score('ab', 'acb'));

        // acronym bonus
        assert(score('ab', 'a-b') > score('ab', 'acb'));
    });

    it('pick padding or position', () => {
        const items = ['p', 'pb', 'pl', 'pos', 'pa', 'oa', 'soa', 'pr', 'pt'];

        assert.equal(pick('p', items), 'p');
        assert.equal(pick('poa', items), 'pos');
    });
});
