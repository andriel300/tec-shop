'use client';

import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Undo,
  Redo,
  Heading2,
} from 'lucide-react';

export interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  minWords?: number;
  maxWords?: number;
  className?: string;
}

/**
 * RichTextEditor Component
 * WYSIWYG editor for product descriptions with word count
 *
 * @example
 * <RichTextEditor
 *   value={description}
 *   onChange={setDescription}
 *   placeholder="Describe your product..."
 *   minWords={50}
 *   maxWords={200}
 * />
 */
const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  onBlur,
  placeholder = 'Enter product description...',
  minWords = 50,
  maxWords = 200,
  className = '',
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html);
    },
    onBlur: () => {
      onBlur?.();
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[150px] px-4 py-3',
      },
    },
    immediatelyRender: false,
  });

  // Safely update editor content on value change
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', false);
    }
  }, [value, editor]);

  // Calculate word count
  const wordCount = editor?.getText().split(/\s+/).filter(Boolean).length || 0;
  const isUnderMin = wordCount < minWords;
  const isOverMax = wordCount > maxWords;

  return (
    <div
      className={`border border-surface-container-highest rounded-lg bg-surface-container overflow-hidden ${className}`}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-surface-container-highest bg-surface-container-low">
        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBold().run()}
          disabled={!editor?.can().chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-surface-container-highest transition-colors ${
            editor?.isActive('bold')
              ? 'bg-surface-container-highest text-brand-primary-600'
              : 'text-gray-500'
          }`}
          title="Bold"
        >
          <Bold size={18} />
        </button>

        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          disabled={!editor?.can().chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-surface-container-highest transition-colors ${
            editor?.isActive('italic')
              ? 'bg-surface-container-highest text-brand-primary-600'
              : 'text-gray-500'
          }`}
          title="Italic"
        >
          <Italic size={18} />
        </button>

        <button
          type="button"
          onClick={() =>
            editor?.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={`p-2 rounded hover:bg-surface-container-highest transition-colors ${
            editor?.isActive('heading', { level: 2 })
              ? 'bg-surface-container-highest text-brand-primary-600'
              : 'text-gray-500'
          }`}
          title="Heading"
        >
          <Heading2 size={18} />
        </button>

        <div className="w-px h-6 bg-surface-container-highest mx-1" />

        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-surface-container-highest transition-colors ${
            editor?.isActive('bulletList')
              ? 'bg-surface-container-highest text-brand-primary-600'
              : 'text-gray-500'
          }`}
          title="Bullet List"
        >
          <List size={18} />
        </button>

        <button
          type="button"
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-surface-container-highest transition-colors ${
            editor?.isActive('orderedList')
              ? 'bg-surface-container-highest text-brand-primary-600'
              : 'text-gray-500'
          }`}
          title="Numbered List"
        >
          <ListOrdered size={18} />
        </button>

        <div className="w-px h-6 bg-surface-container-highest mx-1" />

        <button
          type="button"
          onClick={() => editor?.chain().focus().undo().run()}
          disabled={!editor?.can().chain().focus().undo().run()}
          className="p-2 rounded hover:bg-surface-container-highest transition-colors text-gray-500 disabled:opacity-30"
          title="Undo"
        >
          <Undo size={18} />
        </button>

        <button
          type="button"
          onClick={() => editor?.chain().focus().redo().run()}
          disabled={!editor?.can().chain().focus().redo().run()}
          className="p-2 rounded hover:bg-surface-container-highest transition-colors text-gray-500 disabled:opacity-30"
          title="Redo"
        >
          <Redo size={18} />
        </button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />

      {/* Word Count Footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-surface-container-highest bg-surface-container-low text-xs">
        <span className="text-gray-500">
          {minWords} - {maxWords} words recommended
        </span>
        <span
          className={`font-medium ${
            isUnderMin
              ? 'text-feedback-warning'
              : isOverMax
              ? 'text-feedback-error'
              : 'text-feedback-success'
          }`}
        >
          {wordCount} words
        </span>
      </div>
    </div>
  );
};

RichTextEditor.displayName = 'RichTextEditor';

export { RichTextEditor };
