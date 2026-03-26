
import * as React from 'react';
import { 
    CogIcon, GlobeAltIcon, 
    SparklesIcon, ArchiveBoxIcon, 
    LockClosedIcon, LockOpenIcon, ArrowPathIcon,
    ChevronLeftIcon, PlusCircleIcon
} from './Icons';

interface SiteDesignPageProps {
    pageLocks: Record<string, boolean>;
    onToggleLock: (id: string, value: boolean) => void;
    onBatchToggleLocks: (locks: Record<string, boolean>) => void;
    onNavigateBack: () => void;
}

interface DesignTarget {
    id: string;
    label: string;
    category: 'Page' | 'Modal';
    description: string;
}

const DESIGN_TARGETS: DesignTarget[] = [
    // PAGES & CORE MODULES
    { id: 'addEditHub', label: 'ADD/EDIT HUB', category: 'Page', description: 'Main registry entry point' },
    { id: 'anchors', label: 'ANCHORS', category: 'Page', description: 'Sea-floor mooring points registry' },
    { id: 'archive', label: 'ARCHIVE', category: 'Page', description: 'Soft-delete recovery & logs' },
    { id: 'backupRestore', label: 'BACKUP/RESTORE', category: 'Page', description: 'Local state management' },
    { id: 'branchDetails', label: 'BRANCH DETAILS', category: 'Page', description: 'Deep-dive biological data' },
    { id: 'branches', label: 'BRANCHES', category: 'Page', description: 'Individual coral branch inventory' },
    { id: 'collectionZones', label: 'COLLECTION ZONES', category: 'Page', description: 'Source reef donor locations' },
    { id: 'dashboard', label: 'DASHBOARD', category: 'Page', description: 'Central mission control & sync status' },
    { id: 'dataLoggers', label: 'DATA LOGGERS', category: 'Page', description: 'Temperature logger registry' },
    { id: 'deviceClusters', label: 'DEVICE CLUSTERS', category: 'Page', description: 'Larval recruitment units' },
    { id: 'diveGear', label: 'DIVE GEAR', category: 'Page', description: 'Equipment status & service intervals' },
    { id: 'environmental', label: 'ENVIRONMENTAL', category: 'Page', description: 'Fitzroy Island live conditions' },
    { id: 'experimentsHub', label: 'EXPERIMENTS HUB', category: 'Page', description: 'Active research studies entry' },
    { id: 'facilityHub', label: 'FACILITY HUB', category: 'Page', description: 'LSS & hardware entry point' },
    { id: 'facilityRegistry', label: 'FACILITY REGISTRY', category: 'Page', description: 'Hardware asset entry' },
    { id: 'facilityTasks', label: 'FACILITY TASKS', category: 'Page', description: 'Chemistry & equipment logs' },
    { id: 'floats', label: 'FLOATS', category: 'Page', description: 'Structure buoyancy management' },
    { id: 'globalHeader', label: 'GLOBAL HEADER', category: 'Page', description: 'Main navigation and quick search bar' },
    { id: 'growthLedger', label: 'GROWTH LEDGER', category: 'Page', description: 'Historical accretion metrics' },
    { id: 'healthLedger', label: 'HEALTH LEDGER', category: 'Page', description: 'Historical monitoring history' },
    { id: 'memberPortal', label: 'MEMBER PORTAL', category: 'Page', description: 'Volunteer deployment center' },
    { id: 'merchandise', label: 'MERCHANDISE', category: 'Page', description: 'Foundation stock tracking' },
    { id: 'monitoring', label: 'MONITORING', category: 'Page', description: 'Field health & maintenance logging' },
    { id: 'movementHub', label: 'MOVEMENT HUB', category: 'Page', description: 'Complex relocation logic' },
    { id: 'notesTodo', label: 'NOTES/TODO', category: 'Page', description: 'Field voice memos & tasks' },
    { id: 'nurseryTrees', label: 'NURSERY TREES', category: 'Page', description: 'Standard structure management' },
    { id: 'operationalSchedule', label: 'OPERATIONAL SCHEDULE', category: 'Page', description: 'Full mission mission control' },
    { id: 'peopleTeam', label: 'PEOPLE/TEAM', category: 'Page', description: 'Volunteer roster & staff management' },
    { id: 'photoViewer', label: 'PHOTO VIEWER', category: 'Page', description: 'R2 visual media browser' },
    { id: 'prefixSettings', label: 'PREFIX SETTINGS', category: 'Page', description: 'Global re-sequencing logic' },
    { id: 'qrGenerator', label: 'QR GENERATOR', category: 'Page', description: 'Manual label creation tool' },
    { id: 'raDetails', label: 'RA DETAILS', category: 'Page', description: 'Deep-dive outplant data' },
    { id: 'reef2Units', label: 'REEF² UNITS', category: 'Page', description: 'Squared structure management' },
    { id: 'reef3Units', label: 'REEF³ UNITS', category: 'Page', description: 'Cubed structure management' },
    { id: 'reports', label: 'REPORTS', category: 'Page', description: 'PDF generation & document OCR' },
    { id: 'restorationSchedule', label: 'RESTORATION SCHEDULE', category: 'Page', description: 'Target restoration date logic' },
    { id: 'rubbleAnchors', label: 'RUBBLE ANCHORS', category: 'Page', description: 'Benthic outplant unit monitoring' },
    { id: 'rules', label: 'RULES', category: 'Page', description: 'Automation & protocol intervals' },
    { id: 'settings', label: 'SETTINGS', category: 'Page', description: 'Security & R2 cloud config' },
    { id: 'sites', label: 'SITES', category: 'Page', description: 'Primary nursery geofence management' },
    { id: 'spawning', label: 'SPAWNING', category: 'Page', description: 'Gamete event verification' },
    { id: 'speciesId', label: 'SPECIES ID', category: 'Page', description: 'Scientific library & taxonomy' },
    { id: 'strings', label: 'STRINGS', category: 'Page', description: 'Rope unit line management' },
    { id: 'substrateZones', label: 'SUBSTRATE ZONES', category: 'Page', description: 'Outplant site spatial tracking' },
    { id: 'systemBlueprint', label: 'SYSTEM BLUEPRINT', category: 'Page', description: 'Infrastructure documentation' },
    { id: 'tanks', label: 'TANKS', category: 'Page', description: 'LSS tank geometry logic' },
    { id: 'trends', label: 'TRENDS', category: 'Page', description: 'AI-powered data analysis' },

    // GLOBAL MODALS & POPUPS
    { id: 'anchorEditor', label: 'ANCHOR EDITOR', category: 'Modal', description: 'Mooring point depth & status' },
    { id: 'documentCropper', label: 'DOCUMENT CROPPER', category: 'Modal', description: 'Perspective correction for OCR' },
    { id: 'fullScreenViewer', label: 'FULL-SCREEN VIEWER', category: 'Modal', description: 'High-res image carousel' },
    { id: 'gearLocker', label: 'GEAR LOCKER', category: 'Modal', description: 'LSS equipment service tracking' },
    { id: 'globalScanner', label: 'GLOBAL SCANNER', category: 'Modal', description: 'Internal ID & setup parsing' },
    { id: 'healthDrillDown', label: 'HEALTH DRILL-DOWN', category: 'Modal', description: 'Dashboard bucket detail view' },
    { id: 'missionPlanner', label: 'MISSION PLANNER', category: 'Modal', description: 'Team shift assignment logic' },
    { id: 'photoManager', label: 'PHOTO MANAGER', category: 'Modal', description: 'Inventory gallery & R2 upload' },
    { id: 'qrLabelModal', label: 'QR LABEL MODAL', category: 'Modal', description: 'Print-ready identifier labels' },
    { id: 'siteEditor', label: 'SITE EDITOR', category: 'Modal', description: 'Site metadata & photo management' },
    { id: 'speciesEditor', label: 'SPECIES EDITOR', category: 'Modal', description: 'Taxonomy library entry logic' },
    { id: 'speciesSpecs', label: 'SPECIES SPECS', category: 'Modal', description: 'Scientific reference view' },
    { id: 'staffProfile', label: 'STAFF PROFILE', category: 'Modal', description: 'Access & availability control' },
    { id: 'stockEditor', label: 'STOCK EDITOR', category: 'Modal', description: 'Inventory restock/giveaway logs' },
    { id: 'volunteerData', label: 'VOLUNTEER DATA', category: 'Modal', description: 'Credential & medical records' },
    { id: 'zoneEditor', label: 'ZONE EDITOR', category: 'Modal', description: 'Spatial node GPS configuration' }
];

