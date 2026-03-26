
import * as React from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import type { Site, Anchor, Tree, CoralBranch, StructureType, Photo, ActivityLogItem, Species, PrefixSettings, R2Settings } from '../types';
import { CloseIcon, CameraIcon, PencilIcon, ArrowRightOnRectangleIcon, ArrowPathIcon, CheckCircleIcon, TrashIcon } from './Icons';
import { resolveMediaUrl } from './SpeciesIdPage';
import QRCodeLabelModal from './QRCodeLabelModal';

interface BranchesPageProps {
    sites: Site[];
    anchors: Anchor[];
    trees: Tree[];
    branches: CoralBranch[];
    speciesList: Species[];
    r2Settings: R2Settings | null;
    onNavigateToSpecies: () => void;
    activityLog: ActivityLogItem[];
    prefixSettings: PrefixSettings;
    onAddBranch: (siteId: string, treeId: string, face: 1 | 2 | 3 | 4, position: number, isHeatTolerant: boolean, genus: string, species: string) => { id: string; fragmentId: string } | null;
    onMoveBranch: (branchId: string, newTreeId: string, newFace: 1 | 2 | 3 | 4, newPosition: number, reason?: string) => void;
    onSelectBranch: (branchId: string) => void;
    onUpdateBranch: (branch: CoralBranch) => void;
    onArchiveBranch: (id: string) => void;
    onNavigateBack: () => void;
    highlightBranchId?: string;
    initialBranchToMove?: CoralBranch;
    initialBranchToEdit?: CoralBranch;
    initialTreeId?: string;
    isReadOnly: boolean;
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
    id: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    label: string;
}> = ({ id, checked, onChange, label }) => (
    <div className="flex items-center gap-2">
        <div className="relative flex items-center">
            <input
                type="checkbox"
                id={id}
                checked={checked}
                onChange={e => onChange(e.target.checked)}
                className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-300 bg-white checked:bg-coral-blue checked:border-coral-blue transition-all"
            />
            <svg className="pointer-events-none absolute left-1 top-1 h-3 w-3 text-white opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
        </div>
        <label htmlFor={id} className="text-sm font-medium text-gray-700 cursor-pointer select-none">{label}</label>
    </div>
);

