import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { useProjects, useProjectMutations } from '@/hooks/useProjects';
import PageHeader from '@/components/shared/PageHeader';
import ProjectCard from '@/features/projects/components/ProjectCard';
import ProjectDialog from '@/features/projects/components/ProjectDialog';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import ErrorState from '@/components/shared/ErrorState';
import ConfirmDialog from '@/components/shared/ConfirmDialog';

const FavoritesPage = () => {
  const { data: projects, isLoading, error, refetch } = useProjects();
  const { updateProject, deleteProject, toggleFavorite } = useProjectMutations();

  // Dialog State (for editing projects from this page)
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeProject, setActiveProject] = useState(null);

  // ConfirmDialog state
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  if (isLoading) {
    return <LoadingSpinner message="Loading your pinned workspaces..." />;
  }

  if (error) {
    return <ErrorState message={error.message || 'Failed to load favorites'} onRetry={refetch} />;
  }

  // Filter for favorited projects
  const favoriteProjects = projects.filter((project) => project.isFavorite);

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
      {/* Page Header */}
      <PageHeader
        title="Pinned Favorites"
        description="Quick access to your pinned projects and workspaces."
      />

      {favoriteProjects.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {favoriteProjects.map((project) => (
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
          icon={Star}
          title="No pinned favorites"
          description="Mark projects with a star icon on the projects page to pin them here for quick access."
        />
      )}

      {/* Edit Dialog Modal */}
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

export default FavoritesPage;
