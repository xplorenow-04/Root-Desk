import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as flowApi from '../../../services/flowApi';

export const useExecution = (executionId) => {
  return useQuery({
    queryKey: ['execution', executionId],
    queryFn: async () => {
      const res = await flowApi.getExecution(executionId);
      return res.data;
    },
    enabled: !!executionId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && ['running', 'paused'].includes(data.status)) return 3000;
      return false;
    },
  });
};

export const useExecuteActions = () => {
  const queryClient = useQueryClient();

  const advanceMutation = useMutation({
    mutationFn: async ({ executionId, data }) => {
      const res = await flowApi.advanceExecution(executionId, data);
      return res.data;
    },
    onSuccess: (data) => {
      if (data?._id) queryClient.invalidateQueries({ queryKey: ['execution', data._id] });
      queryClient.invalidateQueries({ queryKey: ['flowExecutions'] });
    },
  });

  const pauseMutation = useMutation({
    mutationFn: async (executionId) => {
      const res = await flowApi.pauseExecution(executionId);
      return res.data;
    },
    onSuccess: (data) => {
      if (data?._id) queryClient.invalidateQueries({ queryKey: ['execution', data._id] });
    },
  });

  const resumeMutation = useMutation({
    mutationFn: async (executionId) => {
      const res = await flowApi.resumeExecution(executionId);
      return res.data;
    },
    onSuccess: (data) => {
      if (data?._id) queryClient.invalidateQueries({ queryKey: ['execution', data._id] });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (executionId) => {
      const res = await flowApi.cancelExecution(executionId);
      return res.data;
    },
    onSuccess: (data) => {
      if (data?._id) queryClient.invalidateQueries({ queryKey: ['execution', data._id] });
    },
  });

  const restartMutation = useMutation({
    mutationFn: async (executionId) => {
      const res = await flowApi.restartExecution(executionId);
      return res.data;
    },
    onSuccess: (data) => {
      if (data?._id) queryClient.invalidateQueries({ queryKey: ['execution', data._id] });
    },
  });

  const retryMutation = useMutation({
    mutationFn: async (executionId) => {
      const res = await flowApi.retryExecution(executionId);
      return res.data;
    },
    onSuccess: (data) => {
      if (data?._id) queryClient.invalidateQueries({ queryKey: ['execution', data._id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (executionId) => {
      const res = await flowApi.deleteExecution(executionId);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flowExecutions'] });
    },
  });

  return {
    advance: advanceMutation.mutateAsync,
    pause: pauseMutation.mutateAsync,
    resume: resumeMutation.mutateAsync,
    cancel: cancelMutation.mutateAsync,
    restart: restartMutation.mutateAsync,
    retry: retryMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    isAdvancing: advanceMutation.isPending,
    isPausing: pauseMutation.isPending,
    isResuming: resumeMutation.isPending,
    isCancelling: cancelMutation.isPending,
    isRestarting: restartMutation.isPending,
  };
};

export const useStepExecution = (executionId, nodes, edges) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const sortedNodes = [...(nodes || [])].sort((a, b) => {
    if (a.data?.nodeType === 'start') return -1;
    if (b.data?.nodeType === 'start') return 1;
    return 0;
  });

  const currentNode = sortedNodes[currentStepIndex];
  const isLastStep = currentStepIndex >= sortedNodes.length - 1;
  const totalSteps = sortedNodes.length;

  const nextStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.min(prev + 1, sortedNodes.length - 1));
  }, [sortedNodes.length]);

  const prevStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((index) => {
    setCurrentStepIndex(Math.max(0, Math.min(index, sortedNodes.length - 1)));
  }, [sortedNodes.length]);

  const reset = useCallback(() => {
    setCurrentStepIndex(0);
  }, []);

  return {
    currentNode,
    currentStepIndex,
    isLastStep,
    totalSteps,
    nextStep,
    prevStep,
    goToStep,
    reset,
  };
};
