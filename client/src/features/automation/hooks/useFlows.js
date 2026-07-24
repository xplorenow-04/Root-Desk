import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as flowApi from '../../../services/flowApi';

export const useFlows = (params) => {
  return useQuery({
    queryKey: ['flows', params],
    queryFn: async () => {
      const res = await flowApi.getFlows(params);
      return res.data;
    },
    placeholderData: (prev) => prev,
  });
};

export const useFlow = (id) => {
  return useQuery({
    queryKey: ['flow', id],
    queryFn: async () => {
      const res = await flowApi.getFlow(id);
      return res.data;
    },
    enabled: !!id,
  });
};

export const useCreateFlow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await flowApi.createFlow(data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flows'] });
    },
  });
};

export const useUpdateFlow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await flowApi.updateFlow(id, data);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['flows'] });
      if (data?._id) queryClient.invalidateQueries({ queryKey: ['flow', data._id] });
    },
  });
};

export const useDeleteFlow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await flowApi.deleteFlow(id);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flows'] });
    },
  });
};

export const useDuplicateFlow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await flowApi.duplicateFlow(id);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flows'] });
    },
  });
};

export const useSaveFlowData = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await flowApi.saveFlowData(id, data);
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.flow?._id) queryClient.invalidateQueries({ queryKey: ['flow', data.flow._id] });
    },
  });
};

export const useArchiveFlow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await flowApi.archiveFlow(id);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flows'] });
    },
  });
};

export const useFlowHistory = (id, params) => {
  return useQuery({
    queryKey: ['flowHistory', id, params],
    queryFn: async () => {
      const res = await flowApi.getFlowHistory(id, params);
      return res.data;
    },
    enabled: !!id,
  });
};

export const useRestoreFlowVersion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, version }) => {
      const res = await flowApi.restoreFlowVersion(id, version);
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.flow?._id) {
        queryClient.invalidateQueries({ queryKey: ['flow', data.flow._id] });
        queryClient.invalidateQueries({ queryKey: ['flowHistory', data.flow._id] });
      }
    },
  });
};

export const useExportFlow = () => {
  return useMutation({
    mutationFn: async (id) => {
      const res = await flowApi.exportFlow(id);
      return res.data;
    },
  });
};

export const useImportFlow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const res = await flowApi.importFlow(data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flows'] });
    },
  });
};

export const useTemplates = (params) => {
  return useQuery({
    queryKey: ['flowTemplates', params],
    queryFn: async () => {
      const res = await flowApi.getTemplates(params);
      return res.data;
    },
  });
};

export const useCreateFlowFromTemplate = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await flowApi.createFlowFromTemplate(id);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flows'] });
    },
  });
};

export const useFlowExecutions = (id, params) => {
  return useQuery({
    queryKey: ['flowExecutions', id, params],
    queryFn: async () => {
      const res = await flowApi.getFlowExecutions(id, params);
      return res.data;
    },
    enabled: !!id,
  });
};

export const useRunFlow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }) => {
      const res = await flowApi.runFlow(id, data);
      return res.data;
    },
    onSuccess: (data) => {
      if (data?.flowId) queryClient.invalidateQueries({ queryKey: ['flowExecutions', data.flowId] });
    },
  });
};
