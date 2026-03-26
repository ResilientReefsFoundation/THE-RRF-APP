
import * as React from 'react';
import type { FormEvent } from 'react';
import type { Site, Anchor } from '../types';
import { PencilIcon, QrCodeIcon, TrashIcon, CloseIcon } from './Icons';
import QRCodeLabelModal from './QRCodeLabelModal';

interface AnchorsPageProps {
  sites: Site[];
  anchors: Anchor[];
  isReadOnly: boolean;
  onAddAnchor: (name: string, siteId: string, latitude: number | undefined, longitude: number | undefined, isDeepwater: boolean, depth: number | undefined) => string;
  onUpdateAnchor: (anchor: Anchor) => void;
  onArchiveAnchor: (id: string) => void;
  onNavigateBack: () => void;
}

const DEPTH_OPTIONS = Array.from({ length: 50 }, (_, i) => i + 1);

const CustomCheckbox: React.FC<{
    id: string; checked: boolean; onChange: (checked: boolean) => void; label: string;
}> = ({ id, checked, onChange, label }) => (
    <div className="flex items-center gap-2">
        <div className="relative flex items-center">
            <input type="checkbox" id={id} checked={checked} onChange={e => onChange(e.target.checked)} className="peer h-5 w-5 appearance-none rounded border border-gray-300 bg-white checked:bg-coral-blue transition-all"/>
            <svg className="pointer-events-none absolute left-1 top-1 h-3 w-3 text-white opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
        </div>
        <label htmlFor={id} className="font-medium text-gray-700 cursor-pointer select-none">{label}</label>
    </div>
);

