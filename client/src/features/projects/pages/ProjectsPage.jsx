import React, { useState } from 'react';
import { Search, FolderPlus, Grid, List } from 'lucide-react';
import { useProjects, useProjectMutations } from '@/hooks/useProjects';
import PageHeader from '@/components/shared/PageHeader';
import ProjectCard from '../components/ProjectCard';
import ProjectDialog from '../components/ProjectDialog';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

const ProjectsPage = () => {
  const { data: projects, isLoading, error, refetch } = useProjects();
  const { createProject, updateProject, deleteProject, toggleFavorite } = useProjectMutations();

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeProject, setActiveProject] = useState(null); // null means creating

  // ConfirmDialog state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  if (isLoading) {
    return <LoadingSpinner message="Retrieving your workspaces..." />;
  }

  if (error) {
    return (
      <ErrorState
        title="Failed to retrieve projects"
        message={error.message || 'Check your database server connections.'}
        onRetry={refetch}
      />
    );
  }

  const handleCreateClick = () => {
    setActiveProject(null);
    setIsDialogOpen(true);
  };

  const handleEditClick = (project) => {
    setActiveProject(project);
    setIsDialogOpen(true);
  };

  const handleDialogSubmit = async (formData) => {
    try {
      if (activeProject) {
        // Edit mode
        await updateProject({ id: activeProject._id, data: formData });
      } else {
        // Create mode
        await createProject(formData);
      }
    } catch (err) {
      console.error('Failed to save project:', err);
    }
  };

  const handleDeleteClick = (id) => {
    setProjectToDelete(id);
    setIsConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (projectToDelete) {
      try {
        await deleteProject(projectToDelete);
      } catch (err) {
        console.error('Failed to delete project:', err);
      } finally {
        setProjectToDelete(null);
      }
    }
  };

  // Filter & Search Logic
  const filteredProjects = projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.tags?.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      statusFilter === 'all' || project.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title="Projects"
          description="Manage and track your developer project workspaces."
        />
        <button
          onClick={handleCreateClick}
          className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary/95 active:scale-95 transition-all shadow-md cursor-pointer shrink-0"
        >
          <FolderPlus className="h-4.5 w-4.5" />
          <span>New Project</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border/40 bg-card/45 p-4 backdrop-blur-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
          <input
            type="text"
            placeholder="Search by project name or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background/50 pl-10 pr-4 py-2 text-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus:border-primary/50 transition-all duration-150"
          />
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto p-0.5 rounded-lg border border-border/40 bg-background/30 max-w-max">
          {['all', 'active', 'on-hold', 'completed'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                statusFilter === status
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Project Cards Grid */}
      {filteredProjects.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project._id}
              project={project}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={FolderPlus}
          title={searchQuery || statusFilter !== 'all' ? 'No projects matched' : 'Create a workspace'}
          description={
            searchQuery || statusFilter !== 'all'
              ? 'Try modifying your search query or filter options.'
              : 'Create your first project workspace to begin organizing tasks.'
          }
          actionLabel={searchQuery || statusFilter !== 'all' ? null : 'Create Project'}
          onAction={handleCreateClick}
        />
      )}

      {/* Create / Edit Dialog Modal */}
      <ProjectDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleDialogSubmit}
        project={activeProject}
      />

      {/* Custom Confirm Dialog Modal */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => {
          setIsConfirmOpen(false);
          setProjectToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Workspace Project"
        description="Are you sure you want to move this project to the trash? You can restore it later from the trash bin."
      />
    </div>
  );
};

export default ProjectsPage;
