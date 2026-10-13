import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  Cpu,
  BatteryCharging,
  Car,
  SlidersHorizontal,
  CloudSun,
  MapPin,
  Coins,
  ShieldAlert,
  Bot,
  FlaskConical,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { Tooltip } from '../ui/Tooltip';
import { clsx } from 'clsx';

interface NavGroup {
  label: string;
  items: {
    path: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Operate',
    items: [
      { path: '/', label: 'Overview', icon: LayoutDashboard },
      { path: '/forecasting', label: 'AI Forecasting', icon: TrendingUp },
      { path: '/grid-intelligence', label: 'Grid Intelligence', icon: Cpu },
      { path: '/battery-optimization', label: 'Battery Optimization', icon: BatteryCharging },
      { path: '/ev-management', label: 'EV Management', icon: Car },
    ],
  },
  {
    label: 'Analyse',
    items: [
      { path: '/scenario-simulator', label: 'Scenario Simulator', icon: SlidersHorizontal },
      { path: '/weather-intelligence', label: 'Weather Intelligence', icon: CloudSun },
      { path: '/regional-map', label: 'Regional Map', icon: MapPin },
      { path: '/cost-carbon', label: 'Cost & Carbon', icon: Coins },
    ],
  },
  {
    label: 'Plan',
    items: [
      { path: '/microgrid-planner', label: 'Microgrid Planner', icon: ShieldAlert },
      { path: '/assistant', label: 'AI Assistant', icon: Bot },
      { path: '/model-lab', label: 'Model Lab', icon: FlaskConical },
    ],
  },
  {
    label: 'System',
    items: [
      { path: '/settings', label: 'Settings & Data', icon: Settings },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed, toggleSidebar, mobileMenuOpen, setMobileMenuOpen } = useUiStore();

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Sidebar Shell */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-surface border-r border-border transition-all duration-300 ease-in-out lg:static',
          sidebarCollapsed ? 'w-16' : 'w-64',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Top Header / Brand */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-border">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-black font-bold shrink-0 shadow-glow">
              <Zap className="w-4 h-4 fill-black" />
            </div>
            {!sidebarCollapsed && (
              <div className="flex flex-col">
                <span className="font-bold text-sm tracking-tight text-primary font-mono">
                  Voltaris <span className="text-accent-cyan">AI</span>
                </span>
                <span className="text-[10px] text-muted tracking-wider uppercase">Stage 1 Control</span>
              </div>
            )}
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden lg:flex p-1 rounded-md text-muted hover:text-primary hover:bg-elevated transition-colors"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Item Groups */}
        <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
          {NAV_GROUPS.map((group) => (
            <div key={group.label} className="space-y-1">
              {!sidebarCollapsed ? (
                <div className="px-3 text-[10px] font-semibold text-muted uppercase tracking-wider">
                  {group.label}
                </div>
              ) : (
                <div className="h-px bg-border/40 my-2 mx-2" />
              )}

              {group.items.map((item) => {
                const Icon = item.icon;
                const linkContent = (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-150 relative group',
                        isActive
                          ? 'bg-elevated text-primary shadow-sm font-semibold'
                          : 'text-secondary hover:text-primary hover:bg-elevated/50'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-accent-green rounded-r-md" />
                        )}
                        <Icon
                          className={clsx(
                            'w-4 h-4 shrink-0 transition-colors',
                            isActive ? 'text-accent-cyan' : 'text-muted group-hover:text-primary'
                          )}
                        />
                        {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                      </>
                    )}
                  </NavLink>
                );

                if (sidebarCollapsed) {
                  return (
                    <Tooltip key={item.path} content={item.label} position="right">
                      {linkContent}
                    </Tooltip>
                  );
                }
                return linkContent;
              })}
            </div>
          ))}
        </div>

        {/* Sidebar Footer info */}
        {!sidebarCollapsed && (
          <div className="p-3 border-t border-border bg-base/40 text-[11px] text-muted space-y-1">
            <div className="flex items-center justify-between">
              <span>Grid Frequency</span>
              <span className="font-mono text-accent-green font-semibold">50.01 Hz</span>
            </div>
            <div className="flex items-center justify-between">
              <span>National Node</span>
              <span className="font-mono text-secondary">WR-IND-01</span>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
