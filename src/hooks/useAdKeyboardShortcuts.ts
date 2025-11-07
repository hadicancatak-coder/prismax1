import { useEffect } from "react";

interface KeyboardShortcutHandlers {
  onSave?: () => void;
  onNew?: () => void;
  onCancel?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onSubmitForApproval?: () => void;
}

export function useAdKeyboardShortcuts(handlers: KeyboardShortcutHandlers) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + S - Save
      if (modifier && e.key === "s") {
        e.preventDefault();
        handlers.onSave?.();
        return;
      }

      // Ctrl/Cmd + N - New ad
      if (modifier && e.key === "n") {
        e.preventDefault();
        handlers.onNew?.();
        return;
      }

      // Escape - Cancel
      if (e.key === "Escape") {
        e.preventDefault();
        handlers.onCancel?.();
        return;
      }

      // Arrow Up - Previous ad
      if (e.key === "ArrowUp" && !e.shiftKey && !modifier) {
        const activeElement = document.activeElement;
        // Only trigger if not in an input/textarea
        if (
          activeElement?.tagName !== "INPUT" &&
          activeElement?.tagName !== "TEXTAREA"
        ) {
          e.preventDefault();
          handlers.onPrevious?.();
        }
        return;
      }

      // Arrow Down - Next ad
      if (e.key === "ArrowDown" && !e.shiftKey && !modifier) {
        const activeElement = document.activeElement;
        // Only trigger if not in an input/textarea
        if (
          activeElement?.tagName !== "INPUT" &&
          activeElement?.tagName !== "TEXTAREA"
        ) {
          e.preventDefault();
          handlers.onNext?.();
        }
        return;
      }

      // Ctrl/Cmd + Enter - Submit for approval
      if (modifier && e.key === "Enter") {
        e.preventDefault();
        handlers.onSubmitForApproval?.();
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlers]);
}
