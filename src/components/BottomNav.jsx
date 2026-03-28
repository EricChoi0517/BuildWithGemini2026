import { NavLink } from 'react-router-dom';
import { MAIN_NAV } from './navConfig';

export default function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-echo-surface/95 backdrop-blur-xl border-t border-echo-border shadow-[0_-4px_24px_rgba(44,39,32,0.06)]">
      <div
        className="flex items-center justify-around max-w-lg mx-auto"
        style={{ paddingBottom: 'var(--safe-bottom, 8px)' }}>
        {MAIN_NAV.map(({ to, icon: Icon, label, primary }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-col items-center py-2 px-3 transition-all duration-200 ${
                primary ? '' : isActive
                  ? 'text-echo-accent'
                  : 'text-echo-text-dim hover:text-echo-text-muted'
              }`
            }
          >
            {primary ? (
              <div className="flex items-center justify-center w-12 h-12 -mt-6 rounded-full bg-echo-accent shadow-lg shadow-echo-accent/30 text-white">
                <Icon size={22} />
              </div>
            ) : (
              <Icon size={20} />
            )}
            <span className={`text-[10px] mt-1 font-medium ${primary ? 'text-echo-accent' : ''}`}>
              {label}
            </span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
