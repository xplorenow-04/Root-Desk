import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, Trash2, Edit3, MoreVertical, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import DynamicIcon from '@/components/shared/DynamicIcon';
import { hoverScale } from '@/lib/animations';
import { motion } from 'framer-motion';

const ProjectCard = ({ project, onEdit, onDelete, onToggleFavorite }) => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleCardClick = () => {
    navigate(`/projects/${project._id}`);
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    onToggleFavorite(project._id);
  };

  const handleEditClick = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    onEdit(project);
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setMenuOpen(false);
    onDelete(project._id);
  };

  const handleMenuToggle = (e) => {
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      case 'archived':
        return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
      case 'on-hold':
        return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      default:
        return 'bg-primary/10 text-primary border border-primary/20';
    }
  };

  return (
    <motion.div
      {...hoverScale}
      onClick={handleCardClick}
      className="relative flex flex-col justify-between rounded-xl border border-border/40 bg-card/65 p-5 shadow hover:shadow-lg backdrop-blur-sm cursor-pointer transition-shadow select-none group"
      style={{
        borderLeft: `3px solid ${project.color}`,
      }}
    >
      {/* ── Top Panel ── */}
      <div className="flex items-start justify-between gap-4">
        {/* Dynamic Icon */}
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg border shadow-inner shrink-0"
          style={{
            backgroundColor: `${project.color}15`,
            borderColor: `${project.color}35`,
            color: project.color,
          }}
        >
          <DynamicIcon name={project.icon} className="h-5 w-5" />
        </div>

        {/* Favorite & Actions menu */}
        <div className="flex items-center gap-1 relative">
          <button
            onClick={handleFavoriteClick}
            className={`rounded-lg p-1.5 hover:bg-muted active:scale-90 transition-all cursor-pointer ${
              project.isFavorite ? 'text-amber-500 hover:text-amber-600' : 'text-muted-foreground/60 hover:text-foreground'
            }`}
            title={project.isFavorite ? 'Remove from favorites' : 'Mark as favorite'}
          >
            <Star className="h-4 w-4" fill={project.isFavorite ? 'currentColor' : 'none'} />
          </button>

          <button
            onClick={handleMenuToggle}
            className="rounded-lg p-1.5 text-muted-foreground/60 hover:bg-muted hover:text-foreground active:scale-90 transition-all cursor-pointer"
            title="More actions"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {/* Context Dropdown */}
          {menuOpen && (
            <>
              {/* Close Click Overlay */}
              <div
                className="fixed inset-0 z-45"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpen(false);
                }}
              />
              <div className="absolute right-0 mt-8 w-32 origin-top-right rounded-lg border border-border/40 bg-popover text-popover-foreground p-1 shadow-xl z-50 animate-in fade-in duration-100">
                <button
                  onClick={handleEditClick}
                  className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs hover:bg-muted text-foreground transition-colors cursor-pointer"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit Project</span>
                </button>
                <button
                  onClick={handleDeleteClick}
                  className="flex w-full items-center gap-2 rounded px-2.5 py-1.5 text-xs hover:bg-destructive/10 text-destructive font-medium transition-colors cursor-pointer"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Content Body ── */}
      <div className="mt-4 flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-base truncate">
            {project.name}
          </h3>
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${getStatusStyle(project.status)}`}>
            {project.status === 'on-hold' ? 'On Hold' : project.status}
          </span>
        </div>

        {project.description ? (
          <p className="text-xs text-muted-foreground line-clamp-2 h-8 leading-relaxed">
            {project.description}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground/40 italic line-clamp-2 h-8 leading-relaxed">
            No description provided.
          </p>
        )}
      </div>

      {/* ── Tags and Date Footer ── */}
      <div className="mt-4 border-t border-border/20 pt-3 flex flex-col gap-2">
        {/* Render tags */}
        {project.tags && project.tags.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {project.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-secondary/60 px-2 py-0.5 text-[9px] font-bold text-secondary-foreground uppercase tracking-wide border border-border/20"
              >
                {tag}
              </span>
            ))}
            {project.tags.length > 3 && (
              <span className="rounded-md bg-secondary/60 px-2 py-0.5 text-[9px] font-bold text-secondary-foreground tracking-wide border border-border/20">
                +{project.tags.length - 3}
              </span>
            )}
          </div>
        ) : (
          <div className="h-[18px]" /> /* spacer */
        )}

        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-medium">
          <Calendar className="h-3 w-3" />
          <span>Updated {formatDistanceToNow(new Date(project.updatedAt))} ago</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;
