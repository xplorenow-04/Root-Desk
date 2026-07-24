import { useState, memo, useMemo } from 'react';
import {
  Link2, Plus, Trash2, ToggleLeft, ToggleRight, Loader2, ChevronDown,
  Zap, Settings, AlertTriangle, GitBranch,
} from 'lucide-react';
import {
  useFlowLinks,
  useCreateWorkflowLink,
  useDeleteWorkflowLink,
  useToggleWorkflowLink,
  useUpdateWorkflowLink,
} from '../hooks/useWorkflowLinks';
import { MODULE_LINK_TARGETS } from '../../../constants/flowTypes';
import { cn } from '../../../lib/utils';
import { toast } from 'sonner';

const TRIGGER_OPTIONS = [
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
  { value: 'instead', label: 'Instead' },
  { value: 'parallel', label: 'Parallel' },
];

const TARGET_TYPE_OPTIONS = [
  { value: 'page', label: 'Page' },
  { value: 'button', label: 'Button' },
  { value: 'sidebar', label: 'Sidebar' },
  { value: 'menu', label: 'Menu' },
  { value: 'form', label: 'Form' },
  { value: 'module', label: 'Module' },
  { value: 'route', label: 'Route' },
  { value: 'event', label: 'Event' },
  { value: 'api', label: 'API' },
  { value: 'crud', label: 'CRUD' },
  { value: 'widget', label: 'Widget' },
  { value: 'action', label: 'Action' },
];

const VERSION_OPTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'specific', label: 'Specific Version' },
];

/**
 * WorkflowLinkManager — manages persistent workflow-to-module links.
 * All operations save to the server via React Query mutations.
 * Links automatically reload on mount and persist across refresh/restart/deployment.
 */
