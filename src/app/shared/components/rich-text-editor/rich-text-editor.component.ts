import {
  Component,
  input,
  output,
  signal,
  viewChild,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';

export type FormatAction =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'strikethrough'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'ul'
  | 'ol'
  | 'link'
  | 'code'
  | 'blockquote'
  | 'hr';

interface ToolbarButton {
  action: FormatAction;
  label: string;
  icon: string;
  group: string;
  isActive?: boolean;
}

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rich-text-editor.component.html',
  styleUrls: ['./rich-text-editor.component.css'],
})
export class RichTextEditorComponent implements AfterViewInit, OnDestroy {
  /** The content string (HTML) */
  content = input<string>('');
  contentChange = output<string>();

  /** Placeholder text */
  placeholder = input<string>('Start editing content...');

  /** Editor element ref */
  editorRef = viewChild<ElementRef<HTMLElement>>('editorElement');

  /** TipTap Editor instance */
  editor: Editor | null = null;

  /** Word & char count */
  charCount = signal(0);
  wordCount = signal(0);

  /** Active states for toolbar buttons */
  activeStates = signal<Record<string, boolean>>({});

  /** Toolbar button definitions */
  readonly toolbarGroups: { name: string; buttons: ToolbarButton[] }[] = [
    {
      name: 'text',
      buttons: [
        { action: 'bold', label: 'Bold', icon: 'B', group: 'text' },
        { action: 'italic', label: 'Italic', icon: 'I', group: 'text' },
        { action: 'underline', label: 'Underline', icon: 'U', group: 'text' },
        { action: 'strikethrough', label: 'Strikethrough', icon: 'S', group: 'text' },
      ],
    },
    {
      name: 'heading',
      buttons: [
        { action: 'h1', label: 'Heading 1', icon: 'H1', group: 'heading' },
        { action: 'h2', label: 'Heading 2', icon: 'H2', group: 'heading' },
        { action: 'h3', label: 'Heading 3', icon: 'H3', group: 'heading' },
      ],
    },
    {
      name: 'list',
      buttons: [
        { action: 'ul', label: 'Bullet List', icon: 'ul', group: 'list' },
        { action: 'ol', label: 'Numbered List', icon: 'ol', group: 'list' },
      ],
    },
    {
      name: 'insert',
      buttons: [
        { action: 'link', label: 'Insert Link', icon: 'link', group: 'insert' },
        { action: 'code', label: 'Code Block', icon: 'code', group: 'insert' },
        { action: 'blockquote', label: 'Blockquote', icon: 'quote', group: 'insert' },
        { action: 'hr', label: 'Horizontal Rule', icon: 'hr', group: 'insert' },
      ],
    },
  ];

  constructor() {
    // Update editor content when the input changes externally,
    // but avoid circular updates when the change comes from TipTap itself.
    effect(() => {
      const newContent = this.content();
      if (this.editor && this.editor.getHTML() !== newContent) {
        this.editor.commands.setContent(newContent);
        this.updateCounts(this.editor.getText());
      }
    });
  }

  ngAfterViewInit(): void {
    const el = this.editorRef()?.nativeElement;
    if (!el) return;

    this.editor = new Editor({
      element: el,
      extensions: [
        StarterKit,
        Underline,
        Link.configure({
          openOnClick: false,
          HTMLAttributes: {
            rel: 'noopener noreferrer',
            target: '_blank',
          },
        }),
        Placeholder.configure({
          placeholder: this.placeholder(),
        }),
      ],
      content: this.content(),
      onUpdate: ({ editor }) => {
        const html = editor.getHTML();
        this.contentChange.emit(html);
        this.updateCounts(editor.getText());
      },
      onSelectionUpdate: ({ editor }) => {
        this.updateActiveStates(editor);
      },
      onTransaction: ({ editor }) => {
        this.updateActiveStates(editor);
      },
      editorProps: {
        attributes: {
          class: 'rte-tiptap-editor',
          spellcheck: 'true',
        },
      },
    });

    if (this.editor) {
      this.updateCounts(this.editor.getText());
      this.updateActiveStates(this.editor);
    }
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
  }

  private updateActiveStates(editor: Editor): void {
    this.activeStates.set({
      bold: editor.isActive('bold'),
      italic: editor.isActive('italic'),
      underline: editor.isActive('underline'),
      strikethrough: editor.isActive('strike'),
      h1: editor.isActive('heading', { level: 1 }),
      h2: editor.isActive('heading', { level: 2 }),
      h3: editor.isActive('heading', { level: 3 }),
      ul: editor.isActive('bulletList'),
      ol: editor.isActive('orderedList'),
      link: editor.isActive('link'),
      code: editor.isActive('codeBlock') || editor.isActive('code'),
      blockquote: editor.isActive('blockquote'),
    });
  }

  applyFormat(action: FormatAction): void {
    if (!this.editor) return;

    // Focus the editor before applying formats
    this.editor.chain().focus();

    switch (action) {
      case 'bold':
        this.editor.chain().focus().toggleBold().run();
        break;
      case 'italic':
        this.editor.chain().focus().toggleItalic().run();
        break;
      case 'underline':
        this.editor.chain().focus().toggleUnderline().run();
        break;
      case 'strikethrough':
        this.editor.chain().focus().toggleStrike().run();
        break;
      case 'h1':
        this.editor.chain().focus().toggleHeading({ level: 1 }).run();
        break;
      case 'h2':
        this.editor.chain().focus().toggleHeading({ level: 2 }).run();
        break;
      case 'h3':
        this.editor.chain().focus().toggleHeading({ level: 3 }).run();
        break;
      case 'ul':
        this.editor.chain().focus().toggleBulletList().run();
        break;
      case 'ol':
        this.editor.chain().focus().toggleOrderedList().run();
        break;
      case 'blockquote':
        this.editor.chain().focus().toggleBlockquote().run();
        break;
      case 'code':
        if (this.editor.isActive('codeBlock')) {
          this.editor.chain().focus().toggleCodeBlock().run();
        } else if (this.editor.isActive('code')) {
          this.editor.chain().focus().toggleCode().run();
        } else {
          // If multiple lines are selected, toggle codeblock, otherwise inline code
          const { state } = this.editor;
          const { selection } = state;
          const selectedText = state.doc.textBetween(selection.from, selection.to, '\\n');
          if (selectedText.includes('\\n')) {
            this.editor.chain().focus().toggleCodeBlock().run();
          } else {
            this.editor.chain().focus().toggleCode().run();
          }
        }
        break;
      case 'hr':
        this.editor.chain().focus().setHorizontalRule().run();
        break;
      case 'link': {
        const previousUrl = this.editor.getAttributes('link')['href'];
        const url = window.prompt('URL:', previousUrl || 'https://');

        if (url === null) {
          return;
        }

        if (url === '') {
          this.editor.chain().focus().extendMarkRange('link').unsetLink().run();
          return;
        }

        this.editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        break;
      }
    }
  }

  private updateCounts(text: string): void {
    const plainText = text || '';
    this.charCount.set(plainText.length);
    const words = plainText.trim() ? plainText.trim().split(/\\s+/).length : 0;
    this.wordCount.set(words);
  }
}


