'use strict';

import stringScore from './lib/score';
import cssSnippets from './lib/snippets';

const fuzziness = 1;
const globalKeywords = ['auto', 'inherit'];
const unitlessProperties = ['z-index', 'line-height', 'opacity', 'font-weight', 'zoom'];
const unitAliases = {
    e :'em',
    p: '%',
    x: 'ex',
    r: 'rem'
};

/**
 * For every node in given `tree`, finds matching snippet from `registry` and
 * updates node with snippet data.
 *
 * This resolver uses fuzzy matching for searching matched snippets and their
 * keyword values.
 */

export default function(tree, registry) {
	const snippets = cssSnippets(registry.all({type: 'string'}));
	tree.walk(node => resolveNode(node, snippets));
	return tree;
}

/**
 * Resolves given node: finds matched CSS snippets using fuzzy match and resolves
 * keyword aliases from node value
 * @param  {Node} node
 * @param  {CSSSnippet[]} snippets
 * @return {Node}
 */
function resolveNode(node, snippets) {
	const snippet = findBestMatch(node.name, snippets, 'key');

	if (!snippet) {
		// Edge case: `!important` snippet
		return node.name === '!' ? setNodeAsText(node, '!important') : node;
	}

	return snippet.property
		? resolveAsProperty(node, snippet)
		: resolveAsSnippet(node, snippet);
}

/**
 * Resolves given parsed abbreviation node as CSS propery
 * @param {Node} node
 * @param {CSSSnippet} snippet
 * @return {Node}
 */
function resolveAsProperty(node, snippet) {
    const abbr = node.name;
	node.name = snippet.property;

	if (node.value && typeof node.value === 'object') {
		// resolve keyword shortcuts
		const keywords = snippet.keywords();

		if (!node.value.size) {
			// no value defined, try to resolve unmatched part as a keyword alias
			let kw = findBestMatch(getUnmatchedPart(abbr, node.name), keywords);

            if (!kw) {
                // no matching value, try to get default one
                kw = snippet.defaulValue;
                if (kw && kw.indexOf('${') === -1) {
                    // Quick and dirty test for existing field. If not, wrap
                    // default value in a field
                    kw = `\${1:${kw}}`;
                }
            }

			if (kw) {
				node.value.add(kw);
			}
		} else {
			// replace keyword aliases in current node value
			for (let i = 0, token; i < node.value.value.length; i++) {
				token = node.value.value[i];

				if (token === '!') {
					token = `${!i ? '${1} ' : ''}!important`;
				} else if (isKeyword(token)) {
					token = findBestMatch(token.value, keywords)
						|| findBestMatch(token.value, globalKeywords)
						|| token;
				} else if (isNumericValue(token)) {
                    token = resolveNumericValue(node.name, token);
                }

                node.value.value[i] = token;
			}
		}
	}

	return node;
}

/**
 * Resolves given parsed abbreviation node as a snippet: a plain code chunk
 * @param {Node} node
 * @param {CSSSnippet} snippet
 * @return {Node}
 */
function resolveAsSnippet(node, snippet) {
	return setNodeAsText(node, snippet.value);
}

/**
 * Sets given parsed abbreviation node as a text snippet
 * @param {Node} node
 * @param {String} text
 * @return {Node}
 */
function setNodeAsText(node, text) {
	node.name = null;
	node.value = text;
	return node;
}

/**
 * Finds best matching item from `items` array
 * @param {String} abbr  Abbreviation to match
 * @param {Array}  items List of items for match
 * @param {String} [key] If `items` is a list of objects, use `key` as object property to test against
 * @return {*}
 */
function findBestMatch(abbr, items, key) {
	if (!abbr) {
		return null;
	}

	let matchedItem = null;
	let maxScore = 0;

	for (let i = 0, item; i < items.length; i++) {
		item = items[i];
		const score = stringScore(abbr, item && typeof item === 'object' ? item[key] : item, fuzziness);

		if (score === 1) {
			// direct hit, no need to look further
			return item;
		}

		if (score > maxScore) {
			maxScore = score;
			matchedItem = item;
		}
	}

	return matchedItem;
}

/**
 * Returns a part of `abbr` that wasn’t directly matched agains `string`.
 * For example, if abbreviation `poas` is matched against `position`, the unmatched part will be `as`
 * since `a` wasn’t found in string stream
 * @param {String} abbr
 * @param {String} string
 * @return {String}
 */
function getUnmatchedPart(abbr, string) {
	for (let i = 0, lastPos = 0; i < abbr.length; i++) {
		lastPos = string.indexOf(abbr[i], lastPos);
		if (lastPos === -1) {
			return abbr.slice(i);
		}
	}

	return '';
}

/**
 * Check if given CSS value token is a keyword
 * @param {*} token
 * @return {Boolean}
 */
function isKeyword(token) {
	return tokenTypeOf(token, 'keyword');
}

/**
 * Check if given CSS value token is a numeric value
 * @param  {*}  token
 * @return {Boolean}
 */
function isNumericValue(token) {
    return tokenTypeOf(token, 'numeric');
}

function tokenTypeOf(token, type) {
	return token && typeof token === 'object' && token.type === type;
}

/**
 * Resolves numeric value for given CSS property
 * @param  {String} property    CSS property name
 * @param  {NumericValue} token CSS numeric value token
 * @return {NumericValue}
 */
function resolveNumericValue(property, token) {
    if (token.unit) {
        token.unit = unitAliases[token.unit] || token.unit;
    } else if (token.value !== 0 && unitlessProperties.indexOf(property) === -1) {
        // use `px` for integers, `em` for floats
        // NB: num|0 is a quick alternative to Math.round(0)
        token.unit = token.value === (token.value|0) ? 'px' : 'em';
    }

    return token;
}
