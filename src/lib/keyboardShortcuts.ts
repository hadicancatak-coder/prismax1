export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  category: 'navigation' | 'selection' | 'editing' | 'formatting' | 'file' | 'data';
}

export const SPREADSHEET_SHORTCUTS: KeyboardShortcut[] = [
  // Navigation
  { key: 'ArrowUp', description: 'Move up one cell', category: 'navigation' },
  { key: 'ArrowDown', description: 'Move down one cell', category: 'navigation' },
  { key: 'ArrowLeft', description: 'Move left one cell', category: 'navigation' },
  { key: 'ArrowRight', description: 'Move right one cell', category: 'navigation' },
  { key: 'ArrowUp', ctrl: true, description: 'Jump to top of data region', category: 'navigation' },
  { key: 'ArrowDown', ctrl: true, description: 'Jump to bottom of data region', category: 'navigation' },
  { key: 'ArrowLeft', ctrl: true, description: 'Jump to left edge of data region', category: 'navigation' },
  { key: 'ArrowRight', ctrl: true, description: 'Jump to right edge of data region', category: 'navigation' },
  { key: 'Home', description: 'Go to column A', category: 'navigation' },
  { key: 'Home', ctrl: true, description: 'Go to cell A1', category: 'navigation' },
  { key: 'End', description: 'Go to last column with data', category: 'navigation' },
  { key: 'PageUp', description: 'Scroll up one screen', category: 'navigation' },
  { key: 'PageDown', description: 'Scroll down one screen', category: 'navigation' },
  { key: 'Tab', description: 'Move right one cell', category: 'navigation' },
  { key: 'Tab', shift: true, description: 'Move left one cell', category: 'navigation' },

  // Selection
  { key: 'ArrowUp', shift: true, description: 'Extend selection up', category: 'selection' },
  { key: 'ArrowDown', shift: true, description: 'Extend selection down', category: 'selection' },
  { key: 'ArrowLeft', shift: true, description: 'Extend selection left', category: 'selection' },
  { key: 'ArrowRight', shift: true, description: 'Extend selection right', category: 'selection' },
  { key: 'ArrowUp', ctrl: true, shift: true, description: 'Select to top edge', category: 'selection' },
  { key: 'ArrowDown', ctrl: true, shift: true, description: 'Select to bottom edge', category: 'selection' },
  { key: 'ArrowLeft', ctrl: true, shift: true, description: 'Select to left edge', category: 'selection' },
  { key: 'ArrowRight', ctrl: true, shift: true, description: 'Select to right edge', category: 'selection' },
  { key: 'a', ctrl: true, description: 'Select all cells', category: 'selection' },
  { key: ' ', ctrl: true, description: 'Select entire column', category: 'selection' },
  { key: ' ', shift: true, description: 'Select entire row', category: 'selection' },

  // Editing
  { key: 'F2', description: 'Edit current cell', category: 'editing' },
  { key: 'Delete', description: 'Clear cell contents', category: 'editing' },
  { key: 'Backspace', description: 'Clear and start editing', category: 'editing' },
  { key: 'Enter', description: 'Confirm and move down', category: 'editing' },
  { key: 'Enter', shift: true, description: 'Confirm and move up', category: 'editing' },
  { key: 'Escape', description: 'Cancel editing', category: 'editing' },

  // Formatting
  { key: 'b', ctrl: true, description: 'Toggle bold', category: 'formatting' },
  { key: 'i', ctrl: true, description: 'Toggle italic', category: 'formatting' },
  { key: 'u', ctrl: true, description: 'Toggle underline', category: 'formatting' },

  // File Operations
  { key: 's', ctrl: true, description: 'Save spreadsheet', category: 'file' },
  { key: 'o', ctrl: true, description: 'Open spreadsheet', category: 'file' },
  { key: 'n', ctrl: true, description: 'New spreadsheet', category: 'file' },
  { key: 'p', ctrl: true, description: 'Print', category: 'file' },

  // Data Operations
  { key: 'c', ctrl: true, description: 'Copy', category: 'data' },
  { key: 'x', ctrl: true, description: 'Cut', category: 'data' },
  { key: 'v', ctrl: true, description: 'Paste', category: 'data' },
  { key: 'z', ctrl: true, description: 'Undo', category: 'data' },
  { key: 'y', ctrl: true, description: 'Redo', category: 'data' },
  { key: 'z', ctrl: true, shift: true, description: 'Redo', category: 'data' },
  { key: 'f', ctrl: true, description: 'Find', category: 'data' },
  { key: 'h', ctrl: true, description: 'Find & Replace', category: 'data' },
  { key: '=', alt: true, description: 'Auto-sum', category: 'data' },
  { key: '`', ctrl: true, description: 'Toggle formula view', category: 'data' },
];

export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: KeyboardShortcut
): boolean {
  const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey;
  const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
  const altMatch = shortcut.alt ? event.altKey : !event.altKey;
  const metaMatch = shortcut.meta ? event.metaKey : true; // meta is optional

  return (
    event.key === shortcut.key &&
    ctrlMatch &&
    shiftMatch &&
    altMatch &&
    metaMatch
  );
}