const WorkflowLinkManager = ({ flowId, flowVersion = 1, entryNodes = [] }) => {
  const { data, isLoading } = useFlowLinks(flowId);
  const createLink = useCreateWorkflowLink();
  const deleteLink = useDeleteWorkflowLink();
  const toggleLink = useToggleWorkflowLink();
  const updateLink = useUpdateWorkflowLink();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    targetType: 'module',
    targetId: '',
    targetLabel: '',
    triggerOn: 'after',
    priority: 0,
    entryNode: '',
    versionSelection: 'latest',
    specificVersion: null,
  });

  const links = data?.data?.links || data?.links || [];

  const handleCreate = async () => {
    if (!form.targetId.trim()) {
      toast.error('Target ID is required');
      return;
    }
    try {
      await createLink.mutateAsync({
        flowId,
        ...form,
        specificVersion: form.versionSelection === 'specific' ? (form.specificVersion || flowVersion) : null,
      });
      toast.success('Link created and saved');
      setShowForm(false);
      setForm({ targetType: 'module', targetId: '', targetLabel: '', triggerOn: 'after', priority: 0, entryNode: '', versionSelection: 'latest', specificVersion: null });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create link');
    }
  };

  const handleDelete = async (linkId) => {
    try {
      await deleteLink.mutateAsync(linkId);
      toast.success('Link removed');
    } catch (err) {
      toast.error('Failed to remove link');
    }
  };

  const handleToggle = async (linkId) => {
    try {
      await toggleLink.mutateAsync(linkId);
    } catch (err) {
      toast.error('Failed to toggle link');
    }
  };

  const handleUpdateField = async (linkId, field, value) => {
    try {
      const updateData = { [field]: value };
      if (field === 'versionSelection' && value !== 'specific') {
        updateData.specificVersion = null;
      }
      await updateLink.mutateAsync({ id: linkId, data: updateData });
    } catch (err) {
      toast.error(`Failed to update ${field}`);
    }
  };

  const startEdit = (link) => {
    setEditingId(link._id);
    setForm({
      targetType: link.targetType,
      targetId: link.targetId,
      targetLabel: link.targetLabel || '',
      triggerOn: link.triggerOn,
      priority: link.priority || 0,
      entryNode: link.entryNode || '',
      versionSelection: link.versionSelection || 'latest',
      specificVersion: link.specificVersion || null,
    });
  };

  const handleEditSave = async () => {
    if (!editingId) return;
    try {
      await updateLink.mutateAsync({
        id: editingId,
        data: {
          targetType: form.targetType,
          targetId: form.targetId,
          targetLabel: form.targetLabel,
          triggerOn: form.triggerOn,
          priority: form.priority,
          entryNode: form.entryNode,
          versionSelection: form.versionSelection,
          specificVersion: form.versionSelection === 'specific' ? (form.specificVersion || flowVersion) : null,
        },
      });
      toast.success('Link updated');
      setEditingId(null);
    } catch (err) {
      toast.error('Failed to update link');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
      </div>
    );
  }

  const versionLabel = (link) => {
    switch (link.versionSelection) {
      case 'published': return 'Published';
      case 'draft': return 'Draft';
      case 'specific': return `v${link.specificVersion || '?'}`;
      default: return 'Latest';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-semibold text-foreground">Module Links</h3>
          <span className="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-full">
            {links.length}
          </span>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); }}
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-[10px] font-medium transition-all"
        >
          <Plus className="w-3 h-3" />
          Link
        </button>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2 p-2.5 rounded-lg bg-blue-500/5 border border-blue-500/20">
        <Zap className="w-3 h-3 text-blue-400 shrink-0 mt-0.5" />
        <p className="text-[10px] text-blue-400 leading-relaxed">
          Links are permanently saved. They persist across refresh, restart, logout, and deployment.
        </p>
      </div>

      {/* Create/Edit form */}
      {(showForm || editingId) && (
        <div className="p-3 rounded-lg border border-border/40 bg-muted/20 space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Target Type</label>
              <select
                value={form.targetType}
                onChange={(e) => setForm(f => ({ ...f, targetType: e.target.value }))}
                className="w-full px-2 py-1.5 rounded-lg bg-muted/50 border border-border/40 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                {TARGET_TYPE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Target ID</label>
              <input
                type="text"
                value={form.targetId}
                onChange={(e) => setForm(f => ({ ...f, targetId: e.target.value }))}
                placeholder="e.g. admin_login, student_module"
                className="w-full px-2 py-1.5 rounded-lg bg-muted/50 border border-border/40 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Label</label>
            <input
              type="text"
              value={form.targetLabel}
              onChange={(e) => setForm(f => ({ ...f, targetLabel: e.target.value }))}
              placeholder="e.g. Admin Login"
              className="w-full px-2 py-1.5 rounded-lg bg-muted/50 border border-border/40 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Trigger</label>
              <select
                value={form.triggerOn}
                onChange={(e) => setForm(f => ({ ...f, triggerOn: e.target.value }))}
                className="w-full px-2 py-1.5 rounded-lg bg-muted/50 border border-border/40 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                {TRIGGER_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="w-20">
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Priority</label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.priority}
                onChange={(e) => setForm(f => ({ ...f, priority: parseInt(e.target.value) || 0 }))}
                className="w-full px-2 py-1.5 rounded-lg bg-muted/50 border border-border/40 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>
          </div>

          {/* Version Selection */}
          <div>
            <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Version</label>
            <div className="flex gap-2">
              <select
                value={form.versionSelection}
                onChange={(e) => setForm(f => ({ ...f, versionSelection: e.target.value }))}
                className="flex-1 px-2 py-1.5 rounded-lg bg-muted/50 border border-border/40 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                {VERSION_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              {form.versionSelection === 'specific' && (
                <input
                  type="number"
                  min={1}
                  value={form.specificVersion || flowVersion}
                  onChange={(e) => setForm(f => ({ ...f, specificVersion: parseInt(e.target.value) || 1 }))}
                  className="w-20 px-2 py-1.5 rounded-lg bg-muted/50 border border-border/40 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                />
              )}
            </div>
          </div>

          {/* Entry Node */}
          {entryNodes.length > 0 && (
            <div>
              <label className="text-[10px] font-medium text-muted-foreground mb-1 block">Entry Node</label>
              <select
                value={form.entryNode}
                onChange={(e) => setForm(f => ({ ...f, entryNode: e.target.value }))}
                className="w-full px-2 py-1.5 rounded-lg bg-muted/50 border border-border/40 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="">Default (Start node)</option>
                {entryNodes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.data?.label || node.id}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={editingId ? handleEditSave : handleCreate}
              disabled={createLink.isPending || updateLink.isPending}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-500 text-white hover:bg-indigo-600 text-[10px] font-medium transition-all disabled:opacity-50"
            >
              {(createLink.isPending || updateLink.isPending) ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
              {editingId ? 'Update Link' : 'Save Link'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditingId(null); }}
              className="px-3 py-1.5 rounded-lg bg-muted/50 text-muted-foreground hover:bg-muted/80 text-[10px] font-medium transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Existing links */}
      {links.length === 0 && !showForm ? (
        <div className="text-center py-6">
          <Link2 className="w-6 h-6 text-muted-foreground/30 mx-auto mb-1.5" />
          <p className="text-xs text-muted-foreground">No module links yet</p>
          <p className="text-[10px] text-muted-foreground/60 mt-0.5">
            Link this workflow to pages, modules, or events
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {links.map((link) => {
            const typeOpt = TARGET_TYPE_OPTIONS.find(t => t.value === link.targetType);
            return (
              <div
                key={link._id}
                className={cn(
                  'flex items-center gap-2 p-2.5 rounded-lg border transition-all',
                  link.enabled
                    ? 'border-border/40 bg-card/30'
                    : 'border-border/20 bg-muted/20 opacity-60'
                )}
              >
                {/* Toggle */}
                <button
                  onClick={() => handleToggle(link._id)}
                  className="shrink-0"
                  title={link.enabled ? 'Disable' : 'Enable'}
                >
                  {link.enabled
                    ? <ToggleRight className="w-5 h-5 text-green-500" />
                    : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 uppercase">
                      {typeOpt?.label || link.targetType}
                    </span>
                    <span className="text-xs text-foreground font-medium truncate">
                      {link.targetLabel || link.targetId}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-[9px] text-muted-foreground">
                      Trigger: {link.triggerOn}
                    </span>
                    <span className="text-[9px] text-muted-foreground">
                      Priority: {link.priority}
                    </span>
                    <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                      {versionLabel(link)}
                    </span>
                    {link.entryNode && (
                      <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
                        <GitBranch className="w-2.5 h-2.5" />
                        Entry: {link.entryNode?.slice(0, 8)}...
                      </span>
                    )}
                  </div>
                </div>

                {/* Trigger select */}
                <select
                  value={link.triggerOn}
                  onChange={(e) => handleUpdateField(link._id, 'triggerOn', e.target.value)}
                  className="px-1.5 py-1 rounded bg-muted/50 border border-border/40 text-[10px] text-foreground focus:outline-none"
                >
                  {TRIGGER_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                {/* Version select */}
                <select
                  value={link.versionSelection || 'latest'}
                  onChange={(e) => handleUpdateField(link._id, 'versionSelection', e.target.value)}
                  className="px-1.5 py-1 rounded bg-muted/50 border border-border/40 text-[10px] text-foreground focus:outline-none"
                  title="Version"
                >
                  {VERSION_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                {/* Edit */}
                <button
                  onClick={() => startEdit(link)}
                  className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all shrink-0"
                  title="Edit"
                >
                  <Settings className="w-3 h-3" />
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(link._id)}
                  className="p-1 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default memo(WorkflowLinkManager);
