import * as React from 'react';
import type { FormEvent } from 'react';
import type { Site, SubstrateZone, HealthReport, GrowthReport, Photo, BleachingLevel, CoralBranch, R2Settings } from '../types';
import { PencilIcon, QrCodeIcon, CameraIcon, ChartBarIcon, ArrowUpIcon, ArrowDownIcon, MinusIcon, GlobeAltIcon, CloseIcon, TrashIcon } from './Icons';
import QRCodeLabelModal from './QRCodeLabelModal';
import HealthChart from './HealthChart';
import GrowthChart from './GrowthChart';
import PhotoManagerModal from './PhotoManagerModal';

interface SubstrateZonesPageProps {
  sites: Site[];
  zones: SubstrateZone[];
  activeBranches: CoralBranch[];
  r2Settings: R2Settings | null;
  isReadOnly: boolean;
  onAddZone: (name: string, siteId: string, depth: number, latitude?: number, longitude?: number) => string;
  onUpdateZone: (zone: SubstrateZone) => void;
  onArchiveZone: (id: string) => void;
  onAddReport: (zoneId: string, type: 'health' | 'growth', report: HealthReport | GrowthReport) => void;
  onAddPhoto: (zoneId: string, photo: Photo) => void;
  onNavigateBack: () => void;
  onSelectBranch: (id: string) => void;
  initialZoneId?: string;
}

const DEPTH_OPTIONS = Array.from({ length: 30 }, (_, i) => i + 1);

