import { useMemo } from 'react';
import { BookOpen, Download, FileJson, FileImage, FileText } from 'lucide-react';
import { getComponentDef } from '../constants/architecture';
import { exportDesignJson, exportDesignSvg, exportDesignPng, exportDesignPdf } from '../utils/export';

/**
 * Auto-generated design documentation. Renders a markdown-ish document from
 * the semantic state (requirements, decisions, assumptions, per-page node &
 * connection inventory, patterns) and supports JSON/SVG/PNG/PDF export.
 */
const DocumentationPanel = ({ design, document, onDownloadJson, onExport }) => {
  const sections = useMemo(() => {
    const out = [];
    const pages = document.pages || [];

    out.push({ heading: 'Overview', body: `**${document.name || design?.name || 'Untitled design'}** — ${document.level === 'lld' ? 'Low-level design' : 'High-level design'}\n\n${document.description || '_No description provided._'}` });

    out.push({
      heading: 'Requirements',
      body: (document.requirements || []).length
        ? (document.requirements || []).map((r) => `- ${r.text}`).join('\n')
        : '_None recorded._',
    });

    out.push({
      heading: 'Assumptions',
      body: (document.assumptions || []).length
        ? (document.assumptions || []).map((a) => `- ${a.text}`).join('\n')
        : '_None recorded._',
    });

    out.push({
      heading: 'Design decisions',
      body: (document.decisions || []).length
        ? (document.decisions || []).map((d) => `- **${d.title}**${d.reason ? ` — ${d.reason}` : ''}`).join('\n')
        : '_None recorded._',
    });

    for (const page of pages) {
      const nodeLines = (page.nodes || []).map((n) => {
        const def = getComponentDef(n.type, document.customComponents) || {};
        const props = Object.entries(n.properties || {})
          .filter(([k, v]) => v !== undefined && v !== null && v !== '' && v !== false)
          .slice(0, 4)
          .map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : v}`);
        const extra = props.length ? ` (${props.join(', ')})` : '';
        return `- ${n.name} — ${def.label || n.type}${extra}`;
      });
      out.push({
        heading: `Page: ${page.name} (${page.level.toUpperCase()})`,
        body: [
          `**Components (${(page.nodes || []).length})**`,
          nodeLines.length ? nodeLines.join('\n') : '_Empty page._',
          '',
          `**Connections (${(page.edges || []).length})**`,
          (page.edges || []).length
            ? (page.edges || []).map((e) => {
                const src = (page.nodes || []).find((n) => n.id === e.source)?.name || e.source;
                const tgt = (page.nodes || []).find((n) => n.id === e.target)?.name || e.target;
                const rps = e.traffic?.rps ? ` · ${e.traffic.rps} rps` : '';
                return `- ${src} → ${tgt} [${e.protocol || 'REST'}${e.syncMode === 'async' ? '·async' : ''}${rps}]`;
              }).join('\n')
            : '_No connections._',
          (page.groups || []).length ? `\n**Boundaries (${page.groups.length})**\n` + (page.groups || []).map((g) => `- ${g.name} (${g.boundaryType})`).join('\n') : '',
        ]
          .filter(Boolean)
          .join('\n'),
      });
    }

    out.push({
      heading: 'Patterns used',
      body: (document.patternsUsed || []).length
        ? (document.patternsUsed || []).map((p) => `- ${p}`).join('\n')
        : '_None applied yet._',
    });

    const cap = document.capacityInputs || {};
    const capEntries = Object.entries(cap).filter(([, v]) => v !== undefined && v !== null && v !== '');
    out.push({
      heading: 'Capacity assumptions',
      body: capEntries.length ? capEntries.map(([k, v]) => `- ${k}: ${v}`).join('\n') : '_Not estimated._',
    });

    return out;
  }, [design, document]);

  const copyAsMarkdown = () => {
    const md = sections.map((s) => `## ${s.heading}\n\n${s.body}`).join('\n\n---\n\n');
    navigator.clipboard?.writeText(md).then(() => {
      if (document.activeElement?.closest('[data-sonner-toaster]')) return;
      const el = document.createElement('div');
      el.textContent = 'Documentation copied to clipboard';
      el.style.cssText = 'position:fixed;top:12px;right:12px;background:#16a34a;color:#fff;padding:8px 12px;border-radius:8px;font-size:12px;z-index:9999';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2000);
    });
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="border-b border-border/40 p-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
          <BookOpen size={13} className="text-primary" /> Documentation
        </div>
        <p className="mt-0.5 text-[10px] text-muted-foreground">Auto-generated from the current design state.</p>
        <div className="mt-2 flex flex-wrap gap-1">
          <button type="button" onClick={onDownloadJson} className="flex items-center gap-1 rounded border border-border/60 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground">
            <FileJson size={10} /> JSON
          </button>
          <button type="button" onClick={copyAsMarkdown} className="flex items-center gap-1 rounded border border-border/60 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground">
            <Download size={10} /> Markdown
          </button>
          <button type="button" onClick={() => onExport?.('svg')} className="flex items-center gap-1 rounded border border-border/60 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground">
            <FileImage size={10} /> SVG
          </button>
          <button type="button" onClick={() => onExport?.('png')} className="flex items-center gap-1 rounded border border-border/60 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground">
            <FileImage size={10} /> PNG
          </button>
          <button type="button" onClick={() => onExport?.('pdf')} className="flex items-center gap-1 rounded border border-border/60 px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground">
            <FileText size={10} /> PDF
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-4 p-3">
        {sections.map((s) => (
          <section key={s.heading}>
            <h3 className="mb-1 text-[11px] font-bold uppercase tracking-wider text-primary">{s.heading}</h3>
            <div className="whitespace-pre-wrap rounded-lg border border-border/40 bg-card/50 p-2.5 text-[11px] leading-relaxed text-foreground">
              {s.body}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
};

export default DocumentationPanel;
