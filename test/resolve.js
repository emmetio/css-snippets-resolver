'use strict';

const assert = require('assert');
const parse = require('@emmetio/css-abbreviation');
const SnippetsRegistry = require('@emmetio/snippets-registry');
require('babel-register');
const resolve = require('../index').default;
const stringScore = require('../lib/score').default;

const registry = new SnippetsRegistry();
registry.add({
    "bg": "background:#${1:000}",
    "bga": "background-attachment:fixed|scroll",
    "bgbk": "background-break:bounding-box|each-box|continuous",
    "bgi": "background-image:url(${0})",
    "bgo": "background-origin:padding-box|border-box|content-box",
    "c": "color:#${1:000}",
    "cl": "clear:both|left|right|none",
    "pos": "position:relative|absolute|relative|fixed|static",
    "m": "margin",
    "bd": "border:${1:1px} ${2:solid} ${3:#000}",
    "bds": "border-style:hidden|dotted|dashed|solid|double|dot-dash|dot-dot-dash|wave|groove|ridge|inset|outset"
});

function expand(abbr) {
    return stringify(parse(abbr).use(resolve, registry));
}

function stringify(tree) {
    return tree.children
    .map(node => {
        let prop = node.name;

        if (node.attributes.length) {
            prop += `(${node.attributes.map(attr => `${attr.name} => ${attr.value}`).join(', ')})`;
        }

        if (node.value.size) {
            prop += `: ${node.value}`;
        }

        return `${prop};`;
    })
    .join('');
}

describe('CSS resolver', () => {
	it('resolve', () => {
        assert.equal(expand('pos'), 'position: ${1:relative};');
        assert.equal(expand('poa'), 'position: absolute;');
        assert.equal(expand('por'), 'position: relative;');
        assert.equal(expand('pof'), 'position: fixed;');

        assert.equal(expand('m'), 'margin;');
        assert.equal(expand('m0'), 'margin: 0;');

        // use `auto` as global keyword
        assert.equal(expand('m0-a'), 'margin: 0 auto;');
        assert.equal(expand('m-a'), 'margin: auto;');

        assert.equal(expand('bg'), 'background: #${1:000};');

        assert.equal(expand('bd'), 'border: ${1:1px} ${2:solid} ${3:#000};');
        assert.equal(expand('bd-a'), 'border: auto;');
        assert.equal(expand('bd3-s#fc0'), 'border: 3 solid #ffcc00;');
        assert.equal(expand('bd3-dd#fc0'), 'border: 3 dot-dash #ffcc00;');
        assert.equal(expand('bd3-h#fc0'), 'border: 3 hidden #ffcc00;');
	});
});
