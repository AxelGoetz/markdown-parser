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
