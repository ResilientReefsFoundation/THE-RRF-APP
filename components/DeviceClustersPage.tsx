import * as React from 'react';
import type { FormEvent, ChangeEvent } from 'react';
/* Import R2Settings */
import type { Site, Anchor, Tree, CoralBranch, StructureType, SpawningEventDetails, ParentGenotype, Species, PrefixSettings, R2Settings } from '../types';
import { PencilIcon, ArrowRightOnRectangleIcon, CloseIcon, CameraIcon, SparklesIcon, TrashIcon } from './Icons';
import QRCodeLabelModal from './QRCodeLabelModal';
import { resolveMediaUrl } from './SpeciesIdPage';

interface DeviceClustersPageProps {
  /* Added isReadOnly and r2Settings to props */
  isReadOnly: boolean;
  r2Settings: R2Settings | null;
  sites: Site[];
  anchors: Anchor[];
  trees: Tree[];
  speciesList: Species[];
  onNavigateToSpecies: () => void;
  deviceClusters: CoralBranch[];
  prefixSettings: PrefixSettings;
  onAddDeviceCluster: (siteId: string, treeId: string, face: 1 | 2 | 3 | 4, position: number, isHeatTolerant: boolean, genus: string, species: string, spawningDetails?: SpawningEventDetails) => { id: string; fragmentId: string } | null;
  onMoveDeviceCluster: (branchId: string, newTreeId: string, newFace: 1 | 2 | 3 | 4, newPosition: number, reason?: string) => void;
  onSelectDeviceCluster: (branchId: string) => void;
  onUpdateDeviceCluster: (branch: CoralBranch) => void;
  onNavigateBack: () => void;
  highlightClusterId?: string;
  initialBranchToMove?: CoralBranch;
  initialBranchToEdit?: CoralBranch;
  onOpenGallery: (id: string) => void;
}

