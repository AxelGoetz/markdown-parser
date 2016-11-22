import { findParentNode } from '../utils/utils.js';
import _ from 'lodash';

/**
 * The AST maintains a very similar structure to the tokens,
 * instead 1 key is added: 'children', which is an array of tokens that
 * lists the children from left to right.
 *
 * For instance the following text: '# Hello\nI am *Axel*\n'
 * {type: 'MAIN',
 * children: [{
 *  line: 1,
 *  type: 'HEADER',
 *  level: 1,
 *  text: 'Hello',
 *  children: []
 *  }, {
 *  type: 'PARAGRAPH',
 *  children: [{
 *    type: 'PARTPARAGRAPH',
 *    line: 2,
 *    text: 'I am ',
 *    children: []
 *  }, {
 *    type: 'ITALICS',
 *    line: 2,
 *    text: 'Axel',
 *    children: []
 *   }
 *  ]}
 * ]}
 */


/**
 * Removes an element from the children of an AST
 * @param  {Dict} AST     [Node from which a child element needs to be removed]
 * @param  {Dict} node    [Child element to be removed]
 * @param  {Dict} newNode [New element]
 * @return {Dict} AST     [New tree]
 */
function replaceNode(AST, node, newNode) {
  for(let i = 0; i < AST.children.length; i++) {
    if(AST.children[i] == node) {
      AST.children.splice(i, 1, newNode);
      return AST;
    }
  }
  return AST;
}

function createParagraph(currentNode, token) {
  return  {
    type: 'PARAGRAPH',
    children: [token],
    tag: 'p'
  };
}

/**
 * Adds a partparagraph to the AST by either starting
 * a new parapgraph or appending to the current one
 * @param  {Dict} currentNode [Node in the AST]
 * @param  {Dict} token       [Token that is being added]
 * @return {Dict} currentNode
 */
function addParagraph(AST, currentNode, token) {
  currentNode = checkIfNotTable(AST, currentNode);
  if(currentNode.type == 'PARAGRAPH') {
    currentNode.children.push(token);
  } else if(currentNode.type == 'ORDEREDLIST' || currentNode.type == 'UNORDEREDLIST') { // Paragraph within list
    currentNode = currentNode.children[currentNode.children.length - 1]; // Last list item will contain paragraph
    let paragraph = createParagraph(currentNode, token);
    currentNode.children.push(paragraph);
    currentNode = paragraph;
  } else {
    let paragraph = createParagraph(currentNode, token);
    currentNode.children.push(paragraph);
    currentNode = paragraph;
  }
  return currentNode;
}


/**
 * Paragraphs do not deal with single newlines so
 * if inside a paragraph or a table, stop both
 * @param  {Dict} AST         [Abstract syntax tree]
 * @param  {Dict} currentNode [Node in the AST]
 * @param  {Dict} token       [Token that is being added]
 * @return {Dict} currentNode
 */
function addSingleNewLine(AST, currentNode, token) {
  currentNode = checkIfNotTable(AST, currentNode);
  let parentNode = findParentNode(AST, currentNode);
  if(currentNode.type == 'TABLE' ||
  currentNode.type == 'ORDEREDLIST' || currentNode.type == 'UNORDEREDLIST' ||
  currentNode.type == 'ORDEREDLISTITEM' || currentNode.type == 'UNORDEREDLISTITEM') {
    currentNode = parentNode; // Stop table or listitem
  } else if(currentNode.type == 'PARAGRAPH' &&
    (parentNode.type == 'ORDEREDLISTITEM' || parentNode.type == 'UNORDEREDLISTITEM')) {
      currentNode = parentNode;
  }
  return currentNode;
}

function addLineBreak(AST, currentNode, token) {
  currentNode = checkIfNotTable(AST, currentNode);
  if(currentNode.type == 'PARAGRAPH' || currentNode.type == 'TABLE' || currentNode.type == 'NOTTABLE' ||
    currentNode.type == 'ORDEREDLIST' || currentNode.type == 'UNORDEREDLIST' ||
    currentNode.type == 'ORDEREDLISTITEM' || currentNode.type == 'UNORDEREDLISTITEM') {
    currentNode = findParentNode(AST, currentNode); // Stop paragraph, table or list
    // For nested lists, you should escape all the way
    if(currentNode.type == 'ORDEREDLISTITEM' || currentNode.type == 'UNORDEREDLISTITEM') {
      currentNode = addLineBreak(AST, currentNode, token);
    } else if(currentNode.type == 'ORDEREDLIST' || currentNode.type == 'UNORDEREDLIST') {
      currentNode = findParentNode(AST, currentNode, token);
      currentNode.children.push(token);
    }
  } else {
    currentNode.children.push(token);
  }
  return currentNode;
}

