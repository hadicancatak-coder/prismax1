import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Link as LinkIcon,
  Palette,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EditorLinkDialog } from './EditorLinkDialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

const COLORS = [
  { name: 'Default', value: '' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Pink', value: '#ec4899' },
];

interface Position {
  top: number;
  left: number;
  isBelow: boolean;
}

// Singleton state
let globalActiveEditor: any = null;
let globalUpdateCallback: (() => void) | null = null;

export function setGlobalActiveEditor(editor: any) {
  globalActiveEditor = editor;
  globalUpdateCallback?.();
}

export function clearGlobalActiveEditor(editor: any) {
  if (globalActiveEditor === editor) {
    globalActiveEditor = null;
    globalUpdateCallback?.();
  }
}

// Find nearest scroll container
function findScrollParent(element: HTMLElement | null): HTMLElement {
  if (!element) return document.documentElement;
  
  let parent = element.parentElement;
  while (parent) {
    const overflowY = window.getComputedStyle(parent).overflowY;
    const overflowX = window.getComputedStyle(parent).overflowX;
    if (
      (overflowY === 'auto' || overflowY === 'scroll' || overflowX === 'auto' || overflowX === 'scroll') &&
      parent.scrollHeight > parent.clientHeight
    ) {
      return parent;
    }
    parent = parent.parentElement;
  }
  return document.documentElement;
}

export function GlobalBubbleMenu() {
  const [show, setShow] = useState(false);
  const [position, setPosition] = useState<Position>({ top: 0, left: 0, isBelow: false });
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [colorPopoverOpen, setColorPopoverOpen] = useState(false);
  const [activeEditor, setActiveEditor] = useState<any>(null);
  
  const bubbleRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout>();
  const scrollTimerRef = useRef<NodeJS.Timeout>();

  // Register update callback
  useEffect(() => {
    globalUpdateCallback = () => setActiveEditor(globalActiveEditor);
    return () => {
      globalUpdateCallback = null;
    };
  }, []);

  const updatePosition = useCallback(() => {
    if (!activeEditor) {
      setShow(false);
      return;
    }

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
      setShow(false);
      return;
    }

    // Check if selection is inside an editor
    const anchorNode = selection.anchorNode;
    if (!anchorNode) {
      setShow(false);
      return;
    }

    const editorElement = (anchorNode as HTMLElement).closest?.('.ProseMirror') || 
                          (anchorNode.parentElement?.closest?.('.ProseMirror'));
    
    if (!editorElement) {
      setShow(false);
      return;
    }

    try {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      if (rect.width === 0 && rect.height === 0) {
        setShow(false);
        return;
      }

      // Find scroll container
      const scrollParent = findScrollParent(editorElement as HTMLElement);
      const scrollRect = scrollParent === document.documentElement 
        ? { top: 0, left: 0, bottom: window.innerHeight, right: window.innerWidth }
        : scrollParent.getBoundingClientRect();

      // Calculate center of selection
      const selectionCenterX = rect.left + rect.width / 2;
      const selectionTop = rect.top;
      const selectionBottom = rect.bottom;

      // Bubble dimensions (approximate)
      const bubbleHeight = 44;
      const bubbleWidth = 300;
      const offset = 8;

      // Try positioning above first
      let top = selectionTop - bubbleHeight - offset;
      let isBelow = false;

      // If not enough space above, position below
      if (top < scrollRect.top) {
        top = selectionBottom + offset;
        isBelow = true;
      }

      // Horizontal centering with boundary constraints
      let left = selectionCenterX - bubbleWidth / 2;
      
      // Constrain within viewport
      if (left < 20) left = 20;
      if (left + bubbleWidth > window.innerWidth - 20) {
        left = window.innerWidth - bubbleWidth - 20;
      }

      // Check if selection is visible in scroll container
      if (
        rect.bottom < scrollRect.top ||
        rect.top > scrollRect.bottom ||
        rect.right < scrollRect.left ||
        rect.left > scrollRect.right
      ) {
        setShow(false);
        return;
      }

      setPosition({ top, left, isBelow });
      setShow(true);
    } catch (error) {
      console.error('Error positioning bubble menu:', error);
      setShow(false);
    }
  }, [activeEditor]);

  // Debounced update on selection change
  useEffect(() => {
    const handleSelectionChange = () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      debounceTimerRef.current = setTimeout(() => {
        updatePosition();
      }, 100);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [updatePosition]);

  // Handle scroll - hide during scroll, reposition after
  useEffect(() => {
    const handleScroll = () => {
      setShow(false);
      
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
      
      scrollTimerRef.current = setTimeout(() => {
        updatePosition();
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
    };
  }, [updatePosition]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (show) {
        updatePosition();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [show, updatePosition]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && show) {
        setShow(false);
        setColorPopoverOpen(false);
        setLinkDialogOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [show]);

  // Update when editor changes
  useEffect(() => {
    if (activeEditor) {
      const handleUpdate = () => updatePosition();
      activeEditor.on('transaction', handleUpdate);
      activeEditor.on('focus', handleUpdate);
      activeEditor.on('blur', () => {
        // Delay hide to allow clicking bubble menu buttons
        setTimeout(() => {
          if (!bubbleRef.current?.contains(document.activeElement)) {
            setShow(false);
          }
        }, 100);
      });

      return () => {
        activeEditor.off('transaction', handleUpdate);
        activeEditor.off('focus', handleUpdate);
        activeEditor.off('blur');
      };
    }
  }, [activeEditor, updatePosition]);

  const handleLinkClick = () => {
    if (!activeEditor) return;
    
    const previousUrl = activeEditor.getAttributes('link').href;
    if (previousUrl) {
      activeEditor.chain().focus().unsetLink().run();
    } else {
      setLinkDialogOpen(true);
    }
  };

  const handleSetLink = (url: string) => {
    if (!activeEditor) return;
    
    if (url) {
      activeEditor
        .chain()
        .focus()
        .extendMarkRange('link')
        .setLink({ href: url })
        .run();
    }
  };

  const handleColorChange = (color: string) => {
    if (!activeEditor) return;
    
    if (color) {
      activeEditor.chain().focus().setColor(color).run();
    } else {
      activeEditor.chain().focus().unsetColor().run();
    }
    setColorPopoverOpen(false);
  };

  const BubbleButton = ({
    onClick,
    isActive = false,
    children,
    title,
  }: {
    onClick: () => void;
    isActive?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        'h-8 w-8 p-0',
        isActive && 'bg-accent text-accent-foreground'
      )}
      title={title}
    >
      {children}
    </Button>
  );

  if (!show || !activeEditor) return null;

  return (
    <>
      <div
        ref={bubbleRef}
        className="fixed z-[100] flex items-center gap-1 p-1 bg-popover border border-border rounded-lg shadow-lg"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
      >
        <BubbleButton
          onClick={() => activeEditor.chain().focus().toggleBold().run()}
          isActive={activeEditor.isActive('bold')}
          title="Bold (Ctrl+B)"
        >
          <Bold className="h-4 w-4" />
        </BubbleButton>

        <BubbleButton
          onClick={() => activeEditor.chain().focus().toggleItalic().run()}
          isActive={activeEditor.isActive('italic')}
          title="Italic (Ctrl+I)"
        >
          <Italic className="h-4 w-4" />
        </BubbleButton>

        <BubbleButton
          onClick={() => activeEditor.chain().focus().toggleUnderline().run()}
          isActive={activeEditor.isActive('underline')}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="h-4 w-4" />
        </BubbleButton>

        <BubbleButton
          onClick={() => activeEditor.chain().focus().toggleStrike().run()}
          isActive={activeEditor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough className="h-4 w-4" />
        </BubbleButton>

        <div className="w-px h-6 bg-border mx-1" />

        <BubbleButton
          onClick={handleLinkClick}
          isActive={activeEditor.isActive('link')}
          title={activeEditor.isActive('link') ? 'Remove Link' : 'Add Link (Ctrl+K)'}
        >
          <LinkIcon className="h-4 w-4" />
        </BubbleButton>

        <Popover open={colorPopoverOpen} onOpenChange={setColorPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              title="Text Color"
            >
              <Palette className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2" align="center">
            <div className="grid grid-cols-4 gap-1">
              {COLORS.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => handleColorChange(color.value)}
                  className={cn(
                    'h-8 w-8 rounded border border-border hover:scale-110 transition-transform',
                    !color.value && 'bg-background'
                  )}
                  style={{ backgroundColor: color.value || 'transparent' }}
                  title={color.name}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <EditorLinkDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        onSave={handleSetLink}
        initialUrl={activeEditor.getAttributes('link').href || ''}
      />
    </>
  );
}
