
import * as React from 'react';
import type { PrefixSettings } from '../types';
import { PencilSquareIcon, CheckCircleIcon, ArrowPathIcon } from './Icons';

interface PreviewRowProps {
    label: string;
    settingKey: keyof PrefixSettings;
    exampleNum: number;
    exampleSuffix?: string;
    localSettings: PrefixSettings;
    currentSettings: PrefixSettings;
    onUpdateSetting: (key: keyof PrefixSettings, val: string) => void;
}

const PreviewRow: React.FC<PreviewRowProps> = ({ 
    label, 
    settingKey, 
    exampleNum, 
    exampleSuffix = "", 
    localSettings, 
    currentSettings, 
    onUpdateSetting 
}) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div>
            <p className="font-bold text-coral-dark">{label}</p>
            <p className="text-xs text-gray-500">Global identifier prefix</p>
        </div>
        <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500 uppercase">Label:</span>
            <input 
                type="text" 
                value={localSettings[settingKey] || ""} 
                onChange={(e) => onUpdateSetting(settingKey, e.target.value)}
                className="flex-grow p-2 border border-gray-300 rounded font-mono text-sm focus:ring-2 focus:ring-coral-blue outline-none bg-white text-gray-900 shadow-inner"
            />
        </div>
        <div className="bg-gray-50 p-2 rounded border border-dashed border-gray-300">
            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Preview ID</p>
            <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400 line-through">{(currentSettings[settingKey] as string) || "..."} {exampleNum}{exampleSuffix}</span>
                <span className="text-gray-400">→</span>
                <span className="font-bold text-coral-blue">{localSettings[settingKey]} {exampleNum}{exampleSuffix}</span>
            </div>
        </div>
    </div>
);

interface NumberingSystemPageProps {
  settings: PrefixSettings;
  onUpdate: (newSettings: PrefixSettings) => void;
  onNavigateBack: () => void;
}

