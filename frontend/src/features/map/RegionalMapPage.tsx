import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../services/api/apiClient';
import { RegionalAsset, RiskLevel } from '../../types';
import { Card } from '../../components/ui/Card';
import { Drawer } from '../../components/ui/Overlays';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { LoadingSkeleton, ErrorState } from '../../components/ui/StateBanners';
import { AssumptionNote } from '../../components/ui/AssumptionNote';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import {
  Sun,
  Wind,
  Car,
  Factory,
  Search,
  Layers,
  Info,
  Activity,
  ArrowRight,
} from 'lucide-react';

// Create custom colored SVG marker icons for Leaflet
const createAssetIcon = (type: string, risk: RiskLevel) => {
  const riskBorder = risk === 'critical' ? '#F26B6B' : risk === 'watch' ? '#F5B83D' : '#2ED47A';
  const typeColor = type === 'solar' ? '#F5B83D' : type === 'wind' ? '#22D3EE' : type === 'ev' ? '#FB923C' : '#E2E8F0';
  
  const svg = `
    <div style="
      background-color: #101828;
      border: 2px solid ${riskBorder};
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 10px ${riskBorder}40;
    ">
      <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${typeColor};"></div>
    </div>
  `;
  return L.divIcon({
    html: svg,
    className: 'custom-leaflet-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

export const RegionalMapPage: React.FC = () => {
  const [selectedAsset, setSelectedAsset] = useState<RegionalAsset | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['regional-assets'],
    queryFn: () => apiClient.getRegionalAssets(),
  });

  const filteredAssets = useMemo(() => {
    if (!data) return [];
    return data.filter((asset) => {
      if (typeFilter !== 'all' && asset.type !== typeFilter) return false;
      if (riskFilter !== 'all' && asset.risk !== riskFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          asset.name.toLowerCase().includes(q) ||
          asset.locationName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [data, typeFilter, riskFilter, searchQuery]);

  if (isLoading) return <LoadingSkeleton rows={4} height="h-32" />;
  if (isError || !data) {
    return (
      <ErrorState
        title="GIS Geospatial Gateway Offline"
        message={(error as Error)?.message || 'Failed to stream geographical asset vectors.'}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary">Regional Energy Infrastructure Map</h2>
          <p className="text-xs text-secondary mt-0.5">
            Geospatial tracking of solar parks, wind corridors, EV charging networks, and industrial demand clusters across Western & Southern India.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-base border border-border text-[11px] text-muted">
          <Info className="w-3.5 h-3.5 text-accent-cyan" />
          <span>Sample/simulated values, not real-time grid measurements</span>
        </div>
      </div>

      {/* Floating Filter Bar */}
      <div className="p-3 bg-surface border border-border rounded-xl flex flex-wrap items-center justify-between gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-base border border-border rounded-lg px-2.5 py-1.5 text-xs text-primary focus:outline-none cursor-pointer"
          >
            <option value="all">All Asset Types</option>
            <option value="solar">Solar PV Parks</option>
            <option value="wind">Wind Turbines</option>
            <option value="ev">EV Charging Hubs</option>
            <option value="demand">Demand Zones</option>
          </select>

          {/* Risk Filter */}
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-base border border-border rounded-lg px-2.5 py-1.5 text-xs text-primary focus:outline-none cursor-pointer"
          >
            <option value="all">All Risk Levels</option>
            <option value="stable">Stable Ring (Green)</option>
            <option value="watch">Watch Ring (Yellow)</option>
            <option value="critical">Critical Ring (Red)</option>
          </select>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search regional site..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-base border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-primary focus:outline-none focus:border-accent-cyan"
          />
        </div>
      </div>

      {/* Map Container */}
      <div className="relative h-[560px] w-full rounded-xl overflow-hidden border border-border shadow-card bg-base">
        <MapContainer
          center={[19.5, 75.5]}
          zoom={6}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%' }}
        >
          {/* Dark Mode styled OpenStreetMap Tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="dark-map-tiles"
          />

          {filteredAssets.map((asset) => (
            <Marker
              key={asset.id}
              position={[asset.lat, asset.lng]}
              icon={createAssetIcon(asset.type, asset.risk)}
              eventHandlers={{
                click: () => setSelectedAsset(asset),
              }}
            >
              <Popup>
                <div className="p-1 space-y-1 text-xs font-mono">
                  <div className="font-bold text-primary font-sans">{asset.name}</div>
                  <div className="text-secondary">{asset.locationName}</div>
                  <div className="text-accent-cyan">Capacity: {asset.capacityMW} MW</div>
                  <div className="text-muted">Current Output: {asset.currentOutputMW} MW</div>
                  <button
                    type="button"
                    onClick={() => setSelectedAsset(asset)}
                    className="mt-1 text-accent-cyan hover:underline text-[11px] block font-sans"
                  >
                    Open Telemetry Drawer →
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Floating Map Legend */}
        <div className="absolute bottom-4 left-4 z-[1000] p-3 rounded-lg bg-surface/90 backdrop-blur-md border border-border shadow-xl text-xs space-y-2 pointer-events-auto">
          <div className="font-semibold text-primary text-[11px] uppercase tracking-wider">
            Infrastructure Legend
          </div>
          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-amber" />
              <span className="text-secondary">Solar PV Farm</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-cyan" />
              <span className="text-secondary">Wind Corridor</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-accent-orange" />
              <span className="text-secondary">EV Mega Charging Hub</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span className="text-secondary">Heavy Demand Zone</span>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Detail Side Drawer */}
      <Drawer
        isOpen={Boolean(selectedAsset)}
        onClose={() => setSelectedAsset(null)}
        title={selectedAsset?.name || 'Asset Telemetry'}
        description={selectedAsset?.locationName}
        width="max-w-md"
      >
        {selectedAsset && (
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border/50">
              <StatusBadge status={selectedAsset.risk} />
              <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-base border border-border">
                {selectedAsset.type} Node
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 font-mono">
              <div className="p-3 rounded-lg bg-base border border-border">
                <span className="text-[11px] font-sans text-muted block">Installed Capacity</span>
                <span className="text-base font-bold text-primary">{selectedAsset.capacityMW} MW</span>
              </div>
              <div className="p-3 rounded-lg bg-base border border-border">
                <span className="text-[11px] font-sans text-muted block">Current Output</span>
                <span className="text-base font-bold text-accent-cyan">{selectedAsset.currentOutputMW} MW</span>
              </div>
              <div className="p-3 rounded-lg bg-base border border-border">
                <span className="text-[11px] font-sans text-muted block">1h Ahead Forecast</span>
                <span className="text-base font-bold text-primary">{selectedAsset.details.forecast1hMW} MW</span>
              </div>
              <div className="p-3 rounded-lg bg-base border border-border">
                <span className="text-[11px] font-sans text-muted block">Efficiency Rating</span>
                <span className="text-base font-bold text-accent-green">{selectedAsset.details.efficiencyPct}%</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-base border border-border/80 text-xs space-y-1">
              <div className="font-semibold text-secondary">Operating Telemetry State</div>
              <p className="text-primary font-mono">{selectedAsset.details.status}</p>
            </div>

            <div>
              <AssumptionNote
                note="Geographic coordinates mapped to national substations. Node transmission losses calculated per Central Electricity Authority (CEA) guidelines."
                type="simulated"
              />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
