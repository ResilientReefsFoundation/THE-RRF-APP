import * as React from 'react';
import type { FormEvent, ChangeEvent } from 'react';
/* Import resolveMediaUrl from SpeciesIdPage */
import { resolveMediaUrl } from './SpeciesIdPage';
import type { Site, Anchor, Tree, CoralBranch, StructureType, ActivityLogItem, Photo, Species, PrefixSettings, SubstrateZone, R2Settings } from '../types';
import { PencilIcon, ArrowRightOnRectangleIcon, CloseIcon, CameraIcon, GlobeAltIcon } from './Icons';
import QRCodeLabelModal from './QRCodeLabelModal';
import CoralBranchDisplay from './CoralBranchDisplay';

interface RopeUnitsPageProps {
  /* Added isReadOnly and r2Settings to props */
  isReadOnly: boolean;
  r2Settings: R2Settings | null;
  sites: Site[];
  anchors: Anchor[];
  trees: Tree[];
  substrateZones: SubstrateZone[];
  speciesList: Species[];
  onNavigateToSpecies: () => void;
  ropeUnits: CoralBranch[];
  activityLog: ActivityLogItem[];
  prefixSettings: PrefixSettings;
  onAddRopeUnit: (siteId: string, treeId: string, face: 1 | 2 | 3 | 4, position: number, isHeatTolerant: boolean, genus: string, species: string) => { id: string; fragmentId: string } | null;
  onMoveRopeUnit: (branchId: string, newTreeId: string, newFace: 1 | 2 | 3 | 4, newPosition: number, reason?: string) => void;
  onOutplantRopeUnit: (branchId: string, zoneId: string, depth: number) => void;
  onSelectRopeUnit: (branchId: string) => void;
  onUpdateRopeUnit: (branch: CoralBranch) => void;
  onNavigateBack: () => void;
  highlightUnitId?: string;
  initialBranchToMove?: CoralBranch;
  initialBranchToEdit?: CoralBranch;
  onOpenGallery: (id: string) => void;
}

