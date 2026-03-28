import { NavLink, Link } from 'react-router-dom';
import { Mic } from 'lucide-react';
import { MAIN_NAV } from './navConfig';

export default function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-56 lg:w-64 shrink-0 border-r border-echo-border bg-echo-sidebar h-screen sticky top-0 z-40">
      <div className="p-5 lg:p-6 border-b border-echo-border/70">
        <Link
          to="/"
          className="flex items-center gap-3 rounded-xl p-1 -m-1 hover:bg-echo-card/60 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-echo-accent/12 border border-echo-accent/20 flex items-center justify-center text-echo-accent shadow-sm">
            <Mic size={20} strokeWidth={2.25} />
          </div>
          <div className="min-w-0 text-left">
            <span className="font-display text-lg lg:text-xl text-echo-text leading-tight block group-hover:text-echo-accent transition-colors">
              Echo Journal
            </span>
            <span className="text-[10px] text-echo-text-dim uppercase tracking-widest font-medium">
              Voice diary
            </span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 lg:p-4 space-y-1 overflow-y-auto">
        {MAIN_NAV.map(({ to, icon: Icon, label, primary }) =>
          primary ? (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl font-medium text-sm transition-all ${
                  isActive
                    ? 'bg-echo-accent text-white shadow-md shadow-echo-accent/25'
                    : 'bg-echo-accent/90 text-white hover:bg-echo-accent shadow-sm'
                }`
              }
            >
              <Icon size={20} />
              {label}
            </NavLink>
          ) : (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-echo-card text-echo-accent border border-echo-border'
                    : 'text-echo-text-muted hover:text-echo-text hover:bg-echo-card/70 border border-transparent'
                }`
              }
            >
              <Icon size={20} className="opacity-90" />
              {label}
            </NavLink>
          )
        )}
      </nav>
    </aside>
  );
}
