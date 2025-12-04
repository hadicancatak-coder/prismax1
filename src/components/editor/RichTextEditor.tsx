import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';
import { setGlobalActiveEditor, clearGlobalActiveEditor } from './GlobalBubbleMenu';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minHeight?: string;
  autoFocus?: boolean;
  onBlur?: () => void;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start typing...',
  className,
  disabled = false,
  minHeight = '80px',
  autoFocus = false,
  onBlur,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer hover:text-primary/80',
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Color,
      TextStyle,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || '',
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onBlur: () => {
      onBlur?.();
    },
      editorProps: {
        attributes: {
          class: cn(
            'prose prose-sm max-w-none focus:outline-none min-h-[80px]',
            'prose-headings:font-semibold prose-headings:text-foreground',
            'prose-p:text-foreground prose-p:my-2 prose-p:break-words',
            'prose-strong:text-foreground prose-strong:font-bold',
            'prose-em:text-foreground prose-em:italic',
            'prose-ul:list-disc prose-ul:pl-4 prose-ul:text-foreground',
            'prose-ol:list-decimal prose-ol:pl-4 prose-ol:text-foreground',
            'prose-li:text-foreground prose-li:break-words',
            'prose-a:text-primary prose-a:underline prose-a:cursor-pointer hover:prose-a:text-primary/80 prose-a:break-all',
            '[&_p.is-editor-empty:first-child]:before:content-[attr(data-placeholder)]',
            '[&_p.is-editor-empty:first-child]:before:text-muted-foreground',
            '[&_p.is-editor-empty:first-child]:before:float-left',
            '[&_p.is-editor-empty:first-child]:before:pointer-events-none',
            '[&_p.is-editor-empty:first-child]:before:h-0',
            'break-words overflow-wrap-anywhere',
          ),
        },
      },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value, editor]);

  useEffect(() => {
    if (editor && autoFocus) {
      editor.commands.focus();
    }
  }, [editor, autoFocus]);

  // Register with global bubble menu
  useEffect(() => {
    if (!editor || disabled) return;

    const handleFocus = () => setGlobalActiveEditor(editor);
    const handleBlur = () => {
      // Increased delay to allow bubble menu interaction
      setTimeout(() => {
        const activeElement = document.activeElement;
        // Check for bubble menu, popovers, dialogs
        const isBubbleMenu = activeElement?.closest('[class*="bubble"]');
        const isPopover = activeElement?.closest('[data-radix-popper-content-wrapper]');
        const isDialog = activeElement?.closest('[role="dialog"]');
        const isEditorElement = activeElement?.closest('.ProseMirror');
        
        if (!isBubbleMenu && !isPopover && !isDialog && !isEditorElement) {
          clearGlobalActiveEditor(editor);
        }
      }, 300);
    };

    editor.on('focus', handleFocus);
    editor.on('blur', handleBlur);

    return () => {
      editor.off('focus', handleFocus);
      editor.off('blur', handleBlur);
      clearGlobalActiveEditor(editor);
    };
  }, [editor, disabled]);

  if (!editor) {
    return null;
  }

  return (
    <div className={cn('border border-input rounded-md bg-background', className)}>
      <div
        className="px-3 py-2"
        style={{ minHeight }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
