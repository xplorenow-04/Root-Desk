/**
 * Shared Markdown-to-HTML parser.
 * Raw HTML is allowed to pass through and is sanitized with DOMPurify (XSS-safe).
 */

import DOMPurify from 'dompurify';

const SANITIZE_CONFIG = {
  USE_PROFILES: { html: true },
  FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea'],
  FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'style', 'srcset'],
};

export const parseMarkdown = (markdownText) => {
  if (!markdownText || !markdownText.trim()) {
    return '<p class="italic text-muted-foreground text-sm">Nothing to preview. Write some markdown...</p>';
  }

  let html = String(markdownText);

  // Fenced code blocks (must run before inline code)
  html = html.replace(/```([\s\S]*?)```/gim, '<pre class="my-4 overflow-x-auto rounded-lg border border-border/50 bg-background/80 p-3.5 font-mono text-xs text-foreground/90">$1</pre>');

  // Markdown Headers: ### -> h4, ## -> h3, # -> h2
  html = html.replace(/^### (.*$)/gim, '<h4 class="text-sm font-bold text-foreground mt-4 mb-2">$1</h4>');
  html = html.replace(/^## (.*$)/gim, '<h3 class="text-base font-bold text-foreground mt-5 mb-2 border-b border-border/20 pb-1">$1</h3>');
  html = html.replace(/^# (.*$)/gim, '<h2 class="text-lg font-extrabold text-foreground mt-6 mb-3 border-b border-border/40 pb-1.5">$1</h2>');

  // Blockquotes
  html = html.replace(/^> (.*$)/gim, '<blockquote class="my-2 border-l-2 border-primary/40 bg-muted/40 pl-3 pr-2 py-1 rounded-r-md text-sm text-muted-foreground">$1</blockquote>');

  // Images ![alt](url)
  html = html.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/gim, '<img src="$2" alt="$1" class="my-3 max-w-full rounded-lg border border-border/40" />');

  // Inline code
  html = html.replace(/`(.*?)`/gim, '<code class="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-primary font-medium border border-border/30">$1</code>');

  // Bold
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-bold text-foreground">$1</strong>');

  // Italic
  html = html.replace(/(^|[^*])\*([^*]+)\*(?!\*)/gim, '$1<em class="italic text-foreground/90">$2</em>');

  // Links [text](url)
  html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/gim, '<a href="$2" target="_blank" rel="noopener noreferrer" class="font-medium text-primary underline underline-offset-2 hover:text-primary/80 transition-colors">$1</a>');

  // Unordered lists
  html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li class="list-disc ml-5 my-1 text-sm text-foreground/95">$1</li>');

  // Line breaks
  html = html.replace(/\n/g, '<br />');

  // Sanitize final HTML (allows raw HTML like GitHub README headers/badges)
  return DOMPurify.sanitize(html, SANITIZE_CONFIG);
};
