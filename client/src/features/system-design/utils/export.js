import { getComponentDef } from '../constants/architecture';

/**
 * Export utilities for system designs. All raster output is drawn from the
 * semantic document (no DOM dependency), so exports match the canvas at any
 * zoom. JSON/SVG/PNG download; PDF opens a print dialog.
 */

const fmtCount = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(0)}K` : `${Math.round(n || 0)}`);

const getBounds = (nodes, groups) => {
  let minX = 0, minY = 0, maxX = 800, maxY = 600;
  for (const n of nodes) {
    minX = Math.min(minX, n.position.x);
    minY = Math.min(minY, n.position.y);
    maxX = Math.max(maxX, n.position.x + (n.size?.w || 220));
    maxY = Math.max(maxY, n.position.y + (n.size?.h || 96));
  }
  for (const g of groups) {
    minX = Math.min(minX, g.position.x);
    minY = Math.min(minY, g.position.y);
    maxX = Math.max(maxX, g.position.x + (g.size?.w || 600));
    maxY = Math.max(maxY, g.position.y + (g.size?.h || 400));
  }
  return { minX, minY, maxX, maxY };
};

const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const textWidth = (s, size) => {
  const c = 0.62;
  return (s?.length || 0) * size * c;
};

const truncate = (s, size, maxW) => {
  const str = String(s ?? '');
  if (textWidth(str, size) <= maxW) return str;
  let out = str;
  while (out.length > 1 && textWidth(out + '…', size) > maxW) out = out.slice(0, -1);
  return out + '…';
};

const nodeColor = (n, def) => n.style?.color || def?.color || '#6366f1';

/**
 * Draw a single page to an SVG string.
 */
export const pageToSvg = (page, customComponents = []) => {
  const { minX, minY, maxX, maxY } = getBounds(page.nodes || [], page.groups || []);
  const W = maxX - minX + 40;
  const H = maxY - minY + 40;
  const ox = -minX + 20;
  const oy = -minY + 20;
  const parts = [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="Segoe UI, Inter, Arial, sans-serif">`
  );
  parts.push(`<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="#6366f1"/></marker></defs>`);
  parts.push(`<rect width="${W}" height="${H}" fill="#0f172a"/>`);
  parts.push(`<rect x="${ox}" y="${oy}" width="${W - 40}" height="${H - 40}" fill="#111827"/>`);

  for (const g of page.groups || []) {
    const x = ox + g.position.x, y = oy + g.position.y, w = g.size?.w || 600, h = g.size?.h || 400;
    parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${g.color || '#64748b'}14" stroke="${g.color || '#64748b'}" stroke-width="1.5" stroke-dasharray="6 4"/>`);
    parts.push(`<rect x="${x + 10}" y="${y + 8}" rx="6" fill="${g.color || '#64748b'}"><text x="${x + 18}" y="${y + 22}" font-size="11" font-weight="600" fill="#fff">${esc(g.name || 'Boundary')}</text></rect>`);
  }

  for (const e of page.edges || []) {
    const s = (page.nodes || []).find((n) => n.id === e.source);
    const t = (page.nodes || []).find((n) => n.id === e.target);
    if (!s || !t) continue;
    const sx = ox + s.position.x + (s.size?.w || 220) / 2;
    const sy = oy + s.position.y + (s.size?.h || 96) / 2;
    const tx = ox + t.position.x + (t.size?.w || 220) / 2;
    const ty = oy + t.position.y + (t.size?.h || 96) / 2;
    const dashed = e.syncMode === 'async';
    const dx = tx - sx, dy = ty - sy;
    const len = Math.hypot(dx, dy) || 1;
    const r1 = Math.max((s.size?.w || 220) / 2, (s.size?.h || 96) / 2) + 6;
    const r2 = Math.max((t.size?.w || 220) / 2, (t.size?.h || 96) / 2) + 6;
    const x1 = sx + (dx / len) * r1, y1 = sy + (dy / len) * r1;
    const x2 = tx - (dx / len) * r2, y2 = ty - (dy / len) * r2;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - 8;
    parts.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#6366f1" stroke-width="1.6" ${dashed ? 'stroke-dasharray="6 4"' : ''} marker-end="url(#arrow)"/>`);
    const label = `${esc(e.protocol || 'REST')}${e.traffic?.rps ? ` · ${fmtCount(e.traffic.rps)} rps` : ''}`;
    parts.push(`<rect x="${mx - textWidth(label, 9) / 2 - 5}" y="${my - 8}" width="${textWidth(label, 9) + 10}" height="16" rx="4" fill="#1e293b" stroke="#334155"/><text x="${mx}" y="${my + 3}" font-size="9" fill="#cbd5e1" text-anchor="middle">${label}</text>`);
  }

  for (const n of page.nodes || []) {
    const def = getComponentDef(n.type, customComponents) || {};
    const x = ox + n.position.x, y = oy + n.position.y, w = n.size?.w || 220, h = n.size?.h || 96;
    const color = nodeColor(n, def);
    parts.push(`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#1e293b" stroke="${color}" stroke-width="2"/>`);
    parts.push(`<rect x="${x + 8}" y="${y + 8}" width="18" height="18" rx="5" fill="${color}"/>`);
    const name = truncate(n.name || def?.label || 'Component', 12, w - 36);
    const cat = truncate((n.category || '') + ' · ' + (def?.label || n.type), 8, w - 16);
    parts.push(`<text x="${x + 32}" y="${y + 22}" font-size="12" font-weight="600" fill="#f1f5f9">${esc(name)}</text>`);
    parts.push(`<text x="${x + 8}" y="${y + 38}" font-size="8" fill="#94a3b8">${esc(cat)}</text>`);
    const rps = n.properties?.requestsPerSec || n.properties?.readsPerSec || n.properties?.throughput;
    if (rps) parts.push(`<text x="${x + 8}" y="${y + h - 8}" font-size="8" fill="#94a3b8">~${fmtCount(rps)}/s</text>`);
  }

  parts.push(`</svg>`);
  return parts.join('\n');
};

