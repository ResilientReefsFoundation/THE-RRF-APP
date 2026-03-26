
import * as React from 'react';
import type { Site, Tree, Float, CoralBranch, Anchor, StructureType, PrefixSettings } from '../types';

interface FloatManagementPageProps {
  sites: Site[];
  anchors: Anchor[];
  trees: Tree[];
  floats: Float[];
  branches: CoralBranch[];
  prefixSettings: PrefixSettings;
  onAddFloat: (treeId: string) => { id: string; name: string } | null;
  onAddFloatsBulk: (treeIds: string[]) => void;
  onRemoveFloatsBulk: (treeIds: string[]) => void;
  onRemoveFloat: (floatId: string) => void;
  onNavigateBack: () => void;
}

const FloatManagementPage: React.FC<FloatManagementPageProps> = ({
  sites = [],
  anchors = [],
  trees = [],
  floats = [],
  branches = [],
  prefixSettings,
  onAddFloat,
  onAddFloatsBulk,
  onRemoveFloatsBulk,
  onRemoveFloat,
  onNavigateBack
}) => {
  const [mode, setMode] = React.useState<'individual' | 'bulk'>('individual');
  const [selectedSiteId, setSelectedSiteId] = React.useState<string>('');
  const [selectedTreeId, setSelectedTreeId] = React.useState<string>('');

  const getPrefix = (type?: StructureType) => {
      if (type === 'Reef2') return prefixSettings.reef2;
      if (type === 'Reef3') return prefixSettings.reef3;
      return prefixSettings.tree;
  };

  const handleSiteChange = (siteId: string) => {
    setSelectedSiteId(siteId);
    setSelectedTreeId('');
  };

  const handleAddFloatClick = (treeId: string) => {
      onAddFloat(treeId);
  };

  const handleAddAll = () => {
    if (structuresOnSelectedSite.length === 0) return;
    if (confirm(`Add 1 float to each of the ${structuresOnSelectedSite.length} structures at this site?`)) {
        const treeIds = structuresOnSelectedSite.map(s => s.id);
        onAddFloatsBulk(treeIds);
        alert(`Successfully added floats to all structures.`);
    }
  };

  const handleRemoveAll = () => {
    const structuresWithFloats = structuresOnSelectedSite.filter(s => floats.filter(f => f.treeId === s.id).length > 0);
    if (structuresWithFloats.length === 0) return;
    if (confirm(`Remove 1 float from each of the ${structuresWithFloats.length} structures at this site?`)) {
        const treeIds = structuresWithFloats.map(s => s.id);
        onRemoveFloatsBulk(treeIds);
        alert(`Successfully removed floats.`);
    }
  };

  const handleRemoveOneFromStruct = (treeId: string) => {
      const structFloats = floats.filter(f => f.treeId === treeId);
      if (structFloats.length > 0) {
          if (confirm(`Are you sure you want to remove a float from this structure?\nThis will affect the structure's buoyancy.`)) {
              onRemoveFloat(structFloats[structFloats.length - 1].id);
          }
      }
  };

  const handleRemoveIndividualFloat = (floatId: string, name: string) => {
      if (confirm(`REMOVE FLOAT: ${name}?\nThis action cannot be undone.`)) {
          onRemoveFloat(floatId);
      }
  };

  // Robust filtering: find all structures associated with anchors at the selected site
  const structuresOnSelectedSite = React.useMemo(() => {
    if (!selectedSiteId || !anchors.length) return [];
    
    // Find all anchor IDs belonging to this site
    const siteAnchorIds = new Set(
      anchors
        .filter(a => a.siteId === selectedSiteId)
        .map(a => a.id)
    );
    
    // Filter trees (all types) that are attached to those anchors
    return trees
      .filter(t => siteAnchorIds.has(t.anchorId))
      .sort((a, b) => {
          // Sort primary by type (Reef2, Reef3, Tree) then by number
          const typeA = a.type || 'Tree';
          const typeB = b.type || 'Tree';
          if (typeA !== typeB) return typeA.localeCompare(typeB);
          return a.number - b.number;
      });
  }, [selectedSiteId, trees, anchors]);

  const floatsOnSelectedTree = React.useMemo(() => {
    if (!selectedTreeId) return [];
    return floats
      .filter(f => f.treeId === selectedTreeId)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  }, [selectedTreeId, floats]);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg space-y-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4">
            <h2 className="text-2xl font-bold text-coral-dark mb-2 sm:mb-0">Float Management</h2>
            <button
                onClick={onNavigateBack}
                className="bg-gray-200 hover:bg-gray-300 text-coral-dark font-bold py-2 px-4 rounded-lg transition-colors duration-200 self-start sm:self-center"
            >
                &larr; Back to Add/Edit Items
            </button>
        </div>

        <div className="flex justify-center mb-4 border-b pb-4">
            <div className="inline-flex rounded-md shadow-sm">
                <button
                    onClick={() => setMode('individual')}
                    className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${mode === 'individual' ? 'bg-coral-blue text-white border-coral-blue z-10' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                >
                    Individual Structure
                </button>
                <button
                    onClick={() => setMode('bulk')}
                    className={`px-4 py-2 text-sm font-medium rounded-r-lg border ${mode === 'bulk' ? 'bg-coral-blue text-white border-coral-blue z-10' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                >
                    Bulk Add/Remove
                </button>
            </div>
        </div>
        
        {/* Site Selector */}
        <div className="p-4 border-2 border-coral-blue rounded-lg bg-gray-50">
            <label htmlFor="siteSelect" className="block text-sm font-medium text-gray-700">Select Site</label>
            <select id="siteSelect" value={selectedSiteId} onChange={e => handleSiteChange(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900">
                <option value="">-- Choose a site --</option>
                {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
        </div>
        
        {selectedSiteId && (
            <div className="pt-4 border-t">
            {mode === 'individual' ? (
                // Individual Mode
                <div className="space-y-6">
                    <div>
                        <label htmlFor="treeSelect" className="block text-sm font-medium text-gray-700">Select Structure (Tree, Reef², Reef³)</label>
                        <select id="treeSelect" value={selectedTreeId} onChange={e => setSelectedTreeId(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900">
                            <option value="">-- Choose a structure --</option>
                            {structuresOnSelectedSite.map(t => {
                                const label = t.type === 'Reef2' ? 'Reef²' : t.type === 'Reef3' ? 'Reef³' : 'Tree';
                                return (
                                    <option key={t.id} value={t.id}>
                                        {getPrefix(t.type)} {t.number} ({label})
                                    </option>
                                );
                            })}
                        </select>
                    </div>

                    {selectedTreeId && (
                        <div>
                            {(() => {
                                const t = trees.find(tree => tree.id === selectedTreeId);
                                const label = t?.type === 'Reef2' ? 'Reef²' : t?.type === 'Reef3' ? 'Reef³' : 'Tree';
                                const displayName = `${getPrefix(t?.type)} ${t?.number}`;
                                return (
                                    <>
                                        <h3 className="font-semibold text-gray-700 text-lg mb-4">Floats on {displayName} ({label})</h3>
                                        <div className="border-2 border-coral-blue rounded-md bg-white">
                                            <ul className="divide-y divide-gray-200">
                                                {floatsOnSelectedTree.length > 0 ? floatsOnSelectedTree.map(float => (
                                                    <li key={float.id} className="p-3 flex justify-between items-center">
                                                        <span className="font-medium text-gray-800">{float.name}</span>
                                                        <button 
                                                            onClick={() => handleRemoveIndividualFloat(float.id, float.name)}
                                                            className="text-sm text-red-600 hover:text-red-800 disabled:text-gray-400 font-bold"
                                                            disabled={floatsOnSelectedTree.length <= 1}
                                                            title={floatsOnSelectedTree.length <= 1 ? "Cannot remove the last float" : "Remove float"}
                                                        >
                                                            Remove
                                                        </button>
                                                    </li>
                                                )) : <li className="p-4 text-center text-gray-500 italic">No floats found.</li>}
                                            </ul>
                                        </div>
                                        <div className="flex justify-end mt-4">
                                            <button onClick={() => handleAddFloatClick(selectedTreeId)} className="bg-coral-green hover:bg-opacity-90 text-coral-dark font-bold py-2 px-6 rounded-lg transition-colors shadow-sm">
                                                Add New Float
                                            </button>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    )}
                </div>
            ) : (
                // Bulk Mode
                <div>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-2">
                        <h3 className="font-semibold text-gray-700 text-lg">Add/Remove Floats in Bulk</h3>
                        <div className="flex gap-2">
                            <button 
                                onClick={handleRemoveAll}
                                className="bg-red-50 text-red-700 border border-red-200 font-bold py-2 px-4 rounded-lg text-sm shadow-sm hover:bg-red-100"
                            >
                                Remove 1 from All
                            </button>
                            <button 
                                onClick={handleAddAll}
                                className="bg-coral-blue text-white font-bold py-2 px-4 rounded-lg text-sm shadow-md hover:bg-opacity-90"
                            >
                                Add 1 to All
                            </button>
                        </div>
                    </div>
                    <div className="border-2 border-coral-blue rounded-md bg-white overflow-hidden shadow-sm">
                        <ul className="divide-y divide-gray-200">
                            {structuresOnSelectedSite.length > 0 ? structuresOnSelectedSite.map(tree => {
                                const structFloats = floats.filter(f => f.treeId === tree.id);
                                const floatCount = structFloats.length;
                                const label = tree.type === 'Reef2' ? 'Reef²' : tree.type === 'Reef3' ? 'Reef³' : 'Tree';
                                const displayName = `${getPrefix(tree.type)} ${tree.number}`;
                                return (
                                    <li key={tree.id} className="p-3 flex justify-between items-center hover:bg-gray-50 transition-colors">
                                        <div>
                                            <p className="font-bold text-coral-dark">{displayName}</p>
                                            <p className="text-xs text-gray-500">{label} • {floatCount} float(s) deployed</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleRemoveOneFromStruct(tree.id)} 
                                                disabled={floatCount <= 1}
                                                className="bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-700 font-bold py-1.5 px-4 rounded-lg text-sm border border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed"
                                                title={floatCount <= 1 ? "Cannot remove the last float" : "Remove float"}
                                            >
                                                - Remove
                                            </button>
                                            <button 
                                                onClick={() => handleAddFloatClick(tree.id)} 
                                                className="bg-coral-green hover:bg-opacity-90 text-coral-dark font-bold py-1.5 px-4 rounded-lg text-sm shadow-sm transition-colors"
                                            >
                                                + Add
                                            </button>
                                        </div>
                                    </li>
                                );
                            }) : (
                                <li className="p-8 text-center text-gray-500 italic">No nursery structures (Trees, Reef², Reef³) found at this site.</li>
                            )}
                        </ul>
                    </div>
                </div>
            )}
            </div>
        )}
    </div>
  );
};

export default FloatManagementPage;
