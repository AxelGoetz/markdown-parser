import { escapeHTML } from '../utils/utils.js';
import hljs from 'highlightjs';

/**
 * Returns a string with the tag
 * @param  {String} tag
 * @param  {Bool} open   [If true, the tag is open, otherwise closed]
 * @return {String} tag
 */
function getTag(tag, open) {
  if(open) {
    return '<' + tag + '>';
  } else {
    return '</' + tag + '>';
  }
}

/**
 * Returns the string for an open and close tag such as
 * <p>String</p>
 * @param  {String} text [InnerHTML]
 * @param  {String} tag  [Only the text (not the <>)]
 * @return {String} tag
 */
function getOpenCloseTag(text, tag) {
  return getTag(tag, true) + text + getTag(tag, false);
}

function generateHeader(node) {
  let tag = 'h' + node.level;
  return getOpenCloseTag(node.text, tag);
}

function generateListItem(node) {
  let text = '';
  for(let i = 0; i < node.tokens.length; i++) {
    let token = node.tokens[i];
    if(token.type == 'TABLETEXT') {
      text += token.text;
    } else {
      text += generateHTML(token);
    }
  }
  text = getOpenCloseTag(text, 'p');
  text += generateChildren(node.children);

  return getOpenCloseTag(text, 'li');
}

function generateList(node) {
  let text = '';
  for(let i = 0; i < node.children.length; i++) {
    text += generateListItem(node.children[i]);
  }
  return getOpenCloseTag(text, node.tag);
}

function generateParagraph(node) {
  let text = '';
  for(let i = 0; i < node.children.length; i++) {
    let child = node.children[i];
    if(child.type == 'PARTPARAGRAPH') {
      text += child.text;
    } else {
      text += generateHTML(child);
    }
  }
  return getOpenCloseTag(text, 'p');
}

/**
 * Generates a link or img
 */
function generateLink(node) {
  node.href = node.href || '';
  node.text = node.text || '';
  node.title = node.title || '';
  return '<' + node.tag + ' href="' + node.href + '" title="' + node.title +
    '">' + escapeHTML(node.text) + '</' + node.tag + '>';
}

function generateImg(node) {
  node.href = node.href || '';
  node.text = node.text || '';
  node.title = node.title || '';
  return '<' + node.tag + ' src="' + node.href + '" title="' + node.title +
    '" alt="' + node.text + '">';
}

function generateMultilineCode(node) {
  if(node.language !== '') {
    let code = getOpenCloseTag(hljs.highlight(node.language, node.text).value, 'code');
    return '<pre class="hljs matlab">' + code + '</pre>';
  } else {
    let pre = document.createElement('pre');
    let code = getOpenCloseTag(node.text, 'code');
    pre.innerHTML = code;
    hljs.highlightBlock(pre);
    return pre.outerHTML;
  }
}

/**
 * Generates a NOTTABLE as a paragraph
 */
function generateNotTable(node) {
  let text = '';
  for(let k = 0; k < node.children.length; k++) {
    let child = node.children[k];
    if(child.type == 'UNDERTABLE') {
      text += child.original;
      continue;
    }
    for(let i = 0; i < child.columns.length; i++) {
      let column = child.columns[i];
      for(let j = 0; j < column.tokens.length; j++) {
        let token = column.tokens[j];
        if(token.type == 'TABLETEXT') {
          text += token.text;
        } else {
          text += generateHTML(token);
        }
      }
      if(i != child.columns.length - 1) text += ' | ';
    }
    let original = child.original.trim();
    if(original[0] == '|') {
      text = '|' + text + '|';
    }
  }
  return text;
}

/**
 * Gets a string for just 1 row, the tag element is either
 * th or td.
 */
