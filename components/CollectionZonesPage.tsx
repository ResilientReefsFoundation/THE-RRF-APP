import * as React from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import type { Site, CollectionZone } from '../types';
import { PencilIcon, CloseIcon, GlobeAltIcon, TrashIcon } from './Icons';
import QRCodeLabelModal from './QRCodeLabelModal';

interface CollectionZonesPageProps {
  sites: Site[];
  zones: CollectionZone[];
  isReadOnly: boolean;
  onAddZone: (name: string, siteId: string, latitude?: number, longitude?: number) => string;
  onUpdateZone: (zone: CollectionZone) => void;
  onArchiveZone: (id: string) => void;
  onNavigateBack: () => void;
}

const EditZoneModal: React.FC<{
    zone: CollectionZone; onClose: () => void; onUpdateZone: (zone: CollectionZone) => void;
}> = ({ zone, onClose, onUpdateZone }) => {
    const [name, setName] = React.useState(zone.name);
    const [latitude, setLatitude] = React.useState(zone.latitude?.toString() || '');
    const [longitude, setLongitude] = React.useState(zone.longitude?.toString() || '');
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onUpdateZone({ ...zone, name, latitude: latitude ? parseFloat(latitude) : undefined, longitude: longitude ? parseFloat(longitude) : undefined });
        onClose();
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative">
                <form onSubmit={handleSubmit}>
                    <header className="p-4 border-b flex justify-between items-center"><h2 className="text-xl font-bold text-coral-dark">Edit Zone</h2><button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800"><CloseIcon className="w-6 h-6"/></button></header>
                    <div className="p-6 space-y-4">
                        <div><label className="block text-sm font-medium text-gray-700">Zone Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900"/></div>
                        <div><label className="block text-sm font-medium text-gray-700">Lat (Opt)</label><input type="number" step="any" value={latitude} onChange={e => setLatitude(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900"/></div>
                        <div><label className="block text-sm font-medium text-gray-700">Lng (Opt)</label><input type="number" step="any" value={longitude} onChange={e => setLongitude(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900"/></div>
                    </div>
                    <footer className="p-4 bg-gray-50 rounded-b-2xl flex justify-end gap-2"><button type="button" onClick={onClose} className="bg-gray-200 font-bold py-2 px-4 rounded-lg text-coral-dark">Cancel</button><button type="submit" className="bg-coral-green font-bold py-2 px-4 rounded-lg text-coral-dark">Save</button></footer>
                </form>
            </div>
        </div>
    );
};

const CollectionZonesPage: React.FC<CollectionZonesPageProps> = ({ sites: activeSites, zones, isReadOnly, onAddZone, onUpdateZone, onArchiveZone, onNavigateBack }) => {
    const [isAddFormOpen, setIsAddFormOpen] = React.useState(false);
    const [selectedSiteId, setSelectedSiteId] = React.useState<string>('');
    const [zoneName, setZoneName] = React.useState('');
    const [latitude, setLatitude] = React.useState('');
    const [longitude, setLongitude] = React.useState('');
    const [editingZone, setEditingZone] = React.useState<CollectionZone | null>(null);
    const [showQR, setShowQR] = React.useState(false);
    const [createdItem, setCreatedItem] = React.useState<{id: string, name: string} | null>(null);

    const activeZones = React.useMemo(() => zones.filter(z => !z.isArchived), [zones]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const newId = onAddZone(zoneName.trim(), selectedSiteId, latitude ? parseFloat(latitude) : undefined, longitude ? parseFloat(longitude) : undefined);
        setCreatedItem({ id: newId, name: zoneName.trim() }); setShowQR(true);
        setSelectedSiteId(''); setZoneName(''); setLatitude(''); setLongitude('');
        setIsAddFormOpen(false);
    };
    
    const handleShowOnMap = (lat?: number, lon?: number) => {
        if (lat !== undefined && lon !== undefined) window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`, '_blank');
        else alert('GPS not available.');
    };
    
    const zonesBySite = React.useMemo(() => {
        const grouped: { [siteName: string]: CollectionZone[] } = {};
        activeZones.forEach(zone => {
            const site = activeSites.find(s => s.id === zone.siteId);
            const siteName = site?.name || 'Unassigned/Other Site';
            if (!grouped[siteName]) grouped[siteName] = [];
            grouped[siteName].push(zone);
        });
        return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
    }, [activeZones, activeSites]);

    return (
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg space-y-8 border border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4">
                <h2 className="text-2xl font-black text-coral-dark uppercase tracking-tight">Manage Collection Zones</h2>
                <button onClick={onNavigateBack} className="bg-gray-100 hover:bg-gray-300 text-coral-dark font-black py-2 px-4 rounded-xl transition-all self-start sm:self-center mt-2 sm:mt-0 uppercase tracking-widest text-xs flex items-center gap-2">
                    <CloseIcon className="w-4 h-4 transform rotate-180" />
                    <span>Back</span>
                </button>
            </div>

            <div>
              {!isAddFormOpen ? (
                <button onClick={() => setIsAddFormOpen(true)} disabled={isReadOnly} className="w-full bg-coral-blue text-white font-black py-4 rounded-2xl shadow-md hover:bg-opacity-90 transition-all uppercase tracking-widest text-sm disabled:opacity-50">+ Add New Zone</button>
              ) : (
                <form onSubmit={handleSubmit} className="p-6 border-2 border-coral-blue rounded-3xl space-y-4 bg-white animate-fade-in relative shadow-sm">
                    <button type="button" onClick={() => setIsAddFormOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"><CloseIcon className="w-5 h-5"/></button>
                    <h3 className="font-black text-coral-blue text-xs uppercase tracking-widest ml-1">Add New Collection Zone</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-[10px] font-black text-gray-500 uppercase ml-1 tracking-widest mb-1">Site</label><select value={selectedSiteId} onChange={e => setSelectedSiteId(e.target.value)} required className="w-full p-3 border-2 border-gray-100 rounded-xl bg-gray-50 font-bold outline-none focus:border-coral-blue"><option value="">-- Choose site --</option>{activeSites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                        <div><label className="block text-[10px] font-black text-gray-500 uppercase ml-1 tracking-widest mb-1">Zone Name/Number</label><input type="text" value={zoneName} onChange={e => setZoneName(e.target.value)} required className="w-full p-3 border-2 border-gray-100 rounded-xl bg-gray-50 font-bold outline-none focus:border-coral-blue"/></div>
                        <div><label className="block text-[10px] font-black text-gray-500 uppercase ml-1 tracking-widest mb-1">Latitude (Opt)</label><input type="number" step="any" value={latitude} onChange={e => setLatitude(e.target.value)} className="w-full p-3 border-2 border-gray-100 rounded-xl bg-gray-50 font-bold outline-none focus:border-coral-blue"/></div>
                        <div><label className="block text-[10px] font-black text-gray-500 uppercase ml-1 tracking-widest mb-1">Longitude (Opt)</label><input type="number" step="any" value={longitude} onChange={e => setLongitude(e.target.value)} className="w-full p-3 border-2 border-gray-100 rounded-xl bg-gray-50 font-bold outline-none focus:border-coral-blue"/></div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setIsAddFormOpen(false)} className="bg-gray-100 text-gray-500 font-black py-3 px-6 rounded-xl uppercase tracking-widest text-xs transition-all hover:bg-gray-200">Cancel</button><button type="submit" className="bg-coral-blue text-white font-black py-3 px-8 rounded-xl uppercase tracking-widest text-xs transition-all hover:bg-opacity-90 shadow-md">Save Zone</button></div>
                </form>
              )}
            </div>

            <div className="space-y-6">
              <h3 className="text-lg font-black text-coral-dark uppercase tracking-tight ml-2">Existing Collection Zones</h3>
              <div className="space-y-6">
                {zonesBySite.map(([siteName, siteZones]) => (
                    <div key={siteName} className="border-2 border-gray-100 rounded-3xl overflow-hidden shadow-sm">
                        <h4 className="font-black text-coral-dark text-xs uppercase tracking-widest bg-gray-50 p-4 border-b border-gray-100 flex items-center gap-2">
                            <span className="w-2 h-2 bg-coral-blue rounded-full"></span>
                            {siteName}
                        </h4>
                        <div className="bg-white">
                            <ul className="divide-y divide-gray-100">
                                {siteZones.map(zone => (
                                    <li key={zone.id} className="p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-gray-50 transition-colors group">
                                        <div>
                                            <p className="font-black text-coral-dark text-lg uppercase tracking-tight">{zone.name}</p>
                                            <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest font-mono">
                                                {zone.latitude?.toFixed(4) || 'N/A'}, {zone.longitude?.toFixed(4) || 'N/A'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 self-end sm:self-center">
                                            <button onClick={() => setEditingZone(zone)} disabled={isReadOnly} className="p-2.5 rounded-xl hover:bg-blue-50 text-blue-600 transition-all border border-transparent hover:border-blue-100 disabled:opacity-30" title="Edit">
                                                <PencilIcon className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => onArchiveZone(zone.id)} disabled={isReadOnly} className="p-2.5 rounded-xl hover:bg-red-50 text-red-400 transition-all border border-transparent hover:border-red-100 disabled:opacity-30" title="Archive & Remove">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => handleShowOnMap(zone.latitude, zone.longitude)} disabled={zone.latitude === undefined} className="bg-coral-green hover:brightness-95 text-coral-dark font-black py-2 px-4 rounded-xl text-[10px] uppercase tracking-widest disabled:opacity-30 flex items-center gap-2 shadow-sm transition-all active:scale-95">
                                                <GlobeAltIcon className="w-4 h-4" />
                                                Show on Map
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
                {(!activeZones || activeZones.length === 0) && (
                    <div className="text-center py-16 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                        <GlobeAltIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No active collection zones found.</p>
                    </div>
                )}
              </div>
            </div>
            {editingZone && <EditZoneModal zone={editingZone} onClose={() => setEditingZone(null)} onUpdateZone={onUpdateZone}/>}
            {createdItem && <QRCodeLabelModal isOpen={showQR} onClose={() => setShowQR(false)} itemId={createdItem.id} itemName={createdItem.name} itemType="Collection Zone" />}
        </div>
    );
};

export default CollectionZonesPage;