import { lexer } from '../parser/lexer.js';
import _ from 'lodash';

/**
 * Tokenizer, there are various `primitive` tokens that we have to consider:
 * - '#'    [For headings]
 * - '\n'   [End of listitem, heading, paragraph,...]
 * - '*'    [Unordered list, italics, bold, 3+ is horizontal rule]
 * - '+'    [Unordered list]
 * - '-'    [Unordered list, table, 3+ is horizontal rule]
 * - '='    [3+ is horizontal rule]
 * - '_'    [Italics, bold, 3+ is horizontal rule]
 * - '|'    [Table]
 * - '~~'   [Strikethrough]
 * - '\d\.' [Ordered list]
 * - '  '   [Indented list]
 * - '['    [Link/img]
 * - ']'    [Link/img]
 * - '('    [Link/img]
 * - ')'    [Link/img]
 * - '!'    [Img]
 * - '<'    [Link]
 * - '>'    [Link, blockquote]
 * - '`'    [Code]
 * - ':'    [Table]
 *
 * So the only composite tokens that we seem to have are `~~` and `\d\.`
 * Therefore it is a better idea to use `composite tokens`:
 * - /(?:(^#{1,6})|\n(#{1,6}))\s+([^\n$]*)(?:\n|$)/    [Header <h>]           {Either [1].length or [2].length - 1 is the heading level and [3] is the text - Do not use in ```}
 * - /\n(-|=|_|\*)\1\1+(?:\n|$)/                       [Horizontal rule <hr>]
 * - /(\*|_)([^\1]*)\1/                                [Italics <em>]         {[2] is the text}
 * - /((?:\*\*)|(?:__))([^\1]*)\1/                     [Bold <strong>]        {[2] is the text}
 * - /(~~)([^\1]*)\1/                                  [Strikethrough <del>]  {[2] is the text}
 * - /\n\n/                                            [Linebreak <br>]
 * - /(?:(?:^( *)[0-9]+\.)|(?:\n( *)[0-9]+\.))\s+([^\n$]*)(?:\n|$)/
 *                                                     [Ordered list <ol>]    {[1].length or [2].length is identation (in spaces) and [3] is the text}
 * - /(?:(?:^( *)(?:\*|-|\+))|(?:\n( *)(?:\*|-|\+)))\s+([^\n$]*)(?:\n|$)/
 *                                                     [Unordered list <ul>]  {[1].length or [2].length is identation (in spaces) and [3] is the text}
 * - /\[([^\[\]]*)\](?:\(([^\(\)"]*)(?:\s+("|')([^\3]*)\3)?\s*\))/
 *                                                     [Link <a>]             {[1] is the text, [2] is the href and [4] is the title}
 * - urlRegex (see below)                              [Link <a>]             {[0] is the href and text}
 * - /!\[([^\[\]]*)\](?:\(([^\(\)"]*)(?:\s+("|')([^\3]*)\3)?\s*\))/
 *                                                     [Image <img>]          {[1] is the text, [2] is the href and [4] is the title}
 * - /`([^`\n]+)`/                                     [Code <code>]          {[1] is the text}
 * - /(?:(?:^>)|(?:\n>))\s+([^\n$]*)(?:\n|$)/          [Blockquote <pre>]     {[1] is the text}
 * - /(?:(?:^```)|(?:\n```))([a-z]*)\s*\n([^`]*)\n```/ [Multiline code <pre>] {[1] is the language and [2] the text}
 * - /((?:(?:^\|)|(?:\n\|))(?:\s*:?-+:?\s*\|)+)/       [Under table]          {[1] is the entire under table}
 * - /((?:(?:^(?:\s*-+\s*))|(?:\n(?:\s*-+\s*)))(?:\|(?:\s*-+\s*)+)+)/
 *                                                     [Under table]          {[1] is the entire under table}
 * - /((?:(?:^\|)|(?:\n\|))(?:[^|]+\|)+)/              [Table <table>]        {[1] is the entire table}
 * - /((?:(?:^[^\|]+)|(?:\n[^\|]+))(?:\|[^|]+)+)/      [Table <table>]        {[1] is the entire table}
 * - /[^'"#*_\-=~`\d.+\[\(<>!|]+/                      [Paragraph <p>]
 */

