import { useEffect, useCallback } from 'react';
import { SPREADSHEET_SHORTCUTS, matchesShortcut } from '@/lib/keyboardShortcuts';

interface SpreadsheetKeyboardHandlers {
  onNavigate?: (direction: 'up' | 'down' | 'left' | 'right', jump?: boolean) => void;
  onSelect?: (direction: 'up' | 'down' | 'left' | 'right', extend?: boolean, jump?: boolean) => void;
  onSelectAll?: () => void;
  onSelectRow?: () => void;
  onSelectColumn?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onBackspace?: () => void;
  onEnter?: (shiftKey: boolean) => void;
  onEscape?: () => void;
  onTab?: (shiftKey: boolean) => void;
  onBold?: () => void;
  onItalic?: () => void;
  onUnderline?: () => void;
  onSave?: () => void;
  onOpen?: () => void;
  onNew?: () => void;
  onCopy?: () => void;
  onCut?: () => void;
  onPaste?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onFind?: () => void;
  onFindReplace?: () => void;
  onAutoSum?: () => void;
  onToggleFormulas?: () => void;
  onHome?: (ctrl?: boolean) => void;
  onEnd?: () => void;
  onPageUp?: () => void;
  onPageDown?: () => void;
}

export function useSpreadsheetKeyboard(handlers: SpreadsheetKeyboardHandlers) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Check if we're in an input field (except grid cells)
    const target = event.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
    const isContentEditable = target.isContentEditable;
    
    // Allow normal input behavior in form fields
    if ((isInput || isContentEditable) && !target.classList.contains('rdg-cell')) {
      // Only prevent default for specific shortcuts in input fields
      if (event.ctrlKey || event.metaKey) {
        const key = event.key.toLowerCase();
        if (['s', 'o', 'n', 'p'].includes(key)) {
          event.preventDefault();
        }
      }
      return;
    }

    // Navigation
    if (event.key.startsWith('Arrow')) {
      event.preventDefault();
      const direction = event.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right';
      
      if (event.shiftKey && handlers.onSelect) {
        handlers.onSelect(direction, true, event.ctrlKey || event.metaKey);
      } else if (handlers.onNavigate) {
        handlers.onNavigate(direction, event.ctrlKey || event.metaKey);
      }
      return;
    }

    // Tab navigation
    if (event.key === 'Tab' && handlers.onTab) {
      event.preventDefault();
      handlers.onTab(event.shiftKey);
      return;
    }

    // Home/End
    if (event.key === 'Home' && handlers.onHome) {
      event.preventDefault();
      handlers.onHome(event.ctrlKey || event.metaKey);
      return;
    }
    if (event.key === 'End' && handlers.onEnd) {
      event.preventDefault();
      handlers.onEnd();
      return;
    }

    // Page Up/Down
    if (event.key === 'PageUp' && handlers.onPageUp) {
      event.preventDefault();
      handlers.onPageUp();
      return;
    }
    if (event.key === 'PageDown' && handlers.onPageDown) {
      event.preventDefault();
      handlers.onPageDown();
      return;
    }

    // Editing
    if (event.key === 'F2' && handlers.onEdit) {
      event.preventDefault();
      handlers.onEdit();
      return;
    }
    if (event.key === 'Delete' && handlers.onDelete) {
      event.preventDefault();
      handlers.onDelete();
      return;
    }
    if (event.key === 'Backspace' && handlers.onBackspace) {
      event.preventDefault();
      handlers.onBackspace();
      return;
    }
    if (event.key === 'Enter' && handlers.onEnter) {
      event.preventDefault();
      handlers.onEnter(event.shiftKey);
      return;
    }
    if (event.key === 'Escape' && handlers.onEscape) {
      event.preventDefault();
      handlers.onEscape();
      return;
    }

    // Ctrl/Cmd shortcuts
    if (event.ctrlKey || event.metaKey) {
      const key = event.key.toLowerCase();
      
      // Selection
      if (key === 'a' && handlers.onSelectAll) {
        event.preventDefault();
        handlers.onSelectAll();
        return;
      }
      
      // Formatting
      if (key === 'b' && handlers.onBold) {
        event.preventDefault();
        handlers.onBold();
        return;
      }
      if (key === 'i' && handlers.onItalic) {
        event.preventDefault();
        handlers.onItalic();
        return;
      }
      if (key === 'u' && handlers.onUnderline) {
        event.preventDefault();
        handlers.onUnderline();
        return;
      }
      
      // File operations
      if (key === 's' && handlers.onSave) {
        event.preventDefault();
        handlers.onSave();
        return;
      }
      if (key === 'o' && handlers.onOpen) {
        event.preventDefault();
        handlers.onOpen();
        return;
      }
      if (key === 'n' && handlers.onNew) {
        event.preventDefault();
        handlers.onNew();
        return;
      }
      
      // Data operations
      if (key === 'c' && handlers.onCopy) {
        event.preventDefault();
        handlers.onCopy();
        return;
      }
      if (key === 'x' && handlers.onCut) {
        event.preventDefault();
        handlers.onCut();
        return;
      }
      if (key === 'v' && handlers.onPaste) {
        event.preventDefault();
        handlers.onPaste();
        return;
      }
      if (key === 'z' && !event.shiftKey && handlers.onUndo) {
        event.preventDefault();
        handlers.onUndo();
        return;
      }
      if ((key === 'y' || (key === 'z' && event.shiftKey)) && handlers.onRedo) {
        event.preventDefault();
        handlers.onRedo();
        return;
      }
      if (key === 'f' && handlers.onFind) {
        event.preventDefault();
        handlers.onFind();
        return;
      }
      if (key === 'h' && handlers.onFindReplace) {
        event.preventDefault();
        handlers.onFindReplace();
        return;
      }
      if (key === '`' && handlers.onToggleFormulas) {
        event.preventDefault();
        handlers.onToggleFormulas();
        return;
      }
    }

    // Alt shortcuts
    if (event.altKey) {
      if (event.key === '=' && handlers.onAutoSum) {
        event.preventDefault();
        handlers.onAutoSum();
        return;
      }
    }

    // Shift + Space for row selection
    if (event.shiftKey && event.key === ' ' && handlers.onSelectRow) {
      event.preventDefault();
      handlers.onSelectRow();
      return;
    }

    // Ctrl + Space for column selection
    if ((event.ctrlKey || event.metaKey) && event.key === ' ' && handlers.onSelectColumn) {
      event.preventDefault();
      handlers.onSelectColumn();
      return;
    }
  }, [handlers]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { shortcuts: SPREADSHEET_SHORTCUTS };
}
