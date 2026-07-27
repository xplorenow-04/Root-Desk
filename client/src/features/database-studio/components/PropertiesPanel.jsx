import React from 'react';
import { motion } from 'framer-motion';
import { Settings, Plus, Trash2, Key, Link2, AlertCircle, PanelRightClose, PanelRightOpen } from 'lucide-react';

const COMMON_TYPES = [
  'integer',
  'varchar',
  'text',
  'timestamp',
  'boolean',
  'date',
  'decimal',
  'uuid',
];

const PRESET_COLORS = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#f43f5e', // Rose
  '#64748b', // Slate
];

const PropertiesPanel = ({
  selectedNode = null,
  selectedEdge = null,
  onUpdateTable,
  onDeleteTable,
  onUpdateRelationship,
  onDeleteRelationship,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const hasSelection = selectedNode || selectedEdge;

  // Collapsed state - thin strip
  if (isCollapsed) {
    return (
      <motion.div
        initial={{ width: 320 }}
        animate={{ width: 48 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="flex flex-col items-center h-full bg-card border-l border-border/40 text-foreground shrink-0 overflow-hidden"
      >
        <div className="flex flex-col items-center gap-2 p-2 border-b border-border/20 w-full shrink-0">
          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
            title="Expand properties panel"
          >
            <PanelRightOpen className="h-4 w-4" />
          </button>
        </div>
        {hasSelection && (
          <div className="flex flex-col items-center gap-1 pt-2">
            {selectedNode && <Settings className="h-4 w-4 text-primary" />}
            {selectedEdge && <Link2 className="h-4 w-4 text-indigo-400" />}
          </div>
        )}
      </motion.div>
    );
  }

  // Expanded state - full content
  const panelContent = (() => {
    // If nothing is selected
    if (!selectedNode && !selectedEdge) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground/75 p-6 text-center">
          <Settings className="h-10 w-10 text-border mb-3" />
          <span className="font-bold text-sm text-foreground/80">Properties Panel</span>
          <span className="text-xs text-muted-foreground mt-1">
            Select a table or relationship connector on the canvas to configure properties.
          </span>
        </div>
      );
    }

    // ── Handle Relationship/Edge Selected ──
    if (selectedEdge) {
      const { fromTable, fromField, toTable, toField, type } = selectedEdge.data || {};

      return (
        <>
          <div className="flex items-center gap-2 p-4 border-b border-border/20 shrink-0">
            <Link2 className="h-4 w-4 text-indigo-400" />
            <span className="font-bold text-sm">Configure Relationship</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
            <div className="space-y-1.5 p-3 rounded-lg border border-border/40 bg-muted/20">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Source</span>
              <span className="text-xs font-semibold">{fromTable}.{fromField}</span>
            </div>

            <div className="space-y-1.5 p-3 rounded-lg border border-border/40 bg-muted/20">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Target</span>
              <span className="text-xs font-semibold">{toTable}.{toField}</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Relationship Type
              </label>
              <select
                value={type || 'many-to-one'}
                onChange={(e) => onUpdateRelationship(selectedEdge.id, { type: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                <option value="many-to-one">Many-to-One (&gt;)</option>
                <option value="one-to-many">One-to-Many (&lt;)</option>
                <option value="one-to-one">One-to-One (-)</option>
              </select>
            </div>

            <div className="pt-4">
              <button
                onClick={() => onDeleteRelationship(selectedEdge.id)}
                className="flex w-full h-9 items-center justify-center gap-1.5 rounded-lg border border-destructive/30 hover:border-destructive text-destructive hover:bg-destructive/10 text-xs font-bold transition-all cursor-pointer active:scale-95"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Connection</span>
              </button>
            </div>
          </div>
        </>
      );
    }

    // ── Handle Table/Node Selected ──
    const table = selectedNode.data;

    const handleTableNameChange = (e) => {
      onUpdateTable(selectedNode.id, { ...table, name: e.target.value });
    };

    const handleTableColorChange = (color) => {
      onUpdateTable(selectedNode.id, { ...table, color });
    };

    const handleAddField = () => {
      const newField = {
        name: `field_${table.fields.length + 1}`,
        type: 'integer',
        isPk: false,
        isIncrement: false,
        isUnique: false,
        isNullable: true,
        defaultVal: '',
      };
      onUpdateTable(selectedNode.id, {
        ...table,
        fields: [...table.fields, newField],
      });
    };

    const handleUpdateField = (index, fieldUpdate) => {
      const updatedFields = [...table.fields];
      updatedFields[index] = { ...updatedFields[index], ...fieldUpdate };
      onUpdateTable(selectedNode.id, {
        ...table,
        fields: updatedFields,
      });
    };

    const handleDeleteField = (index) => {
      const updatedFields = table.fields.filter((_, idx) => idx !== index);
      onUpdateTable(selectedNode.id, {
        ...table,
        fields: updatedFields,
      });
    };

    return (
      <>
        <div className="flex items-center gap-2 p-4 border-b border-border/20 shrink-0">
          <Settings className="h-4 w-4 text-primary" />
          <span className="font-bold text-sm select-none">Table Configuration</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          {/* Table Details */}
          <div className="space-y-3 pb-3 border-b border-border/10">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Table Name
              </label>
              <input
                type="text"
                value={table.name}
                onChange={handleTableNameChange}
                className="flex h-9 w-full rounded-md border border-input bg-background/50 px-3 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Theme Color</span>
              <div className="flex items-center gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleTableColorChange(c)}
                    style={{ backgroundColor: c }}
                    className={`h-5 w-5 rounded-full border border-white/10 hover:scale-110 active:scale-95 transition-all cursor-pointer ${
                      table.color === c ? 'ring-2 ring-primary ring-offset-1 ring-offset-background' : ''
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Columns Editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Columns</span>
              <button
                onClick={handleAddField}
                className="flex items-center gap-1 px-2 py-1 rounded bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary text-[10px] font-bold tracking-wide transition-all cursor-pointer"
              >
                <Plus className="h-3 w-3" />
                <span>Add</span>
              </button>
            </div>

            <div className="space-y-3.5">
              {table.fields.map((field, index) => (
                <div key={index} className="p-3 rounded-lg border border-border/40 bg-background/40 space-y-2.5 relative group">
                  <button
                    onClick={() => handleDeleteField(index)}
                    className="absolute top-2 right-2 p-1 rounded text-muted-foreground hover:bg-destructive/15 hover:text-destructive opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    title="Remove Column"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>

                  {/* Column Name */}
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) => handleUpdateField(index, { name: e.target.value })}
                      className="flex h-7 w-[80%] rounded border border-border/60 bg-background px-2 py-1 text-xs focus:outline-none"
                      placeholder="column_name"
                    />
                  </div>

                  {/* Column Type */}
                  <div className="grid grid-cols-2 gap-2">
                    <select
                      value={COMMON_TYPES.includes(field.type) ? field.type : 'custom'}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleUpdateField(index, { type: val === 'custom' ? 'varchar' : val });
                      }}
                      className="flex h-7 rounded border border-border/60 bg-background px-2 text-[11px] focus:outline-none cursor-pointer"
                    >
                      {COMMON_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                      <option value="custom">Other / Custom</option>
                    </select>

                    {/* If custom is selected, show input */}
                    {!COMMON_TYPES.includes(field.type) && (
                      <input
                        type="text"
                        value={field.type}
                        onChange={(e) => handleUpdateField(index, { type: e.target.value })}
                        className="flex h-7 rounded border border-border/60 bg-background px-2 py-1 text-xs focus:outline-none"
                        placeholder="varchar(50)"
                      />
                    )}
                  </div>

                  {/* Constraints Flags */}
                  <div className="flex items-center gap-3 pt-0.5 select-none">
                    {/* PK Flag */}
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.isPk}
                        onChange={(e) => handleUpdateField(index, { isPk: e.target.checked })}
                        className="h-3 w-3 rounded text-primary focus:ring-0 cursor-pointer"
                      />
                      <Key className="h-3 w-3 text-amber-500" title="Primary Key" />
                    </label>

                    {/* Nullable Flag */}
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.isNullable}
                        onChange={(e) => handleUpdateField(index, { isNullable: e.target.checked })}
                        className="h-3 w-3 rounded text-primary focus:ring-0 cursor-pointer"
                      />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Null</span>
                    </label>

                    {/* Unique Flag */}
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.isUnique}
                        onChange={(e) => handleUpdateField(index, { isUnique: e.target.checked })}
                        className="h-3 w-3 rounded text-primary focus:ring-0 cursor-pointer"
                      />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Unq</span>
                    </label>

                    {/* Auto Increment Flag */}
                    {(field.type === 'integer' || field.type === 'int') && (
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.isIncrement}
                          onChange={(e) => handleUpdateField(index, { isIncrement: e.target.checked })}
                          className="h-3 w-3 rounded text-primary focus:ring-0 cursor-pointer"
                        />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase" title="Auto Increment">Inc</span>
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="pt-6 border-t border-border/10">
            <button
              onClick={() => onDeleteTable(selectedNode.id)}
              className="flex w-full h-9 items-center justify-center gap-1.5 rounded-lg border border-destructive/30 hover:border-destructive text-destructive hover:bg-destructive/10 text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Drop Table</span>
            </button>
          </div>
        </div>
      </>
    );
  })();

  return (
    <motion.div
      initial={{ width: 48 }}
      animate={{ width: 320 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="flex flex-col h-full bg-card border-l border-border/40 text-foreground select-none shrink-0 overflow-hidden"
    >
      {/* Collapse Toggle */}
      <div className="flex items-center justify-end p-2 border-b border-border/20 shrink-0">
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all cursor-pointer"
          title="Collapse properties panel"
        >
          <PanelRightClose className="h-4 w-4" />
        </button>
      </div>
      {panelContent}
    </motion.div>
  );
};

export default PropertiesPanel;
