import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Cpu, BatteryCharging, SlidersHorizontal } from 'lucide-react';
import { clsx } from 'clsx';

const BOTTOM_NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/forecasting', label: 'Forecast', icon: TrendingUp },
  { path: '/grid-intelligence', label: 'Grid', icon: Cpu },
  { path: '/battery-optimization', label: 'Battery', icon: BatteryCharging },
  { path: '/scenario-simulator', label: 'Simulate', icon: SlidersHorizontal },
];

export const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 lg:hidden bg-surface/95 backdrop-blur-md border-t border-border flex items-center justify-around h-14 px-1 shadow-lg">
      {BOTTOM_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors duration-150',
                isActive
                  ? 'text-accent-cyan font-semibold'
                  : 'text-secondary hover:text-primary'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={clsx('w-4 h-4 mb-0.5', isActive ? 'text-accent-cyan' : 'text-muted')} />
                <span className="truncate max-w-[54px]">{item.label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};
