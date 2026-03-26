
import * as React from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import type { Site, SubstrateZone, RubbleAnchor, Species, HealthReport } from '../types';
import { PencilIcon, QrCodeIcon, TrashIcon, CloseIcon, DatabaseIcon, BookOpenIcon, ChevronDownIcon } from './Icons';
import QRCodeLabelModal from './QRCodeLabelModal';

interface RubbleAnchorsPageProps {
  sites: Site[];
  substrateZones: SubstrateZone[];
  rubbleAnchors: RubbleAnchor[];
  speciesList: Species[];
  onAddRubbleAnchor: (substrateZoneId: string, depth: number, genus: string, species: string) => { id: string; name: string };
  onUpdateRubbleAnchor: (anchor: RubbleAnchor) => void;
  onDeleteRubbleAnchor: (id: string) => void;
  onNavigateBack: () => void;
  onNavigateToSpecies: () => void;
  highlightAnchorId?: string;
  onSelectAnchor?: (id: string) => void;
  isReadOnly: boolean;
}

const DEPTH_OPTIONS = Array.from({ length: 50 }, (_, i) => i + 1); // 1m to 50m

const HEALTH_CATEGORIES = {
    '100%': { color: 'bg-green-500', label: '100%' },
    '75%': { color: 'bg-yellow-400', label: '75%' },
    '50%': { color: 'bg-orange-400', label: '50%' },
    '25%': { color: 'bg-orange-600', label: '25%' },
    '0%': { color: 'bg-red-500', label: '0%' },
};

type HealthStatus = keyof typeof HEALTH_CATEGORIES;

const getHealthStatusFromReports = (reports?: HealthReport[]): HealthStatus | null => {
    if (!reports || reports.length === 0) return '100%';
    const latestReport = [...reports].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
    const p = latestReport.healthPercentage;
    if (p > 87.5) return '100%';
    if (p > 62.5) return '75%';
    if (p > 37.5) return '50%';
    if (p > 12.5) return '25%';
    return '0%';
};

const EditRubbleAnchorModal: React.FC<{
    anchor: RubbleAnchor;
    sites: Site[];
    substrateZones: SubstrateZone[];
    speciesList: Species[];
    onNavigateToSpecies: () => void;
    onClose: () => void;
    onUpdate: (anchor: RubbleAnchor) => void;
}> = ({ anchor, sites, substrateZones, speciesList, onNavigateToSpecies, onClose, onUpdate }) => {
    const [name, setName] = React.useState(anchor.name);
    const [genus, setGenus] = React.useState(anchor.genus);
    const [species, setSpecies] = React.useState(anchor.species);
    const [depth, setDepth] = React.useState(anchor.depth.toString());
    const [zoneId, setZoneId] = React.useState(anchor.substrateZoneId);

    const currentSpeciesId = speciesList.find(s => s.genus === genus && s.species === species)?.id || '';

    const handleSpeciesChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === 'new_species') {
            onNavigateToSpecies();
            return;
        }
        const selected = speciesList.find(s => s.id === val);
        if (selected) {
            setGenus(selected.genus);
            setSpecies(selected.species);
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const depthNum = parseFloat(depth);
        if (!name.trim() || !genus || !species || isNaN(depthNum)) {
            alert("Please fill in all required fields.");
            return;
        }
        
        onUpdate({ 
            ...anchor, 
            name: name.trim(),
            genus, 
            species, 
            depth: depthNum,
            substrateZoneId: zoneId
        });
        onClose();
    };

    const inputClasses = "w-full p-3 border border-gray-300 rounded-lg font-bold text-gray-800 bg-white shadow-inner focus:ring-2 focus:ring-coral-blue focus:border-coral-blue outline-none transition-all";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-[100] flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative flex flex-col max-h-[90vh]">
                <form onSubmit={handleSubmit} className="flex flex-col h-full">
                    <header className="p-5 border-b flex justify-between items-center shrink-0">
                        <h2 className="text-xl font-bold text-coral-dark">Edit Rubble Anchor</h2>
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-800 transition-colors p-1">
                            <CloseIcon className="w-6 h-6"/>
                        </button>
                    </header>
                    <div className="p-6 space-y-5 overflow-y-auto flex-grow">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Anchor ID / Name</label>
                            <input 
                                type="text" 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                                required 
                                className={inputClasses}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Substrate Zone</label>
                            <select 
                                value={zoneId} 
                                onChange={e => setZoneId(e.target.value)} 
                                required 
                                className={inputClasses}
                            >
                                {substrateZones.map(z => {
                                    const site = sites.find(s => s.id === z.siteId);
                                    return <option key={z.id} value={z.id}>{z.name} ({site?.name || 'Unknown Site'})</option>;
                                })}
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Species ID</label>
                            <select 
                                value={currentSpeciesId} 
                                onChange={handleSpeciesChange} 
                                required 
                                className={inputClasses}
                            >
                                <option value="">-- Select Species --</option>
                                {speciesList.map(s => <option key={s.id} value={s.id}>{s.genus} {s.species}</option>)}
                                <option value="new_species" className="font-bold text-coral-blue text-sm">+ Add New Species...</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Recorded Depth (m)</label>
                            <select 
                                value={depth} 
                                onChange={e => setDepth(e.target.value)} 
                                className={inputClasses}
                            >
                                {DEPTH_OPTIONS.map(d => <option key={d} value={d}>{d}m</option>)}
                            </select>
                        </div>
                    </div>
                    <footer className="p-5 bg-gray-50 rounded-b-2xl flex justify-end gap-3 border-t shrink-0">
                        <button type="button" onClick={onClose} className="bg-white border border-gray-300 text-gray-700 font-bold py-2.5 px-5 rounded-xl hover:bg-gray-100 transition-all active:scale-95 shadow-sm">Cancel</button>
                        <button type="submit" className="bg-coral-blue text-white font-bold py-2.5 px-8 rounded-xl shadow-md hover:bg-opacity-90 transition-all active:scale-95">Save Changes</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