function header(match) {
  return {
    type: 'HEADER',
    level: match[1].length,
    text: match[2]
 };
}

function horizontalRule(match) {
  return {
    type: 'HORIZONTALRULE'
  };
}

function italics(match) {
  return {
    type: 'ITALICS',
    text: match[2]
  };
}

function bold(match) {
  return {
    type: 'BOLD',
    text: match[2]
  };
}

function strikethrough(match) {
  return {
    type: 'STRIKETHROUGH',
    text: match[2]
  };
}

function linebreak(match) {
  return {
    type: 'LINEBREAK'
  };
}

function orderedList(match) {
  return {
    type: 'ORDEREDLISTITEM',
    level: match[1].length,
    text: match[2]
  };
}

function unorderedList(match) {
  return {
    type: 'UNORDEREDLISTITEM',
    level: match[1].length,
    text: match[2]
  };
}

function alink(match) {
  return {
    type: 'LINK',
    href: match[2],
    title: match[4],
    text: match[1]
  };
}

function alink1(match) {
  return {
    type: 'LINK',
    href: match[1],
    text: match[1]
  };
}

function img(match) {
  return {
    type: 'IMG',
    href: match[2],
    title: match[4],
    text: match[1]
  };
}

function code(match) {
  return {
    type: 'CODE',
    text: match[1]
  };
}

function blockquote(match) {
  return {
    type: 'BLOCKQUOTE',
    text: match[1]
  };
}

function multilineCode(match) {
  return {
    type: 'MULTILINECODE',
    language: match[1],
    text: match[2]
  };
}

function underTable(match) {
  let columns = match[0].replace(/ /g,'').split('|');
  columns = columns.filter((x) => x !== '');
  let alignment = [];

  for(let i = 0; i < columns.length; i++) {
    let column = columns[i];
    let lastLetterColon = column[column.length - 1] == ':';
    if(column[0] == ':') {
      lastLetterColon ? alignment.push('CENTER') : alignment.push('LEFT');
    } else if(lastLetterColon) {
      alignment.push('RIGHT');
    } else {
      alignment.push('LEFT');
    }
  }

  return {
    type: 'UNDERTABLE',
    alignment: alignment,
    original: match[0]
  };
}

function table(match) {
  let columns = match[1].split('|');
  for(let i = 0; i < columns.length; i++) columns[i] = columns[i].trim();
  columns = columns.filter((x) => x !== '');
  let newColumns = [];
  for(let i = 0; i < columns.length; i++) {
    let column = columns[i];
    let newColumn = {
      text: column,
      tokens: lexer(column, tableRules)
    };
    newColumns.push(newColumn);
  }

  return {
    type: 'TABLEROW',
    columns: newColumns,
    original: match[0]
  };
}

function paragraph(match) {
  return {
    type: 'PARTPARAGRAPH',
    text: match[0]
  };
}

function singleNewLine(match) {
  return {
    type: 'SINGLENEWLINE'
  };
}

function singleChar(match) {
  return {
    type: 'SINGLECHAR',
    text: match[0]
  };
}

function tableText(match) {
  return {
    type: 'TABLETEXT',
    text: match[0]
  };
}

