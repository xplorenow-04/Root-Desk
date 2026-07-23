import React, { useState, useEffect } from 'react';
import { FileText, Eye, Edit, Bold, Italic, Heading, Code, List } from 'lucide-react';

const ProjectNotes = ({ projectId }) => {
  const [notes, setNotes] = useState('');
  const [activeMode, setActiveMode] = useState('write'); // 'write' or 'preview'
  const storageKey = `project_${projectId}_notes`;

  // Load notes from localStorage on mount/projectId change
  useEffect(() => {
    const stored = localStorage.getItem(storageKey);
    setNotes(stored || '');
  }, [projectId, storageKey]);

  const handleNotesChange = (e) => {
    const val = e.target.value;
    setNotes(val);
    localStorage.setItem(storageKey, val);
  };

  const insertMarkdown = (syntax) => {
    const textarea = document.getElementById('notes-textarea');
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    let replacement = '';
    switch (syntax) {
      case 'bold':
        replacement = `**${selected || 'bold text'}**`;
        break;
      case 'italic':
        replacement = `*${selected || 'italic text'}*`;
        break;
      case 'header':
        replacement = `\n## ${selected || 'Header'}\n`;
        break;
      case 'code':
        replacement = `\n\`\`\`\n${selected || 'code block'}\n\`\`\`\n`;
        break;
      case 'list':
        replacement = `\n- ${selected || 'list item'}\n`;
        break;
      default:
        break;
    }

    const newText = text.substring(0, start) + replacement + text.substring(end);
    setNotes(newText);
    localStorage.setItem(storageKey, newText);

    // Focus and select the text
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 0);
  };

  // Basic Markdown-to-HTML parser (escaped to prevent external XSS)
  const parseMarkdown = (markdownText) => {
    if (!markdownText.trim()) {
      return '<p class="italic text-muted-foreground text-sm">Write notes in Markdown format...</p>';
    }

    // Escape raw HTML tags to prevent XSS
    let html = markdownText
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    // Markdown Headers: ### -> h4, ## -> h3, # -> h2
    html = html.replace(/^### (.*$)/gim, '<h4 class="text-sm font-bold text-foreground mt-4 mb-2">$1</h4>');
    html = html.replace(/^## (.*$)/gim, '<h3 class="text-base font-bold text-foreground mt-5 mb-2 border-b border-border/20 pb-1">$1</h3>');
    html = html.replace(/^# (.*$)/gim, '<h2 class="text-lg font-extrabold text-foreground mt-6 mb-3 border-b border-border/40 pb-1.5">$1</h2>');

    // Code blocks
    html = html.replace(/\`\`\`([\s\S]*?)\`\`\`/gim, '<pre class="my-4 overflow-x-auto rounded-lg border border-border/50 bg-background/80 p-3.5 font-mono text-xs text-foreground/90">$1</pre>');

    // Inline code
    html = html.replace(/\`(.*?)\`/gim, '<code class="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-primary font-medium border border-border/30">$1</code>');

    // Bold
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold text-foreground">$1</strong>');

    // Italic
    html = html.replace(/\*(.*?)\*/gim, '<em class="italic text-foreground/90">$1</em>');

    // Lists (bullet)
    html = html.replace(/^\s*-\s+(.*$)/gim, '<li class="list-disc ml-5 my-1 text-sm text-foreground/95">$1</li>');

    // Line breaks
    html = html.replace(/\n/g, '<br />');

    return html;
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto rounded-2xl border border-border/40 bg-card/45 p-6 shadow-md backdrop-blur-md">
      {/* Tab bar header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/20 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-bold text-foreground">Project Notes</h3>
        </div>

        {/* Toggle Mode */}
        <div className="flex items-center rounded-lg border border-border/40 bg-background/30 p-0.5">
          <button
            onClick={() => setActiveMode('write')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
              activeMode === 'write'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Edit className="h-3.5 w-3.5" />
            <span>Write</span>
          </button>
          <button
            onClick={() => setActiveMode('preview')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
              activeMode === 'preview'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Preview</span>
          </button>
        </div>
      </div>

      {/* Editor Interface */}
      {activeMode === 'write' ? (
        <div className="space-y-2">
          {/* Format Toolbar */}
          <div className="flex flex-wrap items-center gap-1 border-b border-border/25 pb-2">
            <button
              onClick={() => insertMarkdown('header')}
              title="Add Header"
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-all cursor-pointer"
            >
              <Heading className="h-4 w-4" />
            </button>
            <button
              onClick={() => insertMarkdown('bold')}
              title="Bold Text"
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-all cursor-pointer"
            >
              <Bold className="h-4 w-4" />
            </button>
            <button
              onClick={() => insertMarkdown('italic')}
              title="Italic Text"
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-all cursor-pointer"
            >
              <Italic className="h-4 w-4" />
            </button>
            <button
              onClick={() => insertMarkdown('code')}
              title="Add Code Block"
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-all cursor-pointer"
            >
              <Code className="h-4 w-4" />
            </button>
            <button
              onClick={() => insertMarkdown('list')}
              title="Add Bullet List"
              className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-all cursor-pointer"
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <textarea
            id="notes-textarea"
            rows={15}
            value={notes}
            onChange={handleNotesChange}
            placeholder="# Project Goals&#10;&#10;- Write notes in markdown...&#10;- Switch to the preview tab to verify styles."
            className="flex w-full rounded-xl border border-input bg-background/30 px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:border-primary/50 transition-all resize-none font-mono leading-relaxed"
          />
        </div>
      ) : (
        /* Preview Output */
        <div className="rounded-xl border border-border/30 bg-background/10 px-6 py-5 min-h-[340px] overflow-y-auto max-h-[500px]">
          <div
            className="prose prose-invert max-w-none text-foreground select-text"
            dangerouslySetInnerHTML={{ __html: parseMarkdown(notes) }}
          />
        </div>
      )}
    </div>
  );
};

export default ProjectNotes;