const RubbleAnchorsPage: React.FC<RubbleAnchorsPageProps> = ({
  sites,
  substrateZones,
  rubbleAnchors,
  speciesList,
  onAddRubbleAnchor,
  onUpdateRubbleAnchor,
  onDeleteRubbleAnchor,
  onNavigateBack,
  onNavigateToSpecies,
  highlightAnchorId,
  onSelectAnchor,
  isReadOnly
}) => {
    // Form State
    const [selectedSiteId, setSelectedSiteId] = React.useState<string>('');
    const [selectedZoneId, setSelectedZoneId] = React.useState<string>('');
    const [depth, setDepth] = React.useState('');
    const [genus, setGenus] = React.useState('');
    const [species, setSpecies] = React.useState('');
    const [selectedSpeciesId, setSelectedSpeciesId] = React.useState('');

    // QR State
    const [showQR, setShowQR] = React.useState(false);
    const [createdItem, setCreatedItem] = React.useState<{id: string, name: string} | null>(null);
    const [editingAnchor, setEditingAnchor] = React.useState<RubbleAnchor | null>(null);

    React.useEffect(() => {
        if (highlightAnchorId) {
            const el = document.getElementById(`anchor-card-${highlightAnchorId}`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('ring-4', 'ring-coral-blue', 'ring-offset-2', 'bg-blue-50');
                setTimeout(() => el.classList.remove('ring-4', 'ring-coral-blue', 'ring-offset-2', 'bg-blue-50'), 4000);
            }
        }
    }, [highlightAnchorId]);

    const handleSpeciesChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        if (val === 'new_species_action') {
            onNavigateToSpecies();
            return;
        }
        
        setSelectedSpeciesId(val);
        const selected = speciesList.find(s => s.id === val);
        if (selected) {
            setGenus(selected.genus);
            setSpecies(selected.species);
        } else {
            setGenus('');
            setSpecies('');
        }
    };

    const handleZoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newZoneId = e.target.value;
        setSelectedZoneId(newZoneId);
        
        const zone = substrateZones.find(z => z.id === newZoneId);
        if (zone) {
            setDepth(zone.depth.toString());
        } else {
            setDepth('');
        }
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (isReadOnly) return;
        const depthNum = parseFloat(depth);
        if (!selectedZoneId || isNaN(depthNum) || !genus) {
            alert('Please complete all fields.');
            return;
        }

        const result = onAddRubbleAnchor(selectedZoneId, depthNum, genus, species);
        
        setCreatedItem({ id: result.id, name: result.name });
        setShowQR(true);

        // Reset form fields
        setGenus('');
        setSpecies('');
        setSelectedSpeciesId('');
        setDepth('');
        setSelectedZoneId('');
    };

    const filteredZones = substrateZones.filter(z => z.siteId === selectedSiteId);
    
    // Group anchors for display based on current selection
    const groupedAnchors = React.useMemo(() => {
        const grouped: { [siteId: string]: { [zoneId: string]: RubbleAnchor[] } } = {};
        
        const sourceAnchors = selectedSiteId 
            ? rubbleAnchors.filter(a => {
                const zone = substrateZones.find(z => z.id === a.substrateZoneId);
                return zone?.siteId === selectedSiteId;
            })
            : rubbleAnchors;

        sourceAnchors.forEach(a => {
            const zone = substrateZones.find(z => z.id === a.substrateZoneId);
            if (!zone) return;
            const siteId = zone.siteId;
            
            if (!grouped[siteId]) grouped[siteId] = {};
            if (!grouped[siteId][zone.id]) grouped[siteId][zone.id] = [];
            grouped[siteId][zone.id].push(a);
        });
        
        return grouped;
    }, [rubbleAnchors, substrateZones, selectedSiteId]);

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg space-y-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4">
                <h2 className="text-2xl font-bold text-coral-dark mb-2 sm:mb-0">Rubble Anchors</h2>
                <button
                    onClick={onNavigateBack}
                    className="bg-gray-200 hover:bg-gray-300 text-coral-dark font-bold py-2 px-4 rounded-lg transition-colors duration-200 self-start sm:self-center"
                >
                    &larr; Back to Add/Edit Items
                </button>
            </div>

            {isReadOnly && (
                <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3 text-red-700 animate-pulse">
                    <CloseIcon className="w-6 h-6 shrink-0"/>
                    <div>
                        <p className="font-black uppercase text-xs tracking-widest">Read-Only Mode</p>
                        <p className="text-sm">You must click <strong>"Start Session"</strong> in the top header before you can add or edit anchors.</p>
                    </div>
                </div>
            )}

            {/* Add Form */}
            <form onSubmit={handleSubmit} className={`p-4 border-2 border-coral-blue rounded-lg space-y-4 bg-gray-50 shadow-inner transition-opacity ${isReadOnly ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
                <h3 className="font-bold text-coral-dark text-lg border-b pb-1">Deploy New Rubble Anchor</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">1. Select Site</label>
                        <select value={selectedSiteId} onChange={e => { setSelectedSiteId(e.target.value); setSelectedZoneId(''); }} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900">
                            <option value="">-- Choose Site --</option>
                            {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">2. Substrate Zone</label>
                        <select value={selectedZoneId} onChange={handleZoneChange} required disabled={!selectedSiteId} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white disabled:bg-gray-100 text-gray-900">
                            <option value="">-- Choose Zone --</option>
                            {filteredZones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">3. Coral Species</label>
                        <select 
                            value={selectedSpeciesId} 
                            onChange={handleSpeciesChange} 
                            required 
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900"
                        >
                            <option value="">-- Select Species --</option>
                            {speciesList.sort((a,b) => a.genus.localeCompare(b.genus)).map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.genus} {s.species}
                                </option>
                            ))}
                            <option value="" disabled>──────────</option>
                            <option value="new_species_action" className="font-bold text-coral-blue">+ Add New Species...</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">4. Recorded Depth (m)</label>
                        <select 
                            value={depth} 
                            onChange={e => setDepth(e.target.value)} 
                            required 
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900"
                        >
                            <option value="">-- Select Depth --</option>
                            {DEPTH_OPTIONS.map(d => (
                                <option key={d} value={d}>{d}m</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex justify-end pt-2">
                    <button type="submit" disabled={isReadOnly} className="bg-coral-blue hover:bg-opacity-90 text-white font-bold py-3 px-8 rounded-lg shadow-md transition-all active:scale-95 disabled:bg-gray-300 disabled:shadow-none">
                        Add Rubble Anchor
                    </button>
                </div>
            </form>

            {/* List */}
            <div className="space-y-6">
                <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-bold text-gray-700 text-lg">
                        {selectedSiteId 
                            ? `Existing Anchors at ${sites.find(s => s.id === selectedSiteId)?.name}` 
                            : 'All Deployed Rubble Anchors'}
                    </h3>
                    {!selectedSiteId && <span className="text-xs text-gray-400 italic">Filter by site above to narrow down</span>}
                </div>

                {Object.keys(groupedAnchors).length > 0 ? (
                    Object.entries(groupedAnchors).map(([siteId, zonesMap]) => {
                        const site = sites.find(s => s.id === siteId);
                        return (
                            <div key={siteId} className="space-y-4">
                                {!selectedSiteId && (
                                    <div className="flex items-center gap-2 mt-4">
                                        <div className="h-px bg-gray-200 flex-grow"></div>
                                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{site?.name || 'Unknown Site'}</span>
                                        <div className="h-px bg-gray-200 flex-grow"></div>
                                    </div>
                                )}
                                
                                {Object.entries(zonesMap).map(([zoneId, anchors]) => {
                                    const zone = substrateZones.find(z => z.id === zoneId);
                                    return (
                                        <div key={zoneId} className="border-2 border-coral-blue rounded-xl overflow-hidden shadow-sm bg-white">
                                            <div className="bg-gray-50 px-4 py-2 border-b border-coral-blue flex justify-between items-center">
                                                <h4 className="font-black text-coral-dark text-sm uppercase tracking-wide">
                                                    {zone?.name || 'Unknown Zone'}
                                                </h4>
                                                <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">{anchors.length} Item(s)</span>
                                            </div>
                                            <ul className="divide-y divide-gray-100">
                                                {anchors.map(anchor => {
                                                    const status = getHealthStatusFromReports(anchor.healthReports);
                                                    const healthColor = status ? HEALTH_CATEGORIES[status].color : 'bg-green-500';
                                                    return (
                                                        <li key={anchor.id} id={`anchor-card-${anchor.id}`} className="p-4 flex flex-col sm:flex-row justify-between items-center hover:bg-blue-50 transition-colors group gap-4">
                                                            <div className="flex items-start gap-4 w-full sm:w-auto">
                                                                <div className={`w-3 h-3 rounded-full ${healthColor} shadow-sm border border-white mt-2 shrink-0`}></div>
                                                                <div>
                                                                    <div className="flex items-center gap-3">
                                                                        <span className="font-black text-coral-dark text-lg">{anchor.name}</span>
                                                                        <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded border border-gray-200">{anchor.depth}m</span>
                                                                    </div>
                                                                    <p className="text-sm text-gray-500 italic mt-0.5">{anchor.genus} {anchor.species}</p>
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2 w-full sm:w-auto justify-end">
                                                                <button 
                                                                    onClick={() => { setCreatedItem({id: anchor.name, name: anchor.name}); setShowQR(true); }}
                                                                    className="p-2 bg-white border border-gray-300 text-gray-500 hover:text-coral-blue hover:border-coral-blue rounded-xl shadow-sm transition-all"
                                                                    title="View Label"
                                                                >
                                                                    <QrCodeIcon className="w-5 h-5" />
                                                                </button>
                                                                <button 
                                                                    onClick={() => !isReadOnly && setEditingAnchor(anchor)} 
                                                                    disabled={isReadOnly}
                                                                    className="p-2 bg-white border border-gray-300 text-gray-500 hover:text-coral-blue hover:border-coral-blue rounded-xl shadow-sm transition-all disabled:opacity-30"
                                                                    title="Edit Details"
                                                                >
                                                                    <PencilIcon className="w-5 h-5" />
                                                                </button>
                                                                <button 
                                                                    onClick={() => { if(!isReadOnly && confirm(`Are you sure you want to delete ${anchor.name}?`)) onDeleteRubbleAnchor(anchor.id); }}
                                                                    disabled={isReadOnly}
                                                                    className="p-2 bg-white border border-gray-300 text-gray-300 hover:text-red-500 hover:border-red-200 rounded-xl shadow-sm transition-all disabled:opacity-30"
                                                                    title="Remove Anchor"
                                                                >
                                                                    <TrashIcon className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50">
                        <DatabaseIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 font-medium">No rubble anchors found.</p>
                        <p className="text-sm text-gray-400 mt-1">Use the form above to deploy new anchors to a substrate zone.</p>
                    </div>
                )}
            </div>

            {createdItem && (
                <QRCodeLabelModal
                    isOpen={showQR}
                    onClose={() => setShowQR(false)}
                    itemId={createdItem.id} 
                    itemName={createdItem.name}
                    itemType="Rubble Anchor"
                />
            )}

            {editingAnchor && (
                <EditRubbleAnchorModal 
                    anchor={editingAnchor} 
                    sites={sites}
                    substrateZones={substrateZones}
                    speciesList={speciesList}
                    onNavigateToSpecies={onNavigateToSpecies}
                    onClose={() => setEditingAnchor(null)} 
                    onUpdate={onUpdateRubbleAnchor} 
                />
            )}
        </div>
    );
};

export default RubbleAnchorsPage;
