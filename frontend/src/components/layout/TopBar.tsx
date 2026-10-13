import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Menu,
  RefreshCw,
  Bell,
  MapPin,
  Calendar,
  Layers,
  ChevronDown,
  User,
  Shield,
  FileDown,
  Check,
} from 'lucide-react';
import { useUiStore, LOCATIONS } from '../../store/uiStore';
import { DateRangePreset, LocationId } from '../../types';
import { formatTimeIST } from '../../lib/formatters';
import { useQueryClient } from '@tanstack/react-query';
import { clsx } from 'clsx';

export const TopBar: React.FC = () => {
  const location = useLocation();
  const queryClient = useQueryClient();

  const {
    setMobileMenuOpen,
    selectedLocationId,
    setSelectedLocationId,
    dateRange,
    setDateRange,
    dataMode,
    setDataMode,
    powerUnit,
    togglePowerUnit,
    lastRefreshed,
    touchLastRefreshed,
    notifications,
    setNotificationDrawerOpen,
  } = useUiStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataModePopoverOpen, setDataModePopoverOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Determine current page title from path
  const getPageTitle = (path: string) => {
    switch (path) {
      case '/': return { title: 'Overview Dashboard', section: 'Operate' };
      case '/forecasting': return { title: 'AI Forecasting Engine', section: 'Operate' };
      case '/grid-intelligence': return { title: 'Grid Intelligence & Risk', section: 'Operate' };
      case '/battery-optimization': return { title: 'Battery Dispatch Optimization', section: 'Operate' };
      case '/ev-management': return { title: 'EV Fleet & Station Management', section: 'Operate' };
      case '/scenario-simulator': return { title: 'Scenario & Stress Simulator', section: 'Analyse' };
      case '/weather-intelligence': return { title: 'Weather & Microclimate Intelligence', section: 'Analyse' };
      case '/regional-map': return { title: 'Regional Energy Infrastructure Map', section: 'Analyse' };
      case '/cost-carbon': return { title: 'Cost & Carbon Analytics', section: 'Analyse' };
      case '/microgrid-planner': return { title: 'Microgrid Resilience Planner', section: 'Plan' };
      case '/assistant': return { title: 'AI Energy Dispatch Assistant', section: 'Plan' };
      case '/model-lab': return { title: 'Model Architecture Lab', section: 'Plan' };
      case '/settings': return { title: 'Settings & Data Management', section: 'System' };
      default: return { title: 'Voltaris AI Control', section: 'Operate' };
    }
  };

  const { title, section } = getPageTitle(location.pathname);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    touchLastRefreshed();
    await queryClient.refetchQueries();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 450);
  };

  return (
    <header className="sticky top-0 z-30 h-14 bg-surface/90 backdrop-blur-md border-b border-border flex items-center justify-between px-4 gap-3">
      {/* Left: Mobile hamburger + Breadcrumb Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          aria-label="Open navigation menu"
          className="lg:hidden p-1.5 rounded-lg text-secondary hover:text-primary hover:bg-elevated transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] text-muted uppercase tracking-wider font-semibold">
            <span>Voltaris</span>
            <span>/</span>
            <span>{section}</span>
          </div>
          <h1 className="text-sm font-semibold text-primary truncate leading-tight tracking-tight">
            {title}
          </h1>
        </div>
      </div>

      {/* Right: Controls & Global Selectors */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Location Dropdown */}
        <div className="hidden md:flex items-center bg-base border border-border rounded-lg px-2.5 py-1 text-xs text-secondary gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-accent-cyan shrink-0" />
          <select
            value={selectedLocationId}
            onChange={(e) => setSelectedLocationId(e.target.value as LocationId)}
            className="bg-transparent text-primary text-xs focus:outline-none cursor-pointer pr-1"
          >
            {LOCATIONS.map((loc) => (
              <option key={loc.id} value={loc.id} className="bg-surface text-primary">
                {loc.name} ({loc.state})
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Selector */}
        <div className="hidden sm:flex items-center bg-base border border-border rounded-lg px-2 py-1 text-xs text-secondary gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-muted shrink-0" />
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as DateRangePreset)}
            className="bg-transparent text-primary text-xs focus:outline-none cursor-pointer font-mono"
          >
            <option value="today" className="bg-surface text-primary">Today (Live)</option>
            <option value="24h" className="bg-surface text-primary">Next 24h</option>
            <option value="7d" className="bg-surface text-primary">Next 7 Days</option>
            <option value="30d" className="bg-surface text-primary">Last 30 Days</option>
          </select>
        </div>

        {/* Data Mode Badge & Popover */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDataModePopoverOpen(!dataModePopoverOpen)}
            className={clsx(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-semibold border transition-all',
              dataMode === 'live'
                ? 'bg-accent-green/15 text-accent-green border-accent-green/30'
                : 'bg-accent-amber/15 text-accent-amber border-accent-amber/30'
            )}
          >
            <span
              className={clsx(
                'w-1.5 h-1.5 rounded-full animate-pulse',
                dataMode === 'live' ? 'bg-accent-green' : 'bg-accent-amber'
              )}
            />
            <span>{dataMode === 'live' ? 'LIVE DATA' : 'DEMO MODE'}</span>
            <ChevronDown className="w-3 h-3 text-muted" />
          </button>

          {dataModePopoverOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-elevated border border-border p-3 shadow-2xl z-50 text-xs space-y-2">
              <div className="font-semibold text-primary pb-1 border-b border-border/50 flex items-center justify-between">
                <span>Data Ingestion Engine</span>
                <span className="font-mono text-[10px] text-muted">{formatTimeIST(lastRefreshed)}</span>
              </div>
              <p className="text-[11px] text-secondary leading-relaxed">
                {dataMode === 'live'
                  ? 'Currently streaming telemetry from state SCADA & weather APIs.'
                  : 'Deterministic physics simulation enabled with diurnal solar bell-curve and EV peak models.'}
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setDataMode('demo');
                    setDataModePopoverOpen(false);
                  }}
                  className={clsx(
                    'flex-1 py-1 px-2 rounded text-[11px] font-medium border text-center transition-colors',
                    dataMode === 'demo'
                      ? 'bg-accent-amber/20 text-accent-amber border-accent-amber/40 font-semibold'
                      : 'border-border text-secondary hover:text-primary'
                  )}
                >
                  Demo Mode
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDataMode('live');
                    setDataModePopoverOpen(false);
                  }}
                  className={clsx(
                    'flex-1 py-1 px-2 rounded text-[11px] font-medium border text-center transition-colors',
                    dataMode === 'live'
                      ? 'bg-accent-green/20 text-accent-green border-accent-green/40 font-semibold'
                      : 'border-border text-secondary hover:text-primary'
                  )}
                >
                  Live Mode
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Units Toggle (MW / kW) */}
        <button
          type="button"
          onClick={togglePowerUnit}
          aria-label="Toggle display power unit"
          className="hidden sm:inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-base border border-border text-xs font-mono font-medium text-secondary hover:text-primary transition-colors"
        >
          <Layers className="w-3 h-3 text-accent-cyan" />
          <span>{powerUnit}</span>
        </button>

        {/* Refresh Button */}
        <button
          type="button"
          onClick={handleRefresh}
          aria-label="Refresh telemetry queries"
          className="p-1.5 rounded-lg border border-border bg-base hover:bg-elevated text-secondary hover:text-primary transition-colors focus:outline-none"
        >
          <RefreshCw className={clsx('w-4 h-4', isRefreshing && 'animate-spin text-accent-cyan')} />
        </button>

        {/* Notification Bell */}
        <button
          type="button"
          onClick={() => setNotificationDrawerOpen(true)}
          aria-label="View notifications and grid alerts"
          className="relative p-1.5 rounded-lg border border-border bg-base hover:bg-elevated text-secondary hover:text-primary transition-colors focus:outline-none"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent-red text-white text-[9px] font-bold flex items-center justify-center font-mono animate-bounce">
              {unreadCount}
            </span>
          )}
        </button>

        {/* User Menu Avatar */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            aria-label="User account and quick export"
            className="w-8 h-8 rounded-lg bg-elevated border border-border flex items-center justify-center text-primary hover:border-accent-cyan/50 transition-colors"
          >
            <User className="w-4 h-4 text-accent-cyan" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl bg-elevated border border-border p-2 shadow-2xl z-50 text-xs space-y-1">
              <div className="px-2.5 py-1.5 border-b border-border/50 text-[11px]">
                <div className="font-semibold text-primary">National Grid Operator</div>
                <div className="text-muted font-mono text-[10px]">operator@voltaris.ai</div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  window.location.href = '#/settings';
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-surface text-secondary hover:text-primary transition-colors flex items-center gap-2"
              >
                <Shield className="w-3.5 h-3.5 text-accent-cyan" />
                <span>Security & API Keys</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setUserMenuOpen(false);
                  alert('Generating Voltaris Executive Summary Report (PDF/CSV)...');
                }}
                className="w-full text-left px-2.5 py-1.5 rounded-md hover:bg-surface text-secondary hover:text-primary transition-colors flex items-center gap-2"
              >
                <FileDown className="w-3.5 h-3.5 text-accent-green" />
                <span>Export Executive Report</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