const NumberingSystemPage: React.FC<NumberingSystemPageProps> = ({ settings, onUpdate, onNavigateBack }) => {
  const [localSettings, setLocalSettings] = React.useState<PrefixSettings>({
      ...settings,
      site: settings.site || 'Site',
      collectionZone: settings.collectionZone || 'CZ',
      anchor: settings.anchor || 'Anchor',
      substrateZone: settings.substrateZone || 'SZ',
      rubbleAnchor: settings.rubbleAnchor || 'RA',
      float: settings.float || 'Float',
      tank: settings.tank || 'Tank',
      pump: settings.pump || 'Pump',
      light: settings.light || 'Light',
      power: settings.power || 'Power',
      filter: settings.filter || 'Filter',
      filterSock: settings.filterSock || 'Sock',
      autospawner: settings.autospawner || 'Spawner',
      chiller: settings.chiller || 'Chiller'
  });
  
  const [isApplying, setIsApplying] = React.useState(false);

  const handleApply = () => {
    if (confirm("Are you sure? This will RENAME every item in your entire nursery to use these new prefixes. This will re-sequence all items (1, 2, 3...) globally by type. This cannot be easily undone.")) {
      setIsApplying(true);
      setTimeout(() => {
        onUpdate(localSettings);
        setIsApplying(false);
        alert("Numbering system updated and all records renamed successfully.");
      }, 500);
    }
  };

  const updateSetting = React.useCallback((key: keyof PrefixSettings, val: string) => {
      setLocalSettings(prev => ({ ...prev, [key]: val }));
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg space-y-6 border-2 border-purple-600">
      <div className="flex justify-between items-center border-b pb-4">
        <h2 className="text-2xl font-bold text-coral-dark flex items-center gap-2">
            <PencilSquareIcon className="w-6 h-6 text-purple-600" />
            Global Numbering System
        </h2>
        <button
          onClick={onNavigateBack}
          className="bg-gray-200 hover:bg-gray-300 text-coral-dark font-bold py-2 px-4 rounded-lg transition-colors"
        >
          &larr; Back
        </button>
      </div>

      <div className="p-4 bg-purple-50 border border-purple-100 rounded-xl">
          <p className="text-sm text-purple-800 font-medium mb-1">
              Centralized Sequential Numbering Control
          </p>
          <p className="text-xs text-purple-700">
              Customize the prefixes for every item type in your system. Clicking "Apply" will globally re-sequence existing records to match these prefixes (e.g., all Branches will be numbered 1 through N).
          </p>
      </div>

      <div className="space-y-8">
          {/* Nursery Assets */}
          <section className="space-y-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-1">Nursery Assets & Locations</h3>
              <div className="space-y-3">
                  <PreviewRow label="Sites" settingKey="site" exampleNum={1} localSettings={localSettings} currentSettings={settings} onUpdateSetting={updateSetting} />
                  <PreviewRow label="Collection Zones" settingKey="collectionZone" exampleNum={5} localSettings={localSettings} currentSettings={settings} onUpdateSetting={updateSetting} />
                  <PreviewRow label="Anchors" settingKey="anchor" exampleNum={24} localSettings={localSettings} currentSettings={settings} onUpdateSetting={updateSetting} />
                  <PreviewRow label="Substrate Zones" settingKey="substrateZone" exampleNum={2} localSettings={localSettings} currentSettings={settings} onUpdateSetting={updateSetting} />
              </div>
          </section>

          {/* Structures */}
          <section className="space-y-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-1">Nursery Structures</h3>
              <div className="space-y-3">
                  <PreviewRow label="Trees (Nursery)" settingKey="tree" exampleNum={1} localSettings={localSettings} currentSettings={settings} onUpdateSetting={updateSetting} />
                  <PreviewRow label="Reef² (Squared)" settingKey="reef2" exampleNum={1} localSettings={localSettings} currentSettings={settings} onUpdateSetting={updateSetting} />
                  <PreviewRow label="Reef³ (Cubed)" settingKey="reef3" exampleNum={4} localSettings={localSettings} currentSettings={settings} onUpdateSetting={updateSetting} />
                  <PreviewRow label="Structure Floats" settingKey="float" exampleNum={1} exampleSuffix="-F2" localSettings={localSettings} currentSettings={settings} onUpdateSetting={updateSetting} />
              </div>
          </section>
          
          {/* Inventory */}
          <section className="space-y-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-1">Inventory Items</h3>
              <div className="space-y-3">
                  <PreviewRow label="Branches" settingKey="branch" exampleNum={101} localSettings={localSettings} currentSettings={settings} onUpdateSetting={updateSetting} />
                  <PreviewRow label="Strings (Rope Units)" settingKey="ropeUnit" exampleNum={5} localSettings={localSettings} currentSettings={settings} onUpdateSetting={updateSetting} />
                  <PreviewRow label="Device Clusters" settingKey="deviceCluster" exampleNum={12} localSettings={localSettings} currentSettings={settings} onUpdateSetting={updateSetting} />
                  <PreviewRow label="Rubble Anchors" settingKey="rubbleAnchor" exampleNum={8} localSettings={localSettings} currentSettings={settings} onUpdateSetting={updateSetting} />
              </div>
          </section>

          {/* Facility Equipment */}
          <section className="space-y-4">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider px-1">Facility Equipment</h3>
              <div className="space-y-3">
                  <PreviewRow label="Tanks" settingKey="tank" exampleNum={1} localSettings={localSettings} currentSettings={settings} onUpdateSetting={updateSetting} />
                  <PreviewRow label="Pumps" settingKey="pump" exampleNum={4} localSettings={localSettings} currentSettings={settings} onUpdateSetting={updateSetting} />
                  <PreviewRow label="Lights" settingKey="light" exampleNum={2} localSettings={localSettings} currentSettings={settings} onUpdateSetting={updateSetting} />
                  <PreviewRow label="Power Modules" settingKey="power" exampleNum={1} localSettings={localSettings} currentSettings={settings} onUpdateSetting={updateSetting} />
                  <PreviewRow label="Filters" settingKey="filter" exampleNum={3} localSettings={localSettings} currentSettings={settings} onUpdateSetting={updateSetting} />
                  <PreviewRow label="Filter Socks" settingKey="filterSock" exampleNum={15} localSettings={localSettings} currentSettings={settings} onUpdateSetting={updateSetting} />
                  <PreviewRow label="Autospawners" settingKey="autospawner" exampleNum={2} localSettings={localSettings} currentSettings={settings} onUpdateSetting={updateSetting} />
                  <PreviewRow label="Chillers" settingKey="chiller" exampleNum={1} localSettings={localSettings} currentSettings={settings} onUpdateSetting={updateSetting} />
              </div>
          </section>
      </div>

      <div className="pt-6 border-t flex flex-col md:flex-row items-center justify-between gap-4 sticky bottom-0 bg-white pb-4">
          <div className="text-sm text-gray-500 max-w-md">
              <strong>Caution:</strong> Applying these changes will rewrite the visible IDs of all matching records in your inventory. This is a destructive naming change.
          </div>
          <button
            onClick={handleApply}
            disabled={isApplying}
            className={`w-full md:w-auto px-8 py-4 rounded-xl font-bold text-white shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 ${isApplying ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}
          >
            {isApplying ? (
                <>
                    <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    Applying Prefix Changes...
                </>
            ) : (
                <>
                    <CheckCircleIcon className="w-5 h-5" />
                    Apply & Rename All Items
                </>
            )}
          </button>
      </div>
    </div>
  );
};

export default NumberingSystemPage;