/**
 * Creates a new list node
 */
function createNewList(currentNode, token) {
  // Should be the child of the last list item
  if(currentNode.type == 'ORDEREDLIST' || currentNode.type == 'UNORDEREDLIST') {
    currentNode = currentNode.children[currentNode.children.length - 1];
  }
  let type;
  token.type == 'ORDEREDLISTITEM'? type = 'ORDEREDLIST': type = 'UNORDEREDLIST';
  let list = {
    type: type,
    level: token.level,
    children: [token],
    tag: token.type == 'ORDEREDLISTITEM'? 'ol' : 'ul'
  };
  currentNode.children.push(list);
  return list;
}

/**
 * Checks if the list returns at the correct level
 */
function checkIfLevelIsCorrect(AST, currentNode, token) {
  if(currentNode.level > token.level) { // Append to parent list if exists
    let parentNode = findParentNode(AST, currentNode);
    if(parentNode.type == 'ORDEREDLISTITEM' || parentNode.type == 'UNORDEREDLISTITEM') {
      currentNode = findParentNode(AST, parentNode);
    }
  } else {
    return currentNode;
  }
  return checkIfLevelIsCorrect(AST, currentNode, token);
}

/**
 * Checks if the level of the current list and the
 * token are the same. If they aren't they either create
 * a new list or append to a parent list
 */
function checkListLevel(AST, currentNode, token) {
  if(currentNode.level < token.level) { // Create a new nested list
    currentNode = createNewList(currentNode, token);
  } else if(currentNode.level > token.level) { // Append to parent list if exists
    let parentNode = findParentNode(AST, currentNode);
    if(parentNode.type == 'ORDEREDLISTITEM' || parentNode.type == 'UNORDEREDLISTITEM') {
      currentNode = findParentNode(AST, parentNode);
    }
    currentNode = checkIfLevelIsCorrect(AST, currentNode, token);
    currentNode.children.push(token); // Else you just append to the current list
  } else { // Append to current list
    currentNode.children.push(token);
  }
  return currentNode;
}

/**
 * Either creates a new list and adds the token as a child
 * or appends the item to an existing list
 */
function addListItem(AST, currentNode, token) {
  currentNode = checkIfNotTable(AST, currentNode);
  currentNode = checkIfNotParagraph(AST, currentNode);
  if(currentNode.type == 'ORDEREDLISTITEM' || currentNode.type == 'UNORDEREDLISTITEM') {
    currentNode = findParentNode(AST, currentNode);
  }
  if(currentNode.type == 'ORDEREDLIST' || currentNode.type == 'UNORDEREDLIST') {
    currentNode = checkListLevel(AST, currentNode, token);
  } else {
    currentNode = createNewList(currentNode, token);
  }
  return currentNode;
}

/**
 * Checks if the currentNode is a NOTTABLE, if it is
 * it returns the parentnode, otherwise the currentnode
 */
function checkIfNotTable(AST, currentNode) {
  if(currentNode.type == 'NOTTABLE') {
    return findParentNode(AST, currentNode);
  }
  return currentNode;
}

function checkIfNotParagraph(AST, currentNode) {
  if(currentNode.type == 'PARAGRAPH') {
    return findParentNode(AST, currentNode);
  }
  return currentNode;
}

function createNewTable(columnLength, children) {
  return {
    type: 'TABLE',
    columnLength: columnLength,
    children: children,
    tag: 'table'
  };
}

/**
 * Once it receives a TABLE token, a new table will be generated
 * But it might also have to check if it is being appended to an
 * existing table
 */
