'use strict';

const assert = require('assert');
const parse = require('@emmetio/css-abbreviation');
const SnippetsRegistry = require('@emmetio/snippets-registry');
require('babel-register');
const resolve = require('../index').default;
const stringScore = require('../lib/score').default;

const registry = new SnippetsRegistry();
registry.add({
    "as": "align-self:auto|flex-start|flex-end|center|baseline|stretch",
    "bg": "background:#${1:000}",
    "bga": "background-attachment:fixed|scroll",
    "bgbk": "background-break:bounding-box|each-box|continuous",
    "bgi": "background-image:url(${0})",
    "bgo": "background-origin:padding-box|border-box|content-box",
    "c": "color:#${1:000}",
    "cl": "clear:both|left|right|none",
    "d": "display:block|none|flex|inline-flex|inline|inline-block|list-item|run-in|compact|table|inline-table|table-caption|table-column|table-column-group|table-header-group|table-footer-group|table-row|table-row-group|table-cell|ruby|ruby-base|ruby-base-group|ruby-text|ruby-text-group",
    "p": "padding",
    "pos": "position:relative|absolute|relative|fixed|static",
    "m": "margin",
    "z": "z-index:1",
    "bd": "border:${1:1px} ${2:solid} ${3:#000}",
    "bdf": "border-fit:scale",
    "bds": "border-style:hidden|dotted|dashed|solid|double|dot-dash|dot-dot-dash|wave|groove|ridge|inset|outset",
    "bxsh": "box-shadow:${1:inset }${2:hoff} ${3:voff} ${4:blur} ${5:color}|none",
	"bxsz": "box-sizing:border-box|content-box|border-box",
    "fl": "float:left|right|none",
    "fef": "font-effect:none|engrave|emboss|outline",
    "trf": "transform:${1}|skewX(${1:angle})|skewY(${1:angle})|scale(${1:x}, ${2:y})|scaleX(${1:x})|scaleY(${1:y})|scaleZ(${1:z})|scale3d(${1:x}, ${2:y}, ${3:z})|rotate(${1:angle})|rotateX(${1:angle})|rotateY(${1:angle})|rotateZ(${1:angle})|translate(${1:x}, ${2:y})|translateX(${1:x})|translateY(${1:y})|translateZ(${1:z})|translate3d(${1:tx}, ${2:ty}, ${3:tz})",
    "@kf": "@keyframes ${1:identifier} {\n\t${2}\n}"
});

function expand(abbr, options) {
    return stringify(parse(abbr).use(resolve, registry, options));
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
        assert.equal(expand('bd1-s'), 'border: 1px solid;');
        assert.equal(expand('dib'), 'display: inline-block;');
        assert.equal(expand('bxsz'), 'box-sizing: ${1:border-box};');
        assert.equal(expand('bxz'), 'box-sizing: ${1:border-box};');
        assert.equal(expand('bxzc'), 'box-sizing: content-box;');
        assert.equal(expand('fl'), 'float: ${1:left};');
        assert.equal(expand('fll'), 'float: left;');

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

        assert.equal(expand('trf-trs'), 'transform: translate(${1:x}, ${2:y});');
	});

    it('numeric', () => {
        assert.equal(expand('p0'), 'padding: 0;', 'No unit for 0');
        assert.equal(expand('p10'), 'padding: 10px;', '`px` unit for integers');
        assert.equal(expand('p.4'), 'padding: 0.4em;', '`em` for floats');
        assert.equal(expand('p10p'), 'padding: 10%;', 'unit alias');
        assert.equal(expand('z10'), 'z-index: 10;', 'Unitless property');
        assert.equal(expand('p10r'), 'padding: 10rem;', 'unit alias');
    });
    
    it('numeric with format options', () => {
        let options = {
            intUnit: 'pt',
            floatUnit: 'vh',
            unitAliases: {
                e :'em',
                p: '%',
                x: 'ex',
                r: ' / @rem'
            }
        }
        assert.equal(expand('p0', options), 'padding: 0;', 'No unit for 0');
        assert.equal(expand('p10', options), 'padding: 10pt;', '`pt` unit for integers');
        assert.equal(expand('p.4', options), 'padding: 0.4vh;', '`vh` for floats');
        assert.equal(expand('p10p', options), 'padding: 10%;', 'unit alias');
        assert.equal(expand('z10', options), 'z-index: 10;', 'Unitless property');
        assert.equal(expand('p10r', options), 'padding: 10 / @rem;', 'unit alias');
	});

    it('important', () => {
        assert.equal(expand('!'), '!important');
        assert.equal(expand('p!'), 'padding: ${1} !important;');
        assert.equal(expand('p0!'), 'padding: 0 !important;');
    });

    it('snippets', () => {
        assert.equal(expand('@k'), '@keyframes ${1:identifier} {\n\t${2}\n}');
    });

    it('case insensitive matches', () => {
        assert.equal(expand('trf:rx'), 'transform: rotateX(${1:angle});');
    });

    it('should use minscore when finding best match for snippets', () => {
        assert.equal(expand('auto', {fuzzySearchMinScore: 0}), 'align-self: ${1:auto};');
        assert.equal(expand('auto', {fuzzySearchMinScore: 0.3}), 'auto;');
    });
});
