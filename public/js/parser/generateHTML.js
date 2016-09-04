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
    return '<' + tag + '/>';
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

/**
 * Generates a link or img
 */
function generateLinkImg(node) {
  let text = '<' + node.tag + ' href="' + node.href + '" title="' + node.title +
    '">' + node.text + '</' + node.tag + '>';
}

function generateMultilineCode(node) {
  if(node.language !== '') {
    return hljs.highligh(node.language, node.text).value;
  } else {
    var pre = document.createElement('pre');
    pre.innerHTML = node.text;
    return hljs.highlightBlock(pre);
  }
}

/**
 * Generates the HTML for all of the children
 * @param  {Array} children [Array of nodes]
 * @return {String} text    [InnerHTML]
 */
// TODO: Check if this works
function generateChildren(children) {
  let text = '';
  for(let i = 0; i < children.length; i++) {
    text += generateHTML(children[i]);
  }
  return text;
}

/**
 * Generates a DOM element with all of the
 * html in the AST
 * Uses a depth-first search to generate the html
 * @param  {Dict} AST [Abstract syntax tree]
 * @return {DOMElement} DOM
 */
function generateHTML(AST) {
  if(AST.type == 'MAIN') {
    return getOpenCloseTag(generateChildren(AST.children), 'html');
  } else if(AST.type == 'HEADER') {
    return generateHeader(AST);
  } else if(AST.type == 'HORIZONTALRULE' || AST.type == 'LINEBREAK' || AST.type == 'SINGLENEWLINE') {
    return getTag(AST.tag, true);
  } else if(AST.type == 'BOLD' || AST.type == 'ITALICS' || AST.type == 'STRIKETHROUGH' || AST.type == 'CODE') {
    return getOpenCloseTag(AST.text, AST.tag);
  } else if(AST.type == 'ORDEREDLIST' || AST.type == 'UNORDEREDLIST') {
    generateList(AST);
  } else if(AST.type == 'LINK' || AST.type == 'IMG') {
    generateLinkImg(AST);
  } else if(AST.type == 'MULTILINECODE') {

  } else if(AST.type == 'SINGLECHAR') {
    return AST.text;
  }
}
