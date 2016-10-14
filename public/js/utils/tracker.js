// TODO: Replace tab by 2 spaces

let mdtext = ['']; // Stores all of the text, every line is a new index
let position = { // Stores current position (initially 0, 0)
  row: 0,        // NOTE: The index of the current char is (row - 1, column - 1)
  column: 0
};

function strSlice(str, index, count, add) {
  // We cannot pass negative indexes dirrectly to the 2nd slicing operation.
  if (index < 0) {
    index = str.length + index;
    if (index < 0) {
      index = 0;
    }
  }

  return str.slice(0, index) + (add || "") + str.slice(index + count);
}

/**
 * Filters out any non visible characters
 * Except for:
 * - Backspace
 */
function filterOutNonVisbles(event) {
  let code = event.keyCode;
  let isNotValid = (code > 15 && code < 32) || // Shift, ctrl, alt,...
    (code > 32 && code < 41) ||
    code == 45 || code == 46 ||                // Insert, delete
    (code > 90 && code < 94) ||                // Left window,...
    (code > 111 && code < 124) ||                // f keys
    code == 144 || code == 145;                // Num lock and scroll lock

  return !isNotValid;
}

function getCaretCharacterOffsetWithin(element) {
  let doc = element.ownerDocument || element.document;
  let win = doc.defaultView || doc.parentWindow;
  let row = 0;
  let sel;
  if (typeof win.getSelection != "undefined") {
    sel = win.getSelection();
    if (sel.rangeCount > 0) {
      let range = win.getSelection().getRangeAt(0);
      let preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(element);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      row = preCaretRange.toString().split('\n').length - 1;
    }
  } else if ( (sel = doc.selection) && sel.type != "Control") {
    var textRange = sel.createRange();
    var preCaretTextRange = doc.body.createTextRange();
    preCaretTextRange.moveToElementText(element);
    preCaretTextRange.setEndPoint("EndToEnd", textRange);
    row = preCaretTextRange.text.split('\n').length - 1;
  }
  return row;
}

function insertTextAtCursor(text) {
  var sel, range, html;
  if (window.getSelection) {
    sel = window.getSelection();
    if (sel.getRangeAt && sel.rangeCount) {
      range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode( document.createTextNode(text) );
    }
  } else if (document.selection && document.selection.createRange) {
    document.selection.createRange().text = text;
  }
}

function moveCaret(win, charCount) {
    var sel, range;
    if (win.getSelection) {
        sel = win.getSelection();
        if (sel.rangeCount) {
            var textNode = sel.focusNode;
            var newOffset = sel.focusOffset + charCount;
            sel.collapse(textNode, Math.min(textNode.length, newOffset));
        }
    } else if ( (sel = win.document.selection) ) {
        if (sel.type != "Control") {
            range = sel.createRange();
            range.move("character", charCount);
            range.select();
        }
    }
}

// TODO: Replace a tab with 2 spaces (Yes, SPACES :-))
function tab() {
  insertTextAtCursor('  ');
  moveCaret(window, 2);
}

/**
 * Registers all of the keydown events
 * @param  {String} id
 */
export function getKeyDowns(id) {
  let el = document.getElementById(id);
  el.addEventListener('keydown', (event) => {
    if(event.keyCode == 9) {  // Tab
       tab();
       event.preventDefault();
    }
  });
  el.addEventListener('keyup', (event) => {
    if(filterOutNonVisbles(event)) {
      let test = getCaretCharacterOffsetWithin(document.getElementById('content'));
      console.log(test);
    }
  });
}
