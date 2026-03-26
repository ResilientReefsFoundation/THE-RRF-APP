import * as React from 'react';
import type { Page } from '../types';
import { 
    CheckCircleIcon, LockClosedIcon, LockOpenIcon, 
    ChevronLeftIcon, ArrowPathIcon, ClipboardListIcon,
    CogIcon, SparklesIcon, ArchiveBoxIcon, WrenchIcon
} from './Icons';

interface ProjectProgressProps {
    pageLocks: Record<string, boolean>;
    onNavigateBack: () => void;
    onNavigateToPage?: (page: Page) => void; // Optional if passed from App
}

interface RegistryNode {
    id: string;
    label: string;
    category: 'Page' | 'Modal';
}

const REGISTRY_NODES: RegistryNode[] = [
    // PAGES & CORE MODULES (47)
    { id: 'addEditHub', label: 'ADD/EDIT HUB', category: 'Page' },
    { id: 'anchors', label: 'ANCHORS', category: 'Page' },
    { id: 'archive', label: 'ARCHIVE', category: 'Page' },
    { id: 'backupRestore', label: 'BACKUP/RESTORE', category: 'Page' },
    { id: 'branchDetails', label: 'BRANCH DETAILS', category: 'Page' },
    { id: 'branches', label: 'BRANCHES', category: 'Page' },
    { id: 'collectionZones', label: 'COLLECTION ZONES', category: 'Page' },
    { id: 'dashboard', label: 'DASHBOARD', category: 'Page' },
    { id: 'dataLoggers', label: 'DATA LOGGERS', category: 'Page' },
    { id: 'deviceClusters', label: 'DEVICE CLUSTERS', category: 'Page' },
    { id: 'diveGear', label: 'DIVE GEAR', category: 'Page' },
    { id: 'environmental', label: 'ENVIRONMENTAL', category: 'Page' },
    { id: 'experimentsHub', label: 'EXPERIMENTS HUB', category: 'Page' },
    { id: 'facilityHub', label: 'FACILITY HUB', category: 'Page' },
    { id: 'facilityRegistry', label: 'FACILITY REGISTRY', category: 'Page' },
    { id: 'facilityTasks', label: 'FACILITY TASKS', category: 'Page' },
    { id: 'floats', label: 'FLOATS', category: 'Page' },
    { id: 'globalHeader', label: 'GLOBAL HEADER', category: 'Page' },
    { id: 'growthLedger', label: 'GROWTH LEDGER', category: 'Page' },
    { id: 'healthLedger', label: 'HEALTH LEDGER', category: 'Page' },
    { id: 'memberPortal', label: 'MEMBER PORTAL', category: 'Page' },
    { id: 'merchandise', label: 'MERCHANDISE', category: 'Page' },
    { id: 'monitoring', label: 'MONITORING', category: 'Page' },
    { id: 'movementHub', label: 'MOVEMENT HUB', category: 'Page' },
    { id: 'notesTodo', label: 'NOTES/TODO', category: 'Page' },
    { id: 'nurseryTrees', label: 'NURSERY TREES', category: 'Page' },
    { id: 'operationalSchedule', label: 'OPERATIONAL SCHEDULE', category: 'Page' },
    { id: 'peopleTeam', label: 'PEOPLE/TEAM', category: 'Page' },
    { id: 'photoAlbum', label: 'react photo album', category: 'Page' },
    { id: 'photoViewer', label: 'PHOTO VIEWER', category: 'Page' },
    { id: 'prefixSettings', label: 'PREFIX SETTINGS', category: 'Page' },
    { id: 'qrGenerator', label: 'QR GENERATOR', category: 'Page' },
    { id: 'raDetails', label: 'RA DETAILS', category: 'Page' },
    { id: 'reef2Units', label: 'REEF² UNITS', category: 'Page' },
    { id: 'reef3Units', label: 'REEF³ UNITS', category: 'Page' },
    { id: 'reports', label: 'REPORTS', category: 'Page' },
    { id: 'restorationSchedule', label: 'RESTORATION SCHEDULE', category: 'Page' },
    { id: 'rubbleAnchors', label: 'RUBBLE ANCHORS', category: 'Page' },
    { id: 'rules', label: 'RULES', category: 'Page' },
    { id: 'settings', label: 'SETTINGS', category: 'Page' },
    { id: 'sites', label: 'SITES', category: 'Page' },
    { id: 'spawning', label: 'SPAWNING', category: 'Page' },
    { id: 'speciesId', label: 'SPECIES ID', category: 'Page' },
    { id: 'strings', label: 'STRINGS', category: 'Page' },
    { id: 'substrateZones', label: 'SUBSTRATE ZONES', category: 'Page' },
    { id: 'systemBlueprint', label: 'SYSTEM BLUEPRINT', category: 'Page' },
    { id: 'tanks', label: 'TANKS', category: 'Page' },
    { id: 'trends', label: 'TRENDS', category: 'Page' },

    // GLOBAL MODALS & POPUPS (16)
    { id: 'anchorEditor', label: 'ANCHOR EDITOR', category: 'Modal' },
    { id: 'documentCropper', label: 'DOCUMENT CROPPER', category: 'Modal' },
    { id: 'fullScreenViewer', label: 'FULL-SCREEN VIEWER', category: 'Modal' },
    { id: 'gearLocker', label: 'GEAR LOCKER', category: 'Modal' },
    { id: 'globalScanner', label: 'GLOBAL SCANNER', category: 'Modal' },
    { id: 'healthDrillDown', label: 'HEALTH DRILL-DOWN', category: 'Modal' },
    { id: 'missionPlanner', label: 'MISSION PLANNER', category: 'Modal' },
    { id: 'photoManager', label: 'PHOTO MANAGER', category: 'Modal' },
    { id: 'qrLabelModal', label: 'QR LABEL MODAL', category: 'Modal' },
    { id: 'siteEditor', label: 'SITE EDITOR', category: 'Modal' },
    { id: 'speciesEditor', label: 'SPECIES EDITOR', category: 'Modal' },
    { id: 'speciesSpecs', label: 'SPECIES SPECS', category: 'Modal' },
    { id: 'staffProfile', label: 'STAFF PROFILE', category: 'Modal' },
    { id: 'stockEditor', label: 'STOCK EDITOR', category: 'Modal' },
    { id: 'volunteerData', label: 'VOLUNTEER DATA', category: 'Modal' },
    { id: 'zoneEditor', label: 'ZONE EDITOR', category: 'Modal' }
];

