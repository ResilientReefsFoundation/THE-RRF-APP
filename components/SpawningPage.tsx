import * as React from 'react';
import { SparklesIcon } from './Icons';
import type { Site, Anchor, Tree, CoralBranch, StructureType, PrefixSettings } from '../types';

interface SpawningPageProps {
  sites: Site[];
  anchors: Anchor[];
  trees: Tree[];
  branches: CoralBranch[];
  prefixSettings: PrefixSettings;
  onUpdateSpawnStatus: (branchId: string, isConfirmed: boolean) => void;
  onNavigateBack: () => void;
}

const SpawningPage: React.FC<SpawningPageProps> = ({ 
    sites,
    anchors,
    trees,
    branches,
    prefixSettings,
    onUpdateSpawnStatus,
    onNavigateBack 
}) => {
    const [selectedSiteId, setSelectedSiteId] = React.useState<string>('');
    const [selectedTreeId, setSelectedTreeId] = React.useState<string>('');
    const [selectedBranchId, setSelectedBranchId] = React.useState<string>('');
    const [isConfirmed, setIsConfirmed] = React.useState(false);

    const getPrefix = (type?: StructureType) => {
        if (type === 'Reef2') return prefixSettings.reef2;
        if (type === 'Reef3') return prefixSettings.reef3;
        return prefixSettings.tree;
    };

    // Derived Lists
    const filteredTrees = React.useMemo(() => {
        return trees.filter(t => {
            const anchor = anchors.find(a => a.id === t.anchorId);
            return anchor && anchor.siteId === selectedSiteId;
        }).sort((a,b) => a.number - b.number);
    }, [trees, anchors, selectedSiteId]);

    const filteredBranches = React.useMemo(() => {
        if (!selectedSiteId || !selectedTreeId) return [];
        const tree = trees.find(t => t.id === selectedTreeId);
        const site = sites.find(s => s.id === selectedSiteId);
        return branches.filter(b => b.tree === tree?.number && (b.treeType || 'Tree') === (tree?.type || 'Tree') && b.site === site?.name)
                       .sort((a,b) => a.position - b.position);
    }, [branches, trees, sites, selectedSiteId, selectedTreeId]);

    const selectedBranch = branches.find(b => b.id === selectedBranchId);

    React.useEffect(() => {
        if (selectedBranch) {
            setIsConfirmed(selectedBranch.isConfirmedSpawned || false);
        }
    }, [selectedBranch]);

    const hasChanges = selectedBranch && isConfirmed !== (selectedBranch.isConfirmedSpawned || false);

    const handleSave = () => {
        if (!selectedBranch || !hasChanges) return;

        // Check if status is changing
        const confirmMessage = isConfirmed 
            ? "Are you sure you want to mark this coral as confirmed spawned?"
            : "Warning: You are about to unmark this coral as confirmed spawned. Are you sure?";
        
        if (window.confirm(confirmMessage)) {
            onUpdateSpawnStatus(selectedBranch.id, isConfirmed);
        } else {
            // Revert if cancelled
            setIsConfirmed(selectedBranch.isConfirmedSpawned || false);
        }
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg space-y-8 min-h-[60vh]">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4">
                <h2 className="text-2xl font-bold text-coral-dark mb-2 sm:mb-0 flex items-center gap-2">
                    <SparklesIcon className="w-6 h-6 text-coral-blue"/>
                    Spawning Management
                </h2>
                <button
                    onClick={onNavigateBack}
                    className="bg-gray-200 hover:bg-gray-300 text-coral-dark font-bold py-2 px-4 rounded-lg transition-colors duration-200 self-start sm:self-center"
                >
                    &larr; Back to Dashboard
                </button>
            </div>
            
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                    <p className="text-sm text-blue-800">
                        Select a coral branch below to confirm spawning activity. This status will be tracked in reports and on the dashboard.
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Site</label>
                            <select value={selectedSiteId} onChange={e => {setSelectedSiteId(e.target.value); setSelectedTreeId(''); setSelectedBranchId('');}} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900">
                                <option value="">-- Select Site --</option>
                                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Structure</label>
                            <select value={selectedTreeId} onChange={e => {setSelectedTreeId(e.target.value); setSelectedBranchId('');}} disabled={!selectedSiteId} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900 disabled:bg-gray-100">
                                <option value="">-- Select Structure --</option>
                                {filteredTrees.map(t => {
                                    const prefix = getPrefix(t.type);
                                    return <option key={t.id} value={t.id}>{prefix} {t.number}</option>;
                                })}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Coral Item</label>
                        <select value={selectedBranchId} onChange={e => setSelectedBranchId(e.target.value)} disabled={!selectedTreeId} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900 disabled:bg-gray-100">
                            <option value="">-- Select Item --</option>
                            {filteredBranches.map(b => <option key={b.id} value={b.id}>{b.fragmentId} ({b.genus} {b.species})</option>)}
                        </select>
                    </div>
                </div>

                {selectedBranch && (
                    <div className="bg-white border-2 border-coral-blue rounded-lg p-6 space-y-6 shadow-sm mt-6">
                        <div className="flex items-start gap-4">
                            <img 
                                src={selectedBranch.photos.find(p => p.isMain)?.url || (selectedBranch.photos[0]?.url) || 'https://via.placeholder.com/100'} 
                                alt={selectedBranch.fragmentId} 
                                className="w-24 h-24 object-cover rounded-lg bg-gray-100"
                            />
                            <div>
                                <h3 className="text-xl font-bold text-coral-dark">{selectedBranch.fragmentId}</h3>
                                <p className="text-gray-600 italic">{selectedBranch.genus} {selectedBranch.species}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Added: {new Date(selectedBranch.dateAdded).toLocaleDateString()}
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100">
                            <label className="flex items-center gap-3 cursor-pointer p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors">
                                <input 
                                    type="checkbox" 
                                    checked={isConfirmed} 
                                    onChange={(e) => setIsConfirmed(e.target.checked)} 
                                    className="h-6 w-6 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                                />
                                <div>
                                    <span className="font-bold text-gray-900 block">Confirmed Spawned</span>
                                    <span className="text-sm text-gray-600">Mark this checkbox if spawning has been visually confirmed or verified for this coral.</span>
                                </div>
                            </label>
                        </div>

                        <div className="flex justify-end">
                            <button 
                                onClick={handleSave}
                                disabled={!hasChanges}
                                className={`font-bold py-3 px-8 rounded-lg transition-colors ${
                                    hasChanges 
                                    ? 'bg-coral-blue hover:bg-opacity-90 text-white' 
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                {hasChanges ? 'Save Status' : 'Saved'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SpawningPage;