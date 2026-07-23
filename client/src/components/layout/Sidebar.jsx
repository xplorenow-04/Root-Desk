import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, LogOut, Terminal } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { NAV_GROUPS } from '@/constants/navigation';
import { sidebarTransition } from '@/lib/animations';

const Sidebar = ({ isCollapsed, toggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <motion.aside
      animate={{ width: isCollapsed ? 72 : 260 }}
      transition={sidebarTransition}
      className="flex h-screen flex-col border-r border-border/40 bg-sidebar text-sidebar-foreground shrink-0 overflow-hidden"
    >
      {/* ── Brand Header ── */}
      <div className="flex h-14 items-center justify-between px-4 border-b border-border/40">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.15)]">
            <Terminal className="h-5 w-5" />
          </div>
          {!isCollapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-bold tracking-tight text-foreground whitespace-nowrap"
            >
              Root Desk
            </motion.span>
          )}
        </div>

        {!isCollapsed && (
          <button
            onClick={toggleSidebar}
            className="hidden md:flex h-7 w-7 items-center justify-center rounded-md border border-border/40 bg-background/50 text-muted-foreground hover:text-foreground active:scale-95 transition-all duration-150 cursor-pointer"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* ── Navigation Links ── */}
      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-none">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="space-y-1">
            {!isCollapsed && (
              <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">
                {group.label}
              </h3>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.label}>
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 group relative ${
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm'
                            : 'text-muted-foreground hover:bg-sidebar-accent/40 hover:text-foreground'
                        }`
                      }
                      title={isCollapsed ? item.label : undefined}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="whitespace-nowrap"
                        >
                          {item.label}
                        </motion.span>
                      )}

                      {/* Tooltip for collapsed state */}
                      {isCollapsed && (
                        <div className="absolute left-16 z-55 scale-0 group-hover:scale-100 rounded bg-popover border border-border/50 px-2 py-1 text-xs font-medium text-popover-foreground shadow-md transition-all duration-100 origin-left">
                          {item.label}
                        </div>
                      )}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* ── User Profile Footer ── */}
      <div className="p-4 border-t border-border/40 bg-sidebar-background/50">
        <div className="flex items-center justify-between gap-3 overflow-hidden">
          <div className="flex items-center gap-3 min-w-0">
            {/* User Avatar */}
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary shrink-0 font-semibold shadow-inner">
              {user?.name ? user.name[0].toUpperCase() : 'U'}
            </div>

            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col min-w-0"
              >
                <span className="text-sm font-semibold text-foreground truncate leading-none mb-1">
                  {user?.name || 'User'}
                </span>
                <span className="text-xs text-muted-foreground truncate leading-none">
                  {user?.email || 'user@example.com'}
                </span>
              </motion.div>
            )}
          </div>

          {!isCollapsed ? (
            <button
              onClick={logout}
              title="Sign Out"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive active:scale-95 transition-all duration-150 cursor-pointer"
            >
              <LogOut className="h-4.5 w-4.5" />
            </button>
          ) : (
            isCollapsed && (
              <button
                onClick={toggleSidebar}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/40 bg-background/50 text-muted-foreground hover:text-foreground active:scale-95 transition-all duration-150 cursor-pointer mx-auto"
              >
                <ChevronRight className="h-4.5 w-4.5" />
              </button>
            )
          )}
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