// MEMOIZED NodeCard for extreme performance
const NodeCard = React.memo<{
    target: DesignTarget;
    isLocked: boolean;
    onToggle: (id: string, val: boolean) => void;
}>(({ target, isLocked, onToggle }) => (
    <div 
        onClick={() => onToggle(target.id, !isLocked)}
        className={`p-4 bg-white border-2 rounded-2xl flex items-center justify-between transition-all cursor-pointer group hover:scale-[1.01] active:scale-[0.99] ${
            isLocked ? 'border-red-500 shadow-xl shadow-red-500/10' : 'border-gray-100 hover:border-coral-blue/30 shadow-sm'
        }`}
    >
        <div className="flex items-center gap-4 min-w-0">
            <div className={`px-3 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest shrink-0 shadow-sm border ${
                isLocked ? 'bg-red-600 text-white border-red-700' : 'bg-blue-500 text-white border-blue-600'
            }`}>
                {isLocked ? 'LOCKED' : 'UNLOCKED'}
            </div>
            <div className="min-w-0">
                <h4 className={`font-black text-xs uppercase tracking-tight truncate ${isLocked ? 'text-red-600' : 'text-coral-dark'}`}>
                    {target.label}
                </h4>
                <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest truncate mt-0.5">
                    {target.description}
                </p>
            </div>
        </div>
        
        <div className={`p-1.5 rounded-lg transition-colors ${isLocked ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-200 group-hover:text-coral-blue/30'}`}>
            <LockClosedIcon className="w-3.5 h-3.5" />
        </div>
    </div>
));

