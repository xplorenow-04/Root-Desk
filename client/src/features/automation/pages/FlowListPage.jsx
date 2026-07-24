import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Search, Download, Upload, SlidersHorizontal, Workflow } from 'lucide-react';
import PageHeader from '../../../components/shared/PageHeader';
import { useFlows, useCreateFlow, useDeleteFlow, useDuplicateFlow, useArchiveFlow, useExportFlow, useImportFlow, useRunFlow } from '../hooks/useFlows';
import FlowList from '../components/FlowList';
import FlowDialog from '../components/FlowDialog';
import { FLOW_STATUSES, FLOW_SORT_OPTIONS } from '../../../constants/flowTypes';
import { cn } from '../../../lib/utils';
import { pageVariants } from '../../../lib/animations';
import { toast } from 'sonner';

const FlowListPage = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sort, setSort] = useState('updatedAt');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);

  const { data, isLoading } = useFlows({ search: search || undefined, status: statusFilter || undefined, sort, page, limit: 20 });
  const createFlow = useCreateFlow();
  const deleteFlow = useDeleteFlow();
  const duplicateFlow = useDuplicateFlow();
  const archiveFlow = useArchiveFlow();
  const exportFlow = useExportFlow();
  const importFlow = useImportFlow();
  const runFlow = useRunFlow();

  const handleCreate = async (data) => {
    try {
      const flow = await createFlow.mutateAsync(data);
      toast.success('Flow created successfully');
      setDialogOpen(false);
      navigate(`/automation/flows/${flow._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create flow');
    }
  };

  const handleDelete = useCallback(async (id) => {
    if (!window.confirm('Are you sure you want to delete this flow?')) return;
    try {
      await deleteFlow.mutateAsync(id);
      toast.success('Flow deleted');
    } catch (err) {
      toast.error('Failed to delete flow');
    }
  }, [deleteFlow]);

  const handleDuplicate = useCallback(async (id) => {
    try {
      await duplicateFlow.mutateAsync(id);
      toast.success('Flow duplicated');
    } catch (err) {
      toast.error('Failed to duplicate flow');
    }
  }, [duplicateFlow]);

  const handleArchive = useCallback(async (id) => {
    try {
      await archiveFlow.mutateAsync(id);
      toast.success('Flow updated');
    } catch (err) {
      toast.error('Failed to update flow');
    }
  }, [archiveFlow]);

  const handleExport = useCallback(async (id) => {
    try {
      const data = await exportFlow.mutateAsync(id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${data.flow.name.replace(/\s+/g, '_')}_flow.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Flow exported');
    } catch (err) {
      toast.error('Failed to export flow');
    }
  }, [exportFlow]);

  const handleImport = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importFlow.mutateAsync(data);
      toast.success('Flow imported successfully');
    } catch (err) {
      toast.error('Failed to import flow');
    }
    e.target.value = '';
  }, [importFlow]);

  const handleRun = useCallback(async (id) => {
    try {
      await runFlow.mutateAsync({ id, data: {} });
      toast.success('Flow execution started');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to run flow');
    }
  }, [runFlow]);

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6">
      <PageHeader
        title="Flows"
        description="Create and manage automation flows"
        icon={Workflow}
        actions={
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/40 text-sm text-muted-foreground hover:bg-muted/50 transition-all cursor-pointer">
              <Download className="w-4 h-4" />
              Import
              <input type="file" accept=".json" onChange={handleImport} className="hidden" />
            </label>
            <button
              onClick={() => setDialogOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-sm font-medium transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              Create Flow
            </button>
          </div>
        }
      />

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search flows..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border/40 bg-card/45 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            'p-2 rounded-xl border transition-all',
            showFilters
              ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400'
              : 'border-border/40 text-muted-foreground hover:bg-muted/50'
          )}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>

      {showFilters && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          className="flex items-center gap-3 overflow-hidden"
        >
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-1.5 rounded-lg bg-muted/50 border border-border/40 text-xs text-foreground focus:outline-none"
            >
              <option value="">All</option>
              {FLOW_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Sort:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-muted/50 border border-border/40 text-xs text-foreground focus:outline-none"
            >
              {FLOW_SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>
        </motion.div>
      )}

      <FlowList
        flows={data?.flows}
        isLoading={isLoading}
        pagination={data?.pagination}
        onPageChange={setPage}
        onRun={handleRun}
        onDuplicate={handleDuplicate}
        onArchive={handleArchive}
        onExport={handleExport}
        onDelete={handleDelete}
      />

      <FlowDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleCreate}
        mode="create"
      />
    </motion.div>
  );
};

export default FlowListPage;
