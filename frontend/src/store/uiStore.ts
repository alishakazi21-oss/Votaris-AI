import { create } from 'zustand';
import { LocationId, LocationOption, DateRangePreset, DataMode, PowerUnit, GridAlert } from '../types';

export const LOCATIONS: LocationOption[] = [
  { id: 'pune', name: 'Pune Smart Grid Hub', state: 'Maharashtra', coordinates: [18.5204, 73.8567], installedSolarMW: 120, installedWindMW: 45 },
  { id: 'nashik', name: 'Nashik Renewable Valley', state: 'Maharashtra', coordinates: [19.9975, 73.7898], installedSolarMW: 85, installedWindMW: 90 },
  { id: 'jaisalmer', name: 'Jaisalmer Solar-Wind Park', state: 'Rajasthan', coordinates: [26.9157, 70.9083], installedSolarMW: 450, installedWindMW: 310 },
  { id: 'chennai', name: 'Chennai Coastal Microgrid', state: 'Tamil Nadu', coordinates: [13.0827, 80.2707], installedSolarMW: 160, installedWindMW: 110 },
];

export interface NotificationItem extends GridAlert {
  read: boolean;
}

interface UiState {
  // Navigation & Shell
  sidebarCollapsed: boolean;
  mobileMenuOpen: boolean;
  notificationDrawerOpen: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  setNotificationDrawerOpen: (open: boolean) => void;

  // Global Context Selectors
  selectedLocationId: LocationId;
  setSelectedLocationId: (id: LocationId) => void;
  selectedLocation: LocationOption;

  dateRange: DateRangePreset;
  setDateRange: (range: DateRangePreset) => void;

  powerUnit: PowerUnit;
  setPowerUnit: (unit: PowerUnit) => void;
  togglePowerUnit: () => void;

  dataMode: DataMode;
  setDataMode: (mode: DataMode) => void;

  // Demo / Developer switches
  simulateApiError: boolean;
  setSimulateApiError: (val: boolean) => void;
  artificialLatencyMs: number;
  setArtificialLatencyMs: (ms: number) => void;

  // Timestamps
  lastRefreshed: Date;
  touchLastRefreshed: () => void;

  // Alerts & Notifications
  notifications: NotificationItem[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearNotification: (id: string) => void;
}

const INITIAL_ALERTS: NotificationItem[] = [
  {
    id: 'alt-1',
    timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    severity: 'critical',
    type: 'Forecast Gap',
    title: 'Projected 42 MW Evening Peak Deficit',
    cause: 'Sudden cloud cover drop in Solar coupled with 18:30 EV charging surge',
    recommendedAction: 'Trigger Battery discharge at 18:00 (35 MW) and initiate flexible EV load shedding',
    whyExplanation: 'Demand will outpace combined solar and grid tie capacity between 18:30 and 20:00.',
    status: 'active',
    read: false,
  },
  {
    id: 'alt-2',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    severity: 'watch',
    type: 'Curtailment Warning',
    title: 'Mid-Day Solar Generation Spike',
    cause: 'Irradiance peak exceeding substation transformer headroom by 12 MW',
    recommendedAction: 'Direct surplus solar to BESS storage units and commercial EV charging stations',
    whyExplanation: 'Prevents thermal tripping while capturing zero-marginal-cost clean energy.',
    status: 'active',
    read: false,
  },
  {
    id: 'alt-3',
    timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    severity: 'stable',
    type: 'Schedule Optimized',
    title: 'Overnight Battery Pre-Charge Complete',
    cause: 'Low off-peak tariff (₹3.40/kWh) utilized between 02:00 and 05:00',
    recommendedAction: 'Reserve held for morning commercial demand peak at 09:30',
    whyExplanation: 'Optimized cost by avoiding peak tariff bands.',
    status: 'resolved',
    read: true,
  },
];

export const useUiStore = create<UiState>((set, get) => ({
  sidebarCollapsed: false,
  mobileMenuOpen: false,
  notificationDrawerOpen: false,
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setMobileMenuOpen: (mobileMenuOpen) => set({ mobileMenuOpen }),
  setNotificationDrawerOpen: (notificationDrawerOpen) => set({ notificationDrawerOpen }),

  selectedLocationId: 'pune',
  selectedLocation: LOCATIONS[0],
  setSelectedLocationId: (id) => {
    const loc = LOCATIONS.find((l) => l.id === id) || LOCATIONS[0];
    set({ selectedLocationId: id, selectedLocation: loc, lastRefreshed: new Date() });
  },

  dateRange: '24h',
  setDateRange: (dateRange) => set({ dateRange, lastRefreshed: new Date() }),

  powerUnit: 'MW',
  setPowerUnit: (powerUnit) => set({ powerUnit }),
  togglePowerUnit: () => set((s) => ({ powerUnit: s.powerUnit === 'MW' ? 'kW' : 'MW' })),

  dataMode: (import.meta.env.VITE_DATA_MODE as DataMode) || 'demo',
  setDataMode: (dataMode) => set({ dataMode }),

  simulateApiError: false,
  setSimulateApiError: (simulateApiError) => set({ simulateApiError }),
  artificialLatencyMs: 400,
  setArtificialLatencyMs: (artificialLatencyMs) => set({ artificialLatencyMs }),

  lastRefreshed: new Date(),
  touchLastRefreshed: () => set({ lastRefreshed: new Date() }),

  notifications: INITIAL_ALERTS,
  markNotificationAsRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
  markAllNotificationsAsRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),
  clearNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));
