import {
  Component,
  input,
  output,
  signal,
  viewChild,
  ElementRef,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';

export type ContentFormat = 'HTML' | 'MARKDOWN';
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
}

@Component({
  selector: 'app-rich-text-editor',
  standalone: true,
  imports: [CommonModule, SafeHtmlPipe],
  templateUrl: './rich-text-editor.component.html',
  styleUrls: ['./rich-text-editor.component.css'],
})
export class RichTextEditorComponent implements AfterViewInit {
  /** The current content format */
  format = input<ContentFormat>('HTML');

  /** The content string (two-way) */
  content = input<string>('');
  contentChange = output<string>();

  /** Placeholder text */
  placeholder = input<string>('Start editing content...');

  /** Textarea ref */
  textareaRef = viewChild<ElementRef<HTMLTextAreaElement>>('editorTextarea');

  /** Word & char count */
  charCount = signal(0);
  wordCount = signal(0);

  /** Source / Preview toggle */
  activeTab = signal<'source' | 'preview'>('source');

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

  ngAfterViewInit(): void {
    this.updateCounts(this.content());
  }

  onTextInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    const value = textarea.value;
    this.contentChange.emit(value);
    this.updateCounts(value);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (!(event.ctrlKey || event.metaKey)) return;

    const key = event.key.toLowerCase();
    const shortcuts: Record<string, FormatAction> = {
      b: 'bold',
      i: 'italic',
      u: 'underline',
      k: 'link',
    };