const download = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

export const exportDesignJson = (design, document) => {
  const payload = { ...document, metadata: { ...(document.metadata || {}), exportedAt: new Date().toISOString() } };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  download(blob, `${(design?.name || 'design').replace(/[^a-z0-9-_]+/gi, '-')}.json`);
};

export const exportDesignSvg = (design, document) => {
  const pages = document.pages || [];
  const parts = pages.map((p, i) => pageToSvg(p, document.customComponents));
  const blob = new Blob(
    [
      parts.length === 1
        ? parts[0]
        : `<svg xmlns="http://www.w3.org/2000/svg" width="${pages.length * 1000}" height="${Math.max(800, pages.length * 200)}"><rect width="100%" height="100%" fill="#0f172a"/></svg>`,
    ],
    { type: 'image/svg+xml' }
  );
  download(blob, `${(design?.name || 'design').replace(/[^a-z0-9-_]+/gi, '-')}.svg`);
};

/**
 * Draw a page onto a 2D canvas (used by PNG + PDF).
 */
export const pageToCanvas = (page, canvas, customComponents = [], bg = '#0f172a') => {
  const { minX, minY, maxX, maxY } = getBounds(page.nodes || [], page.groups || []);
  const W = Math.max(400, maxX - minX + 40);
  const H = Math.max(300, maxY - minY + 40);
  const scale = 2;
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext('2d');
  ctx.scale(scale, scale);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#111827';
  ctx.fillRect(20, 20, W - 40, H - 40);
  const ox = -minX + 20, oy = -minY + 20;

  for (const g of page.groups || []) {
    const x = ox + g.position.x, y = oy + g.position.y, w = g.size?.w || 600, h = g.size?.h || 400;
    ctx.strokeStyle = g.color || '#64748b';
    ctx.fillStyle = g.color ? `${g.color}0d` : 'rgba(100,116,139,0.05)';
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 12);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = g.color || '#64748b';
    ctx.beginPath();
    ctx.roundRect(x + 10, y + 8, ctx.measureText(g.name || 'Boundary').width + 16, 18, 6);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = '600 11px Segoe UI, sans-serif';
    ctx.fillText(g.name || 'Boundary', x + 18, y + 21);
  }

  for (const e of page.edges || []) {
    const s = (page.nodes || []).find((n) => n.id === e.source);
    const t = (page.nodes || []).find((n) => n.id === e.target);
    if (!s || !t) continue;
    const sx = ox + s.position.x + (s.size?.w || 220) / 2;
    const sy = oy + s.position.y + (s.size?.h || 96) / 2;
    const tx = ox + t.position.x + (t.size?.w || 220) / 2;
    const ty = oy + t.position.y + (t.size?.h || 96) / 2;
    const dx = tx - sx, dy = ty - sy;
    const len = Math.hypot(dx, dy) || 1;
    const r1 = Math.max((s.size?.w || 220) / 2, (s.size?.h || 96) / 2) + 6;
    const r2 = Math.max((t.size?.w || 220) / 2, (t.size?.h || 96) / 2) + 6;
    const x1 = sx + (dx / len) * r1, y1 = sy + (dy / len) * r1;
    const x2 = tx - (dx / len) * r2, y2 = ty - (dy / len) * r2;
    ctx.strokeStyle = e.syncMode === 'async' ? '#a78bfa' : '#6366f1';
    ctx.lineWidth = 1.6;
    ctx.setLineDash(e.syncMode === 'async' ? [6, 4] : []);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#6366f1';
    const ang = Math.atan2(dy, dx);
    ctx.save();
    ctx.translate(x2, y2);
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-8, -4);
    ctx.lineTo(-8, 4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    const label = `${e.protocol || 'REST'}${e.traffic?.rps ? ` · ${fmtCount(e.traffic.rps)} rps` : ''}`;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - 10;
    ctx.font = '9px Segoe UI, monospace';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(label, mx - ctx.measureText(label).width / 2, my);
  }

  for (const n of page.nodes || []) {
    const def = getComponentDef(n.type, customComponents) || {};
    const x = ox + n.position.x, y = oy + n.position.y, w = n.size?.w || 220, h = n.size?.h || 96;
    const color = nodeColor(n, def);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect(x + 8, y + 8, 18, 18, 5);
    ctx.fill();
    ctx.font = '600 12px Segoe UI, sans-serif';
    ctx.fillStyle = '#f1f5f9';
    const name = truncate(n.name || def?.label || 'Component', 12, w - 36);
    ctx.fillText(name, x + 32, y + 22);
    ctx.font = '8px Segoe UI, sans-serif';
    ctx.fillStyle = '#94a3b8';
    const cat = truncate((n.category || '') + ' · ' + (def?.label || n.type), 8, w - 16);
    ctx.fillText(cat, x + 8, y + 38);
    const rps = n.properties?.requestsPerSec || n.properties?.readsPerSec || n.properties?.throughput;
    if (rps) ctx.fillText(`~${fmtCount(rps)}/s`, x + 8, y + h - 8);
  }

  return { W, H };
};

export const exportDesignPng = (design, document) => {
  const page = document.pages?.[0];
  if (!page) return;
  const canvas = document.createElement('canvas');
  pageToCanvas(page, canvas, document.customComponents);
  canvas.toBlob((blob) => {
    if (blob) download(blob, `${(design?.name || 'design').replace(/[^a-z0-9-_]+/gi, '-')}.png`);
  }, 'image/png');
};

export const exportDesignPdf = (design, document) => {
  const page = document.pages?.[0];
  if (!page) return;
  const canvas = document.createElement('canvas');
  pageToCanvas(page, canvas, document.customComponents);
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(
    `<!doctype html><html><head><title>${esc(design?.name || 'Design')}</title><style>@page{size:A4 landscape;margin:12mm}body{margin:0;display:flex;align-items:center;justify-content:center;background:#0f172a}img{max-width:100%;max-height:100%;}</style></head><body><img src="${canvas.toDataURL('image/png')}"/><script>window.onload=()=>{setTimeout(()=>window.print(),300)}</scr${'ipt'}></body></html>`
  );
  win.document.close();
};
