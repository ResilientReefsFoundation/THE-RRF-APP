import * as React from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import type { Site, Anchor, Tree, CoralBranch, HealthReport, MaintenanceLog, BleachingLevel, SpongeLevel, CleaningEffort, HydroidLevel, AlgaeLevel, StructureType, PrefixSettings } from '../types';
import { CloseIcon } from './Icons';

interface MonitoringPageProps {
  branches: CoralBranch[];
  sites: Site[];
  trees: Tree[];
  anchors: Anchor[];
  prefixSettings: PrefixSettings;
  isReadOnly: boolean;
  onAddHealthReport: (branchId: string, report: Omit<HealthReport, 'id'>) => void;
  onNavigateBack: () => void;
  onSelectBranch: (branchId: string) => void;
  onLogMaintenance: (log: Omit<MaintenanceLog, 'id' | 'timestamp'>) => void;
  initialTreeId?: string;
  initialBranchId?: string;
}

const CustomRadio: React.FC<{
    name: string;
    value: string;
    checked: boolean;
    onChange: () => void;
    label: string;
    disabled?: boolean;
}> = ({ name, value, checked, onChange, label, disabled }) => (
    <label className={`flex items-center gap-1.5 transition-opacity ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer group'}`}>
        <div className="relative flex items-center justify-center">
            <input 
                type="radio" 
                name={name} 
                checked={checked} 
                onChange={onChange}
                disabled={disabled}
                className="peer appearance-none h-4 w-4 rounded-full border border-gray-300 bg-white checked:border-coral-blue transition-all"
            />
            <div className="absolute h-2 w-2 rounded-full bg-coral-blue opacity-0 peer-checked:opacity-100 transition-opacity"></div>
        </div>
        <span className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-900 group-hover:text-coral-blue'} transition-colors`}>{label}</span>
    </label>
);

const CustomCheckbox: React.FC<{
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
    disabled?: boolean;
}> = ({ checked, onChange, label, disabled }) => (
    <label className={`flex items-center gap-2 transition-opacity ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer group'}`}>
        <div className="relative flex items-center justify-center">
            <input 
                type="checkbox" 
                checked={checked} 
                disabled={disabled}
                onChange={(e) => onChange(e.target.checked)} 
                className="peer h-5 w-5 appearance-none rounded border border-gray-300 bg-white checked:bg-coral-blue checked:border-coral-blue transition-all"
            />
            <svg className="pointer-events-none absolute left-1 top-1 h-3 w-3 text-white opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
        </div>
        <span className={`text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-900 group-hover:text-coral-blue'} transition-colors`}>{label}</span>
    </label>
);

