import React, { useState } from 'react';
import { FileText, Plus, Eye, Edit2, Save, X, Bold, Italic, Heading, Code, List, Link2, Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useProjectMutations } from '@/hooks/useProjects';
import { parseMarkdown } from '@/lib/markdown';

const ProjectMarkdown = ({ project }) => {
  const { updateProject, isUpdating } = useProjectMutations();
  const [editing, setEditing] = useState(false);
  const [activeMode, setActiveMode] = useState('write'); // 'write' | 'preview'
  const [content, setContent] = useState('');

  const hasMarkdown = Boolean(project.markdown && project.markdown.trim());

  const startEditing = () => {
    setContent(project.markdown || '');
    setActiveMode('write');
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setContent('');
  };

  const handleSave = async () => {
    try {
      await updateProject({ id: project._id, data: { markdown: content } });
      toast.success(hasMarkdown ? 'Markdown updated' : 'Markdown added');
      setEditing(false);
      setContent('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save markdown');
    }
  };

  const handleClear = async () => {
    try {
      await updateProject({ id: project._id, data: { markdown: '' } });
      toast.success('Markdown removed');
      setEditing(false);
      setContent('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove markdown');
    }
  };

  const insertMarkdown = (syntax) => {
    const textarea = document.getElementById('project-md-textarea');
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selected = text.substring(start, end);

    const replacements = {
      header: `\n## ${selected || 'Header'}\n`,
      bold: `**${selected || 'bold text'}**`,
      italic: `*${selected || 'italic text'}*`,
      code: `\`\`\`\n${selected || 'code block'}\n\`\`\`\n`,
      list: `\n- ${selected || 'list item'}\n`,
      link: `[${selected || 'link text'}](https://example.com)`,
    };
    const replacement = replacements[syntax];
    const newText = text.substring(0, start) + replacement + text.substring(end);
    setContent(newText);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + replacement.length, start + replacement.length);
    }, 0);
  };

  const toolbarButton = (title, Icon, syntax) => (
    <button
      key={title}
      onClick={() => insertMarkdown(syntax)}
      title={title}
      className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground active:scale-95 transition-all cursor-pointer"
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  const modeToggle = (value, label, Icon) => (
    <button
      key={value}
      onClick={() => setActiveMode(value)}
      className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
        activeMode === value
          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="rounded-xl border border-border/40 bg-card/45 p-6 backdrop-blur-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/20 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-base font-bold text-foreground">Project Markdown</h3>
        </div>

        {!editing ? (
          <div className="flex items-center gap-2">
            {hasMarkdown && (
              <button
                onClick={handleClear}
                title="Remove markdown"
                className="flex h-8 items-center gap-1.5 rounded-lg border border-border/50 px-2.5 text-xs font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive active:scale-95 transition-all cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Remove</span>
              </button>
            )}
            <button
              onClick={startEditing}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-3 text-xs font-bold text-primary-foreground shadow hover:bg-primary/95 active:scale-95 transition-all cursor-pointer"
            >
              {hasMarkdown ? <Edit2 className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
              <span>{hasMarkdown ? 'Edit' : 'Add Markdown'}</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center rounded-lg border border-border/40 bg-background/30 p-0.5">
            {modeToggle('write', 'Write', Edit2)}
            {modeToggle('preview', 'Preview', Eye)}
          </div>
        )}
      </div>

      {/* Body */}
      {!editing ? (
        hasMarkdown ? (
          <div className="rounded-xl border border-border/30 bg-background/10 px-6 py-5 min-h-[220px] max-h-[560px] overflow-y-auto">
            <div
              className="prose prose-invert max-w-none text-foreground select-text text-sm leading-relaxed"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(project.markdown) }}
            />
          </div>
        ) : (
          <button
            onClick={startEditing}
            className="flex w-full min-h-[120px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border/50 text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-muted/30 transition-all cursor-pointer"
          >
            <Plus className="h-6 w-6" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Add an MD file / readme to this project
            </span>
          </button>
        )
      ) : (
        <div className="space-y-3">
          {/* Format Toolbar */}
          <div className="flex flex-wrap items-center gap-1 border-b border-border/25 pb-2">
            {toolbarButton('Add Header', Heading, 'header')}
            {toolbarButton('Bold Text', Bold, 'bold')}
            {toolbarButton('Italic Text', Italic, 'italic')}
            {toolbarButton('Add Code Block', Code, 'code')}
            {toolbarButton('Add Bullet List', List, 'list')}
            {toolbarButton('Add Link', Link2, 'link')}
          </div>

          {activeMode === 'write' ? (
            <textarea
              id="project-md-textarea"
              rows={14}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={'# Project Overview\n\n- Write markdown to describe this project...\n- Switch to Preview to verify styling.\n\n## Getting Started\n\n```\nyour code here\n```'}
              className="flex w-full rounded-xl border border-input bg-background/30 px-4 py-3 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:border-primary/50 transition-all resize-none font-mono leading-relaxed"
            />
          ) : (
            <div className="rounded-xl border border-border/30 bg-background/10 px-6 py-5 min-h-[280px] overflow-y-auto max-h-[500px]">
              <div
                className="prose prose-invert max-w-none text-foreground select-text text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={cancelEditing}
              disabled={isUpdating}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-border/50 px-3 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
              <span>Cancel</span>
            </button>
            <button
              onClick={handleSave}
              disabled={isUpdating}
              className="flex h-8 items-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-bold text-primary-foreground shadow hover:bg-primary/95 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              <span>{isUpdating ? 'Saving...' : 'Save'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectMarkdown;
