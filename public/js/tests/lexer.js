import { lexer } from '../parser/lexer.js';
import { constructRules } from '../parser/lexerRules.js';

let rules = constructRules();

export function runLexerTests() {
  let results = [];
  results.push(header1());
  results.push(header2());
  results.push(header3());
  results.push(header4());
  results.push(horizontalRule1());
  results.push(horizontalRule2());
  results.push(horizontalRule3());
  results.push(italics1());
  results.push(italics2());
  results.push(italics3());
  results.push(bold1());
  results.push(bold2());
  results.push(strikethrough1());
  results.push(linebreak1());
  results.push(linebreak2());
  results.push(orderedList1());
  results.push(orderedList2());
  results.push(unorderedList1());
  results.push(unorderedList2());
  results.push(link1());
  results.push(link2());
  results.push(img1());
  results.push(code1());
  results.push(code2());
  results.push(code3());
  results.push(blockquote1());
  results.push(blockquote2());
  results.push(undertable1());
  results.push(undertable2());
  results.push(table1());
  results.push(table2());

  if(results.filter(x => !x).length === 0) {
    console.log('Passed all ' + results.length + ' lexer tests');
    return true;
  } return false;
}

function header1() {
  let md = '# Hello\n';
  let result = lexer(md, rules);
  if(result.length == 1 && result[0].type == 'HEADER' &&
    result[0].level == 1 && result[0].text == 'Hello') {
    return true;
  } else {
    console.log('FAILED HEADER 1');
    return false;
  }
}

function header2() {
  let md = '#  Hello\n';
  let result = lexer(md, rules);
  if(result.length == 1 && result[0].type == 'HEADER' &&
    result[0].level == 1 && result[0].text == 'Hello') {
    return true;
  } else {
    console.log('FAILED HEADER 2');
    return false;
  }
}

function header3() {
  let md = '## Hello\n';
  let result = lexer(md, rules);
  if(result.length == 1 && result[0].type == 'HEADER' &&
    result[0].level == 2 && result[0].text == 'Hello') {
    return true;
  } else {
    console.log('FAILED HEADER 3');
    return false;
  }
}

function header4() {
  let md = '#### Hello';
  let result = lexer(md, rules);
  if(result.length == 1 && result[0].type == 'HEADER' &&
    result[0].level == 4 && result[0].text == 'Hello') {
    return true;
  } else {
    console.log('FAILED HEADER 4');
    return false;
  }
}

function horizontalRule1() {
  let md = '\n---\n';
  let result = lexer(md, rules);
  if(result.length == 2 && result[1].type == 'HORIZONTALRULE') {
    return true;
  } else {
    console.log('FAILED HORIZONTALRULE 1');
    return false;
  }
}

function horizontalRule2() {
  let md = '\n=====';
  let result = lexer(md, rules);
  if(result.length == 2 && result[1].type == 'HORIZONTALRULE') {
    return true;
  } else {
    console.log('FAILED HORIZONTALRULE 2');
    return false;
  }
}

function horizontalRule3() {
  let md = '\n____\n';
  let result = lexer(md, rules);
  if(result.length == 2 && result[1].type == 'HORIZONTALRULE') {
    return true;
  } else {
    console.log('FAILED HORIZONTALRULE 3');
    return false;
  }
}

function italics1() {
  let md = '*this will be italics*';
  let result = lexer(md, rules);

  if(result.length == 1 && result[0].type == 'ITALICS' &&
    result[0].text == 'this will be italics') {
    return true;
  } else {
    console.log('FAILED ITALICS 1');
    return false;
  }
}

function italics2() {
  let md = '_this will be italics_';
  let result = lexer(md, rules);
  if(result.length == 1 && result[0].type == 'ITALICS' &&
    result[0].text == 'this will be italics') {
    return true;
  } else {
    console.log('FAILED ITALICS 2');
    return false;
  }
}

function italics3() {
  let md = '*this will be italics*__And this bold__';
  let result = lexer(md, rules);
  if(result.length == 2 && result[0].type == 'ITALICS' &&
    result[0].text == 'this will be italics') {
    return true;
  } else {
    console.log('FAILED ITALICS 3');
    return false;
  }
}

function bold1() {
  let md = '**this will be bold**__And this bold__';
  let result = lexer(md, rules);
  if(result.length == 2 && result[0].type == 'BOLD' &&
    result[0].text == 'this will be bold') {
    return true;
  } else {
    console.log('FAILED BOLD 1');
    return false;
  }
}

function bold2() {
  let md = '**this will be bold**_And this italics_';
  let result = lexer(md, rules);
  if(result.length == 2 && result[0].type == 'BOLD' &&
    result[0].text == 'this will be bold') {
    return true;
  } else {
    console.log('FAILED BOLD 1');
    return false;
  }
}

function strikethrough1() {
  let md = '~~this will be strikethrough~~_And this italics_';
  let result = lexer(md, rules);
  if(result.length == 2 && result[0].type == 'STRIKETHROUGH' &&
    result[0].text == 'this will be strikethrough') {
    return true;
  } else {
    console.log('FAILED BOLD 1');
    return false;
  }
}

function linebreak1() {
  let md = '\n\n';
  let result = lexer(md, rules);
  if(result.length == 1 && result[0].type == 'LINEBREAK') {
    return true;
  } else {
    console.log('FAILED LINEBREAK 1');
    return false;
  }
}

function linebreak2() {
  let md = '# Hello\n\n\n';
  let result = lexer(md, rules);
  if(result.length == 2 && result[1].type == 'LINEBREAK') {
    return true;
  } else {
    console.log('FAILED LINEBREAK 1');
    return false;
  }
}

