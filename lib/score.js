'use strict';

const DASH = 45; // -

/**
 * Calculates fuzzy match score of how close `abbr` matches given `string`.
 * @param  {String} abbr        Abbreviation to score
 * @param  {String} string      String to match
 * @param  {String} fullString  Full String
 * @param  {Number} [fuzziness] Fuzzy factor
 * @return {Number}             Match score
 */
export default function(abbr, string, fullString) {
	abbr = abbr.toLowerCase();
	string = string.toLowerCase();
	fullString = fullString.toLowerCase();

	let matchCount = 0;

	if (abbr === string) {
		return 1;
	}

	// a string MUST start with the same character as abbreviation
	if (!string || abbr.charCodeAt(0) !== string.charCodeAt(0)) {
		return 0;
	}

	const abbrLength = abbr.length;
	const stringLength = string.length;
	const fullStringLength = fullString.length;
	let i = 1, j = 1, score = stringLength;
	let ch1, ch2, found, acronym;

	while (i < abbrLength) {
		ch1 = abbr.charCodeAt(i);
		found = false;
		acronym = false;

		while (j < stringLength) {
			ch2 = string.charCodeAt(j);

			if (ch1 === ch2) {
				found = true;
				score += (stringLength - j) * (acronym ? 2 : 1);
				matchCount++;
				break;
			}

			// add acronym bonus for exactly next match after unmatched `-`
			acronym = ch2 === DASH;
			j++;
		}

		if (!found) {
			break;
		}

		i++;
	}

	if(matchCount < string.length){
		i = 1;
		j = 1;
		score = fullStringLength;

		while (i < abbrLength) {
			ch1 = abbr.charCodeAt(i);
			found = false;
			acronym = false;
	
			while (j < fullStringLength) {
				ch2 = fullString.charCodeAt(j);
	
				if (ch1 === ch2) {
					found = true;
					score += (fullStringLength - j) * (acronym ? 2 : 1);
					break;
				}
	
				// add acronym bonus for exactly next match after unmatched `-`
				acronym = ch2 === DASH;
				j++;
			}
	
			if (!found) {
				break;
			}
	
			i++;
		}
		return score && score * (i / abbrLength) / sum(fullStringLength);
	}

	return score && score * (i / abbrLength) / sum(stringLength);
}

/**
 * Calculates sum of first `n` natural numbers, e.g. 1+2+3+...n
 * @param  {Number} n
 * @return {Number}
 */
function sum(n) {
	return n * (n + 1) / 2;
}
