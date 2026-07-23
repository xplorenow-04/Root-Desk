import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart3, FolderKanban, Star, Layers, CheckSquare, Plus, ArrowRight, Settings, Clock, Zap } from 'lucide-react';
import * as dashboardApi from '@/services/dashboardApi';
import PageHeader from '@/components/shared/PageHeader';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import ErrorState from '@/components/shared/ErrorState';
import { motion } from 'framer-motion';
import { containerVariants, itemVariants } from '@/lib/animations';

const DashboardPage = () => {
  const navigate = useNavigate();

  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await dashboardApi.getStats();
      return response.data;
    },
  });

  if (isLoading) {
    return <LoadingSpinner message="Aggregating workspace statistics..." />;
  }

  if (error) {
    return <ErrorState message={error.message || 'Failed to load dashboard'} onRetry={refetch} />;
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 pb-8"
    >
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        description="Workspace overview, completion metrics, and recent node timeline."
      />

      {/* ── Key Metrics Grid ── */}
      <motion.div variants={itemVariants} className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Projects */}
        <div className="rounded-xl border border-border/40 bg-card/45 p-5 shadow-sm backdrop-blur-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
              Total Projects
            </span>
            <p className="text-3xl font-extrabold text-foreground">{stats?.projects?.total || 0}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-500 shadow-inner">
            <FolderKanban className="h-5 w-5" />
          </div>
        </div>

        {/* Favorite Projects */}
        <div className="rounded-xl border border-border/40 bg-card/45 p-5 shadow-sm backdrop-blur-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
              Pinned Favorites
            </span>
            <p className="text-3xl font-extrabold text-foreground">{stats?.projects?.favorites || 0}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 shadow-inner">
            <Star className="h-5 w-5" fill="currentColor" />
          </div>
        </div>

        {/* Total Nodes */}
        <div className="rounded-xl border border-border/40 bg-card/45 p-5 shadow-sm backdrop-blur-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
              Total Task Nodes
            </span>
            <p className="text-3xl font-extrabold text-foreground">{stats?.nodes?.total || 0}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-500 shadow-inner">
            <Layers className="h-5 w-5" />
          </div>
        </div>

        {/* Task Completion Rate */}
        <div className="rounded-xl border border-border/40 bg-card/45 p-5 shadow-sm backdrop-blur-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground/80">
              Completion Rate
            </span>
            <p className="text-3xl font-extrabold text-foreground">
              {stats?.nodes?.completionRate || 0}%
            </p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 shadow-inner">
            <CheckSquare className="h-5 w-5" />
          </div>
        </div>
      </motion.div>

      {/* ── Mid Section: Recent Workspaces & Timeline ── */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Workspaces */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2 rounded-xl border border-border/40 bg-card/45 p-6 shadow-sm backdrop-blur-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">Active Workspaces</h3>
            <Link
              to="/projects"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <span>View all projects</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {stats?.recentProjects?.length > 0 ? (
              stats.recentProjects.map((proj) => (
                <div
                  key={proj._id}
                  onClick={() => navigate(`/projects/${proj._id}`)}
                  className="flex items-center justify-between border border-border/25 rounded-lg bg-background/25 px-4 py-3.5 hover:bg-muted/40 transition-colors duration-150 cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="h-8.5 w-8.5 rounded-lg border flex items-center justify-center font-bold text-xs"
                      style={{
                        backgroundColor: `${proj.color}15`,
                        borderColor: `${proj.color}35`,
                        color: proj.color,
                      }}
                    >
                      {proj.name[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                        {proj.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate max-w-md">
                        {proj.description || 'No description provided.'}
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-secondary/80 border border-border/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-secondary-foreground">
                    {proj.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-sm text-muted-foreground italic border border-dashed border-border/50 rounded-lg">
                No active workspaces found.
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions Panel */}
        <motion.div
          variants={itemVariants}
          className="rounded-xl border border-border/40 bg-card/45 p-6 shadow-sm backdrop-blur-sm space-y-4"
        >
          <h3 className="text-base font-bold text-foreground">Quick Actions</h3>
          <div className="grid gap-3">
            {/* Create new project shortcut */}
            <button
              onClick={() => navigate('/projects')}
              className="flex items-center justify-between w-full border border-border/25 rounded-lg bg-background/25 p-3.5 hover:bg-muted/40 transition-colors duration-150 cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
                  <Plus className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    New Project
                  </p>
                  <p className="text-xs text-muted-foreground">Setup a new board</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
            </button>

            {/* View favorites */}
            <button
              onClick={() => navigate('/favorites')}
              className="flex items-center justify-between w-full border border-border/25 rounded-lg bg-background/25 p-3.5 hover:bg-muted/40 transition-colors duration-150 cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500">
                  <Star className="h-4.5 w-4.5" fill="currentColor" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    Favorites
                  </p>
                  <p className="text-xs text-muted-foreground">View pinned workspaces</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
            </button>

            {/* Settings */}
            <button
              onClick={() => navigate('/settings')}
              className="flex items-center justify-between w-full border border-border/25 rounded-lg bg-background/25 p-3.5 hover:bg-muted/40 transition-colors duration-150 cursor-pointer text-left group"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8.5 w-8.5 items-center justify-center rounded-lg bg-slate-500/10 border border-slate-500/20 text-slate-400">
                  <Settings className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                    Preferences
                  </p>
                  <p className="text-xs text-muted-foreground">Adjust system settings</p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground/60 group-hover:text-foreground transition-colors" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* ── Bottom Section: Recent Node Activity Timeline ── */}
      <motion.div
        variants={itemVariants}
        className="rounded-xl border border-border/40 bg-card/45 p-6 shadow-sm backdrop-blur-sm space-y-4"
      >
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="text-base font-bold text-foreground">Recent Activity</h3>
        </div>

        <div className="space-y-4 relative before:absolute before:inset-y-1 before:left-4 before:w-0.5 before:bg-border/20 pl-2">
          {stats?.recentNodes?.length > 0 ? (
            stats.recentNodes.map((node) => (
              <div
                key={node._id}
                onClick={() => navigate(`/projects/${node.projectId?._id || ''}`)}
                className="flex items-start gap-4 hover:bg-muted/10 p-2 rounded-lg cursor-pointer transition-colors relative group"
              >
                {/* Timeline Dot Indicator */}
                <div
                  className="relative z-10 flex h-4.5 w-4.5 items-center justify-center rounded-full border border-background bg-card text-[8px] font-bold shadow-sm mt-1.5 shrink-0"
                  style={{ borderColor: node.projectId?.color || '#6366f1' }}
                >
                  <div
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: node.projectId?.color || '#6366f1' }}
                  />
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {node.title}
                    </p>
                    <span className="rounded bg-secondary/60 border border-border/25 px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-wider text-secondary-foreground shrink-0">
                      {node.type}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <span>Workspace:</span>
                    <span
                      className="font-semibold"
                      style={{ color: node.projectId?.color }}
                    >
                      {node.projectId?.name || 'Deleted Project'}
                    </span>
                    <span>•</span>
                    <span>Status: <span className="font-semibold uppercase text-foreground">{node.status}</span></span>
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 text-center text-sm text-muted-foreground italic border border-dashed border-border/50 rounded-lg">
              No recent activity recorded. Nodes created inside projects will appear on this timeline.
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default DashboardPage;