const calculateAgeInDays = (dateString: string): number => {
  const addedDate = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - addedDate.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

const formatAge = (totalDays: number): string => {
  if (totalDays === 0) return "Added today";
  if (totalDays < 365) return `${totalDays} ${totalDays === 1 ? 'day' : 'days'}`;
  const years = Math.floor(totalDays / 365);
  const remainingDays = totalDays % 365;
  const yearText = `${years} ${years === 1 ? 'year' : 'years'}`;
  if (remainingDays === 0) return yearText;
  return `${yearText} and ${remainingDays} ${remainingDays === 1 ? 'day' : 'days'}`;
};

const getHealthStatusColor = (percentage: number): string => {
    if (percentage > 87.5) return 'bg-green-500';
    if (percentage > 62.5) return 'bg-yellow-400';
    if (percentage > 37.5) return 'bg-orange-400';
    if (percentage > 12.5) return 'bg-orange-600';
    return 'bg-red-500';
};

const CustomCheckbox: React.FC<{
    id: string; checked: boolean; onChange: (checked: boolean) => void; label: string;
}> = ({ id, checked, onChange, label }) => (
    <div className="flex items-center gap-2">
        <div className="relative flex items-center"><input type="checkbox" id={id} checked={checked} onChange={e => onChange(e.target.checked)} className="peer h-5 w-5 appearance-none rounded border border-gray-300 bg-white checked:bg-coral-blue transition-all"/><svg className="pointer-events-none absolute left-1 top-1 h-3 w-3 text-white opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></div>
        <label htmlFor={id} className="text-sm font-medium text-gray-700 cursor-pointer select-none">{label}</label>
    </div>
);

const RopeUnitsPage: React.FC<RopeUnitsPageProps> = ({
  /* Destructure new props */
  isReadOnly, r2Settings, sites: activeSites, anchors, trees: activeTrees, substrateZones, speciesList, onNavigateToSpecies, ropeUnits, activityLog, prefixSettings, onAddRopeUnit, onMoveRopeUnit, onOutplantRopeUnit, onSelectRopeUnit, onUpdateRopeUnit, onNavigateBack, highlightUnitId, initialBranchToMove, initialBranchToEdit, onOpenGallery
}) => {
  const [isAddFormOpen, setIsAddFormOpen] = React.useState(false);
  const [selectedSiteId, setSelectedSiteId] = React.useState<string>('');
  const [selectedTreeId, setSelectedTreeId] = React.useState<string>('');
  const [selectedSpeciesId, setSelectedSpeciesId] = React.useState<string>('');
  const [genus, setGenus] = React.useState('');
  const [species, setSpecies] = React.useState('');
  const [face, setFace] = React.useState('');
  const [position, setPosition] = React.useState('');
  const [isHeatTolerant, setIsHeatTolerant] = React.useState(false);
  const [movingUnit, setMovingUnit] = React.useState<CoralBranch | null>(null);
  const [outplantingUnit, setOutplantingUnit] = React.useState<CoralBranch | null>(null);
  const [showQR, setShowQR] = React.useState(false);
  const [createdItem, setCreatedItem] = React.useState<{id: string, name: string, detail?: string} | null>(null);

  const handleAddSubmit = (e: FormEvent) => {
    e.preventDefault();
    /* Guard for read only */
    if (isReadOnly) return;
    const result = onAddRopeUnit(selectedSiteId, selectedTreeId, (activeTrees.find(t=>t.id===selectedTreeId)?.type === 'Reef2' ? 1 : parseInt(face)) as 1|2|3|4, parseInt(position), isHeatTolerant, genus || 'Acropora', species || 'Unknown');
    if (result) {
        setCreatedItem({ id: result.id, name: result.fragmentId }); setShowQR(true);
        setGenus(''); setSpecies(''); setSelectedSpeciesId(''); setFace(''); setPosition(''); setIsHeatTolerant(false);
        setIsAddFormOpen(false);
    }
  };

  const nurseryUnits = React.useMemo(() => ropeUnits.filter(b => !b.isArchived && !b.substrateZoneId).sort((a,b) => a.fragmentId.localeCompare(b.fragmentId, undefined, {numeric: true})), [ropeUnits]);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4"><h2 className="text-2xl font-bold text-coral-dark mb-2 sm:mb-0">Manage Strings</h2><button onClick={onNavigateBack} className="bg-gray-200 hover:bg-gray-300 text-coral-dark font-bold py-2 px-4 rounded-lg transition-colors self-start sm:self-center">&larr; Back</button></div>

      <div>
        {!isAddFormOpen ? (
          <button onClick={() => setIsAddFormOpen(true)} className="w-full bg-coral-blue text-white font-bold py-4 rounded-xl shadow-md hover:bg-opacity-90 transition-all uppercase tracking-widest text-sm">+ Add New String</button>
        ) : (
          <form onSubmit={handleAddSubmit} className="p-4 border-2 border-coral-blue rounded-xl space-y-4 bg-gray-50 animate-fade-in relative">
            <button type="button" onClick={() => setIsAddFormOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><CloseIcon className="w-5 h-5"/></button>
            <h3 className="font-semibold text-coral-blue text-lg">Add New String</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div><label className="block text-sm font-medium text-gray-700">Site</label><select value={selectedSiteId} onChange={e => setSelectedSiteId(e.target.value)} required className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900"><option value="">-- Choose site --</option>{activeSites.filter(s=>!s.isArchived).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div><label className="block text-sm font-medium text-gray-700">Structure</label><select value={selectedTreeId} onChange={e => setSelectedTreeId(e.target.value)} required disabled={!selectedSiteId} className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900"><option value="">-- Choose structure --</option>{activeTrees.filter(t => !t.isArchived && (t.type === 'Reef2' || t.type === 'Reef3') && anchors.find(a => a.id === t.anchorId)?.siteId === selectedSiteId).map(t => <option key={t.id} value={t.id}>{(t.type === 'Reef2' ? prefixSettings.reef2 : t.type === 'Reef3' ? prefixSettings.reef3 : prefixSettings.tree)} {t.number}</option>)}</select></div>
                <div className="flex flex-col justify-end pb-1"><CustomCheckbox id="heatTolerant" checked={isHeatTolerant} onChange={setIsHeatTolerant} label="Heat Tolerant" /></div>
                <div><label className="block text-sm font-medium text-gray-700">Species ID</label><select value={selectedSpeciesId} onChange={e => { const s = speciesList.find(x => x.id === e.target.value); setSelectedSpeciesId(e.target.value); if (s) { setGenus(s.genus); setSpecies(s.species); } }} required className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900"><option value="">-- Select Species --</option>{speciesList.map(s => <option key={s.id} value={s.id}>{s.genus} {s.species}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-2"><div><label className="block text-sm font-medium text-gray-700">Face (1-4)</label><input type="number" min="1" max="4" value={face} onChange={e => setFace(e.target.value)} className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900"/></div><div><label className="block text-sm font-medium text-gray-700">Pos (1-10)</label><input type="number" min="1" max="10" value={position} onChange={e => setPosition(e.target.value)} className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900"/></div></div>
            </div>
            <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setIsAddFormOpen(false)} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg">Cancel</button><button type="submit" disabled={isReadOnly} className="bg-coral-blue text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50">Save String</button></div>
          </form>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {nurseryUnits.map(unit => {
            const structurePrefix = unit.treeType === 'Reef2' ? prefixSettings.reef2 : unit.treeType === 'Reef3' ? prefixSettings.reef3 : prefixSettings.tree;
            return (
            <div key={unit.id} className="bg-white border-2 border-coral-blue rounded-lg overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow">
                <div className="flex p-3 gap-3">
                    <div className="flex-shrink-0 relative group w-20 h-20" onClick={() => onOpenGallery(unit.id)}>
                        {unit.photos.find(p=>p.isMain)?.url || unit.photos[0]?.url ? (
                            <img src={resolveMediaUrl(unit.photos.find(p=>p.isMain)?.url || unit.photos[0]?.url, r2Settings)} className="w-20 h-20 object-cover rounded-md cursor-pointer group-hover:opacity-80"/>
                        ) : (
                            <div className="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 cursor-pointer">
                                <CameraIcon className="w-8 h-8" />
                            </div>
                        )}
                    </div>
                    <div className="flex-grow min-w-0">
                        <h4 className="font-bold text-coral-dark text-lg truncate">{unit.fragmentId}</h4>
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-tighter">{unit.site}</p>
                        <p className="text-sm text-gray-700">{structurePrefix} {unit.tree} - face {unit.face} - position {unit.position} • {unit.genus} {unit.species}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <div className={`w-2.5 h-2.5 rounded-full ${getHealthStatusColor(unit.healthReports[0]?.healthPercentage || 100)}`}></div>
                            <span className="text-xs font-semibold text-gray-600">{formatAge(calculateAgeInDays(unit.dateAdded))} old</span>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 p-2 border-t flex gap-2">
                    <button onClick={() => onSelectRopeUnit(unit.id)} className="flex-grow text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold py-1.5 rounded shadow-sm">Details</button>
                </div>
            </div>
          )})}
      </div>
      {createdItem && <QRCodeLabelModal isOpen={showQR} onClose={() => setShowQR(false)} itemId={createdItem.id} itemName={createdItem.name} itemType="String" />}
    </div>
  );
};

export default RopeUnitsPage;