const SubstrateZonesPage: React.FC<SubstrateZonesPageProps> = ({
  sites: activeSites, zones, activeBranches, r2Settings, isReadOnly, onAddZone, onUpdateZone, onArchiveZone, onAddReport, onAddPhoto, onNavigateBack, onSelectBranch, initialZoneId
}) => {
    const [isAddFormOpen, setIsAddFormOpen] = React.useState(false);
    const [selectedSiteId, setSelectedSiteId] = React.useState<string>('');
    const [depth, setDepth] = React.useState('');
    const [latitude, setLatitude] = React.useState('');
    const [longitude, setLongitude] = React.useState('');
    const [viewMode, setViewMode] = React.useState<'list' | 'details'>('list');
    const [selectedZoneId, setSelectedZoneId] = React.useState<string | null>(null);
    const [showQR, setShowQR] = React.useState(false);
    const [createdItem, setCreatedItem] = React.useState<{id: string, name: string} | null>(null);
    const [isPhotoManagerOpen, setIsPhotoManagerOpen] = React.useState(false);
    const [healthScore, setHealthScore] = React.useState(100);
    const [bleaching, setBleaching] = React.useState<BleachingLevel>('None');
    const [reportNotes, setReportNotes] = React.useState('');
    const [growthArea, setGrowthArea] = React.useState('');
    const [growthVolume, setGrowthVolume] = React.useState('');

    // Handle deep link from dashboard
    React.useEffect(() => {
        if (initialZoneId) {
            const zone = zones.find(z => z.id === initialZoneId);
            if (zone) {
                setSelectedZoneId(initialZoneId);
                setViewMode('details');
            }
        }
    }, [initialZoneId, zones]);

    const handleAddSubmit = (e: FormEvent) => {
        e.preventDefault();
        const generatedName = onAddZone("", selectedSiteId, parseFloat(depth), latitude ? parseFloat(latitude) : undefined, longitude ? parseFloat(longitude) : undefined);
        setCreatedItem({ id: generatedName, name: generatedName }); setShowQR(true);
        setDepth(''); setLatitude(''); setLongitude('');
        setIsAddFormOpen(false);
    };

    const handleAddHealthReport = (e: FormEvent) => {
        e.preventDefault();
        if (!selectedZoneId) return;
        onAddReport(selectedZoneId, 'health', { id: Math.random().toString(), date: new Date().toISOString(), healthPercentage: healthScore, bleaching, notes: reportNotes });
        setReportNotes(''); alert('Health report added.');
    };

    const handleAddGrowthReport = (e: FormEvent) => {
        e.preventDefault();
        if (!selectedZoneId) return;
        onAddReport(selectedZoneId, 'growth', { id: Math.random().toString(), date: new Date().toISOString(), surfaceAreaM2: parseFloat(growthArea), volumeM3: parseFloat(growthVolume) });
        setGrowthArea(''); setGrowthVolume(''); alert('Growth report added.');
    };

    const handlePhotoUpload = (files: File[]) => {
        if (!selectedZoneId) return;
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => onAddPhoto(selectedZoneId!, { id: Math.random().toString(), url: reader.result as string, isMain: false, dateTaken: new Date().toISOString() });
            reader.readAsDataURL(file);
        });
    };

    const handleDeletePhotos = (photoIds: string[]) => {
        const zone = zones.find(z => z.id === selectedZoneId);
        if (!zone) return;
        onUpdateZone({
            ...zone,
            photos: zone.photos.filter(p => !photoIds.includes(p.id))
        });
    };

    const handleSetMainPhoto = (photoId: string) => {
        const zone = zones.find(z => z.id === selectedZoneId);
        if (!zone) return;
        onUpdateZone({
            ...zone,
            photos: zone.photos.map(p => ({
                ...p,
                isMain: p.id === photoId
            }))
        });
    };

    const activeZones = React.useMemo(() => zones.filter(z => !z.isArchived), [zones]);

    const zonesBySite = React.useMemo(() => {
        const grouped: { [siteName: string]: SubstrateZone[] } = {};
        activeZones.forEach(zone => {
            const site = activeSites.find(s => s.id === zone.siteId);
            const siteName = site?.name || 'Unassigned/Other Site';
            if (!grouped[siteName]) grouped[siteName] = [];
            grouped[siteName].push(zone);
        });
        return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
    }, [activeZones, activeSites]);

    const selectedZone = zones.find(z => z.id === selectedZoneId);
    const outplantedItems = activeBranches.filter(b => b.substrateZoneId === selectedZoneId);

    if (viewMode === 'details' && selectedZone) {
        const siteName = activeSites.find(s => s.id === selectedZone.siteId)?.name || 'Unknown';
        const sortedPhotos = [...selectedZone.photos].sort((a,b) => new Date(a.dateTaken || '').getTime() - new Date(b.dateTaken || '').getTime());
        const timeZeroPhoto = sortedPhotos.length > 0 ? sortedPhotos[0] : null;
        const latestPhoto = sortedPhotos.length > 1 ? sortedPhotos[sortedPhotos.length - 1] : sortedPhotos[0];

        return (
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg space-y-8 border border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4">
                    <div>
                        <h2 className="text-2xl font-black text-coral-dark uppercase tracking-tight">{selectedZone.name}</h2>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{siteName} • {selectedZone.depth}m Depth</p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => onArchiveZone(selectedZone.id)} disabled={isReadOnly} className="bg-red-50 text-red-600 font-black py-2 px-4 rounded-xl text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all active:scale-95 disabled:opacity-30 border border-red-200 flex items-center gap-2">
                            <TrashIcon className="w-4 h-4" /> Archive Zone
                        </button>
                        <button onClick={() => { setViewMode('list'); setSelectedZoneId(null); }} className="bg-gray-100 hover:bg-gray-200 text-coral-dark font-black py-2 px-5 rounded-xl transition-all uppercase tracking-widest text-[10px] flex items-center gap-2">
                            <CloseIcon className="w-4 h-4 transform rotate-180" />
                            <span>Back to List</span>
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 border-2 border-gray-50 rounded-3xl bg-gray-50/30">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Time Zero (Baseline)</h3>
                            <span className="text-[10px] font-black text-gray-300 uppercase">{timeZeroPhoto ? new Date(timeZeroPhoto.dateTaken || '').toLocaleDateString() : 'N/A'}</span>
                        </div>
                        {timeZeroPhoto ? <img src={timeZeroPhoto.url} className="w-full h-48 object-cover rounded-2xl shadow-sm border border-gray-100" /> : <div className="w-full h-48 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-300 text-[10px] font-black uppercase border-2 border-dashed border-gray-200">No baseline photo</div>}
                    </div>
                    <div className="p-4 border-2 border-gray-50 rounded-3xl bg-gray-50/30">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Latest Status</h3>
                            <span className="text-[10px] font-black text-gray-300 uppercase">{latestPhoto ? new Date(latestPhoto.dateTaken || '').toLocaleDateString() : 'N/A'}</span>
                        </div>
                        {latestPhoto ? <img src={latestPhoto.url} className="w-full h-48 object-cover rounded-2xl shadow-sm border border-gray-100" /> : <div className="w-full h-48 bg-gray-100 rounded-2xl flex items-center justify-center text-gray-300 text-[10px] font-black uppercase border-2 border-dashed border-gray-200">No photos logged</div>}
                    </div>
                </div>
                <div className="flex justify-end"><button onClick={() => setIsPhotoManagerOpen(true)} className="flex items-center gap-2 bg-coral-blue hover:bg-opacity-90 text-white font-black py-3 px-6 rounded-xl transition-all shadow-md active:scale-95 text-xs uppercase tracking-widest"><CameraIcon className="w-5 h-5"/> Manage Photo Gallery</button></div>
                
                <div className="bg-blue-50/50 p-6 rounded-3xl border-2 border-blue-100">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2">
                        <h3 className="font-black text-blue-900 text-sm uppercase tracking-widest flex items-center gap-2">
                            <GlobeAltIcon className="w-5 h-5"/> Outplanted Item Monitoring
                        </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {outplantedItems.map(item => (
                            <button key={item.id} onClick={() => onSelectBranch(item.id)} className="bg-white p-4 rounded-2xl border-2 border-blue-200 shadow-sm hover:border-blue-400 transition-all text-left flex flex-col gap-1 group">
                                <div className="flex justify-between items-start">
                                    <span className="font-black text-blue-900 truncate w-full uppercase tracking-tighter text-lg">{item.fragmentId}</span>
                                    <span className="text-[9px] bg-blue-100 px-1.5 py-0.5 rounded-lg uppercase font-black text-blue-700 whitespace-nowrap">{item.type === 'RopeUnit' ? 'String' : 'Cluster'}</span>
                                </div>
                                <p className="text-[10px] text-gray-500 italic truncate group-hover:text-blue-700 transition-colors">{item.genus} {item.species}</p>
                            </button>
                        ))}
                        {outplantedItems.length === 0 && <div className="col-span-full py-10 text-center border-2 border-dashed border-blue-200 rounded-3xl text-blue-300 text-xs font-black uppercase tracking-widest">No nursery units outplanted here.</div>}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="bg-white border-2 border-coral-blue rounded-3xl p-6 shadow-sm">
                            <h3 className="text-xs font-black text-coral-dark uppercase tracking-widest border-b border-gray-100 pb-3 mb-6">Zone Health Trend</h3>
                            <HealthChart reports={selectedZone.healthReports} />
                        </div>
                        <form onSubmit={handleAddHealthReport} className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-4">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Log Zone Health</h4>
                            <div className="space-y-4">
                                <div><label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Avg. Health %</label><input type="range" min="0" max="100" step="5" value={healthScore} onChange={e => setHealthScore(parseInt(e.target.value))} className="w-full accent-coral-blue"/><div className="text-right font-black text-coral-blue text-sm">{healthScore}%</div></div>
                                <div><label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Bleaching Level</label><select value={bleaching} onChange={e => setBleaching(e.target.value as BleachingLevel)} className="w-full rounded-xl border-2 border-gray-100 font-bold p-3 bg-white text-gray-900 outline-none focus:border-coral-blue"><option value="None">None</option><option value="Mild">Mild</option><option value="Medium">Medium</option><option value="Strong">Strong</option></select></div>
                                <input type="text" value={reportNotes} onChange={e => setReportNotes(e.target.value)} placeholder="Observations..." className="w-full rounded-xl border-2 border-gray-100 font-bold p-3 bg-white text-gray-900 outline-none focus:border-coral-blue text-sm"/>
                                <button type="submit" disabled={isReadOnly} className="w-full bg-coral-green text-coral-dark font-black py-3 rounded-xl shadow-md hover:brightness-95 uppercase tracking-widest text-xs transition-all active:scale-95 disabled:opacity-30">Add Health Report</button>
                            </div>
                        </form>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-white border-2 border-coral-blue rounded-3xl p-6 shadow-sm">
                            <h3 className="text-xs font-black text-coral-dark uppercase tracking-widest border-b border-gray-100 pb-3 mb-6">Seafloor Accretion</h3>
                            <GrowthChart reports={selectedZone.growthReports} />
                        </div>
                        <form onSubmit={handleAddGrowthReport} className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-4">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Log Substrate Growth</h4>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Area (m²)</label><input type="number" step="0.01" value={growthArea} onChange={e => setGrowthArea(e.target.value)} className="w-full rounded-xl border-2 border-gray-100 font-bold p-3 bg-white text-gray-900 outline-none focus:border-coral-blue"/></div>
                                    <div><label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2 ml-1">Vol (m³)</label><input type="number" step="0.001" value={growthVolume} onChange={e => setGrowthVolume(e.target.value)} className="w-full rounded-xl border-2 border-gray-100 font-bold p-3 bg-white text-gray-900 outline-none focus:border-coral-blue"/></div>
                                </div>
                                <button type="submit" disabled={isReadOnly} className="w-full bg-blue-500 text-white font-black py-3 rounded-xl hover:bg-blue-600 transition-all shadow-md active:scale-95 uppercase tracking-widest text-xs disabled:opacity-30">Add Growth Report</button>
                            </div>
                        </form>
                    </div>
                </div>
                <PhotoManagerModal isOpen={isPhotoManagerOpen} onClose={() => setIsPhotoManagerOpen(false)} r2Settings={r2Settings} photos={selectedZone.photos} onAddPhotos={handlePhotoUpload} onDeletePhotos={handleDeletePhotos} onSetMainPhoto={handleSetMainPhoto} />
            </div>
        );
    }

    return (
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg space-y-8 border border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4">
                <h2 className="text-2xl font-black text-coral-dark uppercase tracking-tight">Substrate Zones</h2>
                <button onClick={onNavigateBack} className="bg-gray-100 hover:bg-gray-300 text-coral-dark font-black py-2 px-4 rounded-xl transition-all self-start sm:self-center mt-2 sm:mt-0 uppercase tracking-widest text-xs flex items-center gap-2">
                    <CloseIcon className="w-4 h-4 transform rotate-180" />
                    <span>Back</span>
                </button>
            </div>
            
            <div>
              {!isAddFormOpen ? (
                <button onClick={() => setIsAddFormOpen(true)} disabled={isReadOnly} className="w-full bg-coral-blue text-white font-black py-4 rounded-2xl shadow-md hover:bg-opacity-90 transition-all uppercase tracking-widest text-sm disabled:opacity-50">+ Add New Zone</button>
              ) : (
                <form onSubmit={handleAddSubmit} className="p-6 border-2 border-coral-blue rounded-3xl space-y-4 bg-white shadow-sm animate-fade-in relative">
                    <button type="button" onClick={() => setIsAddFormOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"><CloseIcon className="w-5 h-5"/></button>
                    <h3 className="font-black text-coral-blue text-xs uppercase tracking-widest ml-1">Add New Substrate Zone</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-2"><label className="block text-[10px] font-black text-gray-500 uppercase ml-1 tracking-widest mb-1">Site</label><select value={selectedSiteId} onChange={e => setSelectedSiteId(e.target.value)} required className="w-full p-3 border-2 border-gray-100 rounded-xl bg-gray-50 font-bold outline-none focus:border-coral-blue"><option value="">-- Choose Site --</option>{activeSites.filter(s=>!s.isArchived).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                        <div><label className="block text-[10px] font-black text-gray-500 uppercase ml-1 tracking-widest mb-1">Depth (m)</label><select value={depth} onChange={e => setDepth(e.target.value)} required className="w-full p-3 border-2 border-gray-100 rounded-xl bg-gray-50 font-bold outline-none focus:border-coral-blue"><option value="">-- Select Depth --</option>{DEPTH_OPTIONS.map(d => <option key={d} value={d}>{d}m</option>)}</select></div>
                        <button type="submit" className="bg-coral-blue text-white font-black py-3 px-4 rounded-xl shadow-md hover:bg-opacity-90 transition-all active:scale-95 text-xs uppercase tracking-widest">Save Zone</button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div><label className="block text-[10px] font-black text-gray-500 uppercase ml-1 tracking-widest mb-1">Lat (Opt)</label><input type="number" step="any" value={latitude} onChange={e => setLatitude(e.target.value)} className="w-full p-3 border-2 border-gray-100 rounded-xl bg-gray-50 font-bold outline-none focus:border-coral-blue"/></div>
                        <div><label className="block text-[10px] font-black text-gray-500 uppercase ml-1 tracking-widest mb-1">Lng (Opt)</label><input type="number" step="any" value={longitude} onChange={e => setLongitude(e.target.value)} className="w-full p-3 border-2 border-gray-100 rounded-xl bg-gray-50 font-bold outline-none focus:border-coral-blue"/></div>
                    </div>
                </form>
              )}
            </div>

            <div className="space-y-6">
                <h3 className="text-lg font-black text-coral-dark uppercase tracking-tight ml-2">Browse Zones</h3>
                <div className="space-y-6">
                    {zonesBySite.map(([siteName, siteZones]) => (
                        <div key={siteName} className="border-2 border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                            <h4 className="font-black text-coral-dark text-xs uppercase tracking-widest bg-gray-50 p-4 border-b border-gray-100 flex items-center gap-2">
                                <span className="w-2 h-2 bg-coral-blue rounded-full"></span>
                                {siteName}
                            </h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6 bg-white">
                                {siteZones.map(zone => (
                                    <div key={zone.id} className="border-2 border-gray-100 rounded-2xl p-5 shadow-sm hover:border-coral-blue hover:shadow-md transition-all cursor-pointer bg-white group" onClick={() => { setSelectedZoneId(zone.id); setViewMode('details'); }}>
                                        <div className="flex justify-between items-start mb-4">
                                            <h5 className="font-black text-coral-dark text-xl uppercase tracking-tighter group-hover:text-coral-blue transition-colors">{zone.name}</h5>
                                            <span className="text-[10px] font-black bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-100 shadow-sm">{zone.depth}m Depth</span>
                                        </div>
                                        <button className="w-full bg-coral-blue/5 text-coral-blue font-black py-2.5 rounded-xl hover:bg-coral-blue hover:text-white transition-all text-[10px] uppercase tracking-widest active:scale-95 shadow-sm border border-coral-blue/10">
                                            View & Monitor
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    {activeZones.length === 0 && (
                        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                            <ChartBarIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                            <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No active substrate zones found.</p>
                        </div>
                    )}
                </div>
            </div>
            {createdItem && <QRCodeLabelModal isOpen={showQR} onClose={() => setShowQR(false)} itemId={createdItem.name} itemName={createdItem.name} itemType="Substrate Zone" />}
        </div>
    );
};

export default SubstrateZonesPage;