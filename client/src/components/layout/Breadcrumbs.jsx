import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeNameMap = {
  dashboard: 'Dashboard',
  projects: 'Projects',
  favorites: 'Favorites',
  recent: 'Recent',
  trash: 'Trash',
  settings: 'Settings',
  login: 'Sign In',
  register: 'Sign Up',
};

const Breadcrumbs = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav className="flex items-center space-x-1.5 text-sm text-muted-foreground font-medium">
      <Link
        to="/"
        className="flex items-center hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted/40"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>

      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        
        // Try mapping the pathname to a friendly name, otherwise capitalize
        let displayName = routeNameMap[value.toLowerCase()];
        if (!displayName) {
          // If it looks like a Mongo ID (24 hex characters), show "Detail" or similar
          if (/^[0-9a-fA-F]{24}$/.test(value)) {
            displayName = 'Details';
          } else {
            displayName = value.charAt(0).toUpperCase() + value.slice(1);
          }
        }

        return (
          <React.Fragment key={to}>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
            {isLast ? (
              <span className="text-foreground font-semibold px-1 py-0.5 truncate max-w-[120px] sm:max-w-[200px]">
                {displayName}
              </span>
            ) : (
              <Link
                to={to}
                className="hover:text-foreground transition-colors px-1 py-0.5 rounded-md hover:bg-muted/40 truncate max-w-[120px]"
              >
                {displayName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
