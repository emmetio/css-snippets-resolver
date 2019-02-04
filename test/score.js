'use strict';

const assert = require('assert');
const score = require('../').stringScore;

describe('String score', () => {
	const pick = (abbr, items) => items
		.map(item => ({item, score: score(abbr, item, item)}))
		.filter(obj => obj.score)
		.sort((a, b) => b.score - a.score)
		.map(obj => obj.item)[0];

	it('compare scores', () => {
		assert.equal(score('aaa', 'aaa', 'aaa'), 1);
		assert.equal(score('baa', 'aaa', 'aaa'), 0);

		assert(!score('b', 'aaa', 'aaa'));
		assert(score('a', 'aaa', 'aaa'));
		assert(score('a', 'abc', 'abc'));
		assert(score('ac', 'abc', 'abc'));
		assert(score('a', 'aaa','aaa') < score('aa', 'aaa', 'aaa'));
		assert(score('ab', 'abc', 'abc') > score('ab', 'acb', 'acb'));

		// acronym bonus
		assert(score('ab', 'a-b', 'a-b') > score('ab', 'acb', 'acb'));

	});

	it('pick padding or position', () => {
		const items = ['p', 'pb', 'pl', 'pos', 'pa', 'oa', 'soa', 'pr', 'pt'];

		assert.equal(pick('p', items), 'p');
		assert.equal(pick('poa', items), 'pos');
	});
});