const ProjectProgress: React.FC<ProjectProgressProps> = ({ pageLocks, onNavigateBack, onNavigateToPage }) => {
    const lockedCount = REGISTRY_NODES.filter(node => !!pageLocks[node.id]).length;
    const totalCount = REGISTRY_NODES.length;

    return (
        <div className="bg-coral-sand min-h-screen p-4 sm:p-8 space-y-12 animate-fade-in pb-20">
            <div className="max-w-6xl mx-auto space-y-8">
                
                {/* AI MANIFESTO HEADER */}
                <div className="bg-coral-dark border-4 border-coral-blue rounded-[3.5rem] p-10 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-12 opacity-10 rotate-12">
                        <CogIcon className="w-64 h-64 text-coral-blue" />
                    </div>

                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative z-10">
                        <div className="flex items-center gap-8">
                            <div className="p-6 bg-white/10 rounded-[2.5rem] shadow-inner text-coral-blue">
                                <ClipboardListIcon className="w-12 h-12" />
                            </div>
                            <div>
                                <h1 className="text-6xl font-black text-white uppercase tracking-tighter italic leading-none">Project Progress</h1>
                                <p className="text-sm font-black text-coral-blue uppercase tracking-[0.4em] mt-3">AI Development & Lockdown Status</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            {onNavigateToPage && (
                                <button 
                                    onClick={() => onNavigateToPage('siteDesign')} 
                                    className="bg-coral-blue hover:brightness-110 text-white font-black py-4 px-10 rounded-[2rem] transition-all active:scale-95 text-xs uppercase tracking-widest flex items-center gap-3 shadow-md border-b-[6px] border-blue-800"
                                >
                                    <WrenchIcon className="w-4 h-4" /> MODIFY CONSTRAINTS
                                </button>
                            )}
                            <button 
                                onClick={onNavigateBack} 
                                className="bg-white hover:bg-gray-100 text-coral-dark font-black py-4 px-10 rounded-[2rem] transition-all active:scale-95 text-xs uppercase tracking-widest flex items-center gap-3 shadow-md border-b-[6px] border-gray-300"
                            >
                                <ChevronLeftIcon className="w-4 h-4" /> BACK
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12 pt-12 border-t border-white/10">
                        <div className="lg:col-span-2 p-10 bg-white/5 rounded-[3rem] border-2 border-white/10 space-y-6">
                            <div className="flex items-center gap-3 mb-2">
                                <SparklesIcon className="w-4 h-4 text-coral-blue" />
                                <h3 className="text-[10px] font-black text-white/40 uppercase tracking-[0.5em]">Active Standing Orders</h3>
                            </div>
                            <p className="text-sm font-bold text-gray-300 leading-relaxed uppercase tracking-tight max-w-2xl">
                                The AI Developer is <span className="text-red-500 font-black underline italic">STRICTLY PROHIBITED</span> from modifying any component marked as <span className="text-red-500 font-black italic">LOCKED</span>. 
                            </p>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                                    <span className="text-coral-blue font-black tracking-tighter">»</span> To unlock or lock elements, use the <span className="text-white underline">Modify Constraints</span> button.
                                </div>
                                <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest italic">
                                    <span className="text-coral-blue font-black tracking-tighter">»</span> Changes to logic or design in locked nodes require explicit chat permission.
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="p-8 bg-white/5 rounded-3xl border-2 border-white/10 shadow-sm flex flex-col justify-between h-full">
                                <p className="text-[8px] font-black text-white/40 uppercase tracking-widest">Locked Targets</p>
                                <p className="text-7xl font-black text-red-500 mt-2 leading-none">{lockedCount} / {totalCount}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* LIVE LOCK REGISTRY GRID */}
                <div className="space-y-8">
                    <div className="flex items-center gap-4 ml-4">
                        <ArchiveBoxIcon className="w-5 h-5 text-coral-blue" />
                        <h3 className="text-sm font-black text-coral-dark uppercase tracking-[0.3em]">Live Node Lockdown Registry</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {REGISTRY_NODES.map(node => {
                            const isLocked = !!pageLocks[node.id];
                            return (
                                <div 
                                    key={node.id} 
                                    className={`p-5 rounded-[1.5rem] border-2 flex items-center justify-between transition-all bg-white ${
                                        isLocked ? 'border-red-500 shadow-lg shadow-red-500/10' : 'border-gray-100'
                                    }`}
                                >
                                    <div className="min-w-0">
                                        <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{node.category}</p>
                                        <p className={`text-xs font-black uppercase tracking-tight truncate ${isLocked ? 'text-red-600' : 'text-coral-dark'}`}>
                                            {node.label}
                                        </p>
                                    </div>
                                    <div className={`p-2 rounded-xl ${isLocked ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'}`}>
                                        {isLocked ? <LockClosedIcon className="w-4 h-4" /> : <LockOpenIcon className="w-4 h-4" />}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* DEVELOPMENT LOG */}
                <div className="space-y-8 pt-12 border-t border-gray-200">
                    <div className="flex items-center gap-4 ml-4">
                        <ArrowPathIcon className="w-5 h-5 text-coral-green" />
                        <h3 className="text-sm font-black text-coral-dark uppercase tracking-[0.3em]">AI Development Ledger</h3>
                    </div>
                    
                    <div className="bg-white border-2 border-gray-100 rounded-[2.5rem] overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Version</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Target Node</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">Operation Description</th>
                                    <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                <tr className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-5 text-xs font-black text-coral-blue italic">V15.6.13</td>
                                    <td className="px-8 py-5 text-xs font-bold text-coral-dark uppercase">PHOTO_ALBUM</td>
                                    <td className="px-8 py-5 text-xs font-medium text-gray-500 italic">Library Integrity Patch: Corrected PhotoAlbum v3 API usage to resolve "Black screen" rendering crash.</td>
                                    <td className="px-8 py-5 text-right"><span className="text-[8px] font-black bg-green-50 text-green-600 px-3 py-1 rounded-full border border-green-200 uppercase">Deployed</span></td>
                                </tr>
                                <tr className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-5 text-xs font-black text-coral-blue italic">V15.6.12</td>
                                    <td className="px-8 py-5 text-xs font-bold text-coral-dark uppercase">PHOTO_ALBUM</td>
                                    <td className="px-8 py-5 text-xs font-medium text-gray-500 italic">Enhanced Comparison Mode: Added per-item selection logic and layout toggles to the justified gallery.</td>
                                    <td className="px-8 py-5 text-right"><span className="text-[8px] font-black bg-green-50 text-green-600 px-3 py-1 rounded-full border border-green-200 uppercase">Deployed</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ProjectProgress;