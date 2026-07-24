import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as workflowLinkApi from '../../../services/workflowLinkApi';

/**
 * React Query hooks for persistent workflow-module links.
 * All CRUD operations go through the server — nothing relies on frontend state alone.
 */

/** Fetch all workflow links (optionally filtered by flowId, targetType, targetId). */
export const useWorkflowLinks = (params) => {
  return useQuery({
    queryKey: ['workflowLinks', params],
    queryFn: async () => {
      const res = await workflowLinkApi.getWorkflowLinks(params);
      return res.data;
    },
    placeholderData: (prev) => prev,
  });
};

/** Fetch active linked workflows for a specific module/feature target. */
export const useLinkedWorkflows = (targetType, targetId) => {
  return useQuery({
    queryKey: ['linkedWorkflows', targetType, targetId],
    queryFn: async () => {
      const res = await workflowLinkApi.getLinkedWorkflows(targetType, targetId);
      return res.data;
    },
    enabled: !!targetType && !!targetId,
  });
};

/** Fetch all workflow links for a specific flow. */
export const useFlowLinks = (flowId) => {
  return useQuery({
    queryKey: ['workflowLinks', { flowId }],
    queryFn: async () => {
      const res = await workflowLinkApi.getWorkflowLinks({ flowId });
      return res.data;
    },
    enabled: !!flowId,
  });
};

/** Create a new workflow link (persists to MongoDB). */
export const useCreateWorkflowLink = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await workflowLinkApi.createWorkflowLink(data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowLinks'] });
      queryClient.invalidateQueries({ queryKey: ['linkedWorkflows'] });
    },
  });
};

/** Update an existing workflow link. */
export const useUpdateWorkflowLink = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await workflowLinkApi.updateWorkflowLink(id, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowLinks'] });
      queryClient.invalidateQueries({ queryKey: ['linkedWorkflows'] });
    },
  });
};

/** Delete a workflow link. */
export const useDeleteWorkflowLink = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await workflowLinkApi.deleteWorkflowLink(id);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowLinks'] });
      queryClient.invalidateQueries({ queryKey: ['linkedWorkflows'] });
    },
  });
};

/** Toggle a workflow link's enabled/disabled state. */
export const useToggleWorkflowLink = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await workflowLinkApi.toggleWorkflowLink(id);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowLinks'] });
      queryClient.invalidateQueries({ queryKey: ['linkedWorkflows'] });
    },
  });
};
