import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import * as nodeApi from '../services/nodeApi';

/**
 * Hook to fetch all flat nodes for a project.
 */
export const useNodes = (projectId) => {
  return useQuery({
    queryKey: ['nodes', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const response = await nodeApi.getNodes(projectId);
      return response.data?.nodes || [];
    },
    enabled: !!projectId,
  });
};

/**
 * Hook returning recursive tree structures of nodes along with flat metadata queries.
 */
export const useNodeTree = (projectId) => {
  const { data: nodes = [], isLoading, error, refetch } = useNodes(projectId);

  const tree = useMemo(() => {
    const buildTree = (list, parentId = null) => {
      return list
        .filter((node) => {
          if (parentId === null) {
            return !node.parentId;
          }
          return String(node.parentId) === String(parentId);
        })
        .map((node) => ({
          ...node,
          children: buildTree(list, node._id),
        }))
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    };

    return buildTree(nodes);
  }, [nodes]);

  return {
    tree,
    flatNodes: nodes,
    isLoading,
    error,
    refetch,
  };
};

/**
 * Hook returning mutations for node CRUD operations.
 */
export const useNodeMutations = (projectId) => {
  const queryClient = useQueryClient();

  const createNode = useMutation({
    mutationFn: nodeApi.createNode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes', projectId] });
    },
  });

  const updateNode = useMutation({
    mutationFn: ({ id, data }) => nodeApi.updateNode(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes', projectId] });
    },
  });

  const deleteNode = useMutation({
    mutationFn: nodeApi.deleteNode,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nodes', projectId] });
    },
  });

  return {
    createNode: createNode.mutateAsync,
    isCreating: createNode.isPending,
    updateNode: updateNode.mutateAsync,
    isUpdating: updateNode.isPending,
    deleteNode: deleteNode.mutateAsync,
    isDeleting: deleteNode.isPending,
  };
};
