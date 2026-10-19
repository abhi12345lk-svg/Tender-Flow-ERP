import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const ROUTE_NAMES = {
  'financial-year': 'Financial Year',
  'work-orders': 'Work Orders',
  'agreements': 'Agreements',
  'billing': 'Billing Management',
  'subdivisions': 'Subdivisions',
  'fmd-sd': 'FMD / SD',
};

export default function Breadcrumbs() {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav className="flex items-center space-x-1 sm:space-x-1.5 text-xs text-slate-500 min-w-0" aria-label="Breadcrumb">
      <Link
        to="/work-orders"
        className="flex items-center gap-1 hover:text-slate-900 transition-colors shrink-0"
        title="Dashboard / Work Orders"
      >
        <Home className="h-3.5 w-3.5 text-slate-400" />
        <span className="hidden sm:inline">Home</span>
      </Link>

      {pathnames.map((segment, index) => {
        const isLast = index === pathnames.length - 1;
        const displayName = ROUTE_NAMES[segment] || segment.replace(/-/g, ' ');

        return (
          <React.Fragment key={segment}>
            <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
            {isLast ? (
              <span className="font-semibold text-slate-800 capitalize truncate max-w-[110px] xs:max-w-[150px] sm:max-w-none" title={displayName}>
                {displayName}
              </span>
            ) : (
              <Link
                to={`/${pathnames.slice(0, index + 1).join('/')}`}
                className="hover:text-slate-900 transition-colors capitalize truncate max-w-[80px] sm:max-w-none"
                title={displayName}
              >
                {displayName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