// Tweeked, robust regexp for matching URLs. Thanks: https://gist.github.com/dperini/729294
const urlRegex = /(?:<)?((?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?)(?:>)?/i.source;

/**
* Constructs an array of rules and the function (action)
* that will be evaluated when one of the rules is found.
* The higher the rule, the higher the precedence.
* @return {Array} rules    [Array of Dict with the following format: {regex, action}]
*/
export function constructRules() {
  let rules = [];

  rules.push({regex: /(^#{1,6})\s+([^\n$]*)(?:\n|$)/, action: header});
  rules.push({regex: /(-|=|_|\*)\1\1+(?:\n|$)/, action: horizontalRule});
  rules.push({regex: /(\*\*)((?:[^*]+)|(?:[^*]*\*[^*]*))\1/ , action: bold});
  rules.push({regex: /(__)((?:[^_]+)|(?:[^_]*_[^_]*))\1/ , action: bold});
  rules.push({regex: /(\*)([^*]*)\*/ , action: italics});
  rules.push({regex: /(_)([^_]*)_/ , action: italics});
  rules.push({regex: /(~~)([^~]*(?:~[^~]+)?)\1/, action: strikethrough});
  rules.push({regex: /\n\n/  , action: linebreak});
  rules.push({regex: /(?:^( *)[0-9]+\.)\s+([^\n$]*)(?:\n|$)/ , action: orderedList});
  rules.push({regex: /(?:^( *)(?:\*|-|\+))\s+([^\n$]*)(?:\n|$)/ , action: unorderedList});
  rules.push({regex: /\[([^\[\]]*)\](?:\(([^\(\)"']*)(?:\s+("|')([^\3]*)\3)?\s*\))/ , action: alink});
  rules.push({regex: urlRegex, action: alink1});
  rules.push({regex: /!\[([^\[\]]*)\](?:\(([^\(\)'"]*)(?:\s+("|')([^\3]*)\3)?\s*\))/, action: img});
  rules.push({regex: /`([^`\n]+)`/, action: code});
  rules.push({regex: /(?:^>)\s+([^\n$]*)(?:\n|$)/, action: blockquote});
  rules.push({regex: /(?:^```)([a-z]*)\s*\n([^]*)\n```/, action: multilineCode});
  rules.push({regex: /(?:(?:^\|)(?:\s*:?-+:?\s*\|)+)(?:\n|$)/, action: underTable});
  rules.push({regex: /((?:^(?:\s*:?-+\s*))(?:\|(?:\s*:?-+:?\s*)+)+)(?:\n|$)/, action: underTable});
  rules.push({regex: /((?:^\|)(?:[^|\n]+\|)+)(?:\n|$)/, action: table});
  rules.push({regex: /((?:^[^\|\n]+)(?:\|[^|\n]+)+)(?:\n|$)/, action: table});
  rules.push({regex: /\n/, action: singleNewLine});
  rules.push({regex: /\'|\"|\*|~|`|\[|!/, action: singleChar});
  rules.push({regex: /[^'"*_\~`\[<!|\n]+/, action: paragraph});

  return rules;
}

function constructTableRules() {
  let rules = [];

  rules.push({regex: /(\*\*)((?:[^*]+)|(?:[^*]*\*[^*]*))\1/ , action: bold});
  rules.push({regex: /(__)((?:[^_]+)|(?:[^_]*_[^_]*))\1/ , action: bold});
  rules.push({regex: /(\*)([^*]*)\*/ , action: italics});
  rules.push({regex: /(_)([^_]*)_/ , action: italics});
  rules.push({regex: /(~~)([^~]*(?:~[^~]+)?)\1/, action: strikethrough});
  rules.push({regex: /\[([^\[\]]*)\](?:\(([^\(\)"']*)(?:\s+("|')([^\3]*)\3)?\s*\))/ , action: alink});
  rules.push({regex: urlRegex, action: alink1});
  rules.push({regex: /!\[([^\[\]]*)\](?:\(([^\(\)'"]*)(?:\s+("|')([^\3]*)\3)?\s*\))/, action: img});
  rules.push({regex: /`([^`\n]+)`/, action: code});
  rules.push({regex: /\'|\"|\*|~|`|\[|!/, action: singleChar});
  rules.push({regex: /[^*_~`\[\(<>!]+/, action: tableText});

  return rules;
}

const tableRules = constructTableRules();
