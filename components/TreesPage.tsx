
import * as React from 'react';
import type { Site, Anchor, Tree, Float, CoralBranch, ActivityLogItem, StructureType, Page, PrefixSettings, R2Settings } from '../types';
import { ArrowUpIcon, ChevronDownIcon, QrCodeIcon, PencilIcon, CheckCircleIcon, CloseIcon, CameraIcon, TrashIcon } from './Icons';
import QRCodeLabelModal from './QRCodeLabelModal';
import { resolveMediaUrl } from './SpeciesIdPage';

interface TreesPageProps {
  structureType: StructureType;
  sites: Site[];
  anchors: Anchor[];
  trees: Tree[];
  floats: Float[];
  branches: CoralBranch[];
  activityLog: ActivityLogItem[];
  prefixSettings: PrefixSettings;
  r2Settings: R2Settings | null;
  onAddTree: (anchorId: string, type: StructureType, latitude?: number, longitude?: number, depth?: number) => { id: string; name: string };
  onUpdateTree: (tree: Tree) => void;
  onAddFloat: (treeId: string) => void;
  onMoveTreeUp: (treeId: string) => void;
  onMoveTreeDown: (treeId: string, targetDepth: number) => void;
  onMoveTree: (treeId: string, newAnchorId: string, reason?: string) => void;
  onArchiveTree: (id: string) => void;
  onNavigateBack: () => void;
  highlightTreeId?: string;
  onNavigateToPage: (page: Page) => void;
  onOpenGallery: (id: string) => void;
}

const TARGET_DEPTH_OPTIONS = [6, 8, 10, 12, 14, 16, 18, 20, 22, 24];

