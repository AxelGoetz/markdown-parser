/**
 * Finds the parent node of the currentNode
 * @param  {Dict} AST         [Part of the AST that still needs to be examined]
 * @param  {Dict} currentNode [Looks for parent of this node]
 * @return {Dict} AST         [Parent node]
 */
export function findParentNode(AST, currentNode) {
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

export function escapeHTML( text ) {
  if (text && text.length > 0) {
    return text.replace( /&/g, "&amp;" )
               .replace( /</g, "&lt;" )
               .replace( />/g, "&gt;" )
               .replace( /"/g, "&quot;" )
               .replace( /'/g, "&#39;" );
  } else {
    return "";
  }
}

export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}

/**
 * Performs depth first search and adds (or subtracts)
 * the specified amount from the line
 * @param {AST} ast         [The abstract syntax tree, generated by the parser]
 * @param {Function} op     [Binary operation (add or subtract)]
 * @param {Int} amount      [Amount to add/subtract]
 * @param {Int} line        [The line after which you start the operation]
 */
export function updateTokens(ast, op, amount, line) {
  // If ast.line == line, you also need to add
  for(let i = 0; i < ast.children.length; i++) {
    if(ast.children[i].line >= line) {
      ast.children[i].line = op(ast.children[i].line, amount);
    }
    updateTokens(ast.children[i], op, amount, line);
  }
}