    if (shortcuts[key]) {
      event.preventDefault();
      this.applyFormat(shortcuts[key]);
    }
  }

  applyFormat(action: FormatAction): void {
    const textarea = this.textareaRef()?.nativeElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);
    const isHtml = this.format() === 'HTML';

    let before = '';
    let after = '';
    let insert = '';
    let cursorOffset = 0;

    switch (action) {
      case 'bold':
        if (isHtml) {
          before = '<strong>';
          after = '</strong>';
        } else {
          before = '**';
          after = '**';
        }
        break;

      case 'italic':
        if (isHtml) {
          before = '<em>';
          after = '</em>';
        } else {
          before = '_';
          after = '_';
        }
        break;

      case 'underline':
        if (isHtml) {
          before = '<u>';
          after = '</u>';
        } else {
          before = '<u>';
          after = '</u>';
        }
        break;

      case 'strikethrough':
        if (isHtml) {
          before = '<del>';
          after = '</del>';
        } else {
          before = '~~';
          after = '~~';
        }
        break;

      case 'h1':
        if (isHtml) {
          before = '<h1>';
          after = '</h1>';
        } else {
          insert = this.wrapLine(text, start, end, '# ');
          this.setContent(textarea, insert, start, start + insert.length);
          return;
        }
        break;

      case 'h2':
        if (isHtml) {
          before = '<h2>';
          after = '</h2>';
        } else {
          insert = this.wrapLine(text, start, end, '## ');
          this.setContent(textarea, insert, start, start + insert.length);
          return;
        }
        break;

      case 'h3':
        if (isHtml) {
          before = '<h3>';
          after = '</h3>';
        } else {
          insert = this.wrapLine(text, start, end, '### ');
          this.setContent(textarea, insert, start, start + insert.length);
          return;
        }
        break;

      case 'ul':
        if (isHtml) {
          const ulItems = selected
            ? selected
                .split('\n')
                .map((line) => `  <li>${line}</li>`)
                .join('\n')
            : '  <li></li>';
          insert = `<ul>\n${ulItems}\n</ul>`;
          cursorOffset = insert.indexOf('</li>');
        } else {
          insert = selected
            ? selected
                .split('\n')
                .map((line) => `- ${line}`)
                .join('\n')
            : '- ';
          cursorOffset = insert.length;
        }
        this.replaceSelection(textarea, text, start, end, insert, cursorOffset);
        return;

      case 'ol':
        if (isHtml) {
          const olItems = selected
            ? selected
                .split('\n')
                .map((line) => `  <li>${line}</li>`)
                .join('\n')
            : '  <li></li>';
          insert = `<ol>\n${olItems}\n</ol>`;
          cursorOffset = insert.indexOf('</li>');
        } else {
          insert = selected
            ? selected
                .split('\n')
                .map((line, i) => `${i + 1}. ${line}`)
                .join('\n')
            : '1. ';
          cursorOffset = insert.length;
        }
        this.replaceSelection(textarea, text, start, end, insert, cursorOffset);
        return;

      case 'link': {
        const url = 'https://';
        const linkText = selected || 'link text';
        if (isHtml) {
          insert = `<a href="${url}">${linkText}</a>`;
          cursorOffset = 9; // position in href=""
        } else {
          insert = `[${linkText}](${url})`;
          cursorOffset = insert.indexOf('(') + 1;
        }
        this.replaceSelection(textarea, text, start, end, insert, cursorOffset);
        return;
      }

      case 'code':
        if (isHtml) {
          if (selected && selected.includes('\n')) {
            before = '<pre><code>';
            after = '</code></pre>';
          } else {
            before = '<code>';
            after = '</code>';
          }
        } else {
          if (selected && selected.includes('\n')) {
            before = '```\n';
            after = '\n```';
          } else {
            before = '`';
            after = '`';
          }
        }
        break;

      case 'blockquote':
        if (isHtml) {
          before = '<blockquote>';
          after = '</blockquote>';
        } else {
          insert = selected
            ? selected
                .split('\n')
                .map((line) => `> ${line}`)
                .join('\n')
            : '> ';
          cursorOffset = insert.length;
          this.replaceSelection(textarea, text, start, end, insert, cursorOffset);
          return;
        }
        break;

      case 'hr':
        if (isHtml) {
          insert = '\n<hr>\n';
        } else {
          insert = '\n---\n';
        }
        this.replaceSelection(textarea, text, start, end, insert, insert.length);
        return;
    }

    // Default wrap selection
    const wrapped = before + (selected || '') + after;
    const newText = text.substring(0, start) + wrapped + text.substring(end);
    const newCursorPos = selected ? start + wrapped.length : start + before.length;

    textarea.value = newText;
    textarea.selectionStart = selected ? start : newCursorPos;
    textarea.selectionEnd = selected ? start + wrapped.length : newCursorPos;
    textarea.focus();

    this.contentChange.emit(newText);
    this.updateCounts(newText);
  }

  private wrapLine(
    text: string,
    start: number,
    end: number,
    prefix: string
  ): string {
    const selected = text.substring(start, end) || 'Heading';
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    const beforeLine = text.substring(0, lineStart);
    const afterLine = text.substring(end);
    const newContent = beforeLine + prefix + selected + afterLine;

    const textarea = this.textareaRef()?.nativeElement;
    if (textarea) {
      textarea.value = newContent;
      const cursor = lineStart + prefix.length + selected.length;
      textarea.selectionStart = cursor;
      textarea.selectionEnd = cursor;
      textarea.focus();
      this.contentChange.emit(newContent);
      this.updateCounts(newContent);
    }
    return prefix + selected;
  }

  private replaceSelection(
    textarea: HTMLTextAreaElement,
    text: string,
    start: number,
    end: number,
    insert: string,
    cursorOffset: number
  ): void {
    const newText = text.substring(0, start) + insert + text.substring(end);
    textarea.value = newText;
    textarea.selectionStart = start + cursorOffset;
    textarea.selectionEnd = start + cursorOffset;
    textarea.focus();

    this.contentChange.emit(newText);
    this.updateCounts(newText);
  }

  private setContent(
    textarea: HTMLTextAreaElement,
    _insert: string,
    _start: number,
    _end: number
  ): void {
    // Content already set in wrapLine
  }

  private updateCounts(text: string): void {
    this.charCount.set(text.length);
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    this.wordCount.set(words);
  }
}

