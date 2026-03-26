
import * as React from 'react';
import type { GearItem, GearStatus } from '../types';
import { BriefcaseIcon, CheckCircleIcon, CogIcon, ArchiveBoxIcon, ClipboardListIcon, TrashIcon, WrenchIcon, DatabaseIcon, CloseIcon, PencilIcon } from './Icons';

interface DiveGearPageProps {
  onNavigateBack: () => void;
  gearItems: GearItem[];
  onUpdateGear: (g: GearItem) => void;
  onAddGear: (g: GearItem) => void;
  onDeleteGear: (id: string) => void;
}

const GearManagementModal: React.FC<{ 
    item?: GearItem; 
    onClose: () => void; 
    onSave: (item: GearItem) => void 
}> = ({ item, onClose, onSave }) => {
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const newItem: GearItem = {
            id: item?.id || Math.random().toString(36).substring(2, 9),
            name: fd.get('name') as string,
            qrCode: fd.get('qr') as string,
            type: fd.get('type') as any,
            lastServiceDate: fd.get('service') as string,
            serviceIntervalMonths: parseInt(fd.get('interval') as string) || 12,
            status: item?.status || 'Available',
            maintenanceLogs: item?.maintenanceLogs || []
        };
        onSave(newItem);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-coral-dark">{item ? 'Edit Equipment' : 'Add New Equipment'}</h3>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                        <CloseIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Item Name/Identifier</label>
                        <input name="name" defaultValue={item?.name} required className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 shadow-sm focus:ring-2 focus:ring-coral-blue outline-none" placeholder="e.g. Regulator Set #14" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">QR Code / Serial Number</label>
                        <input name="qr" defaultValue={item?.qrCode} required className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 shadow-sm focus:ring-2 focus:ring-coral-blue outline-none" placeholder="unique-qr-string" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Equipment Type</label>
                        <select name="type" defaultValue={item?.type} className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 shadow-sm focus:ring-2 focus:ring-coral-blue outline-none">
                            <option>Regulator</option>
                            <option>BCD</option>
                            <option>Computer</option>
                            <option>Tank</option>
                            <option>Other</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Last Service</label>
                            <input name="service" type="date" defaultValue={item?.lastServiceDate} className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 shadow-sm focus:ring-2 focus:ring-coral-blue outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Interval (Months)</label>
                            <input name="interval" type="number" defaultValue={item?.serviceIntervalMonths || 12} className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 shadow-sm focus:ring-2 focus:ring-coral-blue outline-none" />
                        </div>
                    </div>
                    <div className="flex gap-2 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 py-3 bg-gray-100 text-coral-dark font-bold rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                        <button type="submit" className="flex-1 py-3 bg-coral-blue text-white font-bold rounded-xl shadow-lg hover:bg-opacity-90 transition-opacity">
                            {item ? 'Update Gear' : 'Register Gear'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const DiveGearPage: React.FC<DiveGearPageProps> = ({ onNavigateBack, gearItems, onUpdateGear, onAddGear, onDeleteGear }) => {
    const [showAddForm, setShowAddForm] = React.useState(false);
    const [editingGear, setEditingGear] = React.useState<GearItem | null>(null);

    const getStatusColor = (status: GearStatus) => {
        switch(status) {
            case 'Available': return 'bg-green-100 text-green-700 border-green-200';
            case 'In Use': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Service Due': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'Faulty': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg space-y-8 border-2 border-coral-blue">
            <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-2xl font-bold text-coral-dark flex items-center gap-2">
                    <BriefcaseIcon className="w-6 h-6 text-coral-blue" />
                    Dive Gear Inventory
                </h2>
                <button onClick={onNavigateBack} className="bg-gray-100 hover:bg-gray-200 text-coral-dark font-bold py-2 px-4 rounded-lg">
                    &larr; Back
                </button>
            </div>

            <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-100">
                <div>
                    <p className="text-sm text-blue-800 font-medium">Life Support Inventory & Service Tracking</p>
                    <p className="text-xs text-blue-700">Scan QR codes to update status or report faults.</p>
                </div>
                <button onClick={() => setShowAddForm(true)} className="bg-coral-blue text-white font-bold px-4 py-2 rounded-lg text-sm shadow-md active:scale-95 transition-transform">+ Add Equipment</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {gearItems.map(item => (
                    <div key={item.id} className="bg-white border-2 border-gray-100 rounded-2xl p-5 shadow-sm hover:border-coral-blue transition-all relative flex flex-col">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-gray-50 rounded-xl">
                                {item.type === 'Regulator' && <CogIcon className="w-6 h-6 text-gray-500" />}
                                {item.type === 'BCD' && <BriefcaseIcon className="w-6 h-6 text-gray-500" />}
                                {item.type === 'Computer' && <ArchiveBoxIcon className="w-6 h-6 text-gray-500" />}
                                {item.type === 'Tank' && <DatabaseIcon className="w-6 h-6 text-gray-500" />}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full border ${getStatusColor(item.status)}`}>
                                    {item.status}
                                </span>
                                <div className="flex gap-1">
                                    <button 
                                        onClick={() => setEditingGear(item)}
                                        className="p-1.5 bg-gray-50 text-gray-400 hover:text-coral-blue hover:bg-blue-50 rounded-lg transition-all border border-gray-100"
                                        title="Edit Item"
                                    >
                                        <PencilIcon className="w-4 h-4" />
                                    </button>
                                    <button 
                                        onClick={() => { if(confirm(`⚠️ DELETE GEAR: ${item.name}?\nThis record will be permanently removed.`)) onDeleteGear(item.id); }}
                                        className="p-1.5 bg-gray-50 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all border border-gray-100"
                                        title="Delete Item"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg">{item.name}</h3>
                        <p className="text-xs text-gray-500 font-mono mb-4">SN: {item.qrCode}</p>
                        
                        <div className="mt-auto space-y-2">
                            <div className="flex justify-between text-xs py-2 border-t border-gray-100">
                                <span className="text-gray-500">Last Service</span>
                                <span className="font-bold">{item.lastServiceDate || 'Unknown'}</span>
                            </div>
                            <div className="flex justify-between text-xs py-2 border-t border-gray-100">
                                <span className="text-gray-500">Service Every</span>
                                <span className="font-bold">{item.serviceIntervalMonths} Mo</span>
                            </div>
                        </div>

                        <div className="mt-4 flex gap-2 pt-4 border-t border-gray-100">
                            <button 
                                onClick={() => {
                                    const fault = prompt("Describe the fault or repair needed:");
                                    if (fault) onUpdateGear({ ...item, status: 'Faulty', maintenanceLogs: [...item.maintenanceLogs, { id: Math.random().toString(), date: new Date().toISOString(), type: 'Fault Report', description: fault }] });
                                }}
                                className="flex-1 text-[10px] font-bold py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 uppercase tracking-widest border border-red-100 shadow-sm"
                            >
                                Report Fault
                            </button>
                            <button 
                                onClick={() => onUpdateGear({ ...item, lastServiceDate: new Date().toISOString().split('T')[0], status: 'Available' })}
                                className="flex-1 text-[10px] font-bold py-2.5 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 uppercase tracking-widest border border-green-100 shadow-sm"
                            >
                                Log Service
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Reusable Modal for Add/Edit */}
            {(showAddForm || editingGear) && (
                <GearManagementModal 
                    item={editingGear || undefined}
                    onClose={() => { setShowAddForm(false); setEditingGear(null); }}
                    onSave={(newItem) => {
                        if (editingGear) onUpdateGear(newItem);
                        else onAddGear(newItem);
                    }}
                />
            )}
        </div>
    );
};

export default DiveGearPage;
