import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Plus, Upload, LayoutTemplate, Trash2, Network, Pencil, Loader2,
  FolderKanban, Layers, GitBranch, Clock,
} from 'lucide-react';
import PageHeader from '@/components/shared/PageHeader';
import EmptyState from '@/components/shared/EmptyState';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import { useProjects } from '@/hooks/useProjects';
import {
  useSystemDesigns,
  useCreateSystemDesign,
  useDeleteSystemDesign,
  useSystemDesignImport,
} from '../hooks/useSystemDesigns';
import TemplatesModal from '../components/TemplatesModal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const inputCls =
  'w-full rounded-md border border-border/50 bg-background px-2.5 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none';

const fmtTime = (iso) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '—';
  }
};

/**
 * System Design Studio landing page: pick a project, then create, import, or
 * instantiate a template design. Lists existing designs with stats.
 */
const SystemDesignStudioPage = () => {
  const navigate = useNavigate();
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const [projectId, setProjectId] = useState('');
  const { data: designs = [], isLoading: designsLoading } = useSystemDesigns(projectId);

  const createMutation = useCreateSystemDesign();
  const deleteMutation = useDeleteSystemDesign(projectId);
  const importMutation = useSystemDesignImport(projectId);

  const [showCreate, setShowCreate] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [newDesign, setNewDesign] = useState({ name: '', description: '', level: 'hld' });
  const [importFile, setImportFile] = useState(null);
  const [showImport, setShowImport] = useState(false);

  const activeProject = projects.find((p) => p._id === projectId);

  const handleCreate = () => {
    if (!newDesign.name.trim() || !projectId) return;
    createMutation.mutate(
      { projectId, ...newDesign, name: newDesign.name.trim() },
      {
        onSuccess: (res) => {
          toast.success('Design created');
          navigate(`/system-design/${res.data?.design?.id || res.data?.design?._id}`);
        },
        onError: (err) => toast.error(err?.response?.data?.error || 'Failed to create design'),
      }
    );
  };

  const handleImport = () => {
    if (!importFile || !projectId) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(String(reader.result));
        importMutation.mutate(payload, {
          onSuccess: (res) => {
            toast.success('Design imported');
            setShowImport(false);
            setImportFile(null);
            const id = res.data?.design?.id || res.data?.design?._id;
            if (id) navigate(`/system-design/${id}`);
          },
          onError: (err) => toast.error(err?.response?.data?.error || 'Import failed — check the file format'),
        });
      } catch {
        toast.error('File is not valid JSON');
      }
    };
    reader.readAsText(importFile);
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <PageHeader
          title="System Design Studio"
          description="Design, validate, and present production-grade architectures — with patterns, capacity math, and chaos simulation."
        />

        {/* Project selector */}
        <div className="mt-6 rounded-xl border border-border/50 bg-card/60 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <FolderKanban size={16} className="text-primary" />
              <span className="text-sm font-semibold text-foreground">Workspace project</span>
            </div>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className={cn(inputCls, 'max-w-xs')}
            >
              <option value="">Select a project…</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
            {activeProject && (
              <span className="text-xs text-muted-foreground">
                Designs live inside this project.
              </span>
            )}
          </div>
        </div>

        {projectId && (
          <>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                <Plus size={15} /> New design
              </button>
              <button
                type="button"
                onClick={() => setShowTemplates(true)}
                className="flex items-center gap-1.5 rounded-lg border border-border/60 px-3.5 py-2 text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary"
              >
                <LayoutTemplate size={15} /> Templates
              </button>
              <button
                type="button"
                onClick={() => {
                  setImportFile(null);
                  setShowImport(true);
                }}
                className="flex items-center gap-1.5 rounded-lg border border-border/60 px-3.5 py-2 text-sm font-medium text-foreground hover:border-primary/40 hover:text-primary"
              >
                <Upload size={15} /> Import JSON
              </button>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Layers size={12} /> Designs ({designs.length})
              </div>
              {designsLoading ? (
                <LoadingSpinner message="Loading designs…" />
              ) : designs.length === 0 ? (
                <EmptyState
                  icon={Network}
                  title="No designs yet"
                  description="Create a blank design, instantiate a template, or import one."
                  actionLabel="Create design"
                  onAction={() => setShowCreate(true)}
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {designs.map((d) => {
                    const nodeCount = (d.pages || []).reduce((s, p) => s + (p.nodes || []).length, 0);
                    return (
                      <div
                        key={d._id || d.id}
                        className="group relative flex flex-col rounded-xl border border-border/50 bg-card/60 p-4 transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <LayoutDashboard size={16} />
                          </span>
                          <span className="rounded-full border border-border/60 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
                            {d.level || 'hld'}
                          </span>
                        </div>
                        <h3 className="mt-2 truncate text-sm font-semibold text-foreground">{d.name}</h3>
                        <p className="mt-0.5 line-clamp-2 min-h-[2rem] text-xs leading-snug text-muted-foreground">
                          {d.description || 'No description.'}
                        </p>
                        <div className="mt-2 flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1"><Layers size={9} /> {nodeCount} nodes</span>
                          <span className="flex items-center gap-1"><GitBranch size={9} /> v{d.version || d.currentVersion || 1}</span>
                          <span className="flex items-center gap-1"><Clock size={9} /> {fmtTime(d.updatedAt)}</span>
                        </div>
                        <div className="mt-3 flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => navigate(`/system-design/${d._id || d.id}`)}
                            className="flex flex-1 items-center justify-center gap-1 rounded-md bg-primary/10 px-2 py-1.5 text-xs font-medium text-primary hover:bg-primary/20"
                          >
                            <Pencil size={11} /> Open
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(d)}
                            className="flex items-center justify-center rounded-md border border-border/60 px-2 py-1.5 text-muted-foreground hover:border-destructive/40 hover:text-destructive"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {!projectId && !projectsLoading && (
          <EmptyState
            icon={FolderKanban}
            title="Select a project to begin"
            description="System designs are stored per project. Pick one above, or create a project first."
          />
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => setShowCreate(false)} />
          <div className="relative z-60 w-full max-w-md rounded-2xl border border-border/40 bg-card p-5 shadow-2xl">
            <h3 className="text-base font-bold text-foreground">New design</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Start from a blank canvas in {activeProject?.name}.</p>
            <div className="mt-4 space-y-3">
              <label className="block">
                <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Name *</span>
                <input
                  autoFocus
                  value={newDesign.name}
                  onChange={(e) => setNewDesign({ ...newDesign, name: e.target.value })}
                  placeholder="e.g. URL Shortener — HLD"
                  className={inputCls}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Description</span>
                <textarea
                  rows={2}
                  value={newDesign.description}
                  onChange={(e) => setNewDesign({ ...newDesign, description: e.target.value })}
                  placeholder="What does this design cover?"
                  className={cn(inputCls, 'resize-none')}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Level</span>
                <select
                  value={newDesign.level}
                  onChange={(e) => setNewDesign({ ...newDesign, level: e.target.value })}
                  className={inputCls}
                >
                  <option value="hld">High-level design (HLD)</option>
                  <option value="lld">Low-level design (LLD)</option>
                </select>
              </label>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-lg border border-border/60 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!newDesign.name.trim() || createMutation.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {createMutation.isPending && <Loader2 size={13} className="animate-spin" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import modal */}
      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-[2px]" onClick={() => setShowImport(false)} />
          <div className="relative z-60 w-full max-w-md rounded-2xl border border-border/40 bg-card p-5 shadow-2xl">
            <h3 className="text-base font-bold text-foreground">Import design</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Upload a JSON exported from this studio (same semantic format).</p>
            <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border/60 p-6 text-center hover:border-primary/40">
              <Upload size={20} className="text-primary" />
              <span className="text-xs font-medium text-foreground">
                {importFile ? importFile.name : 'Choose a .json file'}
              </span>
              {!importFile && <span className="text-[10px] text-muted-foreground">Click to browse</span>}
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowImport(false)}
                className="rounded-lg border border-border/60 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={!importFile || importMutation.isPending}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {importMutation.isPending && <Loader2 size={13} className="animate-spin" />}
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {showTemplates && (
        <TemplatesModal
          projectId={projectId}
          onClose={() => setShowTemplates(false)}
          onCreated={(id) => id && navigate(`/system-design/${id}`)}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            deleteMutation.mutate(deleteTarget._id || deleteTarget.id, {
              onSuccess: () => toast.success('Design deleted'),
              onError: (err) => toast.error(err?.response?.data?.error || 'Failed to delete'),
            });
          }
          setDeleteTarget(null);
        }}
        title="Delete this design?"
        description={`"${deleteTarget?.name}" and all of its pages, versions, and requirements will be permanently removed.`}
        confirmText="Delete"
      />
    </div>
  );
};

export default SystemDesignStudioPage;
