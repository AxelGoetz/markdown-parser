import _ from 'lodash';

// TODO: Copy input to save original
// TODO: Add line numbers to tokens (consider multiple lines) since
//       this might make the parsing process a lot easier. Instead
//       of having the parse the entire text every time, you look
//       for the line number of the parent token and parse only that
//       line upto and including the line where the change has been made

/**
 * Analyzes the input and returns a ordered array of tokens
 * which are in the format:
 * { type: String,
 *   value: String }
 * @param  {String} input [String to be tokenized]
 * @return {Array} tokens [Array of tokens]
 */
export function lexer(input, rules) {
  let tokens = [];

  while(input.length > 0) {
    let scanValue = scan(input, rules);
    input = scanValue.input;
    tokens.push(scanValue.token);
  }

  return tokens;
}


/**
 * Analyzes the input and returns the first token and rest of the input
 * which are in the format:
 * { type: String,
 *   value: String }
 * @param  {String} input [String to be tokenized]
 * @param  {Array} rules  [Array of rules, which are dict in the following format: {regex, action}]
 * @return {Dict} tokens [{input, token}]
 */

function scan(input, rules) {
  let matches = [];

  for(let i = 0; i < rules.length; i++) {
    let rule = rules[i];
    let match = input.match(rule.regex);
    if(match !== null && input.indexOf(match[0]) === 0) {
      matches.push({match: match, action: rule.action});
    }
  }

  return findBestMatch(input, matches);
}

/**
 * Out of a dictionary of matches, if those matches are of the same length,
 * it prefers the first one or otherwise the longest one.
 * @param  {String} input   [String to be tokenized]
 * @param  {Array} matches  [Array of dict in the following format: {match, action}]
 * @return {Dict} tokens    [{input, token}]
 */
function findBestMatch(input, matches) {
  let bestMatch = _.maxBy(matches, (x) => x.match[0].length);
  input = input.replace(bestMatch.match[0], ''); // Get rid of input
  return {
    input: input,
    token: bestMatch.action(bestMatch.match)
  };
}
