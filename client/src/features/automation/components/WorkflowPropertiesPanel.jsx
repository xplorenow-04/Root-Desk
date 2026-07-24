import { memo, useState } from 'react';
import {
  Settings, Tag, Users, Shield, Link2, Clock, User, Hash, Palette,
} from 'lucide-react';
import { FLOW_STATUSES, ROLES, ENTRY_POINTS, TEMPLATE_CATEGORIES, MODULE_LINK_TARGETS } from '../../../constants/flowTypes';
import { cn } from '../../../lib/utils';

/**
 * Professional properties panel for workflow metadata editing.
 */
const WorkflowPropertiesPanel = ({
  flow,
  onUpdate,
}) => {
  if (!flow) return null;

  const handleFieldChange = (field, value) => {
    onUpdate?.({ [field]: value });
  };

  const handleNestedChange = (parent, field, value) => {
    onUpdate?.({
      [parent]: { ...flow[parent], [field]: value },
    });
  };

  const handleTagsChange = (tagsString) => {
    const tags = tagsString.split(',').map(t => t.trim()).filter(Boolean);
    handleFieldChange('tags', tags);
  };

  const handleEntryPointToggle = (ep) => {
    const current = flow.entryPoints || [];
    const next = current.includes(ep)
      ? current.filter(e => e !== ep)
      : [...current, ep];
    handleFieldChange('entryPoints', next);
  };

  const handleRoleToggle = (role) => {
    const current = flow.permissions?.allowedRoles || [];
    const next = current.includes(role)
      ? current.filter(r => r !== role)
      : [...current, role];
    handleNestedChange('permissions', 'allowedRoles', next);
  };

  return (
    <div className="space-y-5">
      {/* Name */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Workflow Name</label>
        <input
          type="text"
          value={flow.name || ''}
          onChange={(e) => handleFieldChange('name', e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Description</label>
        <textarea
          value={flow.description || ''}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
        />
      </div>

      {/* Status */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Status</label>
        <select
          value={flow.status || 'draft'}
          onChange={(e) => handleFieldChange('status', e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          {FLOW_STATUSES.map(s => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {/* Category */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
        <select
          value={flow.metadata?.category || ''}
          onChange={(e) => handleNestedChange('metadata', 'category', e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        >
          <option value="">Select category...</option>
          {TEMPLATE_CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Tags */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <Tag className="w-3 h-3" /> Tags
        </label>
        <input
          type="text"
          value={(flow.tags || []).join(', ')}
          onChange={(e) => handleTagsChange(e.target.value)}
          placeholder="tag1, tag2, tag3"
          className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
        {flow.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {flow.tags.map(tag => (
              <span key={tag} className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Color */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <Palette className="w-3 h-3" /> Color
        </label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={flow.metadata?.color || '#6366f1'}
            onChange={(e) => handleNestedChange('metadata', 'color', e.target.value)}
            className="w-8 h-8 rounded-lg border border-border/40 cursor-pointer"
          />
          <span className="text-xs text-muted-foreground font-mono">{flow.metadata?.color || '#6366f1'}</span>
        </div>
      </div>

      {/* Entry Points */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <Link2 className="w-3 h-3" /> Entry Points
        </label>
        <div className="flex flex-wrap gap-1.5">
          {ENTRY_POINTS.map(ep => {
            const isActive = (flow.entryPoints || []).includes(ep.value);
            return (
              <button
                key={ep.value}
                onClick={() => handleEntryPointToggle(ep.value)}
                className={cn(
                  'text-[10px] px-2 py-1 rounded-lg border transition-all font-medium',
                  isActive
                    ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-400'
                    : 'bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted/50'
                )}
              >
                {ep.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Permissions */}
      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
          <Shield className="w-3 h-3" /> Allowed Roles
        </label>
        <div className="flex flex-wrap gap-1.5">
          {ROLES.map(role => {
            const isActive = (flow.permissions?.allowedRoles || []).includes(role.value);
            return (
              <button
                key={role.value}
                onClick={() => handleRoleToggle(role.value)}
                className={cn(
                  'text-[10px] px-2 py-1 rounded-lg border transition-all font-medium',
                  isActive
                    ? 'bg-green-500/10 border-green-500/40 text-green-400'
                    : 'bg-muted/30 border-border/40 text-muted-foreground hover:bg-muted/50'
                )}
              >
                {role.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Metadata info */}
      <div className="border-t border-border/40 pt-4 space-y-2">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Info</p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground flex items-center gap-1"><Hash className="w-2.5 h-2.5" /> Version</span>
            <span className="text-foreground font-medium">v{flow.version || 1}</span>
          </div>
          {flow.createdBy && (
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground flex items-center gap-1"><User className="w-2.5 h-2.5" /> Created by</span>
              <span className="text-foreground">{flow.createdBy.name || flow.createdBy}</span>
            </div>
          )}
          {flow.createdAt && (
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> Created</span>
              <span className="text-foreground">{new Date(flow.createdAt).toLocaleDateString()}</span>
            </div>
          )}
          {flow.updatedAt && (
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground flex items-center gap-1"><Clock className="w-2.5 h-2.5" /> Updated</span>
              <span className="text-foreground">{new Date(flow.updatedAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default memo(WorkflowPropertiesPanel);
