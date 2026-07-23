import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FolderKanban, Layout, Star, Clock, Trash2, Settings, Terminal, ArrowDown, ArrowUp } from 'lucide-react';

const CommandPalette = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { data: projects = [] } = useProjects();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Static navigation routes
  const staticRoutes = [
    { label: 'Go to Dashboard', path: '/dashboard', icon: Layout },
    { label: 'Go to Projects', path: '/projects', icon: FolderKanban },
    { label: 'Go to Favorites', path: '/favorites', icon: Star },
    { label: 'Go to Recent Activity', path: '/recent', icon: Clock },
    { label: 'Go to Trash', path: '/trash', icon: Trash2 },
    { label: 'Go to Settings', path: '/settings', icon: Settings },
  ];

  // Filter static routes and active projects based on search query
  const filteredRoutes = staticRoutes.filter((route) =>
    route.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredProjects = projects.filter((project) =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Unified items list for keyboard selection mapping
  const items = [
    ...filteredRoutes.map((route) => ({ type: 'route', ...route })),
    ...filteredProjects.map((project) => ({
      type: 'project',
      label: `Open Project: ${project.name}`,
      path: `/projects/${project._id}`,
      icon: FolderKanban,
      color: project.color,
    })),
  ];

  // Keyboard navigation controls
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % items.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (items[selectedIndex]) {
          handleSelect(items[selectedIndex]);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, items, onClose]);

  // Scroll active item into view
  useEffect(() => {
    if (selectedIndex === 0) {
      if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
      return;
    }

    const activeEl = scrollContainerRef.current?.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleSelect = (item) => {
    navigate(item.path);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-55 flex items-start justify-center p-4 pt-[15vh]">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
          />

          {/* Dialog Body */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="relative z-60 w-full max-w-xl overflow-hidden rounded-2xl border border-border/40 bg-card shadow-2xl backdrop-blur-md flex flex-col max-h-[380px]"
          >
            {/* Search Bar Input */}
            <div className="flex items-center gap-3 border-b border-border/20 px-4 py-3.5">
              <Search className="h-4.5 w-4.5 text-muted-foreground/60 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Type a command or project name to navigate..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
              />
            </div>

            {/* Selection Options List */}
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto px-2 py-3 space-y-1 scrollbar-none"
            >
              {items.length > 0 ? (
                items.map((item, idx) => {
                  const Icon = item.icon;
                  const isActive = idx === selectedIndex;
                  return (
                    <button
                      key={`${item.type}-${item.path}`}
                      onClick={() => handleSelect(item)}
                      data-active={isActive}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-all text-left cursor-pointer ${
                        isActive
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm'
                          : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {item.type === 'project' ? (
                          <div
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: item.color || '#6366f1' }}
                          />
                        ) : (
                          <Icon className="h-4 w-4 shrink-0 text-muted-foreground/75" />
                        )}
                        <span className="truncate">{item.label}</span>
                      </div>
                      {isActive && (
                        <kbd className="hidden sm:inline-flex h-5 select-none items-center rounded border border-border/55 bg-background/55 px-1.5 font-mono text-[9px] font-medium text-sidebar-accent-foreground shadow-sm">
                          Enter
                        </kbd>
                      )}
                    </button>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-muted-foreground italic">
                  No commands or projects match "{searchQuery}"
                </div>
              )}
            </div>

            {/* Bottom Keyboard Shortcuts Info */}
            <div className="flex items-center justify-between border-t border-border/15 bg-muted/10 px-4 py-2.5 text-[10px] text-muted-foreground/80 shrink-0 font-medium">
              <div className="flex items-center gap-1">
                <Terminal className="h-3 w-3" />
                <span>Command Palette Navigator</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-0.5">
                  <ArrowUp className="h-2.5 w-2.5" />
                  <ArrowDown className="h-2.5 w-2.5" />
                  <span>Navigate</span>
                </span>
                <span className="flex items-center gap-0.5">
                  <kbd className="rounded border border-border/40 px-1 text-[8.5px] font-semibold bg-background/30 shadow-inner">ESC</kbd>
                  <span>Close</span>
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CommandPalette;