const EditAnchorModal: React.FC<{
    anchor: Anchor; onClose: () => void; onUpdateAnchor: (anchor: Anchor) => void;
}> = ({ anchor, onClose, onUpdateAnchor }) => {
    const [name, setName] = React.useState(anchor.name);
    const [latitude, setLatitude] = React.useState(anchor.latitude?.toString() || '');
    const [longitude, setLongitude] = React.useState(anchor.longitude?.toString() || '');
    const [isDeepwater, setIsDeepwater] = React.useState(anchor.isDeepwater || false);
    const [depth, setDepth] = React.useState(anchor.depth?.toString() || '');
    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        onUpdateAnchor({ ...anchor, name, latitude: latitude ? parseFloat(latitude) : undefined, longitude: longitude ? parseFloat(longitude) : undefined, isDeepwater, depth: isDeepwater ? parseFloat(depth) : undefined });
        onClose();
    };
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative">
                <form onSubmit={handleSubmit}>
                    <header className="p-4 border-b flex justify-between items-center"><h2 className="text-xl font-bold text-coral-dark">Edit Anchor</h2><button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800"><CloseIcon className="w-6 h-6"/></button></header>
                    <div className="p-6 space-y-4">
                        <div><label className="block text-sm font-medium text-gray-700">Name/Number</label><input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900"/></div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium text-gray-700">Lat (Opt)</label><input type="number" step="any" value={latitude} onChange={e => setLatitude(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900"/></div>
                            <div><label className="block text-sm font-medium text-gray-700">Lng (Opt)</label><input type="number" step="any" value={longitude} onChange={e => setLongitude(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900"/></div>
                        </div>
                        <div className="flex flex-col gap-2 pt-2"><CustomCheckbox id="editIsDeepwater" checked={isDeepwater} onChange={setIsDeepwater} label="Deepwater Anchor" />{isDeepwater && <div><label className="block text-sm font-medium text-gray-700">Depth (m)</label><select value={depth} onChange={e => setDepth(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900">{DEPTH_OPTIONS.map(d => <option key={d} value={d}>{d}m</option>)}</select></div>}</div>
                    </div>
                    <footer className="p-4 bg-gray-50 rounded-b-2xl flex justify-end gap-2"><button type="button" onClick={onClose} className="bg-gray-200 font-bold py-2 px-4 rounded-lg text-coral-dark">Cancel</button><button type="submit" className="bg-coral-green font-bold py-2 px-4 rounded-lg text-coral-dark">Save</button></footer>
                </form>
            </div>
        </div>
    );
};

const AnchorsPage: React.FC<AnchorsPageProps> = ({ sites: activeSites, anchors, isReadOnly, onAddAnchor, onUpdateAnchor, onArchiveAnchor, onNavigateBack }) => {
    const [isAddFormOpen, setIsAddFormOpen] = React.useState(false);
    const [selectedSiteId, setSelectedSiteId] = React.useState<string>('');
    const [anchorName, setAnchorName] = React.useState('');
    const [latitude, setLatitude] = React.useState('');
    const [longitude, setLongitude] = React.useState('');
    const [isDeepwater, setIsDeepwater] = React.useState(false);
    const [depth, setDepth] = React.useState('');
    const [editingAnchor, setEditingAnchor] = React.useState<Anchor | null>(null);
    const [showQR, setShowQR] = React.useState(false);
    const [createdItem, setCreatedItem] = React.useState<{id: string, name: string} | null>(null);

    const activeAnchors = React.useMemo(() => anchors.filter(a => !a.isArchived), [anchors]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const newId = onAddAnchor(anchorName.trim(), selectedSiteId, latitude ? parseFloat(latitude) : undefined, longitude ? parseFloat(longitude) : undefined, isDeepwater, isDeepwater ? parseFloat(depth) : undefined);
        setCreatedItem({ id: newId, name: anchorName.trim() }); setShowQR(true);
        setSelectedSiteId(''); setAnchorName(''); setLatitude(''); setLongitude(''); setIsDeepwater(false); setDepth('');
        setIsAddFormOpen(false);
    };
    
    const anchorsBySite = React.useMemo(() => {
        const grouped: { [siteName: string]: Anchor[] } = {};
        activeAnchors.forEach(anchor => {
            const site = activeSites.find(s => s.id === anchor.siteId);
            if (site) { if (!grouped[site.name]) grouped[site.name] = []; grouped[site.name].push(anchor); }
        });
        return Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b));
    }, [activeAnchors, activeSites]);

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg space-y-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4">
                <h2 className="text-2xl font-bold text-coral-dark mb-2 sm:mb-0">Manage Anchors</h2>
                <button onClick={onNavigateBack} className="bg-gray-200 hover:bg-gray-300 text-coral-dark font-bold py-2 px-4 rounded-lg transition-colors self-start sm:self-center">&larr; Back</button>
            </div>

            <div>
              {!isAddFormOpen ? (
                <button onClick={() => setIsAddFormOpen(true)} disabled={isReadOnly} className="w-full bg-coral-blue text-white font-bold py-4 rounded-xl shadow-md hover:bg-opacity-90 transition-all uppercase tracking-widest text-sm disabled:opacity-50">+ Add New Anchor</button>
              ) : (
                <form onSubmit={handleSubmit} className="p-4 border-2 border-coral-blue rounded-xl space-y-4 bg-gray-50 animate-fade-in relative">
                    <button type="button" onClick={() => setIsAddFormOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><CloseIcon className="w-5 h-5"/></button>
                    <h3 className="font-semibold text-coral-blue text-lg">Add New Anchor</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-medium text-gray-700">Site</label><select value={selectedSiteId} onChange={e => setSelectedSiteId(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900"><option value="">-- Choose site --</option>{activeSites.filter(s=>!s.isArchived).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                        <div><label className="block text-sm font-medium text-gray-700">Name/Number</label><input type="text" value={anchorName} onChange={e => setAnchorName(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900"/></div>
                        <div><label className="block text-sm font-medium text-gray-700">Lat (Opt)</label><input type="number" step="any" value={latitude} onChange={e => setLatitude(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900"/></div>
                        <div><label className="block text-sm font-medium text-gray-700">Lng (Opt)</label><input type="number" step="any" value={longitude} onChange={e => setLongitude(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900"/></div>
                        <div className="md:col-span-2 flex flex-col sm:flex-row sm:items-center gap-4 pt-2"><CustomCheckbox id="isDeepwater" checked={isDeepwater} onChange={setIsDeepwater} label="Deepwater Anchor" />{isDeepwater && <div className="flex-grow"><label className="block text-sm font-medium text-gray-700">Depth (m)</label><select value={depth} onChange={e => setDepth(e.target.value)} required={isDeepwater} className="block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900"><option value="">-- Select --</option>{DEPTH_OPTIONS.map(d => <option key={d} value={d}>{d}m</option>)}</select></div>}</div>
                    </div>
                    <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setIsAddFormOpen(false)} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg">Cancel</button><button type="submit" className="bg-coral-blue text-white font-bold py-2 px-4 rounded-lg">Save Anchor</button></div>
                </form>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-gray-700 text-lg mb-4">Existing Anchors</h3>
              <div className="space-y-4">
                {anchorsBySite.map(([siteName, siteAnchors]) => (
                    <div key={siteName} className="p-4 border-2 border-coral-blue rounded-lg bg-gray-50">
                        <h4 className="font-semibold text-coral-dark text-lg mb-4">{siteName}</h4>
                        <div className="bg-white rounded-md shadow-sm border border-gray-200 overflow-hidden">
                            <ul className="divide-y divide-gray-200">
                                {siteAnchors.map(anchor => (
                                    <li key={anchor.id} className="p-3 flex justify-between items-center flex-wrap gap-2">
                                        <div>
                                            <p className="font-semibold text-coral-dark">{anchor.name}</p>
                                            {anchor.isDeepwater && <p className="text-sm text-gray-500">Deepwater | {anchor.depth}m</p>}
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setCreatedItem({id: anchor.name, name: anchor.name}); setShowQR(true); }} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600" title="Label">
                                                <QrCodeIcon className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => setEditingAnchor(anchor)} disabled={isReadOnly} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 disabled:opacity-30" title="Edit">
                                                <PencilIcon className="w-5 h-5" />
                                            </button>
                                            <button onClick={() => { if(!isReadOnly && confirm(`ARCHIVE ANCHOR: ${anchor.name}?\nMooring points should only be archived if removed from sea floor.`)) onArchiveAnchor(anchor.id); }} disabled={isReadOnly} className="p-2 rounded-lg hover:bg-red-50 text-red-400 disabled:opacity-30" title="Archive & Remove">
                                                <TrashIcon className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
              </div>
            </div>
            {editingAnchor && <EditAnchorModal anchor={editingAnchor} onClose={() => setEditingAnchor(null)} onUpdateAnchor={onUpdateAnchor} />}
            {createdItem && <QRCodeLabelModal isOpen={showQR} onClose={() => setShowQR(false)} itemId={createdItem.name} itemName={createdItem.name} itemType="Anchor" />}
        </div>
    );
};

export default AnchorsPage;