const BranchesPage: React.FC<BranchesPageProps> = ({
    sites: activeSites, anchors, trees: activeTrees, branches, r2Settings, speciesList, onNavigateToSpecies, prefixSettings, onAddBranch, onSelectBranch, onUpdateBranch, onArchiveBranch, onNavigateBack, highlightBranchId, initialBranchToEdit, isReadOnly, onOpenGallery
}) => {
    const [isFormOpen, setIsFormOpen] = React.useState(false);
    const [editingBranch, setEditingBranch] = React.useState<CoralBranch | null>(null);

    const [selectedSiteId, setSelectedSiteId] = React.useState<string>('');
    const [selectedTreeId, setSelectedTreeId] = React.useState<string>('');
    const [selectedSpeciesId, setSelectedSpeciesId] = React.useState<string>('');
    const [genus, setGenus] = React.useState('');
    const [speciesName, setSpeciesName] = React.useState('');
    const [face, setFace] = React.useState('');
    const [position, setPosition] = React.useState('');
    const [isHeatTolerant, setIsHeatTolerant] = React.useState(false);

    const [showQR, setShowQR] = React.useState(false);
    const [createdItem, setCreatedItem] = React.useState<{ id: string, name: string, detail?: string } | null>(null);

    // Initial edit mode landing
    React.useEffect(() => {
        if (initialBranchToEdit) {
            setEditingBranch(initialBranchToEdit);
            setIsFormOpen(true);
            
            // Map values to form
            const site = activeSites.find(s => s.name === initialBranchToEdit.site);
            const tree = activeTrees.find(t => t.number === initialBranchToEdit.tree && (t.type || 'Tree') === (initialBranchToEdit.treeType || 'Tree'));
            const species = speciesList.find(s => s.genus === initialBranchToEdit.genus && s.species === initialBranchToEdit.species);
            
            setSelectedSiteId(site?.id || '');
            setSelectedTreeId(tree?.id || '');
            setSelectedSpeciesId(species?.id || '');
            setGenus(initialBranchToEdit.genus);
            setSpeciesName(initialBranchToEdit.species);
            setFace(initialBranchToEdit.face.toString());
            setPosition(initialBranchToEdit.position.toString());
            setIsHeatTolerant(initialBranchToEdit.isHeatTolerant || false);
        }
    }, [initialBranchToEdit, activeSites, activeTrees, speciesList]);

    const getPrefix = (type?: StructureType) => {
        if (type === 'Reef2') return prefixSettings.reef2;
        if (type === 'Reef3') return prefixSettings.reef3;
        return prefixSettings.tree;
    };

    const handleSpeciesChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === 'new_species') { onNavigateToSpecies(); return; }
        setSelectedSpeciesId(val);
        const selected = speciesList.find(s => s.id === val);
        if (selected) { setGenus(selected.genus); setSpeciesName(selected.species); }
    };

    const handleFormSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (isReadOnly) return;
        
        const faceNum = activeTrees.find(t => t.id === selectedTreeId)?.type === 'Reef2' ? 1 : parseInt(face, 10);
        const posNum = parseInt(position, 10);

        if (editingBranch) {
            const tree = activeTrees.find(t => t.id === selectedTreeId);
            onUpdateBranch({
                ...editingBranch,
                site: activeSites.find(s => s.id === selectedSiteId)?.name || editingBranch.site,
                tree: tree?.number || editingBranch.tree,
                treeType: tree?.type || 'Tree',
                face: faceNum as 1|2|3|4,
                position: posNum,
                genus: genus || editingBranch.genus,
                species: speciesName || editingBranch.species,
                isHeatTolerant
            });
            alert('Branch updated!');
            setIsFormOpen(false);
            setEditingBranch(null);
        } else {
            const result = onAddBranch(selectedSiteId, selectedTreeId, faceNum as 1 | 2 | 3 | 4, posNum, isHeatTolerant, genus || 'Acropora', speciesName || 'Unknown');
            if (result) {
                setCreatedItem({ id: result.id, name: result.fragmentId });
                setShowQR(true);
                setIsFormOpen(false);
            }
        }
        // Clear fields
        setGenus(''); setSpeciesName(''); setSelectedSpeciesId(''); setFace(''); setPosition(''); setIsHeatTolerant(false);
    };

    const activeBranches = React.useMemo(() => branches.filter(b => !b.isArchived), [branches]);

    const displayedBranches = React.useMemo(() => {
        return activeBranches.filter(b => (!b.type || b.type === 'Branch')).filter(b => {
            if (selectedSiteId && b.site !== activeSites.find(s => s.id === selectedSiteId)?.name) return false;
            if (selectedTreeId) {
                const tree = activeTrees.find(t => t.id === selectedTreeId);
                return b.tree === tree?.number && (b.treeType || 'Tree') === (tree?.type || 'Tree');
            }
            return true;
        });
    }, [activeBranches, selectedSiteId, selectedTreeId, activeSites, activeTrees]);

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg space-y-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4">
                <h2 className="text-2xl font-bold text-coral-dark mb-2 sm:mb-0">Manage Branches</h2>
                <button onClick={onNavigateBack} className="bg-gray-200 hover:bg-gray-300 text-coral-dark font-bold py-2 px-4 rounded-lg transition-colors duration-200 self-start sm:self-center">
                    &larr; Back
                </button>
            </div>

            <div>
                {!isFormOpen ? (
                    <button onClick={() => { setEditingBranch(null); setIsFormOpen(true); }} className="w-full bg-coral-blue text-white font-bold py-4 rounded-xl shadow-md hover:bg-opacity-90 transition-all uppercase tracking-widest text-sm">
                        + Add New Branch
                    </button>
                ) : (
                    <form onSubmit={handleFormSubmit} className="p-4 border-2 border-coral-blue rounded-xl space-y-4 bg-gray-50 animate-fade-in relative shadow-inner">
                        <button type="button" onClick={() => { setIsFormOpen(false); setEditingBranch(null); }} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <CloseIcon className="w-5 h-5" />
                        </button>
                        <h3 className="font-bold text-coral-blue text-lg flex items-center gap-2">
                            {editingBranch ? <PencilIcon className="w-5 h-5" /> : null}
                            {editingBranch ? `Edit Branch ${editingBranch.fragmentId}` : 'Add New Coral Branch'}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Site</label>
                                <select value={selectedSiteId} onChange={e => { setSelectedSiteId(e.target.value); setSelectedTreeId(''); }} required className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900">
                                    <option value="">-- Choose site --</option>
                                    {activeSites.filter(s=>!s.isArchived).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Structure</label>
                                <select value={selectedTreeId} onChange={e => setSelectedTreeId(e.target.value)} required disabled={!selectedSiteId} className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900">
                                    <option value="">-- Choose structure --</option>
                                    {activeTrees.filter(t => !t.isArchived && anchors.find(a => a.id === t.anchorId)?.siteId === selectedSiteId).map(t => (
                                        <option key={t.id} value={t.id}>{getPrefix(t.type)} {t.number}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col justify-end pb-1">
                                <CustomCheckbox id="heatTolerant" checked={isHeatTolerant} onChange={setIsHeatTolerant} label="Heat Tolerant Genotype" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Species ID</label>
                                <select value={selectedSpeciesId} onChange={handleSpeciesChange} required className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900">
                                    <option value="">-- Select Species --</option>
                                    {speciesList.map(s => <option key={s.id} value={s.id}>{s.genus} {s.species}</option>)}
                                    <option value="new_species" className="font-bold text-coral-blue text-sm">+ Add New Species...</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Face (1-4)</label>
                                <input type="number" min="1" max="4" value={face} onChange={e => setFace(e.target.value)} required={selectedTreeId !== '' && activeTrees.find(t => t.id === selectedTreeId)?.type !== 'Reef2'} disabled={selectedTreeId !== '' && activeTrees.find(t => t.id === selectedTreeId)?.type === 'Reef2'} className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Position (1-10)</label>
                                <input type="number" min="1" max="10" value={position} onChange={e => setPosition(e.target.value)} required className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => { setIsFormOpen(false); setEditingBranch(null); }} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg">Cancel</button>
                            <button type="submit" disabled={isReadOnly} className="bg-coral-blue text-white font-bold py-2 px-8 rounded-lg shadow-md disabled:bg-gray-400">
                                {editingBranch ? 'Save Changes' : 'Save Branch'}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedBranches.map(branch => {
                    const structurePrefix = branch.treeType === 'Reef2' ? prefixSettings.reef2 : branch.treeType === 'Reef3' ? prefixSettings.reef3 : prefixSettings.tree;
                    return (
                        <div key={branch.id} className={`bg-white border-2 rounded-lg overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-all ${editingBranch?.id === branch.id ? 'border-coral-green ring-2 ring-coral-green/20' : 'border-coral-blue'}`}>
                            <div className="flex p-3 gap-3">
                                <div className="flex-shrink-0 relative group w-20 h-20" onClick={() => onOpenGallery(branch.id)}>
                                    {branch.photos.find(p => p.isMain)?.url || branch.photos[0]?.url ? (
                                        <img src={resolveMediaUrl(branch.photos.find(p => p.isMain)?.url || branch.photos[0]?.url, r2Settings)} className="w-20 h-20 object-cover rounded-md cursor-pointer group-hover:opacity-80" alt={branch.fragmentId} />
                                    ) : (
                                        <div className="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center text-gray-400 cursor-pointer">
                                            <CameraIcon className="w-8 h-8" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-grow min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h4 className="font-bold text-coral-dark text-lg truncate">{branch.fragmentId}</h4>
                                        <button onClick={() => { if(!isReadOnly && confirm(`ARCHIVE BRANCH: ${branch.fragmentId}?\nThis will hide the branch from active inventory.`)) onArchiveBranch(branch.id); }} disabled={isReadOnly} className="p-1 text-gray-300 hover:text-red-500 disabled:opacity-30 transition-colors" title="Archive & Remove Branch">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-tighter">{branch.site}</p>
                                    <p className="text-sm text-gray-700">{structurePrefix} {branch.tree} - f{branch.face} - p{branch.position} • {branch.genus} {branch.species}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className={`w-2.5 h-2.5 rounded-full ${getHealthStatusColor(branch.healthReports[0]?.healthPercentage || 100)}`}></div>
                                        <span className="text-xs font-semibold text-gray-600">{formatAge(calculateAgeInDays(branch.dateAdded))} old</span>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-2 border-t flex gap-2">
                                <button onClick={() => onSelectBranch(branch.id)} className="flex-grow text-xs bg-white border border-gray-200 hover:bg-gray-100 text-gray-600 font-bold py-1.5 rounded shadow-sm transition-colors">Details</button>
                                <button onClick={() => { setEditingBranch(branch); setIsFormOpen(true); }} className="flex-grow text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold py-1.5 rounded shadow-sm transition-colors">Edit</button>
                            </div>
                        </div>
                    )
                })}
            </div>

            {createdItem && <QRCodeLabelModal isOpen={showQR} onClose={() => setShowQR(false)} itemId={createdItem.id} itemName={createdItem.name} itemType="Branch" />}
        </div>
    );
};

export default BranchesPage;