const MonitoringPage: React.FC<MonitoringPageProps> = ({
  branches,
  sites,
  trees,
  anchors,
  prefixSettings,
  isReadOnly,
  onAddHealthReport,
  onNavigateBack,
  onSelectBranch,
  onLogMaintenance,
  initialTreeId,
  initialBranchId,
}) => {
  const [activeTab, setActiveTab] = React.useState<'branch' | 'tree' | 'anchors'>('branch');
  const [reportMode, setReportMode] = React.useState<'detailed' | 'quick'>('detailed');
  
  // --- BRANCH TAB STATE ---
  const [selectedSiteId, setSelectedSiteId] = React.useState('');
  const [selectedTreeId, setSelectedTreeId] = React.useState('');
  const [selectedBranchId, setSelectedBranchId] = React.useState('');
  const [healthScore, setHealthScore] = React.useState<number>(100);
  const [bleachingLevel, setBleachingLevel] = React.useState<BleachingLevel>('None');
  // Branch Maintenance State
  const [branchSponge, setBranchSponge] = React.useState<SpongeLevel>('None');
  const [branchHydroids, setBranchHydroids] = React.useState<HydroidLevel>('None');
  const [branchAlgaeCleaned, setBranchAlgaeCleaned] = React.useState<AlgaeLevel>('None');
  const [branchCableTies, setBranchCableTies] = React.useState(false);
  
  const [notes, setNotes] = React.useState('');
  
  // Bulk Report State
  const [bulkHealthUpdates, setBulkHealthUpdates] = React.useState<{ [branchId: string]: number }>({});


  // --- TREE TAB STATE ---
  const [treeSiteId, setTreeSiteId] = React.useState('');
  const [treeTreeId, setTreeTreeId] = React.useState('');
  const [cleanedTree, setCleanedTree] = React.useState(false);
  const [cleaningEffort, setCleaningEffort] = React.useState<CleaningEffort>('None');
  const [scrubbedFloats, setScrubbedFloats] = React.useState(false);
  const [spongeRemoved, setSpongeRemoved] = React.useState<SpongeLevel>('None');
  const [treeNotes, setTreeNotes] = React.useState('');

  // --- ANCHOR TAB STATE ---
  const [anchorSiteId, setAnchorSiteId] = React.useState('');
  const [anchorId, setAnchorId] = React.useState('');
  const [anchorConditionOk, setAnchorConditionOk] = React.useState<'Yes' | 'No' | null>(null);
  const [anchorHolding, setAnchorHolding] = React.useState<'Yes' | 'No' | null>(null);
  const [equipmentCleaned, setEquipmentCleaned] = React.useState<'Yes' | 'No' | null>(null);
  const [abrasionVisible, setAbrasionVisible] = React.useState<'Yes' | 'No' | null>(null);
  const [anchorNotes, setAnchorNotes] = React.useState('');

  const getPrefix = (type?: StructureType) => {
      if (type === 'Reef2') return prefixSettings.reef2;
      if (type === 'Reef3') return prefixSettings.reef3;
      return prefixSettings.tree;
  };

  React.useEffect(() => {
      if (initialTreeId) {
          setActiveTab('tree');
          const tree = trees.find(t => t.id === initialTreeId);
          if (tree) {
              const anchor = anchors.find(a => a.id === tree.anchorId);
              const site = sites.find(s => s.id === anchor?.siteId);
              if (site) {
                  setTreeSiteId(site.id);
                  setTreeTreeId(tree.id);
                  setSelectedSiteId(site.id);
                  setSelectedTreeId(tree.id);
              }
          }
      }
  }, [initialTreeId, trees, anchors, sites]);

  React.useEffect(() => {
      if (initialBranchId) {
          const branch = branches.find(b => b.id === initialBranchId);
          if (branch) {
              const site = sites.find(s => s.name.trim().toLowerCase() === (branch.site || '').trim().toLowerCase());
              const tree = trees.find(t => {
                  if (t.number !== branch.tree) return false;
                  if ((t.type || 'Tree') !== (branch.treeType || 'Tree')) return false;
                  const anchor = anchors.find(a => a.id === t.anchorId);
                  return anchor && anchor.siteId === site?.id;
              });

              if (site && tree) {
                  setActiveTab('branch');
                  setSelectedSiteId(site.id);
                  setSelectedTreeId(tree.id);
                  setSelectedBranchId(branch.id);
                  setReportMode('detailed');
              }
          }
      }
  }, [initialBranchId, branches, trees, anchors, sites]);

  const filteredTrees = React.useMemo(() => {
    if (!selectedSiteId) return [];
    return trees.filter(t => {
        const anchor = anchors.find(a => a.id === t.anchorId);
        return anchor && anchor.siteId === selectedSiteId;
    }).sort((a,b) => a.number - b.number);
  }, [selectedSiteId, trees, anchors]);
  
  const filteredBranches = React.useMemo(() => {
    if (!selectedTreeId || !selectedSiteId) return [];
    const tree = trees.find(t => t.id === selectedTreeId);
    const site = sites.find(s => s.id === selectedSiteId);
    if (!tree || !site) return [];
    
    return branches.filter(b => {
        if (b.isArchived) return false;
        const bSite = (b.site || '').trim().toLowerCase();
        const sName = site.name.trim().toLowerCase();
        const siteMatch = bSite === sName || b.site === site.id;
        const treeMatch = Number(b.tree) === Number(tree.number);
        const bType = b.treeType || 'Tree';
        const tType = tree.type || 'Tree';
        const typeMatch = bType === tType;
        return siteMatch && treeMatch && typeMatch;
    }).sort((a, b) => a.position - b.position);
  }, [selectedTreeId, selectedSiteId, branches, trees, sites]);

  React.useEffect(() => {
    if (selectedBranchId && filteredBranches.length > 0) {
        if (!filteredBranches.some(b => b.id === selectedBranchId)) {
            setSelectedBranchId('');
        }
    } else if (filteredBranches.length === 0) {
        setSelectedBranchId('');
    }
  }, [filteredBranches, selectedBranchId]);

  const maintenanceTrees = treeSiteId ? trees.filter(t => {
      const anchor = anchors.find(a => a.id === t.anchorId);
      return anchor && anchor.siteId === treeSiteId;
  }).sort((a,b) => a.number - b.number) : [];

  const maintenanceAnchors = anchorSiteId ? anchors.filter(a => a.siteId === anchorSiteId) : [];
  const selectedItem = branches.find(b => b.id === selectedBranchId);
  const isDeviceCluster = selectedItem?.type === 'DeviceCluster';

  const handleHealthSubmit = (e: FormEvent) => {
      e.preventDefault();
      if (isReadOnly) return;
      if(selectedBranchId) {
          onAddHealthReport(selectedBranchId, {
              date: new Date().toISOString(),
              healthPercentage: healthScore,
              bleaching: bleachingLevel,
              notes: notes
          });

          const maintenanceTasks: string[] = [];
          if (branchSponge !== 'None') maintenanceTasks.push(`Sponge removed: ${branchSponge}`);
          if (branchHydroids !== 'None') maintenanceTasks.push(`Hydroids cleaned: ${branchHydroids}`);
          if (branchAlgaeCleaned !== 'None') maintenanceTasks.push(`Cleaned algae: ${branchAlgaeCleaned}`);
          if (branchCableTies) maintenanceTasks.push('Added/Tightened cable ties');

          if (maintenanceTasks.length > 0) {
              onLogMaintenance({
                  siteId: selectedSiteId,
                  treeId: selectedTreeId,
                  branchId: selectedBranchId,
                  target: 'Branch',
                  tasks: maintenanceTasks,
                  notes: notes,
                  spongeRemoved: branchSponge !== 'None' ? branchSponge : undefined,
                  hydroidsCleaned: branchHydroids !== 'None' ? branchHydroids : undefined,
                  algaeCleaned: branchAlgaeCleaned !== 'None' ? branchAlgaeCleaned : undefined,
                  cableTiesAdded: branchCableTies
              });
          }

          setNotes(''); setBranchSponge('None'); setBranchHydroids('None'); setBranchAlgaeCleaned('None'); setBranchCableTies(false);
          alert('Report saved!');
      }
  };

  const handleBulkHealthUpdate = (branchId: string, health: number) => {
      if (isReadOnly) return;
      setBulkHealthUpdates(prev => ({ ...prev, [branchId]: health }));
  };

  const handleBulkSubmit = () => {
      if (isReadOnly) return;
      const updates = Object.entries(bulkHealthUpdates);
      if (updates.length === 0) return;
      if (window.confirm(`Save health reports for ${updates.length} branches?`)) {
          updates.forEach(([branchId, health]) => {
               onAddHealthReport(branchId, { date: new Date().toISOString(), healthPercentage: health, bleaching: 'None', notes: 'Bulk update' });
          });
          setBulkHealthUpdates({}); alert('Bulk reports saved!');
      }
  };

  const handleTreeMaintenanceSubmit = (e: FormEvent) => {
      e.preventDefault();
      if (isReadOnly || !treeSiteId || !treeTreeId) return;
      const tasks: string[] = [];
      if (cleanedTree) tasks.push('Cleaned structure');
      if (scrubbedFloats) tasks.push('Scrubbed floats');
      const log: any = { siteId: treeSiteId, treeId: treeTreeId, target: 'Tree', tasks, notes: treeNotes, spongeRemoved: spongeRemoved !== 'None' ? spongeRemoved : undefined, cleaningEffort: cleanedTree ? cleaningEffort : undefined };
      onLogMaintenance(log);
      setCleanedTree(false); setCleaningEffort('None'); setScrubbedFloats(false); setSpongeRemoved('None'); setTreeNotes('');
      alert('Maintenance logged!');
  };

  const handleAnchorMaintenanceSubmit = (e: FormEvent) => {
      e.preventDefault();
      if (isReadOnly || !anchorSiteId || !anchorId) return;
      const tasks: string[] = [];
      if (anchorConditionOk === 'Yes') tasks.push('Condition OK');
      if (anchorConditionOk === 'No') tasks.push('Condition Issue');
      if (anchorHolding === 'Yes') tasks.push('Holding');
      if (anchorHolding === 'No') tasks.push('Not Holding');
      if (equipmentCleaned === 'Yes') tasks.push('Cleaned Equipment');
      if (abrasionVisible === 'Yes') tasks.push('Abrasion Visible');
      if (abrasionVisible === 'No') tasks.push('No Abrasion');
      const log: any = { siteId: anchorSiteId, anchorId: anchorId, target: 'Anchor', tasks, notes: anchorNotes, anchorConditionOk: anchorConditionOk === 'Yes', anchorHolding: anchorHolding === 'Yes', equipmentCleaned: equipmentCleaned === 'Yes', abrasionVisible: abrasionVisible === 'Yes' };
      onLogMaintenance(log);
      setAnchorConditionOk(null); setAnchorHolding(null); setEquipmentCleaned(null); setAbrasionVisible(null); setAnchorNotes('');
      alert('Anchor maintenance logged!');
  };
  
  const HEALTH_DOTS = [
      { value: 100, color: 'bg-green-500', label: '100%' },
      { value: 75, color: 'bg-yellow-400', label: '75%' },
      { value: 50, color: 'bg-orange-400', label: '50%' },
      { value: 25, color: 'bg-orange-600', label: '25%' },
      { value: 0, color: 'bg-red-500', label: '0%' },
  ];

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg space-y-6">
       <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4">
        <h2 className="text-2xl font-bold text-coral-dark mb-2 sm:mb-0">Monitoring & Maintenance</h2>
        <button
          onClick={onNavigateBack}
          className="bg-gray-200 hover:bg-gray-300 text-coral-dark font-bold py-2 px-4 rounded-lg transition-colors duration-200 self-start sm:self-center"
        >
          &larr; Back
        </button>
      </div>

      {isReadOnly && (
          <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-xl flex items-center gap-3 text-purple-700 animate-fade-in shadow-sm">
              <div className="bg-purple-100 p-2 rounded-full"><CloseIcon className="w-5 h-5 shrink-0"/></div>
              <div>
                  <p className="font-black uppercase text-[10px] tracking-widest">Read-Only / Gallery Mode</p>
                  <p className="text-sm font-medium">Inputs are currently locked. Start a session to log new nursery activity.</p>
              </div>
          </div>
      )}

      {/* Tabs */}
      <div className="flex border-b">
          <button 
            className={`flex-1 py-3 text-center font-medium ${activeTab === 'branch' ? 'text-coral-blue border-b-2 border-coral-blue' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => { setActiveTab('branch'); }}
          >
              Branch / Unit
          </button>
          <button 
            className={`flex-1 py-3 text-center font-medium ${activeTab === 'tree' ? 'text-coral-blue border-b-2 border-coral-blue' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => { setActiveTab('tree'); }}
          >
              Structure
          </button>
          <button 
            className={`flex-1 py-3 text-center font-medium ${activeTab === 'anchors' ? 'text-coral-blue border-b-2 border-coral-blue' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => { setActiveTab('anchors'); }}
          >
              Anchors
          </button>
      </div>

      {/* --- BRANCH TAB --- */}
      {activeTab === 'branch' && (
      <>
        <div className="flex justify-center mb-6">
            <div className="inline-flex rounded-md shadow-sm">
                <button
                    onClick={() => setReportMode('detailed')}
                    className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${reportMode === 'detailed' ? 'bg-coral-blue text-white border-coral-blue z-10' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                >
                    Detailed Report
                </button>
                <button
                    onClick={() => setReportMode('quick')}
                    className={`px-4 py-2 text-sm font-medium rounded-r-lg border ${reportMode === 'quick' ? 'bg-coral-blue text-white border-coral-blue z-10' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                >
                    Quick Bulk Health Check
                </button>
            </div>
        </div>

        {reportMode === 'detailed' && (
            <div className="space-y-6 max-w-2xl mx-auto">
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Site</label>
                            <select value={selectedSiteId} onChange={e => {setSelectedSiteId(e.target.value); setSelectedTreeId(''); setSelectedBranchId('');}} disabled={isReadOnly} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900 disabled:bg-gray-50 disabled:text-gray-500">
                                <option value="">-- Select Site --</option>
                                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Structure</label>
                            <select value={selectedTreeId} onChange={e => {setSelectedTreeId(e.target.value); setSelectedBranchId('');}} disabled={!selectedSiteId || isReadOnly} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900 disabled:bg-gray-50 disabled:text-gray-500">
                                <option value="">-- Select Structure --</option>
                                {filteredTrees.map(t => {
                                    const prefix = getPrefix(t.type);
                                    return <option key={t.id} value={t.id}>{prefix} {t.number}</option>;
                                })}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Item (Branch / Rope Unit / Cluster)</label>
                        <select value={selectedBranchId} onChange={e => setSelectedBranchId(e.target.value)} disabled={!selectedTreeId || isReadOnly} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900 disabled:bg-gray-50 disabled:text-gray-500">
                            <option value="">-- Select Item --</option>
                            {filteredBranches.map(b => <option key={b.id} value={b.id}>{b.fragmentId} (Pos: {b.position})</option>)}
                        </select>
                    </div>
                </div>

                {selectedBranchId && (
                    <form onSubmit={handleHealthSubmit} className="p-6 bg-gray-50 rounded-lg space-y-6 border-2 border-coral-blue animate-fade-in relative">
                        <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Log Status</h3>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                {isDeviceCluster ? "Devices Alive (Device Cluster)" : "Health Score"}
                            </label>
                            
                            {isDeviceCluster ? (
                                <div className="flex gap-3 flex-wrap">
                                    {[0, 1, 2, 3, 4, 5].map(aliveCount => {
                                        const percentage = aliveCount * 20;
                                        const isActive = healthScore === percentage;
                                        return (
                                            <button
                                                key={aliveCount}
                                                type="button"
                                                disabled={isReadOnly}
                                                onClick={() => setHealthScore(percentage)}
                                                className={`px-4 py-2 rounded-lg font-bold text-sm transition-all shadow-sm ${isActive 
                                                    ? 'bg-blue-600 text-white ring-2 ring-offset-2 ring-blue-300' 
                                                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100 disabled:opacity-50'}`}
                                            >
                                                {aliveCount} Alive ({percentage}%)
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="flex gap-4 items-center">
                                    {HEALTH_DOTS.map(dot => (
                                        <button
                                            key={dot.value}
                                            type="button"
                                            disabled={isReadOnly}
                                            onClick={() => setHealthScore(dot.value)}
                                            className={`w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center shadow-sm ${healthScore === dot.value ? `ring-2 ring-offset-2 ring-gray-400 scale-110 ${dot.color}` : `opacity-40 hover:opacity-80 disabled:opacity-20 ${dot.color}`}`}
                                        >
                                            {healthScore === dot.value && <span className="text-white font-bold text-sm">✓</span>}
                                        </button>
                                    ))}
                                    <span className="font-semibold text-lg text-gray-700 ml-2">{healthScore}%</span>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Bleaching Level</label>
                            <div className="flex flex-wrap gap-4">
                                {['None', 'Mild', 'Medium', 'Strong'].map(l => (
                                    <CustomRadio 
                                        key={l}
                                        name="bleaching"
                                        value={l}
                                        checked={bleachingLevel === l}
                                        onChange={() => setBleachingLevel(l as BleachingLevel)}
                                        label={l}
                                        disabled={isReadOnly}
                                    />
                                ))}
                            </div>
                        </div>
                        
                        <div className="border-t pt-4">
                            <h4 className="font-semibold text-sm text-gray-800 mb-4">Maintenance</h4>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Sponge present/removed</label>
                                    <div className="flex flex-wrap gap-4">
                                        {['None', 'Small', 'Medium', 'Large'].map((level) => (
                                            <CustomRadio 
                                                key={level}
                                                name="branchSponge"
                                                value={level}
                                                checked={branchSponge === level}
                                                onChange={() => setBranchSponge(level as SpongeLevel)}
                                                label={level}
                                                disabled={isReadOnly}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Hydroids present/cleaned</label>
                                    <div className="flex flex-wrap gap-4">
                                        {['None', 'Small', 'Medium', 'Large'].map((level) => (
                                            <CustomRadio 
                                                key={level}
                                                name="branchHydroids"
                                                value={level}
                                                checked={branchHydroids === level}
                                                onChange={() => setBranchHydroids(level as HydroidLevel)}
                                                label={level}
                                                disabled={isReadOnly}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Cleaned algae</label>
                                    <div className="flex flex-wrap gap-4">
                                        {['None', 'Small', 'Medium', 'Lots'].map((level) => (
                                            <CustomRadio 
                                                key={level}
                                                name="branchAlgae"
                                                value={level}
                                                checked={branchAlgaeCleaned === level}
                                                onChange={() => setBranchAlgaeCleaned(level as AlgaeLevel)}
                                                label={level}
                                                disabled={isReadOnly}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <CustomCheckbox 
                                        checked={branchCableTies}
                                        onChange={setBranchCableTies}
                                        label="Added/Tightened cable ties"
                                        disabled={isReadOnly}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">Notes</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} disabled={isReadOnly} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900 disabled:bg-gray-50 disabled:text-gray-500" placeholder="Observations..."></textarea>
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" disabled={!selectedBranchId || isReadOnly} className="bg-coral-blue hover:bg-opacity-90 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">Log Status</button>
                        </div>
                    </form>
                )}
            </div>
        )}
        
        {reportMode === 'quick' && (
            <div className="space-y-6 max-w-2xl mx-auto">
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Site</label>
                            <select value={selectedSiteId} onChange={e => {setSelectedSiteId(e.target.value); setSelectedTreeId(''); setSelectedBranchId(''); setBulkHealthUpdates({}); }} disabled={isReadOnly} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900 disabled:bg-gray-50 disabled:text-gray-500">
                                <option value="">-- Select Site --</option>
                                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Structure</label>
                            <select value={selectedTreeId} onChange={e => {setSelectedTreeId(e.target.value); setSelectedBranchId(''); setBulkHealthUpdates({}); }} disabled={!selectedSiteId || isReadOnly} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900 disabled:bg-gray-100 disabled:bg-gray-50 disabled:text-gray-500">
                                <option value="">-- Select Structure --</option>
                                {filteredTrees.map(t => {
                                    const prefix = getPrefix(t.type);
                                    return <option key={t.id} value={t.id}>{prefix} {t.number}</option>;
                                })}
                            </select>
                        </div>
                </div>

                {selectedTreeId && (
                    <div className="border-2 border-coral-blue rounded-lg overflow-hidden bg-white shadow-sm">
                        <div className="bg-gray-50 p-3 border-b border-coral-blue grid grid-cols-2 sm:grid-cols-3 gap-2 font-semibold text-sm text-gray-700">
                            <div className="sm:col-span-1">Item</div>
                            <div className="sm:col-span-2 text-center sm:text-left">Health Status</div>
                        </div>
                        <div className="divide-y divide-gray-200">
                            {filteredBranches.length > 0 ? filteredBranches.map(branch => {
                                const currentHealth = bulkHealthUpdates[branch.id];
                                return (
                                    <div key={branch.id} className="p-3 grid grid-cols-1 sm:grid-cols-3 gap-2 items-center">
                                        <div className="sm:col-span-1">
                                            <p className="font-medium text-coral-dark">{branch.fragmentId}</p>
                                            <p className="text-xs text-gray-500">Pos: {branch.position}, Face: {branch.face}</p>
                                        </div>
                                        <div className="sm:col-span-2 flex justify-between sm:justify-start sm:gap-4 items-center">
                                            {HEALTH_DOTS.map(dot => (
                                                <button
                                                    key={dot.value}
                                                    type="button"
                                                    disabled={isReadOnly}
                                                    onClick={() => handleBulkHealthUpdate(branch.id, dot.value)}
                                                    className={`w-8 h-8 rounded-full transition-all duration-200 flex items-center justify-center shadow-sm ${currentHealth === dot.value ? `ring-2 ring-offset-2 ring-gray-400 scale-110 ${dot.color}` : `opacity-40 hover:opacity-80 disabled:opacity-20 ${dot.color}`}`}
                                                >
                                                    {currentHealth === dot.value && <span className="text-white font-bold text-xs">✓</span>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="p-8 text-center text-gray-500">No active items found on this structure.</div>
                            )}
                        </div>
                        {filteredBranches.length > 0 && (
                            <div className="p-4 bg-gray-50 border-t flex justify-end">
                                <button
                                    onClick={handleBulkSubmit}
                                    disabled={Object.keys(bulkHealthUpdates).length === 0 || isReadOnly}
                                    className="bg-coral-blue hover:bg-opacity-90 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                    Save All Reports
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}
      </>
      )}

      {/* --- TREE TAB --- */}
      {activeTab === 'tree' && (
          <div className="space-y-6 max-w-2xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700">Site</label>
                        <select value={treeSiteId} onChange={e => {setTreeSiteId(e.target.value); setTreeTreeId('');}} disabled={isReadOnly} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900 disabled:bg-gray-50">
                            <option value="">-- Choose site --</option>
                            {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                  </div>
                   <div>
                        <label className="block text-sm font-medium text-gray-700">Structure</label>
                        <select value={treeTreeId} onChange={e => setTreeTreeId(e.target.value)} disabled={!treeSiteId || isReadOnly} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white disabled:bg-gray-50 text-gray-900">
                            <option value="">-- Choose structure --</option>
                             {maintenanceTrees.map(t => {
                                 const prefix = getPrefix(t.type);
                                 return <option key={t.id} value={t.id}>{prefix} {t.number}</option>;
                             })}
                        </select>
                    </div>
              </div>

              <form onSubmit={handleTreeMaintenanceSubmit} className="space-y-6 bg-gray-50 p-6 rounded-lg border-2 border-coral-blue relative">
                  <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Log Structure Activity</h3>
                  <div className="space-y-4">
                      <label className="block text-sm font-medium text-gray-700">Tasks Performed</label>
                      
                      <div className="space-y-2">
                        <CustomCheckbox 
                            checked={cleanedTree}
                            onChange={setCleanedTree}
                            label="Cleaned structure"
                            disabled={isReadOnly}
                        />
                        {cleanedTree && (
                            <div className="ml-7 p-3 bg-blue-50 rounded-lg border border-blue-100 animate-fade-in">
                                <span className="text-xs font-bold text-blue-700 uppercase tracking-wide block mb-2">Effort Required</span>
                                <div className="flex flex-wrap gap-4">
                                    {['None', 'Light scrub', 'Medium scrub', 'Heavy scrub'].map((level) => (
                                        <CustomRadio 
                                            key={level}
                                            name="cleaningEffort"
                                            value={level}
                                            checked={cleaningEffort === level}
                                            onChange={() => setCleaningEffort(level as CleaningEffort)}
                                            label={level}
                                            disabled={isReadOnly}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                      </div>

                      <div className="pb-2">
                        <CustomCheckbox 
                            checked={scrubbedFloats}
                            onChange={setScrubbedFloats}
                            label="Scrubbed floats"
                            disabled={isReadOnly}
                        />
                      </div>
                      
                      <div className="border-t pt-4">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Sponge present/removed</label>
                        <div className="flex flex-wrap gap-4">
                            {['None', 'Small', 'Medium', 'Large'].map((level) => (
                                <CustomRadio 
                                    key={level}
                                    name="spongeLevel"
                                    value={level}
                                    checked={spongeRemoved === level}
                                    onChange={() => setSpongeRemoved(level as SpongeLevel)}
                                    label={level}
                                    disabled={isReadOnly}
                                />
                            ))}
                        </div>
                      </div>

                       <div className="pt-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                            <textarea value={treeNotes} onChange={e => setTreeNotes(e.target.value)} disabled={isReadOnly} rows={3} className="block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-500" placeholder="Add any extra details..."></textarea>
                        </div>

                        <div className="flex justify-end">
                            <button type="submit" disabled={isReadOnly} className="bg-coral-green hover:bg-opacity-90 text-coral-dark font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-gray-400">Save Maintenance Log</button>
                        </div>
                  </div>
              </form>
          </div>
      )}

      {/* --- ANCHOR TAB --- */}
      {activeTab === 'anchors' && (
          <div className="space-y-6 max-w-2xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                      <label className="block text-sm font-medium text-gray-700">Site</label>
                        <select value={anchorSiteId} onChange={e => {setAnchorSiteId(e.target.value); setAnchorId('');}} disabled={isReadOnly} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900 disabled:bg-gray-50">
                            <option value="">-- Choose site --</option>
                            {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                  </div>
                   <div>
                        <label className="block text-sm font-medium text-gray-700">Anchor</label>
                        <select value={anchorId} onChange={e => setAnchorId(e.target.value)} disabled={!anchorSiteId || isReadOnly} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white disabled:bg-gray-50 text-gray-900">
                            <option value="">-- Choose anchor --</option>
                             {maintenanceAnchors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>
              </div>

              <form onSubmit={handleAnchorMaintenanceSubmit} className="space-y-6 bg-gray-50 p-6 rounded-lg border-2 border-coral-blue relative">
                  <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Log Anchor Status</h3>
                  <div className="space-y-4">
                      {/* Condition OK */}
                      <div className="flex justify-between items-center border-b pb-3 border-gray-200">
                          <span className="font-medium text-gray-900">Condition OK</span>
                          <div className="flex gap-4">
                              <CustomRadio name="conditionOk" value="Yes" checked={anchorConditionOk === 'Yes'} onChange={() => setAnchorConditionOk('Yes')} label="Yes" disabled={isReadOnly} />
                              <CustomRadio name="conditionOk" value="No" checked={anchorConditionOk === 'No'} onChange={() => setAnchorConditionOk('No')} label="No" disabled={isReadOnly} />
                          </div>
                      </div>

                      {/* Holding */}
                      <div className="flex justify-between items-center border-b pb-3 border-gray-200">
                          <span className="font-medium text-gray-900">Holding</span>
                          <div className="flex gap-4">
                              <CustomRadio name="holding" value="Yes" checked={anchorHolding === 'Yes'} onChange={() => setAnchorHolding('Yes')} label="Yes" disabled={isReadOnly} />
                              <CustomRadio name="holding" value="No" checked={anchorHolding === 'No'} onChange={() => setAnchorHolding('No')} label="No" disabled={isReadOnly} />
                          </div>
                      </div>

                      {/* Abrasion Visible */}
                      <div className="flex justify-between items-center border-b pb-3 border-gray-200">
                          <span className="font-medium text-gray-900">Abrasion visible</span>
                          <div className="flex gap-4">
                              <CustomRadio name="abrasion" value="Yes" checked={abrasionVisible === 'Yes'} onChange={() => setAbrasionVisible('Yes')} label="Yes" disabled={isReadOnly} />
                              <CustomRadio name="abrasion" value="No" checked={abrasionVisible === 'No'} onChange={() => setAbrasionVisible('No')} label="No" disabled={isReadOnly} />
                          </div>
                      </div>

                      {/* Cleaned Equipment */}
                      <div className="flex justify-between items-center border-b pb-3 border-gray-200">
                          <span className="font-medium text-gray-900">Cleaned equipment</span>
                          <div className="flex gap-4">
                              <CustomRadio name="cleaned" value="Yes" checked={equipmentCleaned === 'Yes'} onChange={() => setEquipmentCleaned('Yes')} label="Yes" disabled={isReadOnly} />
                              <CustomRadio name="cleaned" value="No" checked={equipmentCleaned === 'No'} onChange={() => setEquipmentCleaned('No')} label="No" disabled={isReadOnly} />
                          </div>
                      </div>

                       <div className="pt-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                            <textarea value={anchorNotes} onChange={e => setAnchorNotes(e.target.value)} disabled={isReadOnly} rows={2} className="block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900 disabled:bg-gray-100" placeholder="Details..."></textarea>
                        </div>

                        <div className="flex justify-end">
                            <button type="submit" disabled={isReadOnly} className="bg-coral-blue hover:bg-opacity-90 text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-gray-400">Log Anchor Status</button>
                        </div>
                  </div>
              </form>
          </div>
      )}

    </div>
  );
};

export default MonitoringPage;