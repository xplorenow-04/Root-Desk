import React, { useState } from 'react';
import { Clock } from 'lucide-react';
import { useProjects, useProjectMutations } from '@/hooks/useProjects';
import PageHeader from '@/components/shared/PageHeader';
import ProjectCard from '@/features/projects/components/ProjectCard';
import ProjectDialog from '@/features/projects/components/ProjectDialog';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

const RecentPage = () => {
  const { data: projects, isLoading, error, refetch } = useProjects();
  const { updateProject, deleteProject, toggleFavorite } = useProjectMutations();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeProject, setActiveProject] = useState(null);

  // ConfirmDialog state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  if (isLoading) {
    return <LoadingSpinner message="Loading recent activity..." />;
  }

  if (error) {
    return <ErrorState message={error.message || 'Failed to load recent projects'} onRetry={refetch} />;
  }

  // Sort projects by updatedAt in descending order
  const recentProjects = [...(projects || [])].sort(
    (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)
  );

  const handleEditClick = (project) => {
    setActiveProject(project);
    setIsDialogOpen(true);
  };

  const handleDialogSubmit = async (formData) => {
    try {
      if (activeProject) {
        await updateProject({ id: activeProject._id, data: formData });
      }
    } catch (err) {
      console.error('Failed to update project:', err);
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recent Activity"
        description="Your workspaces sorted by most recently modified."
      />

      {recentProjects.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {recentProjects.map((project) => (
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
          icon={Clock}
          title="No recent activity"
          description="You haven't worked on any projects yet."
        />
      )}

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

export default RecentPage;
