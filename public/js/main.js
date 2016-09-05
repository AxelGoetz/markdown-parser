// TODO:30 Tabs should be replaced with 2 spaces
import { runTests } from './tests/tests.js';

import { lexer } from './parser/lexer.js';
import { parse } from './parser/parser.js';
import { generateHTML } from './parser/generateHTML.js';
import { constructRules } from './parser/lexerRules.js';

const rules = constructRules();
const runTest = false;

function compileMarkdown() {
  let md = document.getElementById('textarea').value;
  let tokens = lexer(md, rules);
  let AST = parse(tokens);
  let html = generateHTML(AST);
  let iframe = document.getElementById('iframe');
  iframe.contentWindow.document.open();
  iframe.contentWindow.document.write('');
  iframe.contentWindow.document.close();
  iframe.contentWindow.document.write(html);
}

let button = document.getElementById('button');
button.addEventListener('click', compileMarkdown);

if(runTest) {
  runTests();
}
