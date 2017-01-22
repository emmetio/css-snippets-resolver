'use strict';

/**
 * Calculates fuzzy match score of how close `abbr` matches given `string`.
 * Original implementation:
 * https://github.com/joshaven/string_score
 * Current implementation is optimized for speed, reduced memory allocations
 * and Emmet needs
 *
 * @param  {String} abbr        Abbreviation to score
 * @param  {String} string      String to match
 * @param  {Number} [fuzziness] Fuzzy factor
 * @return {Object}        Object with `.score` (from 0 to 1) and `.matches`
 * array of matched `string` indicies
 */

export default function(abbr, string, fuzziness) {
    const abbrLength = abbr.length;
    const stringLength = string.length;

    let i = 0, j = 0;

    if (abbr === string) {
        return 1;
    }

    if (!string || abbrLength > stringLength) {
        return 0;
    }

    const fuzzyFactor = fuzziness ? 1 - fuzziness : 0;
    let fuzzies = 1;

    let ch1, ch1u, ch2, offset, found;
    let runningScore = 0;
    let beginningBonus = false;

    while (i < abbrLength) {
        ch1 = abbr.charCodeAt(i++);
        ch1u = toUpper(ch1);
        offset = j;
        found = false;

        while (j < stringLength) {
            ch2 = string.charCodeAt(j);

            if (ch1u === toUpper(ch2)) {
                found = true;

                if (j === 0 && i === 0) {
                    beginningBonus = true;
                }

                runningScore += (offset === j ? 0.7 : 0.1) + (ch1 === ch2 ? 0.1 : 0);
                j++;
                break;
            }

            j++;
        }

        if (!found) {
            if (fuzziness) {
                fuzzies += fuzzyFactor;
                j = offset;
            } else {
                return 0;
            }
        }
    }

    // Reduce penalty for longer strings.
    let finalScore = 0.5 * (runningScore / abbrLength + runningScore / stringLength) / fuzzies;
    if (finalScore < 0.85 && beginningBonus) {
        finalScore += 0.15;
    }

    return finalScore;
}

/**
 * Convers given alpha character code to its uppercase version
 * @param  {Number} code Alpha character code
 * @return {Number}
 */
function toUpper(code) {
    return code & -33;
}