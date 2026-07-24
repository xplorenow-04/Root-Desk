import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutTemplate, Search, Clock, Users, Star, ArrowRight } from 'lucide-react';
import PageHeader from '../../../components/shared/PageHeader';
import { useTemplates, useCreateFlowFromTemplate } from '../hooks/useFlows';
import { TEMPLATE_CATEGORIES } from '../../../constants/flowTypes';
import { cn } from '../../../lib/utils';
import { pageVariants } from '../../../lib/animations';
import { toast } from 'sonner';
import LoadingSpinner from '../../../components/shared/LoadingSpinner';
import EmptyState from '../../../components/shared/EmptyState';

const FlowTemplatesPage = () => {
  const navigate = useNavigate();
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useTemplates({ category: category || undefined });
  const createFromTemplate = useCreateFlowFromTemplate();

  const handleUseTemplate = async (templateId) => {
    try {
      const flow = await createFromTemplate.mutateAsync(templateId);
      toast.success('Flow created from template');
      navigate(`/automation/flows/${flow._id}`);
    } catch (err) {
      toast.error('Failed to create flow from template');
    }
  };

  const templates = data?.templates || [];
  const filteredTemplates = search
    ? templates.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase())
      )
    : templates;

  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" className="space-y-6">
      <PageHeader
        title="Flow Templates"
        description="Start with a pre-built template"
        icon={LayoutTemplate}
      />

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search templates..."
          className="w-full pl-9 pr-4 py-2 rounded-xl border border-border/40 bg-card/45 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setCategory('')}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
            !category
              ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
              : 'bg-muted/30 border-border/40 text-muted-foreground hover:border-muted-foreground/30'
          )}
        >
          All
        </button>
        {TEMPLATE_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-all',
              category === cat.value
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                : 'bg-muted/30 border-border/40 text-muted-foreground hover:border-muted-foreground/30'
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : filteredTemplates.length === 0 ? (
        <EmptyState
          icon={LayoutTemplate}
          title="No templates found"
          description={search ? 'Try a different search term' : 'No templates available in this category'}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <div
              key={template._id}
              className="group relative rounded-xl border border-border/40 bg-card/45 backdrop-blur-sm p-5 hover:border-indigo-500/30 hover:bg-card/60 transition-all"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                  <LayoutTemplate className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">
                    {template.name}
                  </h3>
                  <p className="text-xs text-muted-foreground capitalize">{template.category}</p>
                </div>
              </div>

              {template.description && (
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                  {template.description}
                </p>
              )}

              <div className="flex items-center gap-3 text-[10px] text-muted-foreground mb-4">
                {template.metadata?.estimatedDuration && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    ~{template.metadata.estimatedDuration}s
                  </span>
                )}
                {template.metadata?.difficulty && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    {template.metadata.difficulty}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  {template.metadata?.popularity || 0} uses
                </span>
              </div>

              <button
                onClick={() => handleUseTemplate(template._id)}
                className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-xs font-medium transition-all opacity-0 group-hover:opacity-100"
              >
                Use Template
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default FlowTemplatesPage;