const SiteDesignPage: React.FC<SiteDesignPageProps> = ({ pageLocks, onToggleLock, onBatchToggleLocks, onNavigateBack }) => {
    const [search, setSearch] = React.useState('');
    
    const handleToggle = React.useCallback((id: string, val: boolean) => {
        onToggleLock(id, val);
    }, [onToggleLock]);

    const handleBatchAction = (lockValue: boolean) => {
        const actionLabel = lockValue ? 'LOCK ALL' : 'UNLOCK ALL';
        if (confirm(`Perform batch action: ${actionLabel} registry nodes?\n\nThis will apply to all 62 functional modules.`)) {
            const nextLocks = { ...pageLocks };
            DESIGN_TARGETS.forEach(target => {
                nextLocks[target.id] = lockValue;
            });
            onBatchToggleLocks(nextLocks);
        }
    };
    
    const lockedCount = DESIGN_TARGETS.filter(t => !!pageLocks[t.id]).length;
    const filteredPages = DESIGN_TARGETS.filter(t => t.category === 'Page' && t.label.toLowerCase().includes(search.toLowerCase()));
    const filteredModals = DESIGN_TARGETS.filter(t => t.category === 'Modal' && t.label.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="bg-coral-sand min-h-screen p-4 sm:p-8 animate-fade-in pb-20">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* SYSTEM INTEGRITY HEADER */}
                <div className="bg-white border-4 border-coral-blue rounded-[3.5rem] p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-5 rotate-12">
                        <ArrowPathIcon className="w-64 h-64" />
                    </div>

                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative z-10">
                        <div className="flex items-center gap-8">
                            <div className="p-6 bg-blue-50 rounded-[2.5rem] shadow-inner text-coral-blue group cursor-pointer active:scale-95 transition-transform">
                                <ArrowPathIcon className="w-12 h-12" />
                            </div>
                            <div>
                                <h1 className="text-6xl font-black text-coral-dark uppercase tracking-tighter italic leading-none">System Integrity</h1>
                                <p className="text-sm font-black text-gray-400 uppercase tracking-[0.4em] mt-3">Registry Component State Management</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => handleBatchAction(false)} 
                                className="bg-blue-500 hover:bg-blue-600 text-white font-black py-4 px-10 rounded-[2rem] transition-all active:scale-95 text-xs uppercase tracking-widest flex items-center gap-3 shadow-md border-b-[6px] border-blue-800"
                            >
                                <LockOpenIcon className="w-4 h-4" /> UNLOCK ALL
                            </button>
                            <button 
                                onClick={() => handleBatchAction(true)} 
                                className="bg-red-600 hover:bg-red-700 text-white font-black py-4 px-10 rounded-[2rem] transition-all active:scale-95 text-xs uppercase tracking-widest flex items-center gap-3 shadow-md border-b-[6px] border-red-900"
                            >
                                <LockClosedIcon className="w-4 h-4" /> LOCK ALL
                            </button>
                            <button 
                                onClick={onNavigateBack} 
                                className="bg-white hover:bg-gray-100 text-coral-dark font-black py-4 px-10 rounded-[2rem] transition-all active:scale-95 text-xs uppercase tracking-widest flex items-center gap-3 shadow-md border-b-[6px] border-gray-300"
                            >
                                <ChevronLeftIcon className="w-4 h-4" /> BACK
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12 pt-12 border-t border-gray-100">
                        {/* MANIFESTO BOX */}
                        <div className="lg:col-span-2 p-10 bg-gray-50/50 rounded-[3rem] border-2 border-gray-100 space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <GlobeAltIcon className="w-4 h-4 text-gray-400" />
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.5em]">Project Manifesto</h3>
                            </div>
                            <p className="text-sm font-bold text-gray-500 leading-relaxed uppercase tracking-tight max-w-2xl">
                                Integrity locks prevent unauthorized logic changes during active field operations. When a component is <span className="text-red-500 font-black underline italic">LOCKED</span>, its design and functional triggers are frozen for both human and AI developers.
                            </p>
                        </div>

                        {/* STATUS CARDS */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 mb-2 ml-2">
                                <SparklesIcon className="w-4 h-4 text-coral-blue" />
                                <h3 className="text-[10px] font-black text-coral-dark uppercase tracking-[0.5em]">Registry Status</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-8 bg-white rounded-3xl border-2 border-gray-50 shadow-sm flex flex-col justify-between">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-tight">Locked Elements</p>
                                    <p className={`text-6xl font-black mt-2 leading-none transition-colors duration-500 ${lockedCount > 0 ? 'text-red-500' : 'text-gray-200'}`}>{lockedCount}</p>
                                </div>
                                <div className="p-8 bg-white rounded-3xl border-2 border-gray-50 shadow-sm flex flex-col justify-between">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-tight">Total Logic Nodes</p>
                                    <p className="text-6xl font-black text-coral-dark mt-2 leading-none">62</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SEARCH BAR */}
                <div className="flex justify-end">
                    <div className="relative w-full max-w-md group">
                        <input 
                            type="text" 
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Filter component nodes..."
                            className="w-full p-6 pl-14 bg-white border-2 border-gray-100 rounded-[2rem] shadow-sm font-black uppercase text-xs tracking-widest outline-none focus:border-coral-blue transition-all"
                        />
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-coral-blue transition-colors">
                            <PlusCircleIcon className="w-6 h-6" />
                        </div>
                    </div>
                </div>

                {/* MAIN GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                    
                    {/* PAGES COLUMN */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4 ml-4">
                            <ArchiveBoxIcon className="w-5 h-5 text-coral-blue" />
                            <h3 className="text-sm font-black text-coral-blue uppercase tracking-[0.3em]">Pages & Core Modules</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {filteredPages.map(target => (
                                <NodeCard 
                                    key={target.id}
                                    target={target}
                                    isLocked={!!pageLocks[target.id]}
                                    onToggle={handleToggle}
                                />
                            ))}
                        </div>
                    </div>

                    {/* MODALS COLUMN */}
                    <div className="space-y-8">
                        <div className="flex items-center gap-4 ml-4">
                            <SparklesIcon className="w-5 h-5 text-coral-green" />
                            <h3 className="text-sm font-black text-coral-green uppercase tracking-[0.3em]">Global Modals & Popups</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                            {filteredModals.map(target => (
                                <NodeCard 
                                    key={target.id}
                                    target={target}
                                    isLocked={!!pageLocks[target.id]}
                                    onToggle={handleToggle}
                                />
                            ))}
                        </div>
                    </div>

                </div>

                {/* SYSTEM FOOTER */}
                <div className="pt-20 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-12">
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em]">Project Node</p>
                            <p className="text-sm font-black text-gray-400 uppercase tracking-tighter italic">Integrity_V15</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-coral-blue uppercase tracking-widest">{lockedCount} Active Constraints</p>
                            <div className="h-1 bg-gray-100 rounded-full w-48 overflow-hidden">
                                <div className="h-full bg-coral-blue transition-all duration-1000" style={{ width: `${(lockedCount / 62) * 100}%` }}></div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SiteDesignPage;
