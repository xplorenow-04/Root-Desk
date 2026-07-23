import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, Calendar, Settings, Layout, ListTodo, FileText, BarChart2 } from 'lucide-react';
import { useProject, useProjectMutations } from '@/hooks/useProjects';
import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import HierarchyTree from '@/features/nodes/components/HierarchyTree';
import ProjectChecklist from '../components/ProjectChecklist';
import ProjectNotes from '../components/ProjectNotes';

const ProjectDetailPage = () => {
  const { id } = useParams();
  const { data: project, isLoading, error, refetch } = useProject(id);
  const { toggleFavorite } = useProjectMutations();
  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) {
    return <LoadingSpinner message="Opening project dashboard..." />;
  }

  if (error || !project) {
    return (
      <ErrorState
        title="Project not found"
        message={error?.message || 'This workspace may have been deleted or moved.'}
        onRetry={refetch}
      />
    );
  }

  const handleFavoriteClick = async () => {
    try {
      await toggleFavorite(project._id);
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case 'archived':
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
      case 'on-hold':
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      default:
        return 'bg-primary/10 text-primary border border-primary/20';
    }
  };

  // Render tab contents (placeholder templates to be expanded in subsequent phases)
  const renderTabContent = () => {
    switch (activeTab) {
      case 'hierarchy':
        return <HierarchyTree projectId={project._id} />;
      case 'checklist':
        return <ProjectChecklist projectId={project._id} />;
      case 'notes':
        return <ProjectNotes projectId={project._id} />;
      default:
        return (
          <div className="grid gap-6 md:grid-cols-3">
            {/* Project Info Block */}
            <div className="md:col-span-2 space-y-6">
              <div className="rounded-xl border border-border/40 bg-card/45 p-6 backdrop-blur-sm space-y-4">
                <h3 className="text-lg font-bold text-foreground">Project Overview</h3>
                {project.description ? (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {project.description}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground/50 italic">
                    No project description provided. Add one by editing this project.
                  </p>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  {project.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground uppercase tracking-wide border border-border/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Metrics Sidebar Block */}
            <div className="space-y-6">
              <div className="rounded-xl border border-border/40 bg-card/45 p-6 backdrop-blur-sm space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground/80">
                  Workspace Metrics
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Status</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-semibold text-foreground">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last Update</span>
                    <span className="font-semibold text-foreground">
                      {new Date(project.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart2 },
    { id: 'hierarchy', label: 'Task Hierarchy', icon: Layout },
    { id: 'checklist', label: 'Checklist', icon: ListTodo },
    { id: 'notes', label: 'Notes', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Back button and Favorite toggler */}
      <div className="flex items-center justify-between">
        <Link
          to="/projects"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Projects</span>
        </Link>

        <button
          onClick={handleFavoriteClick}
          className={`flex items-center gap-1.5 rounded-lg border border-border/40 px-3 py-1.5 text-xs font-bold hover:bg-muted active:scale-95 transition-all cursor-pointer ${
            project.isFavorite ? 'text-amber-500' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Star className="h-4 w-4" fill={project.isFavorite ? 'currentColor' : 'none'} />
          <span>{project.isFavorite ? 'Pinned' : 'Pin Project'}</span>
        </button>
      </div>

      {/* Main Page Header */}
      <PageHeader
        title={project.name}
        description={
          <span className="flex items-center gap-1.5 text-xs font-mono">
            <Calendar className="h-3.5 w-3.5" />
            <span>Workspace ID: {project._id}</span>
          </span>
        }
      />

      {/* Custom Tabs Navigation */}
      <div className="border-b border-border/30">
        <nav className="flex space-x-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 border-b-2 py-4 text-sm font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:border-border/60 hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Render active tab contents */}
      <div className="pt-2">{renderTabContent()}</div>
    </div>
  );
};

export default ProjectDetailPage;
