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
    "p": "padding",
    "z": "z-index:1",
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

		if (prop == null) {
			return String(node.value);
		}

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
	it('keywords', () => {
        assert.equal(expand('pos'), 'position: ${1:relative};');
        assert.equal(expand('poa'), 'position: absolute;');
        assert.equal(expand('por'), 'position: relative;');
        assert.equal(expand('pof'), 'position: fixed;');
        assert.equal(expand('pos-a'), 'position: absolute;');

        assert.equal(expand('m'), 'margin;');
        assert.equal(expand('m0'), 'margin: 0;');

        // use `auto` as global keyword
        assert.equal(expand('m0-a'), 'margin: 0 auto;');
        assert.equal(expand('m-a'), 'margin: auto;');

        assert.equal(expand('bg'), 'background: #${1:000};');

        assert.equal(expand('bd'), 'border: ${1:1px} ${2:solid} ${3:#000};');
        assert.equal(expand('bd0-s#fc0'), 'border: 0 solid #ffcc00;');
        assert.equal(expand('bd0-dd#fc0'), 'border: 0 dot-dash #ffcc00;');
        assert.equal(expand('bd0-h#fc0'), 'border: 0 hidden #ffcc00;');
	});

    it('numeric', () => {
        assert.equal(expand('p0'), 'padding: 0;', 'No unit for 0');
        assert.equal(expand('p10'), 'padding: 10px;', '`px` unit for integers');
        assert.equal(expand('p.4'), 'padding: 0.4em;', '`em` for floats');
        assert.equal(expand('p10p'), 'padding: 10%;', 'unit alias');
        assert.equal(expand('z10'), 'z-index: 10;', 'Initless property');
	});

    it('important', () => {
        assert.equal(expand('!'), '!important');
        assert.equal(expand('p!'), 'padding: ${1} !important;');
        assert.equal(expand('p0!'), 'padding: 0 !important;');
    });
});