const DeviceClustersPage: React.FC<DeviceClustersPageProps> = ({
  /* Destructure new props */
  isReadOnly, r2Settings, sites: activeSites, anchors, trees: activeTrees, speciesList, onNavigateToSpecies, deviceClusters, prefixSettings, onAddDeviceCluster, onMoveDeviceCluster, onSelectDeviceCluster, onUpdateDeviceCluster, onNavigateBack, onOpenGallery
}) => {
  const [isAddFormOpen, setIsAddFormOpen] = React.useState(false);
  const [selectedSiteId, setSelectedSiteId] = React.useState<string>('');
  const [selectedTreeId, setSelectedTreeId] = React.useState<string>('');
  const [selectedSpeciesId, setSelectedSpeciesId] = React.useState<string>('');
  const [genus, setGenus] = React.useState('');
  const [speciesName, setSpeciesName] = React.useState('');
  const [face, setFace] = React.useState('');
  const [position, setPosition] = React.useState('');
  const [activeTab, setActiveTab] = React.useState<'location' | 'lineage'>('location');
  const [parents, setParents] = React.useState<ParentGenotype[]>([]);
  const [showQR, setShowQR] = React.useState(false);
  const [createdItem, setCreatedItem] = React.useState<{id: string, name: string, detail?: string} | null>(null);

  const handleAddSubmit = (e: FormEvent) => {
    e.preventDefault();
    /* Guard for read only */
    if (isReadOnly) return;
    const result = onAddDeviceCluster(selectedSiteId, selectedTreeId, (activeTrees.find(t=>t.id===selectedTreeId)?.type === 'Reef2' ? 1 : parseInt(face)) as 1|2|3|4, parseInt(position), false, genus || 'Acropora', speciesName || 'Unknown', { spawnDate: new Date().toISOString(), tankId: '', autoSpawnerId: '', autoSpawnerSettings: '', settlementDate: new Date().toISOString(), growOutTankId: '', growOutEntryDate: '', growOutExitDate: new Date().toISOString(), growOutLightSettings: '', growOutTemp: 0, parents });
    if (result) {
        setCreatedItem({ id: result.id, name: result.fragmentId, detail: '5 Devices' }); setShowQR(true);
        setGenus(''); setSpeciesName(''); setParents([]); setSelectedSiteId(''); setSelectedTreeId('');
        setIsAddFormOpen(false);
    }
  };

  const activeClusters = React.useMemo(() => deviceClusters.filter(c => !c.isArchived).sort((a,b) => a.fragmentId.localeCompare(b.fragmentId, undefined, {numeric: true})), [deviceClusters]);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4"><h2 className="text-2xl font-bold text-coral-dark mb-2 sm:mb-0">Manage Device Clusters</h2><button onClick={onNavigateBack} className="bg-gray-200 hover:bg-gray-300 text-coral-dark font-bold py-2 px-4 rounded-lg transition-colors self-start sm:self-center">&larr; Back</button></div>
      
      <div>
        {!isAddFormOpen ? (
          <button onClick={() => setIsAddFormOpen(true)} className="w-full bg-coral-blue text-white font-bold py-4 rounded-xl shadow-md hover:bg-opacity-90 transition-all uppercase tracking-widest text-sm">+ Add New Cluster</button>
        ) : (
          <form onSubmit={handleAddSubmit} className="p-4 border-2 border-coral-blue rounded-xl space-y-4 bg-gray-50 animate-fade-in relative">
            <button type="button" onClick={() => setIsAddFormOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><CloseIcon className="w-5 h-5"/></button>
            <h3 className="font-semibold text-coral-blue text-lg">Add New Device Cluster</h3>
            <div className="flex border-b border-gray-300 mb-4"><button type="button" onClick={() => setActiveTab('location')} className={`py-2 px-4 font-medium text-sm focus:outline-none ${activeTab === 'location' ? 'text-coral-blue border-b-2 border-coral-blue' : 'text-gray-500'}`}>1. Location</button><button type="button" onClick={() => setActiveTab('lineage')} className={`py-2 px-4 font-medium text-sm focus:outline-none ${activeTab === 'lineage' ? 'text-coral-blue border-b-2 border-coral-blue' : 'text-gray-500'}`}>2. Lineage</button></div>
            {activeTab === 'location' ? (<div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div><label className="block text-sm font-medium text-gray-700">Site</label><select value={selectedSiteId} onChange={e => setSelectedSiteId(e.target.value)} required className="w-full p-2 border rounded bg-white text-gray-900"><option value="">-- Select --</option>{activeSites.filter(s=>!s.isArchived).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div><div><label className="block text-sm font-medium text-gray-700">Structure</label><select value={selectedTreeId} onChange={e => setSelectedTreeId(e.target.value)} required disabled={!selectedSiteId} className="w-full p-2 border rounded bg-white text-gray-900"><option value="">-- Select --</option>{activeTrees.filter(t => !t.isArchived && anchors.find(a => a.id === t.anchorId)?.siteId === selectedSiteId).map(t => <option key={t.id} value={t.id}>{(t.type || 'Tree')} {t.number}</option>)}</select></div><div><label className="block text-sm font-medium text-gray-700">Species</label><select value={selectedSpeciesId} onChange={e => { const s = speciesList.find(x => x.id === e.target.value); setSelectedSpeciesId(e.target.value); if (s) { setGenus(s.genus); setSpeciesName(s.species); } }} required className="w-full p-2 border rounded bg-white text-gray-900"><option value="">-- Select --</option>{speciesList.map(s => <option key={s.id} value={s.id}>{s.genus} {s.species}</option>)}</select></div></div>) : (<div className="p-3 bg-white border rounded"><input type="text" placeholder="Parent ID e.g. T1-F1-P5" onKeyDown={e => {if(e.key==='Enter'){e.preventDefault(); const v=(e.target as any).value; if(v){setParents([...parents, {descriptor:v}]); (e.target as any).value='';}}}} className="w-full p-2 border rounded"/><div className="flex flex-wrap gap-2 mt-2">{parents.map((p,i)=>(<span key={i} className="bg-blue-50 px-2 py-1 rounded text-xs border flex items-center gap-1">{p.descriptor}<button onClick={()=>setParents(parents.filter((_,idx)=>idx!==i))}>&times;</button></span>))}</div></div>)}
            <div className="flex justify-end gap-2 pt-2 border-t mt-4"><button type="button" onClick={() => setIsAddFormOpen(false)} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg">Cancel</button><button type="submit" disabled={isReadOnly || !selectedTreeId} className="bg-coral-blue text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">Save Cluster</button></div>
          </form>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeClusters.map(cluster => {
            const structurePrefix = cluster.treeType === 'Reef2' ? prefixSettings.reef2 : cluster.treeType === 'Reef3' ? prefixSettings.reef3 : prefixSettings.tree;
            return (
            <div key={cluster.id} className="bg-white border-2 border-coral-blue rounded-lg overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow">
                <div className="flex p-3 gap-3">
                    <div className="flex-shrink-0" onClick={() => onOpenGallery(cluster.id)}>
                        {cluster.photos[0]?.url ? (
                            <img src={resolveMediaUrl(cluster.photos[0].url, r2Settings)} className="w-20 h-20 object-cover rounded-md cursor-pointer"/>
                        ) : (
                            <div className="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 cursor-pointer">
                                <CameraIcon className="w-8 h-8" />
                            </div>
                        )}
                    </div>
                    <div className="flex-grow min-w-0">
                        <h4 className="font-bold text-coral-dark text-lg truncate">{cluster.fragmentId}</h4>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-tighter">{cluster.site}</p>
                        <p className="text-xs text-gray-500">{structurePrefix} {cluster.tree} - face {cluster.face} - position {cluster.position} • {cluster.genus} {cluster.species}</p>
                    </div>
                </div>
                <div className="bg-gray-50 p-2 border-t flex gap-2">
                    <button onClick={() => onSelectDeviceCluster(cluster.id)} className="flex-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold py-1.5 rounded">Details</button>
                </div>
            </div>
          )})}
      </div>
      {createdItem && <QRCodeLabelModal isOpen={showQR} onClose={() => setShowQR(false)} itemId={createdItem.id} itemName={createdItem.name} itemType="Device Cluster" />}
    </div>
  );
};

export default DeviceClustersPage;