function orderedList1() {
  let md = '1. Testing\n2. Hellow';
  let result = lexer(md, rules);
  if(result.length == 2 && result[0].type == 'ORDEREDLISTITEM' &&
    result[0].level === 0) {
    return true;
  } else {
    console.log('FAILED ORDEREDLIST 1');
    return false;
  }
}

function orderedList2() {
  let md = '1. Testing\n  2. Hellow';
  let result = lexer(md, rules);
  if(result.length == 2 && result[1].type == 'ORDEREDLISTITEM' &&
    result[1].level === 2) {
    return true;
  } else {
    console.log('FAILED ORDEREDLIST 2');
    return false;
  }
}

function unorderedList1() {
  let md = '* Testing\n  - Hellow';
  let result = lexer(md, rules);
  if(result.length == 2 && result[1].type == 'UNORDEREDLISTITEM' &&
    result[1].level === 2) {
    return true;
  } else {
    console.log('FAILED UNORDEREDLIST 1');
    return false;
  }
}

function unorderedList2() {
  let md = '* Testing\n+ Hellow';
  let result = lexer(md, rules);
  if(result.length == 2 && result[0].type == 'UNORDEREDLISTITEM' &&
    result[0].level === 0) {
    return true;
  } else {
    console.log('FAILED UNORDEREDLIST 2');
    return false;
  }
}

function link1() {
  let md = '[Hello](http://google.com "Google")';
  let result = lexer(md, rules);
  if(result.length == 1 && result[0].type == 'LINK' &&
    result[0].href == 'http://google.com' && result[0].text == 'Hello' &&
    result[0].title == 'Google') {
    return true;
  } else {
    console.log('FAILED LINK 1');
    return false;
  }
}

function link2() {
  let md = '<http://google.com>';
  let result = lexer(md, rules);
  if(result.length == 1 && result[0].type == 'LINK' &&
    result[0].href == 'http://google.com') {
    return true;
  } else {
    console.log('FAILED LINK 2');
    return false;
  }
}

function img1() {
  let md = '![test](http://google.com "Google logo")';
  let result = lexer(md, rules);
  if(result.length == 1 && result[0].type == 'IMG' &&
    result[0].href == 'http://google.com' && result[0].title == 'Google logo' &&
    result[0].text == 'test') {
    return true;
  } else {
    console.log('FAILED IMG 1');
    return false;
  }
}

function code1() {
  let md = '`test`';
  let result = lexer(md, rules);
  if(result.length == 1 && result[0].type == 'CODE' &&
    result[0].text == 'test') {
    return true;
  } else {
    console.log('FAILED CODE 1');
    return false;
  }
}

function code2() {
  let md = '```javascript\nvar test\n```';
  let result = lexer(md, rules);
  if(result.length == 1 && result[0].type == 'MULTILINECODE' &&
    result[0].text == 'var test' && result[0].language == 'javascript') {
    return true;
  } else {
    console.log('FAILED CODE 2');
    return false;
  }
}

function code3() {
  let md = '\n```javascript\nvar `test`\n```';
  let result = lexer(md, rules);
  if(result.length == 2 && result[1].type == 'MULTILINECODE' &&
    result[1].text == 'var `test`' && result[1].language == 'javascript') {
    return true;
  } else {
    console.log('FAILED CODE 3');
    return false;
  }
}

function blockquote1() {
  let md = '> Howdy partner\n';
  let result = lexer(md, rules);
  if(result.length == 1 && result[0].type == 'BLOCKQUOTE' &&
    result[0].text == 'Howdy partner') {
    return true;
  } else {
    console.log('FAILED BLOCKQUOTE 1');
    return false;
  }
}

function blockquote2() {
  let md = '\n> Howdy partner\n';
  let result = lexer(md, rules);
  if(result.length == 2 && result[1].type == 'BLOCKQUOTE' &&
    result[1].text == 'Howdy partner') {
    return true;
  } else {
    console.log('FAILED BLOCKQUOTE 2');
    return false;
  }
}

function undertable1() {
  let md = '---|:---:|---:';
  let result = lexer(md, rules);
  if(result.length == 1 && result[0].type == 'UNDERTABLE' &&
    result[0].alignment.length == 3 &&
    result[0].alignment[0] == 'left' &&
    result[0].alignment[1] == 'center' &&
    result[0].alignment[2] == 'right') {
    return true;
  } else {
    console.log('FAILED UNDER TABLE 1');
    return false;
  }
}

function undertable2() {
  let md = '|------|:---:|----------:|';
  let result = lexer(md, rules);
  if(result.length == 1 && result[0].alignment.length == 3 &&
    result[0].alignment[0] == 'left' &&
    result[0].alignment[1] == 'center' &&
    result[0].alignment[2] == 'right') {
    return true;
  } else {
    console.log('FAILED UNDER TABLE 2');
    return false;
  }
}

function table1() {
  let md = 'column 1 |    column 2 | column 3   ';
  let result = lexer(md, rules);
  if(result.length == 1 && result[0].type == 'TABLEROW' &&
    result[0].columns[0].text == 'column 1' &&
    result[0].columns[1].text == 'column 2' &&
    result[0].columns[2].text == 'column 3') {
    return true;
  } else {
    console.log('FAILED TABLE 1');
    return false;
  }
}

function table2() {
  let md = '|column 1 |    column 2 | column 3   |';
  let result = lexer(md, rules);
  if(result.length == 1 && result[0].type == 'TABLEROW' &&
    result[0].columns[0].text == 'column 1' &&
    result[0].columns[1].text == 'column 2' &&
    result[0].columns[2].text == 'column 3') {
    return true;
  } else {
    console.log('FAILED TABLE 2');
    return false;
  }
}
