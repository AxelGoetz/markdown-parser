import { lexer } from '../parser/lexer.js';
import { parse } from '../parser/parser.js';
import { constructRules } from '../parser/lexerRules.js';

let rules = constructRules();

export function runParserTests() {
  let results = [];

  results.push(parse1());
  results.push(parse2());
  results.push(parse3());
  results.push(parse4());


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
  let md = "Let's test some **ordered lists**\n1. Writing tests is boring\n2. But it is also useful\n4. It does not have to be in the correct order\n\n\nYou need 3 linebreaks to break out of a list.";
  let AST = lexAndParse(md);
  let children = AST.children;
  let check = children[0].type == 'PARAGRAPH' &&
    children[0].children.length == 2 &&
    children[0].children[0].type == 'PARTPARAGRAPH' &&
    children[0].children[1].type == 'BOLD' &&
    children[1].type == 'ORDEREDLIST' &&
    children[1].children.length == 3 &&
    children[1].children[0].type == 'ORDEREDLISTITEM' &&
    children[1].children[1].type == 'ORDEREDLISTITEM' &&
    children[1].children[2].type == 'ORDEREDLISTITEM' &&
    children[2].type == 'PARAGRAPH';

  if(check) {
    return true;
  } else {
    console.log('FAILED PARSE 2');
    return false;
  }
}

function parse3() {
  let md = "Let's test some **nested ordered lists**\n1. Writing tests is *boring*\n2. But it is also useful\n  1. This will be nested\n  2. And this as well\n4. And this not\n\n\nYou need 3 linebreaks to break out of a list.";
  let AST = lexAndParse(md);
  let children = AST.children;
  let check = children[0].type == 'PARAGRAPH' &&
    children[0].children.length == 2 &&
    children[0].children[0].type == 'PARTPARAGRAPH' &&
    children[0].children[1].type == 'BOLD' &&
    children[1].type == 'ORDEREDLIST' &&
    children[1].children.length == 3 &&
    children[1].children[0].type == 'ORDEREDLISTITEM' &&
    children[1].children[1].type == 'ORDEREDLISTITEM' &&
    children[1].children[2].type == 'ORDEREDLISTITEM' &&
    children[2].type == 'PARAGRAPH';

  if(check) {
    return true;
  } else {
    console.log('FAILED PARSE 3');
    return false;
  }
}

function parse4() {
  let md = "Let's test some **nested ordered lists**\n1. Writing tests is *boring*\n2. But it is also useful\n3. Let's see if we can have paragraphs within a list\n# And headers\nPersonally, I am not sure yet\n2nd **paragraph**\n4. Last point\n\n\nTest";
  let AST = lexAndParse(md);
  let children = AST.children;
  let check = children[0].type == 'PARAGRAPH' &&
    children[0].children[0].type == 'PARTPARAGRAPH' &&
    children[0].children[1].type == 'BOLD' &&
    children[1].type == 'ORDEREDLIST' &&
    children[1].children.length == 4 &&
    children[1].children[0].type == 'ORDEREDLISTITEM' &&
    children[1].children[1].type == 'ORDEREDLISTITEM' &&
    children[1].children[2].type == 'ORDEREDLISTITEM' &&
    children[2].type == 'PARAGRAPH';

  if(check) {
    return true;
  } else {
    console.log('FAILED PARSE 4');
    return false;
  }
}