function addTable(AST, currentNode, tokens, i) {
  currentNode = checkIfNotParagraph(AST, currentNode);
  let token = tokens[i];
  // If there is a table or not a table, just add the node
  // The reason we include nottable is because it will be easier
  // to parse if a nottable becomes a table
  if(currentNode.type == 'TABLE' || currentNode.type == 'NOTTABLE') {
    currentNode.children.push(token);
  } else {
    let undertable = tokens[i + 1];
    let firstRow = tokens[i + 2];
    if((tokens.length > (i + 1)) && undertable.type == 'UNDERTABLE' && undertable.alignment.length == token.columns.length &&
      firstRow.type == 'TABLEROW' && firstRow.columns.length == token.columns.length) {
      let table = createNewTable(token.columns.length, [token, undertable, firstRow]);
      undertable.children = undertable.children || [];
      firstRow.children = firstRow.children || [];
      currentNode.children.push(table);
      currentNode = table;
      i += 2;
    } else {
      let notTable = {
        type: 'NOTTABLE',
        children: [token]
      };
      currentNode.children.push(notTable);
      currentNode = notTable;
    }
  }

  return {currentNode, i};
}

/**
 * Returns NOTTABLE since there is no header
 */
function addUnderTable(AST, currentNode, token) {
  if(currentNode.type == 'NOTTABLE') {
    currentNode.children.push(token);
  } else {
    let notTable = {
      type: 'NOTTABLE',
      children: [token]
    };
    currentNode.children.push(notTable);
    currentNode = notTable;
  }
  return currentNode;
}

/**
 * Add all the other tokens to the AST and considers things
 * like when they are inside of a list. Or if they make the beginning
 * of a paragraph
 * You do not have to worry about the following case:
 * 1. Hello *I am Axel* because italics/bold/.. in lists and tables
 * are taken care of seperately.
 */
function addSingleLineOthers(AST, currentNode, token) {
  currentNode = checkIfNotTable(AST, currentNode);
  // In for example the case: '*Hello* I am axel\n'
  if(currentNode.type != 'PARAGRAPH') {
    currentNode = addParagraph(AST, currentNode, token); // Already takes care of lists
  } else {
    currentNode.children.push(token);
  }
  return currentNode;
}

/**
 * Considers things like when these items are nested within a list
 */
function addMultiLineOthers(AST, currentNode, token) {
  currentNode = checkIfNotTable(AST, currentNode);
  currentNode = checkIfNotParagraph(AST, currentNode);
  if(currentNode.type == 'ORDEREDLIST' || currentNode.type == 'UNORDEREDLIST') { // within a list
    currentNode = currentNode.children[currentNode.children.length - 1]; // Last item in the list
    currentNode.children.push(token);
  } else {
    currentNode.children.push(token);
  }
  return currentNode;
}

/**
 * Takes a line (or lines if a newline is added) and a subsection of the parse tree
 * and returns a new tree. Thhis 'subtree' is then replaced in the main tree
 * @param  {Array} tokens [Array of tokens]
 * @param  {Dict} AST     [Previous AST]
 * @return {Dict} AST     [Abstract syntax tree]
 */
export function parse(tokens, AST) {
  AST = AST || {type: 'MAIN', children: []};
  let currentNode = AST;

  for(let i = 0; i < tokens.length; i++) {
    let token = tokens[i];
    token.children = token.children || [];

    if(token.type.match(/^(ITALICS|BOLD|STRIKETHROUGH|LINK|IMG|CODE|SINGLECHAR)/)) {
      currentNode = addSingleLineOthers(AST, currentNode, token);
    } else if(token.type.match(/^(HEADER|HORIZONTALRULE|BLOCKQUOTE|MULTILINECODE)/)) {
      currentNode = addMultiLineOthers(AST, currentNode, token);
    } else if(token.type == 'PARTPARAGRAPH') {
      currentNode = addParagraph(AST, currentNode, token);
    } else if(token.type == 'SINGLENEWLINE') {
      currentNode = addSingleNewLine(AST, currentNode, token);
    } else if(token.type == 'LINEBREAK') {
      currentNode = addLineBreak(AST, currentNode, token);
    } else if(token.type == 'ORDEREDLISTITEM' || token.type == 'UNORDEREDLISTITEM') {
      currentNode = addListItem(AST, currentNode, token);
    } else if(token.type == 'TABLEROW') {
      let value = addTable(AST, currentNode, tokens, i);
      currentNode = value.currentNode;
      i = value.i;
    } else if(token.type == 'UNDERTABLE') {
      currentNode = addUnderTable(AST, currentNode, token);
    }
  }

  return AST;
}
