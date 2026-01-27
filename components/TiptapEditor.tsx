"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';

interface TiptapEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function TiptapEditor({ content, onChange, placeholder }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: placeholder || 'Write your description here...',
      }),
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[120px] px-3 py-2',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-white/30 rounded-md bg-white/10 focus-within:ring-2 focus-within:ring-white/50">
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-white/20 flex-wrap">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 rounded text-sm font-semibold transition-colors ${
            editor.isActive('bold')
              ? 'bg-white/30 text-white'
              : 'text-white/70 hover:bg-white/20 hover:text-white'
          }`}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 rounded text-sm italic transition-colors ${
            editor.isActive('italic')
              ? 'bg-white/30 text-white'
              : 'text-white/70 hover:bg-white/20 hover:text-white'
          }`}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`px-2 py-1 rounded text-sm line-through transition-colors ${
            editor.isActive('strike')
              ? 'bg-white/30 text-white'
              : 'text-white/70 hover:bg-white/20 hover:text-white'
          }`}
        >
          S
        </button>
        
        <div className="w-px h-6 bg-white/20 mx-1"></div>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`px-2 py-1 rounded text-sm transition-colors ${
            editor.isActive('heading', { level: 1 })
              ? 'bg-white/30 text-white'
              : 'text-white/70 hover:bg-white/20 hover:text-white'
          }`}
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 rounded text-sm transition-colors ${
            editor.isActive('heading', { level: 2 })
              ? 'bg-white/30 text-white'
              : 'text-white/70 hover:bg-white/20 hover:text-white'
          }`}
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`px-2 py-1 rounded text-sm transition-colors ${
            editor.isActive('heading', { level: 3 })
              ? 'bg-white/30 text-white'
              : 'text-white/70 hover:bg-white/20 hover:text-white'
          }`}
        >
          H3
        </button>
        
        <div className="w-px h-6 bg-white/20 mx-1"></div>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 rounded text-sm transition-colors ${
            editor.isActive('bulletList')
              ? 'bg-white/30 text-white'
              : 'text-white/70 hover:bg-white/20 hover:text-white'
          }`}
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2 py-1 rounded text-sm transition-colors ${
            editor.isActive('orderedList')
              ? 'bg-white/30 text-white'
              : 'text-white/70 hover:bg-white/20 hover:text-white'
          }`}
        >
          1. List
        </button>
        
        <div className="w-px h-6 bg-white/20 mx-1"></div>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`px-2 py-1 rounded text-sm transition-colors ${
            editor.isActive('blockquote')
              ? 'bg-white/30 text-white'
              : 'text-white/70 hover:bg-white/20 hover:text-white'
          }`}
        >
          " Quote
        </button>
        
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="px-2 py-1 rounded text-sm text-white/70 hover:bg-white/20 hover:text-white transition-colors"
        >
          ― HR
        </button>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} className="text-white" />
    </div>
  );
}
