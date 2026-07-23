import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sun, Moon, Monitor, Search, LogOut, Settings, User, Menu } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Breadcrumbs from './Breadcrumbs';

const Header = ({ toggleMobileSidebar, onOpenCommandPalette }) => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setDropdownOpen(false);
    await logout();
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4.5 w-4.5" />;
      case 'dark':
        return <Moon className="h-4.5 w-4.5" />;
      default:
        return <Monitor className="h-4.5 w-4.5" />;
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 w-full items-center justify-between border-b border-border/40 bg-background/70 px-4 sm:px-6 shadow-sm backdrop-blur-md">
      {/* ── Left Side: Mobile Menu & Breadcrumbs ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleMobileSidebar}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-border/40 text-muted-foreground hover:bg-muted/40 hover:text-foreground md:hidden active:scale-95 transition-all cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="hidden sm:block">
          <Breadcrumbs />
        </div>
      </div>

      {/* ── Right Side: Search, Theme, Avatar ── */}
      <div className="flex items-center gap-3">
        {/* Search trigger placeholder */}
        <button
          onClick={onOpenCommandPalette}
          className="flex h-9 w-40 sm:w-60 items-center justify-between rounded-lg border border-input bg-background/50 px-3 text-xs text-muted-foreground/80 hover:bg-background/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <Search className="h-3.5 w-3.5" />
            <span>Search workspace...</span>
          </span>
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-border/60 bg-muted px-1.5 font-mono text-[9px] font-medium text-muted-foreground/90 shadow-sm">
            <span>Ctrl</span>
            <span>K</span>
          </kbd>
        </button>

        {/* Theme Toggle Button */}
        <div className="flex items-center rounded-lg border border-border/40 bg-background/30 p-0.5">
          <button
            onClick={() => setTheme('light')}
            className={`p-1.5 rounded-md hover:text-foreground transition-all cursor-pointer ${
              theme === 'light' ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm' : 'text-muted-foreground'
            }`}
            title="Light Theme"
          >
            <Sun className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`p-1.5 rounded-md hover:text-foreground transition-all cursor-pointer ${
              theme === 'dark' ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm' : 'text-muted-foreground'
            }`}
            title="Dark Theme"
          >
            <Moon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`p-1.5 rounded-md hover:text-foreground transition-all cursor-pointer ${
              theme === 'system' ? 'bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-sm' : 'text-muted-foreground'
            }`}
            title="System Theme"
          >
            <Monitor className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Avatar Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold shadow-sm active:scale-95 transition-transform cursor-pointer"
          >
            {user?.name ? user.name[0].toUpperCase() : 'U'}
          </button>

          {/* Simple Dropdown Menu */}
          {dropdownOpen && (
            <>
              {/* Overlay background to close dropdown */}
              <div
                className="fixed inset-0 z-45"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-border/40 bg-popover text-popover-foreground p-1.5 shadow-xl backdrop-blur-md z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="px-3 py-2 text-xs border-b border-border/30 mb-1">
                  <p className="font-semibold text-foreground">{user?.name || 'User'}</p>
                  <p className="text-muted-foreground truncate">{user?.email}</p>
                </div>
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/settings');
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm hover:bg-muted text-foreground transition-colors cursor-pointer"
                >
                  <Settings className="h-4 w-4 text-muted-foreground" />
                  <span>Settings</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-sm hover:bg-destructive/10 text-destructive font-medium transition-colors cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
