'use strict';

const assert = require('assert');
require('babel-register');
const cssSnippets = require('../lib/snippets').default;

function createSnippets(obj) {
    const list = cssSnippets( Object.keys(obj).map(key => ({key, value: obj[key]})) );
    return toDict(list);
}

function toDict(snippets) {
    return snippets.reduce((dict, snippet) => {
        dict[snippet.key] = snippet;
        return dict;
    }, {});
}

describe('CSS snippets', () => {
    const snippets = createSnippets({
        "bg": "background:#${1:000}",
        "bga": "background-attachment:fixed|scroll",
        "bgbk": "background-break:bounding-box|each-box|continuous",
        "bgc": "background-color:#${1:fff}",
        "colm": "columns",
        "bgcp": "background-clip:padding-box|border-box|content-box|no-clip",
        "bgi": "background-image:url(${0})",
        "bgo": "background-origin:padding-box|border-box|content-box",
        "c": "color:#${1:000}",
        "cl": "clear:both|left|right|none",
        "bgp": "background-position:${1:0} ${2:0}",
        "bgpx": "background-position-x",
        "bgr": "background-repeat:no-repeat|repeat-x|repeat-y|space|round",
        "bgpy": "background-position-y",
        "bgsz": "background-size:contain|cover",
    });

    it('create nested', () => {
        const deps = snippet => snippet.dependencies.map(dep => dep.key);

        assert.deepEqual(deps(snippets.bg), ['bga', 'bgbk', 'bgc', 'bgcp', 'bgi', 'bgo', 'bgp', 'bgr', 'bgsz']);
        assert.deepEqual(deps(snippets.bga), []);
        assert.deepEqual(deps(snippets.bgc), []);
        assert.deepEqual(deps(snippets.colm), []);
        assert.deepEqual(deps(snippets.bgp), ['bgpx', 'bgpy']);
    });

    it('keywords', () => {
        assert.deepEqual(snippets.bg.keywords(), [
            'fixed', 'scroll', 'bounding-box', 'each-box', 'continuous',
            'padding-box', 'border-box', 'content-box', 'no-clip', 'url(${0})',
            'no-repeat', 'repeat-x', 'repeat-y', 'space', 'round', 'contain', 'cover'
        ]);

        assert.deepEqual(snippets.bgo.keywords(), [
            'padding-box', 'border-box', 'content-box'
        ]);

        assert.deepEqual(snippets.bgpy.keywords(), []);
    });
});
