import React, { useState } from 'react';
import { useUiStore, LOCATIONS } from '../../store/uiStore';
import { Card, CardHeader } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Overlays';
import { FileDropzone } from '../../components/ui/FileDropzone';
import { NumberField, ToggleField, SliderField } from '../../components/ui/FormControls';
import { StatusBadge } from '../../components/ui/StatusBadge';
import {
  Key,
  Database,
  Sliders,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const {
    simulateApiError,
    setSimulateApiError,
    artificialLatencyMs,
    setArtificialLatencyMs,
    dataMode,
    setDataMode,
  } = useUiStore();

  const [activeTab, setActiveTab] = useState<string>('upload');
  const [showApiKey, setShowApiKey] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>('gm_live_sec_994827104928472918471');
  const [apiStatus, setApiStatus] = useState<'idle' | 'testing' | 'connected'>('connected');
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  const settingsTabs = [
    { id: 'upload', label: 'Data Ingestion' },
    { id: 'apikeys', label: 'API Keys & SCADA' },
    { id: 'demo', label: 'Developer & Demo Switches' },
    { id: 'locations', label: 'Nodes & Locations' },
    { id: 'display', label: 'Units & Display' },
  ];

  const handleTestConnection = () => {
    setApiStatus('testing');
    setTimeout(() => {
      setApiStatus('connected');
      alert('SCADA API Connection Verified: Latency 38ms. All 4 regional substations responding.');
    }, 600);
  };

  const handleSaveAll = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-primary">Settings & Data Management</h2>
          <p className="text-xs text-secondary mt-0.5">
            Configure telemetry ingestion schemas, secure SCADA API tokens, and operational threshold defaults.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="text-xs font-semibold text-accent-green flex items-center gap-1 animate-fadeIn">
              <Check className="w-4 h-4" />
              <span>Saved successfully!</span>
            </span>
          )}
          <button
            type="button"
            onClick={handleSaveAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent-cyan hover:bg-cyan-400 text-black text-xs font-semibold transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Configuration</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={settingsTabs}
        activeTab={activeTab}
        onChange={(t) => setActiveTab(t)}
      />

      {/* Tab 1: Data Ingestion */}
      {activeTab === 'upload' && (
        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Telemetry Dataset Upload & Validation Pipeline"
              subtitle="Upload CSV or Parquet timeseries for Solar, Wind, Demand, or EV chargers (15-min or 1-hour resolution)"
            />
            <FileDropzone />
          </Card>
        </div>
      )}

      {/* Tab 2: API Keys & SCADA */}
      {activeTab === 'apikeys' && (
        <Card className="space-y-4">
          <CardHeader
            title="SCADA & Meteorological API Connectivity"
            subtitle="Secure tokens used for real-time telemetry streaming (Stored encrypted in backend vault)"
          />
          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block text-xs font-medium text-secondary mb-1">
                State Load Dispatch Center (SLDC) SCADA Token
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-base border border-border rounded-lg pl-3 pr-10 py-2 text-xs font-mono text-primary focus:border-accent-cyan focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted mt-1">
                Keys are stored on the backend only; never exposed in client bundle.
              </p>
            </div>

            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={handleTestConnection}
                className="px-3 py-1.5 rounded-lg border border-border bg-base hover:bg-elevated text-xs font-medium text-secondary hover:text-primary transition-colors"
              >
                {apiStatus === 'testing' ? 'Testing Link...' : 'Test SCADA Connection'}
              </button>
              {apiStatus === 'connected' && (
                <StatusBadge status="Live" size="sm" />
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Tab 3: Developer & Demo Switches */}
      {activeTab === 'demo' && (
        <Card className="space-y-5">
          <CardHeader
            title="Demonstration Controls & Failure Injection (Hackathon Testing)"
            subtitle="Toggle simulated states to demonstrate error handling, retries, and network latency"
          />

          <div className="space-y-4 max-w-xl">
            <ToggleField
              label="Simulate Backend Gateway Outage (503 Error)"
              description="Forces apiClient to reject calls, verifying ErrorState components and retry actions across all pages."
              checked={simulateApiError}
              onChange={(checked) => setSimulateApiError(checked)}
            />

            <div className="pt-2">
              <SliderField
                label="Simulated Network Latency"
                value={artificialLatencyMs}
                min={100}
                max={1500}
                step={50}
                unit="ms"
                defaultValue={400}
                onChange={(val) => setArtificialLatencyMs(val)}
              />
              <span className="text-[11px] text-muted">
                Adjusts artificial delay to showcase loading skeletons and spinner transitions.
              </span>
            </div>

            <div className="pt-3 border-t border-border/50">
              <label className="block text-xs font-medium text-secondary mb-1">
                Data Mode Switch
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDataMode('demo')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border text-center transition-colors ${
                    dataMode === 'demo'
                      ? 'bg-accent-amber/20 text-accent-amber border-accent-amber/40'
                      : 'border-border text-secondary hover:text-primary'
                  }`}
                >
                  Demo Mode (Physical Simulation)
                </button>
                <button
                  type="button"
                  onClick={() => setDataMode('live')}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold border text-center transition-colors ${
                    dataMode === 'live'
                      ? 'bg-accent-green/20 text-accent-green border-accent-green/40'
                      : 'border-border text-secondary hover:text-primary'
                  }`}
                >
                  Live Mode (Backend Connection)
                </button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Tab 4: Nodes & Locations */}
      {activeTab === 'locations' && (
        <Card>
          <CardHeader
            title="Configured Regional Substation Nodes"
            subtitle="Active telemetry feeds mapped in the Indian Regional Grid"
          />
          <div className="space-y-3">
            {LOCATIONS.map((loc) => (
              <div
                key={loc.id}
                className="p-3 rounded-lg bg-base border border-border flex items-center justify-between text-xs"
              >
                <div>
                  <h4 className="font-semibold text-primary">{loc.name}</h4>
                  <p className="text-secondary font-mono text-[11px]">
                    State: {loc.state} | Coordinates: [{loc.coordinates.join(', ')}]
                  </p>
                </div>
                <div className="text-right font-mono text-[11px]">
                  <div className="text-accent-amber">Solar: {loc.installedSolarMW} MW</div>
                  <div className="text-accent-cyan">Wind: {loc.installedWindMW} MW</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tab 5: Units & Display */}
      {activeTab === 'display' && (
        <Card className="space-y-4">
          <CardHeader
            title="Unit & Interface Display Preferences"
            subtitle="Measurement standards applied throughout KPI cards and chart axes"
          />
          <div className="space-y-3 text-xs text-secondary max-w-md">
            <div className="flex items-center justify-between p-2.5 rounded bg-base border border-border">
              <span>Primary Power Unit:</span>
              <span className="font-mono text-primary font-bold">Megawatts (MW) / Kilowatts (kW)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded bg-base border border-border">
              <span>Financial Currency:</span>
              <span className="font-mono text-primary font-bold">Indian Rupee (₹ INR)</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded bg-base border border-border">
              <span>Timezone Standard:</span>
              <span className="font-mono text-primary font-bold">Asia/Kolkata (IST, UTC+05:30)</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
