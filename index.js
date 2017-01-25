'use strict';

import stringScore from './lib/score';
import cssSnippets from './lib/snippets';

const globalKeywords = ['auto', 'inherit'];
const fuzziness = 1;

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
		return node;
	}

	return snippet.property
		? resolveAsProperty(node, snippet)
		: resolveAsSnippet(node, snippet);
}

/**
 * Resolves given node as CSS propery
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
                    // quick and dirty test for existing field. If not, wrap
                    // default value in a field
                    kw = `\${1:${kw}}`;
                }
            }

			if (kw) {
				node.value.add(kw);
			}
		} else {
			// replace keyword aliases in current node value
            const allKeywords = keywords.concat(globalKeywords);
			for (let i = 0, v; i < node.value.value.length; i++) {
				v = node.value.value[i];
				if (isKeyword(v)) {
					node.value.value[i] = findBestMatch(v, allKeywords) || v;
				}
			}
		}
	}

	return node;
}

/**
 * Resolves given node as a snippet: a plain code chunk
 * @param {Node} node
 * @param {CSSSnippet} snippet
 * @return {Node}
 */
function resolveAsSnippet(node, snippet) {
	node.name = null;
	node.value = snippet.value;
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
 * Check if given string is a keyword
 * @param {String} str
 * @return {Boolean}
 */
function isKeyword(str) {
	return str && typeof str === 'string' && /^[\w\-]+$/.test(str);
}
