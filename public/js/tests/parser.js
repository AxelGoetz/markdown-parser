import { lexer } from '../parser/lexer.js';
import { parse } from '../parser/parser.js';
import { constructRules } from '../parser/lexerRules.js';

let rules = constructRules();

export function runParserTests() {
  let results = [];

  results.push(parse1());


  if(results.filter(x => !x).length === 0) {
    console.log('Passed all ' + results.length + ' parser tests');
    return true;
  } return false;
}

function lexAndParse(md) {
  let tokens = lexer(md, rules);
  return parse(tokens);
}

function parse1() {
  let md = '# Hello\nI am *Axel*.\nYow | test\n---|---\nYeeeeeaaaa|*yow* yow **yow**\n';
  let AST = lexAndParse(md);
  let children = AST.children;
  let check = children[0].type == 'HEADER' &&
    children[1].type == 'PARAGRAPH' &&
    children[1].children[0].type == 'PARTPARAGRAPH' &&
    children[1].children[1].type == 'ITALICS' &&
    children[1].children[2].type == 'PARTPARAGRAPH' &&
    children[2].type == 'TABLE' &&
    children[2].children[0].type == 'TABLEROW' &&
    children[2].children[1].type == 'UNDERTABLE' &&
    children[2].children[2].type == 'TABLEROW';

  if(check) {
    return true;
  } else {
    console.log('FAILED PARSE 1');
    return false;
  }
}

function parse2() {
  let md = "Let's test some **ordered lists**\n1. Writing tests is boring\n2. But it is also useful\n4. It does not have to be in the correct order\n\nYou need 2 linebreaks to break out of a list.";
  let AST = lexAndParse(md);
  let children = AST.children;
  let check = children[0].type == 'PARAGRAPH' &&
    children[0].children.length == 1
}
