import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as projectApi from '../services/projectApi';

/**
 * Hook to fetch all projects.
 */
export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await projectApi.getProjects();
      return response.data?.projects || [];
    },
  });
};

/**
 * Hook to fetch a single project by ID.
 */
export const useProject = (id) => {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await projectApi.getProject(id);
      return response.data?.project || null;
    },
    enabled: !!id,
  });
};

/**
 * Hook returning mutations for CRUD and toggling projects.
 */
export const useProjectMutations = () => {
  const queryClient = useQueryClient();

  // Create Project
  const createProject = useMutation({
    mutationFn: projectApi.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  // Update Project
  const updateProject = useMutation({
    mutationFn: ({ id, data }) => projectApi.updateProject(id, data),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.id] });
    },
  });

  // Delete Project (Soft Delete)
  const deleteProject = useMutation({
    mutationFn: projectApi.deleteProject,
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
  });

  // Toggle Favorite Status
  const toggleFavorite = useMutation({
    mutationFn: projectApi.toggleFavorite,
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', id] });
    },
  });

  return {
    createProject: createProject.mutateAsync,
    isCreating: createProject.isPending,
    updateProject: updateProject.mutateAsync,
    isUpdating: updateProject.isPending,
    deleteProject: deleteProject.mutateAsync,
    isDeleting: deleteProject.isPending,
    toggleFavorite: toggleFavorite.mutateAsync,
    isTogglingFavorite: toggleFavorite.isPending,
  };
};