const TreeCard: React.FC<{
    tree: Tree;
    structureType: StructureType;
    sites: Site[];
    anchors: Anchor[];
    floats: Float[];
    branches: CoralBranch[];
    activityLog: ActivityLogItem[];
    prefixSettings: PrefixSettings;
    r2Settings: R2Settings | null;
    onUpdateTree: (tree: Tree) => void;
    onAddFloat: (treeId: string) => void;
    onMoveTreeUp: (treeId: string) => void;
    onMoveTreeDown: (treeId: string, targetDepth: number) => void;
    onMoveTree: (treeId: string, newAnchorId: string, reason?: string) => void;
    onArchiveTree: (id: string) => void;
    onNavigateToPage: (page: Page) => void;
    onShowQR: (id: string, name: string) => void;
    onOpenGallery: (id: string) => void;
    isReadOnly: boolean;
}> = ({
    tree, structureType, sites, anchors, floats, branches, activityLog, prefixSettings, r2Settings,
    onUpdateTree, onAddFloat, onMoveTreeUp, onMoveTreeDown, onMoveTree, onArchiveTree,
    onNavigateToPage, onShowQR, onOpenGallery, isReadOnly
}) => {
    const currentAnchor = anchors.find(a => a.id === tree.anchorId);
    const [localTree, setLocalTree] = React.useState<Tree>(tree);
    const [editSiteId, setEditSiteId] = React.useState<string>(currentAnchor?.siteId || '');
    const [isDirty, setIsDirty] = React.useState(false);

    React.useEffect(() => {
        setLocalTree(tree);
        setEditSiteId(anchors.find(a => a.id === tree.anchorId)?.siteId || '');
        setIsDirty(false);
    }, [tree, anchors]);

    const handleLocalChange = (updates: Partial<Tree>) => {
        if (isReadOnly) return;
        setLocalTree(prev => ({ ...prev, ...updates }));
        setIsDirty(true);
    };

    const handleSave = () => {
        onUpdateTree(localTree);
        setIsDirty(false);
    };

    const [historyVisible, setHistoryVisible] = React.useState(false);

    const getPrefix = (type?: StructureType) => {
        if (type === 'Reef2') return prefixSettings.reef2;
        if (type === 'Reef3') return prefixSettings.reef3;
        return prefixSettings.tree;
    };

    const displayName = `${getPrefix(structureType)} ${localTree.number}`;
    const branchCount = branches.filter(b => !b.isArchived && b.tree === tree.number && (b.treeType || 'Tree') === structureType).length;
    
    const floatCount = (floats || []).filter(f => f.treeId === tree.id).length;
    
    const isEligibleToMoveUp = (): boolean => {
        if (!tree.lastMovedDate) return true;
        const lastMoved = new Date(tree.lastMovedDate).getTime();
        const now = new Date().getTime();
        const fourteenDaysInMillis = 14 * 24 * 60 * 60 * 1000;
        return now - lastMoved > fourteenDaysInMillis;
    };
    
    const canMoveUp = isEligibleToMoveUp() && tree.currentDepth > 6;
    const eligibleDepthOptions = TARGET_DEPTH_OPTIONS.filter(depth => depth > tree.currentDepth);
    const movementHistory = activityLog.filter(item => item.type === 'movement' && item.message.includes(`[${tree.id}]`));
    const editFilteredAnchors = anchors.filter(a => a.siteId === editSiteId);
    const mainPhoto = tree.photos?.find(p => p.isMain) || tree.photos?.[0];

    return (
        <div id={`tree-card-${tree.id}`} className="p-4 border-2 border-coral-blue rounded-lg flex flex-col gap-4 transition-shadow duration-300 bg-white shadow-sm">
            <div className="flex flex-col sm:flex-row gap-4">
                <div 
                    onClick={() => onOpenGallery(tree.id)}
                    className="w-full sm:w-32 h-32 shrink-0 bg-gray-100 rounded-xl overflow-hidden cursor-pointer relative group border border-gray-100 shadow-inner flex items-center justify-center"
                >
                    {mainPhoto ? (
                        <img src={resolveMediaUrl(mainPhoto.url, r2Settings)} alt={displayName} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400 gap-1">
                            <CameraIcon className="w-8 h-8" />
                            <span className="text-[8px] font-black uppercase tracking-widest">No Imagery</span>
                        </div>
                    )}
                </div>

                <div className="flex-grow w-full">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="font-bold text-coral-dark text-xl">{displayName}</h4>
                        <div className="flex gap-2">
                            {isDirty && (
                                <button onClick={handleSave} className="bg-coral-blue text-white text-xs font-bold py-1.5 px-4 rounded-full shadow-md flex items-center gap-1 animate-pulse"><CheckCircleIcon className="w-3 h-3" /> Save Changes</button>
                            )}
                            <button onClick={() => { if(confirm(`ARCHIVE STRUCTURE: ${displayName}?\nThis will hide the structure and all its contents from active inventory.`)) onArchiveTree(tree.id); }} disabled={isReadOnly} className="p-2 text-gray-300 hover:text-red-500 disabled:opacity-30 transition-colors" title="Archive & Remove Structure">
                                <TrashIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div className="text-sm text-gray-600 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3 items-center">
                        <div className="flex items-center gap-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest min-w-fit">ID #:</label>
                            <input 
                                type="number" 
                                value={localTree.number} 
                                onChange={(e) => handleLocalChange({ number: parseInt(e.target.value, 10) || 0 })} 
                                className="font-black p-1 border border-gray-300 rounded bg-white w-16 text-sm text-coral-blue shadow-inner outline-none focus:border-coral-blue transition-all"
                            />
                        </div>
                        <p className="col-span-1">Branches: <span className="font-medium">{branchCount} / 40</span></p>
                        <p className="col-span-1">Floats: <span className="font-black text-coral-blue">{floatCount}</span></p>
                        <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-gray-50 p-2 rounded border border-gray-200 flex flex-wrap gap-4 items-center">
                            <span className="text-xs font-black text-gray-500 uppercase">Site Filter:</span>
                            <select value={editSiteId} onChange={(e) => setEditSiteId(e.target.value)} className="p-1 border border-gray-300 rounded text-sm w-32 bg-white">{sites.filter(s=>!s.isArchived).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
                            <span className="text-xs font-black text-gray-500 uppercase ml-2">Anchor:</span>
                            <select value={localTree.anchorId} onChange={(e) => handleLocalChange({ anchorId: e.target.value })} className="p-1 border border-gray-300 rounded text-sm w-32 bg-white font-medium text-coral-dark">{editFilteredAnchors.filter(a=>!a.isArchived).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
                        </div>
                        <div className="flex items-center gap-2"><label className="text-gray-500 min-w-fit">Target:</label><select value={localTree.normalDepth} onChange={(e) => handleLocalChange({ normalDepth: parseInt(e.target.value, 10) })} className="font-medium p-1 border border-gray-300 rounded bg-white text-sm">{TARGET_DEPTH_OPTIONS.map(depth => <option key={depth} value={depth}>{depth}m</option>)}</select></div>
                        <div className="flex items-center gap-2"><label className="text-gray-500 min-w-fit">Current:</label><select value={localTree.currentDepth} onChange={(e) => handleLocalChange({ currentDepth: parseFloat(e.target.value) })} className="font-medium p-1 border border-gray-300 rounded bg-white text-sm">{TARGET_DEPTH_OPTIONS.map(depth => <option key={depth} value={depth}>{depth}m</option>)}</select></div>
                        <div className="flex items-center gap-2"><label className="text-gray-500 min-w-fit">Lat:</label><input type="number" value={localTree.latitude || ''} onChange={(e) => handleLocalChange({ latitude: parseFloat(e.target.value) })} step="any" className="font-medium p-1 border border-gray-300 rounded bg-white w-24 text-sm"/></div>
                        <div className="flex items-center gap-2"><label className="text-gray-500 min-w-fit">Lng:</label><input type="number" value={localTree.longitude || ''} onChange={(e) => handleLocalChange({ longitude: parseFloat(e.target.value) })} step="any" className="font-medium p-1 border border-gray-300 rounded bg-white w-24 text-sm"/></div>
                    </div>
                </div>

                <div className="flex-shrink-0 flex flex-col gap-2 w-full sm:w-auto">
                    <div className="flex gap-2">
                        <button onClick={() => onShowQR(tree.id, displayName)} className="flex-1 bg-coral-blue text-white font-semibold py-2 px-4 rounded-lg text-sm">Label</button>
                        <button onClick={() => onAddFloat(tree.id)} disabled={isReadOnly} className="flex-1 bg-coral-green text-coral-dark font-semibold py-2 px-4 rounded-lg text-sm active:scale-95 transition-transform disabled:opacity-50">Add Float</button>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => onMoveTreeUp(tree.id)} disabled={isReadOnly || !canMoveUp} className="flex-1 bg-blue-100 text-blue-800 font-semibold py-2 px-3 rounded-lg text-sm disabled:opacity-50">Up</button>
                        <select onChange={(e) => onMoveTreeDown(tree.id, parseInt(e.target.value))} value="" disabled={isReadOnly || eligibleDepthOptions.length === 0} className="flex-1 bg-blue-100 text-blue-800 font-semibold py-2 px-3 rounded-lg text-sm disabled:opacity-50">
                            <option value="" disabled>Lower...</option>
                            {eligibleDepthOptions.map(depth => <option key={depth} value={depth}>{depth}m</option>)}
                        </select>
                    </div>
                    <button 
                        onClick={() => onOpenGallery(tree.id)}
                        className="w-full bg-gray-900 text-white font-black py-2 rounded-lg text-[10px] uppercase tracking-widest hover:bg-black transition-all"
                    >
                        Structure Gallery
                    </button>
                </div>
            </div>
            <div className="pt-4 border-t border-dashed">
                <button onClick={() => setHistoryVisible(!historyVisible)} className="w-full flex justify-between items-center text-sm font-semibold text-gray-700"><span>Movement History</span><ChevronDownIcon className={`w-5 h-5 transition-transform ${historyVisible ? 'rotate-180' : ''}`} /></button>
                {historyVisible && <div className="mt-2 pl-4 border-l-2">{movementHistory.length > 0 ? <ul className="space-y-2 text-xs">{movementHistory.map(item => <li key={item.id}><p className="font-semibold">{new Date(item.timestamp).toLocaleString()}</p><p>{item.message}</p></li>)}</ul> : <p className="text-xs text-gray-500">No movement history.</p>}</div>}
            </div>
        </div>
    );
}

const TreesPage: React.FC<TreesPageProps> = ({
  structureType, sites, anchors, trees, floats, branches, activityLog, prefixSettings, r2Settings, onAddTree, onUpdateTree, onAddFloat, onMoveTreeUp, onMoveTreeDown, onMoveTree, onArchiveTree, onNavigateBack, highlightTreeId, onNavigateToPage, onOpenGallery
}) => {
  const [isAddFormOpen, setIsAddFormOpen] = React.useState(false);
  const [selectedSiteId, setSelectedSiteId] = React.useState<string>('');
  const [selectedAnchorId, setSelectedAnchorId] = React.useState<string>('');
  const [newTreeLat, setNewTreeLat] = React.useState('');
  const [newTreeLng, setNewTreeLng] = React.useState('');
  const [newTreeDepth, setNewTreeDepth] = React.useState('');
  const [showQR, setShowQR] = React.useState(false);
  const [createdItem, setCreatedItem] = React.useState<{ id: string, name: string } | null>(null);

  const activeTrees = React.useMemo(() => (trees || []).filter(t => !t.isArchived), [trees]);
  const visibleTrees = React.useMemo(() => activeTrees.filter(t => (t.type || 'Tree') === structureType), [activeTrees, structureType]);
  const pageTitle = structureType === 'Tree' ? 'Manage Trees' : structureType === 'Reef2' ? 'Manage Reef²' : 'Manage Reef³';

  // Scroll and highlight effect
  React.useEffect(() => {
    if (highlightTreeId) {
        const timer = setTimeout(() => {
            const el = document.getElementById(`tree-card-${highlightTreeId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('ring-4', 'ring-coral-blue', 'ring-offset-2', 'bg-blue-50');
                setTimeout(() => {
                    el.classList.remove('ring-4', 'ring-coral-blue', 'ring-offset-2', 'bg-blue-50');
                }, 3000);
            }
        }, 100);
        return () => clearTimeout(timer);
    }
  }, [highlightTreeId]);

  const handleAddTree = () => {
    if (selectedAnchorId && newTreeDepth) {
      const result = onAddTree(selectedAnchorId, structureType, newTreeLat ? parseFloat(newTreeLat) : undefined, newTreeLng ? parseFloat(newTreeLng) : undefined, parseFloat(newTreeDepth));
      setCreatedItem({ id: result.id, name: result.name }); setShowQR(true);
      setNewTreeLat(''); setNewTreeLng(''); setNewTreeDepth('');
      setIsAddFormOpen(false);
    } else alert('Please select a site, anchor, and depth.');
  };

  const filteredAnchors = selectedSiteId ? anchors.filter(a => !a.isArchived && a.siteId === selectedSiteId) : [];

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4">
        <h2 className="text-2xl font-bold text-coral-dark mb-2 sm:mb-0">{pageTitle}</h2>
        <button onClick={onNavigateBack} className="bg-gray-200 hover:bg-gray-300 text-coral-dark font-bold py-2 px-4 rounded-lg transition-colors duration-200 self-start sm:self-center">&larr; Back</button>
      </div>

      <div>
        {!isAddFormOpen ? (
          <button onClick={() => setIsAddFormOpen(true)} className="w-full bg-coral-blue text-white font-bold py-4 rounded-xl shadow-md hover:bg-opacity-90 transition-all uppercase tracking-widest text-sm">+ Add New {structureType}</button>
        ) : (
          <div className="p-4 border-2 border-coral-blue rounded-xl space-y-4 bg-gray-50 animate-fade-in relative">
            <button onClick={() => setIsAddFormOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><CloseIcon className="w-5 h-5"/></button>
            <h3 className="font-semibold text-coral-blue text-lg">Add New {structureType}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
              <div><label className="block text-sm font-medium text-gray-700">Site</label><select value={selectedSiteId} onChange={e => { setSelectedSiteId(e.target.value); setSelectedAnchorId(''); }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900"><option value="">-- Choose site --</option>{sites.filter(s=>!s.isArchived).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700">Anchor</label><select value={selectedAnchorId} onChange={e => setSelectedAnchorId(e.target.value)} disabled={!selectedSiteId} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900 disabled:bg-gray-100"><option value="">-- Choose anchor --</option>{filteredAnchors.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700">Recorded Depth (m)</label><select value={newTreeDepth} onChange={e => setNewTreeDepth(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900"><option value="">-- Select Depth --</option>{TARGET_DEPTH_OPTIONS.map(depth => <option key={depth} value={depth}>{depth}m</option>)}</select></div>
              <div><label className="block text-sm font-medium text-gray-700">Latitude (Optional)</label><input type="number" value={newTreeLat} onChange={e => setNewTreeLat(e.target.value)} step="any" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900" placeholder="e.g. 25.1234"/></div>
              <div><label className="block text-sm font-medium text-gray-700">Longitude (Optional)</label><input type="number" value={newTreeLng} onChange={e => setNewTreeLng(e.target.value)} step="any" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900" placeholder="e.g. -80.4321"/></div>
              <div className="flex gap-2"><button type="button" onClick={() => setIsAddFormOpen(false)} className="flex-1 bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg">Cancel</button><button onClick={handleAddTree} disabled={!selectedAnchorId || !newTreeDepth} className="flex-[2] bg-coral-blue text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-400">Save</button></div>
            </div>
          </div>
        )}
      </div>
      
      <div>
        <h3 className="font-semibold text-gray-700 text-lg mb-4">Edit Existing {structureType}</h3>
        <div className="space-y-4">
          {visibleTrees.length > 0 ? visibleTrees.sort((a,b) => a.number - b.number).map(tree => <TreeCard key={tree.id} tree={tree} structureType={structureType} sites={sites} anchors={anchors} floats={floats} branches={branches} activityLog={activityLog} prefixSettings={prefixSettings} r2Settings={r2Settings} onUpdateTree={onUpdateTree} onAddFloat={onAddFloat} onMoveTreeUp={onMoveTreeUp} onMoveTreeDown={onMoveTreeDown} onMoveTree={onMoveTree} onArchiveTree={onArchiveTree} onNavigateToPage={onNavigateToPage} onShowQR={(id, name) => { setCreatedItem({ id, name }); setShowQR(true); }} onOpenGallery={onOpenGallery} isReadOnly={false} />) : <p className="text-center text-gray-500 py-8">No {structureType}s added yet.</p>}
        </div>
      </div>
      {createdItem && <QRCodeLabelModal isOpen={showQR} onClose={() => setShowQR(false)} itemId={createdItem.id} itemName={createdItem.name} itemType={structureType} />}
    </div>
  );
};

export default TreesPage;
