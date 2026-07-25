import { useState, useRef, useEffect, memo } from 'react';
import { useNavigate } from 'react-router-dom';
import { GitBranch, ExternalLink, Search } from 'lucide-react';
import { useCreateWorkflowLink } from '@/features/automation/hooks/useWorkflowLinks';
import { useFlows } from '@/features/automation/hooks/useFlows';
import { cn } from '@/lib/utils';

const NodeFlowLink = ({ nodeId, nodeType, linkedFlow }) => {
  const navigate = useNavigate();
  const createLink = useCreateWorkflowLink();
  const [showPicker, setShowPicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: flowsData } = useFlows({ search: searchQuery || undefined, limit: 100 });
  const pickerRef = useRef(null);

  const linkedFlowId = linkedFlow?.flowId?._id || linkedFlow?.flowId;
  const linkedFlowName = linkedFlow?.flowId?.name || linkedFlow?.targetLabel || 'Linked Flow';

  const flows = flowsData?.data?.flows || flowsData?.flows || [];

  const handleClick = () => {
    if (linkedFlowId) {
      navigate(`/automation/flows/${linkedFlowId}`);
    } else {
      setShowPicker(true);
    }
  };

  const handleLinkFlow = async (flowId, flowName) => {
    try {
      await createLink.mutateAsync({
        flowId,
        targetType: nodeType,
        targetId: String(nodeId),
        targetLabel: flowName,
        enabled: true,
      });
      setShowPicker(false);
      navigate(`/automation/flows/${flowId}`);
    } catch (err) {
      console.error('Failed to link flow:', err);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    };
    if (showPicker) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [showPicker]);

  const filteredFlows = flows.filter((f) =>
    f.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative inline-flex" ref={pickerRef}>
      <button
        onClick={handleClick}
        title={linkedFlowId ? `Open flow: ${linkedFlowName}` : 'Link to a flow'}
        className={cn(
          'p-1 rounded transition-all',
          linkedFlowId
            ? 'text-indigo-400 hover:bg-indigo-500/10'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )}
      >
        <GitBranch className="h-3.5 w-3.5" />
      </button>

      {showPicker && !linkedFlowId && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-card border border-border/40 rounded-xl shadow-xl backdrop-blur-xl z-[70] p-3">
          <div className="text-xs font-medium text-foreground mb-2">Link to Flow</div>
          <div className="relative mb-2">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search flows..."
              autoFocus
              className="w-full pl-7 pr-2 py-1.5 rounded-lg bg-muted/50 border border-border/40 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {filteredFlows.length === 0 ? (
              <p className="text-[10px] text-muted-foreground text-center py-3">No flows found</p>
            ) : (
              filteredFlows.slice(0, 20).map((flow) => (
                <button
                  key={flow._id}
                  onClick={() => handleLinkFlow(flow._id, flow.name)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-xs text-foreground hover:bg-muted/50 transition-all text-left"
                >
                  <GitBranch className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span className="truncate flex-1">{flow.name}</span>
                  <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default memo(NodeFlowLink);