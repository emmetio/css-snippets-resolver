'use strict';

/**
 * For every node in given `tree`, finds matching snippet from `registry` and
 * updates node with snippet data.
 *
 * This resolver uses fuzzy matching for searching matched snippets and their
 * keyword values.
 */

export default function(tree, registry) {
    tree.walk(node => resolveNode(node, registry));
    return tree;
}
