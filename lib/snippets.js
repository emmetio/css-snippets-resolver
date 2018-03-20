'use strict';

const reProperty = /^([a-z\-]+)(?:\s*:\s*([^\n\r]+))?$/;
const DASH = 45; // -

/**
 * Creates a special structure for resolving CSS properties from plain CSS
 * snippets.
 * Almost all CSS snippets are aliases for real CSS properties with available
 * value variants, optionally separated by `|`. Most values are keywords that
 * can be fuzzy-resolved as well. Some CSS properties are shorthands for other,
 * more specific properties, like `border` and `border-style`. For such cases
 * keywords from more specific properties should be available in shorthands too.
 * @param {Snippet[]} snippets
 * @return {CSSSnippet[]}
 */
export default function(snippets) {
	return nest( snippets.map(snippet => new CSSSnippet(snippet.key, snippet.value)) );
}

export class CSSSnippet {
	constructor(key, value) {
		this.key = key;
		this.value = value;
		this.property = null;

		// detect if given snippet is a property
		const m = value && value.match(reProperty);
		if (m) {
			this.property = m[1];
			this.value = m[2];
		}

		this.dependencies = [];
	}

	addDependency(dep) {
		this.dependencies.push(dep);
	}

	get defaultValue() {
		return this.value != null ? splitValue(this.value)[0] : null;
	}

	/**
     * Returns list of unique keywords for current CSS snippet and its dependencies
     * @return {String[]}
     */
	keywords() {
		const stack = [];
		const keywords = new Set();
		let i = 0, item, candidates;

		if (this.property) {
			// scan valid CSS-properties only
			stack.push(this);
		}

		while (i < stack.length) {
			// NB Keep items in stack instead of push/pop to avoid possible
			// circular references
			item = stack[i++];

			if (item.value) {
				candidates = splitValue(item.value).filter(isKeyword);

				// extract possible keywords from snippet value
				for (let j = 0; j < candidates.length; j++) {
					keywords.add(candidates[j].trim());
				}

				// add dependencies into scan stack
				for (let j = 0, deps = item.dependencies; j < deps.length; j++) {
					if (stack.indexOf(deps[j]) === -1) {
						stack.push(deps[j]);
					}
				}
			}
		}

		return Array.from(keywords);
	}
}

/**
 * Nests more specific CSS properties into shorthand ones, e.g.
 * background-position-x -> background-position -> background
 * @param  {CSSSnippet[]} snippets
 * @return {CSSSnippet[]}
 */
function nest(snippets) {
	snippets = snippets.sort(snippetsSort);
	const stack = [];

	// For sorted list of CSS properties, create dependency graph where each
	// shorthand property contains its more specific one, e.g.
	// backgound -> background-position -> background-position-x
	for (let i = 0, cur, prev; i < snippets.length; i++) {
		cur = snippets[i];

		if (!cur.property) {
			// not a CSS property, skip it
			continue;
		}

		// Check if current property belongs to one from parent stack.
		// Since `snippets` array is sorted, items are perfectly aligned
		// from shorthands to more specific variants
		while (stack.length) {
			prev = stack[stack.length - 1];

			if (cur.property.indexOf(prev.property) === 0
                && cur.property.charCodeAt(prev.property.length) === DASH) {
				prev.addDependency(cur);
				stack.push(cur);
				break;
			}

			stack.pop();
		}

		if (!stack.length) {
			stack.push(cur);
		}
	}

	return snippets;
}

/**
 * A sorting function for array of snippets
 * @param  {CSSSnippet} a
 * @param  {CSSSnippet} b
 * @return {Number}
 */
function snippetsSort(a, b) {
	if (a.key === b.key) {
		return 0;
	}

	return a.key < b.key ? -1 : 1;
}

/**
 * Check if given string is a keyword candidate
 * @param  {String}  str
 * @return {Boolean}
 */
function isKeyword(str) {
	return /^\s*[\w-]+/.test(str);
}

function splitValue(value) {
	return String(value).split('|');
}
