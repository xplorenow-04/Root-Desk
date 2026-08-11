import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as systemDesignApi from '../services/systemDesignApi';

export const useSystemDesigns = (projectId) =>
  useQuery({
    queryKey: ['system-designs', projectId],
    queryFn: () => systemDesignApi.listDesigns(projectId),
    enabled: Boolean(projectId),
    select: (res) => res.data?.designs || [],
  });

export const useSystemDesign = (id) =>
  useQuery({
    queryKey: ['system-design', id],
    queryFn: () => systemDesignApi.getDesign(id),
    enabled: Boolean(id),
    select: (res) => res.data?.design || null,
  });

export const useCreateSystemDesign = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => systemDesignApi.createDesign(payload),
    onSuccess: (res, vars) => {
      qc.invalidateQueries({ queryKey: ['system-designs', vars.projectId] });
    },
  });
};

export const useUpdateSystemDesign = (id, projectId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => systemDesignApi.updateDesign(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system-design', id] });
      if (projectId) qc.invalidateQueries({ queryKey: ['system-designs', projectId] });
    },
  });
};

export const useDeleteSystemDesign = (projectId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => systemDesignApi.deleteDesign(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system-designs', projectId] }),
  });
};

export const useSystemDesignTemplates = () =>
  useQuery({
    queryKey: ['system-design-templates'],
    queryFn: () => systemDesignApi.listTemplates(),
    select: (res) => res.data?.templates || [],
  });

export const useUseSystemDesignTemplate = (projectId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (templateId) => systemDesignApi.useTemplate(templateId, projectId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system-designs', projectId] }),
  });
};

export const useSystemDesignImport = (projectId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => systemDesignApi.importDesign(projectId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system-designs', projectId] }),
  });
};

export const useSystemDesignVersions = (id) =>
  useQuery({
    queryKey: ['system-design-versions', id],
    queryFn: () => systemDesignApi.listVersions(id),
    enabled: Boolean(id),
    select: (res) => res.data || { versions: [], currentVersion: 1 },
  });

export const useCreateSystemDesignVersion = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => systemDesignApi.createVersion(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['system-design-versions', id] }),
  });
};

export const useRestoreSystemDesignVersion = (id) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (versionNumber) => systemDesignApi.restoreVersion(id, versionNumber),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system-design', id] });
      qc.invalidateQueries({ queryKey: ['system-design-versions', id] });
    },
  });
};

export const useCompareSystemDesignVersions = (id) =>
  useMutation({ mutationFn: ({ a, b }) => systemDesignApi.compareVersions(id, a, b) });

export const useValidateSystemDesign = (id) =>
  useMutation({
    mutationFn: (data) => systemDesignApi.validateDesign(id, data),
  });

// ── Practice ──

export const usePracticeProblems = (difficulty) =>
  useQuery({
    queryKey: ['practice-problems', difficulty || 'all'],
    queryFn: () => systemDesignApi.listPracticeProblems(difficulty),
    select: (res) => res.data?.problems || [],
  });

export const usePracticeProblem = (problemId) =>
  useQuery({
    queryKey: ['practice-problem', problemId],
    queryFn: () => systemDesignApi.getPracticeProblem(problemId),
    enabled: Boolean(problemId),
    select: (res) => res.data?.problem || null,
  });

export const useSubmitPractice = () =>
  useMutation({
    mutationFn: ({ problemId, data, hintsUsed }) => systemDesignApi.submitPractice(problemId, data, hintsUsed),
  });