function getTableRow(columns, alignment, tag) {
  let mainText = '';
  for(let i = 0; i < columns.length; i++) {
    let text = '';
    let column = columns[i];
    for(let j = 0; j < column.tokens.length; j++) {
      let token = column.tokens[j];
      if(token.type == 'TABLETEXT') {
        text += token.text;
      } else {
        text += generateHTML(token);
      }
    }
    mainText += '<' + tag + ' style="text-align:' + alignment[i] + ';">' + text + '</' + tag + '>';
  }
  return getOpenCloseTag(mainText, 'tr');
}

function generateTable(node) {
  if(node.children.length < 3) {
    return generateParagraphs(node);
  }
  let alignment = node.children[1].alignment;
  let text = getOpenCloseTag(getTableRow(node.children[0].columns, alignment, 'th'), 'thead');
  text += '<tbody>';
  for(let i = 2; i < node.children.length; i++) {
    text += getTableRow(node.children[i].columns, alignment, 'td');
  }
  text += '</tbody>';
  return getOpenCloseTag(text, 'table');
}

function generateBlockquote(node) {
  let text = '';
  for(let i = 0; i < node.tokens.length; i++) {
    let token = node.tokens[i];
    if(token.type == 'TABLETEXT') {
      text += token.text;
    } else {
      text += generateHTML(token);
    }
  }

  return getOpenCloseTag(text, 'blockquote');
}

/**
 * Generates the HTML for all of the children
 * @param  {Array} children [Array of nodes]
 * @return {String} text    [InnerHTML]
 */
function generateChildren(children) {
  let text = '';
  for(let i = 0; i < children.length; i++) {
    text += generateHTML(children[i]);
  }
  return text;
}

function generateHead() {
  let text = getOpenCloseTag('* {box-sizing: border-box;} ol, ul {padding-left: 20px} td, th {border: 1px solid #dddddd;text-align: left;padding: 8px;} table {border-collapse: collapse;width:100%;display:block;} blockquote {color: rgb(119, 119, 119);padding: 0px 1em;border-left: 0.25em solid rgb(221, 221, 221);margin:5;} p {margin-top:10px;margin-bottom:10px;} h1, h2, h3, h4, h5, h6 {margin-top:12px;margin-bottom:12px;}', 'style');
  // TODO: Get local stylesheet
  text += '<link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/9.6.0/styles/default.min.css">';
  return getOpenCloseTag(text, 'head');
}


/**
 * Generates a DOM element with all of the
 * html in the AST
 * Uses a depth-first search to generate the html
 * @param  {Dict} AST [Abstract syntax tree]
 * @return {DOMElement} DOM
 */
export function generateHTML(AST) {
  if(AST.type == 'MAIN') {
    return getOpenCloseTag(generateHead() + generateChildren(AST.children), 'html');
  } else if(AST.type == 'HEADER') {
    return generateHeader(AST);
  } else if(AST.type == 'PARAGRAPH') {
    return generateParagraph(AST);
  } else if(AST.type == 'HORIZONTALRULE' || AST.type == 'LINEBREAK' || AST.type == 'SINGLENEWLINE') {
    return getTag(AST.tag, true);
  } else if(AST.type == 'BOLD' || AST.type == 'ITALICS' || AST.type == 'STRIKETHROUGH' || AST.type == 'CODE') {
    return getOpenCloseTag(AST.text, AST.tag);
  } else if(AST.type == 'ORDEREDLIST' || AST.type == 'UNORDEREDLIST') {
    return generateList(AST);
  } else if(AST.type == 'LINK') {
    return generateLink(AST);
  } else if(AST.type == 'IMG') {
    return generateImg(AST);
  } else if(AST.type == 'MULTILINECODE') {
    return generateMultilineCode(AST);
  } else if(AST.type == 'SINGLECHAR') {
    return AST.text;
  } else if(AST.type == 'TABLE') {
    return generateTable(AST);
  } else if(AST.type == 'NOTTABLE') {
    return generateNotTable(AST);
  } else if(AST.type == 'BLOCKQUOTE') {
    return generateBlockquote(AST);
  }
}
