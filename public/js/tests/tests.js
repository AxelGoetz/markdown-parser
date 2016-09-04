import { runLexerTests } from './lexer.js';
import { runParserTests } from './parser.js';


export function runTests() {
  let results = [];
  results.push(runLexerTests());
  results.push(runParserTests());

  if(results.filter(x => !x).length === 0) {
    console.log('Congrats, passed all tests');
  }
}
