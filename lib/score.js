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
    const matches = new Array(abbrLength);

    let i = 0, j = 0;

    if (abbr === string) {
        while (i < abbrLength) {
            matches.push(i++);
        }

        return score(1, matches);
    }

    if (!string || abbrLength > stringLength) {
        return score(0);
    }

    const fuzzyFactor = fuzziness ? 1 - fuzziness : 0;
    let fuzzies = 1;

    let ch1, ch1u, ch2, offset;
    let runningScore = 0;
    let beginningBonus = false;

    while (i < abbrLength) {
        ch1 = abbr.charCodeAt(i++);
        ch1u = toUpper(ch1);
        matches[i] = -1;
        offset = j;

        while (j < stringLength) {
            ch2 = string.charCodeAt(j);

            if (ch1u === toUpper(ch2)) {
                if (j === 0 && i === 0) {
                    beginningBonus = true;
                }

                runningScore += (offset === j ? 0.7 : 0.1) + (ch1 === ch2 ? 0.1 : 0);
                matches[i] = j++;
                break;
            }

            j++;
        }

        if (j >= stringLength && matches[i] === -1) {
            // Reached the end of `string` but didn’t found required character
            if (fuzziness) {
                fuzzies += fuzzyFactor;
                j = offset;
            } else {
                return score(0);
            }
        }
    }

    // Reduce penalty for longer strings.
    let finalScore = 0.5 * (runningScore / abbrLength + runningScore / stringLength) / fuzzies;
    if (finalScore < 0.85 && beginningBonus) {
        finalScore += 0.15;
    }

    return score(finalScore, matches);
}

/**
 * Convers given alpha character code to its uppercase version
 * @param  {Number} code Alpha character code
 * @return {Number}
 */
function toUpper(code) {
    return code & -33;
}

function score(value, matches) {
    return {
        score: value,
        matches
    };
}
