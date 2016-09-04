import _ from 'lodash';
/**
 * The AST maintains a very similar structure to the tokens,
 * instead 1 key is added: 'children', which is an array of tokens that
 * lists the children from left to right.
 *
 * For instance the following text: '# Hello\nI am *Axel*\n'
 * {type: 'MAIN',
 * children: [{
 *  type: 'HEADER',
 *  level: 1,
 *  text: 'Hello',
 *  children: []
 *  }, {
 *  type: 'PARAGRAPH',
 *  children: [{
 *    type: 'PARTPARAGRAPH',
 *    text: 'I am ',
 *    children: []
 *  }, {
 *    type: 'ITALICS',
 *    text: 'Axel',
 *    children: []
 *   }
 *  ]}
 * ]}
 */

/**
 * Finds the parent node of the currentNode
 * @param  {Dict} AST         [Part of the AST that still needs to be examined]
 * @param  {Dict} currentNode [Looks for parent of this node]
 * @return {Dict} AST         [Parent node]
 */
function findParentNode(AST, currentNode) {
  for(let i = 0; i < AST.children.length; i++) {
    let child = AST.children[i];
    if(child == currentNode) {
      return AST;
    }
    let childSearch = findParentNode(child, currentNode);
    if(childSearch !== null) return childSearch;
  }
  return null;
}

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

/**
 * Adds a partparagraph to the AST by either starting
 * a new parapgraph or appending to the current one
 * @param  {Dict} currentNode [Node in the AST]
 * @param  {Dict} token       [Token that is being added]
 * @return {Dict} currentNode
 */
function addParagraph(currentNode, token) {
  if(currentNode.type == 'PARAGRAPH') {
    currentNode.children.push(token);
  } else {
    let paragraph = {
      type: 'PARAGRAPH',
      children: [token]
    };
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
  if(currentNode.type == 'PARAGRAPH' || currentNode.type == 'TABLE') {
    currentNode = findParentNode(AST, currentNode); // Stop paragraph or table
  } else {
    currentNode.children.push(token);
  }
  return currentNode;
}

function addLineBreak(AST, currentNode, token) {
  if(currentNode.type == 'PARAGRAPH' || currentNode.type == 'TABLE' || currentNode.type == 'LIST') {
    currentNode = findParentNode(AST, currentNode); // Stop paragraph, table or list
  } else {
    currentNode.children.push(token);
  }
  return currentNode;
}

/**
 * Creates a new list node
 */
function createNewList(currentNode, token) {
  let type;
  token.type == 'ORDEREDLISTITEM'? type = 'ORDEREDLIST': type = 'UNORDEREDLIST';
  let list = {
    type: type,
    level: token.level,
    children: [token]
  };
  currentNode.children.push(list);
  return list;
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
    if(parentNode.type == 'ORDEREDLIST' || parentNode.type == 'UNORDEREDLIST') {
      currentNode = parentNode;
    }
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
  if(currentNode.type == 'ORDEREDLIST' || currentNode.type == 'UNORDEREDLIST') {
    currentNode = checkListLevel(AST, currentNode, token);
  } else {
    currentNode = createNewList(currentNode, token);
  }
  return currentNode;
}

/**
 * If the currentNode is a TABLE but either the length
 * of the columns do not match or if there is no undertable,
 * the table element needs to be removed and they need to be turned into a NOTTABLE
 */
function notATable(AST, currentNode, token) {
  parent = findParentNode(AST, currentNode);
  let notTable = {
    type: 'NOTTABLE',
    children: _.flatten([currentNode.children, token])
  };
  parent = replaceNode(parent, currentNode, notTable);
  return notTable;
}

/**
 * Once it receives a TABLE token, a new table will be generated
 * But it might also have to check if it is being appended to an
 * existing table
 */
function addTable(AST, currentNode, token) {
  if(currentNode.type == 'TABLE') {
    // Check if it has the same amount of columns and an undertable
    if(currentNode.columnLength == token.columns.length && currentNode.underTable) {
      currentNode.children.push(token);
    } else {
      currentNode = notATable(AST, currentNode, token);
    }
  } else { // Create a new table
    let table = {
      type: 'TABLE',
      columnLength: token.columns.length,
      children: [token],
      underTable: false
    };
    currentNode.children.push(table);
    currentNode = table;
  }
  return currentNode;
}

/**
 * Checks if the currentNode is a table token and if it has
 * the correct amount of columns.
 */
function addUnderTable(AST, currentNode, token) {
  if(currentNode.type == 'TABLE') {
    if(!currentNode.underTable && currentNode.columnLength == token.alignment.length) {
    currentNode.underTable = true;
    currentNode.children.push(token);
    } else {
      currentNode = notATable(AST, currentNode, token);
    }
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

    if(token.type.match(/HEADER|HORIZONTALRULE|ITALICS|BOLD|STRIKETHROUGH|LINK|IMG|CODE|BLOCKQUOTE|MULTILINECODE|SINGLECHAR/)) {
      currentNode.children.push(token);
    } else if(token.type == 'PARTPARAGRAPH') {
      currentNode = addParagraph(currentNode, token);
    } else if(token.type == 'SINGLENEWLINE') {
      currentNode = addSingleNewLine(AST, currentNode, token);
    } else if(token.type == 'LINEBREAK') {
      currentNode = addLineBreak(AST, currentNode, token);
    } else if(token.type == 'ORDEREDLISTITEM' || token.type == 'UNORDEREDLISTITEM') {
      currentNode = addListItem(AST, currentNode, token);
    } else if(token.type == 'TABLEROW') {
      currentNode = addTable(AST, currentNode, token);
    } else if(token.type == 'UNDERTABLE') {
      currentNode = addUnderTable(AST, currentNode, token);
    }
  }
  return AST;
}
