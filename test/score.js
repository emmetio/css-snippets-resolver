'use strict';

const assert = require('assert');
require('babel-register');
const fuzzyMatch = require('../lib/score').default;
require('./original');

describe('String score', () => {
    const score = (abbr, string, factor) => fuzzyMatch(abbr, string, factor).score;

    describe('Original samples', () => {
        it('exact match', () => {
            assert.equal(score('Hello World', 'Hello World'), 1);
        });

        it('not matching', () => {
            assert.equal(score('hellx', 'hello world'), 0);
            assert.equal(score('hello_world', 'hello world'), 0);
        });

        it('match must be sequential', () => {
            assert.equal(score('WH', 'Hello World'), 0);
        });

        it('same case should match better then wrong case', () => {
            assert(score('hello', 'Hello World') < score('Hello', 'Hello World'));
        });

        it('higher score for closer matches', () => {
            assert(score('H', 'Hello World') < score('He', 'Hello World'));
        });

        it('matching with wrong case', () => {
            assert(score('himi', 'Hillsdale Michigan') > 0);
        });

        it('should have proper relative weighting', () => {
            assert( score('e', 'hello world')          < score('h', 'hello world') );
            assert( score('h', 'hello world')          < score('he', 'hello world') );
            assert( score('hel', 'hello world')        < score('hell', 'hello world') );
            assert( score('hell', 'hello world')       < score('hello', 'hello world') );
            assert( score('hello', 'hello world')      < score('helloworld', 'hello world') );
            assert( score('helloworl', 'hello world')  < score('hello worl', 'hello world') );
            assert( score('hello worl', 'hello world') < score('hello world', 'hello world') );
        });

        it('consecutive letter bonus', () => {
            assert(score('Hel', 'Hello World') > score('Hld', 'Hello World'));
        });

        it('beginning of string bonus', () => {
            assert(score('hi', 'Hillsdale') > score('hi', 'Chippewa'));
            assert(score('h', 'hello world') > score('w', 'hello world'));
            assert(score('mar', 'Mary Large') > score('mar', 'Large Mary'));
            assert(score('mar', 'Silly Mary Large') === score('mar', 'Silly Large Mary'));
        });

        it('proper string weights', () => {
            assert(score('res', 'Research Resources North') > score('res', 'Mary Conces'));
            assert(score('res', 'Research Resources North') > score('res', 'Bonnie Strathern - Southwest Michigan Title Search'));
        });
    });

    describe('Pick items', () => {
        const pick = (abbr, items, factor) => items
            .map(item => ({item, score: score(abbr, item, factor)}))
            .filter(obj => obj.score)
            .sort((a, b) => b.score - a.score)
            .map(obj => obj.item)
            [0];

        it('padding-position', () => {
            const items = ['p', 'pb', 'pl', 'pos', 'pa', 'oa', 'soa', 'pr', 'pt'];
            const factor = 1;

            assert.equal(pick('p', items, factor), 'p');
            assert.equal(pick('poa', items, factor), 'pos');
        });
    });
});
