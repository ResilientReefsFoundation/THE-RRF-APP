
import * as React from 'react';
import type { MerchandiseItem, MerchandiseLog } from '../types';
import { ShoppingBagIcon, TrashIcon, PencilIcon, ChevronLeftIcon, ChevronRightIcon, ArrowPathIcon, CheckCircleIcon, CloseIcon, CameraIcon, UploadIcon } from './Icons';

interface MerchandisePageProps {
  merchandise: MerchandiseItem[];
  logs: MerchandiseLog[];
  onAddMerchandise: (item: MerchandiseItem) => void;
  onUpdateMerchandise: (item: MerchandiseItem) => void;
  onDeleteMerchandise: (id: string) => void;
  onAddLog: (log: MerchandiseLog) => void;
  onNavigateBack: () => void;
}

const CATEGORIES = ['Shirt', 'Hat', 'Bottle', 'Bag', 'Other'];
const SIZES = ['N/A', 'XS', 'S', 'M', 'L', 'XL', 'XXL'];

const MerchandiseItemModal: React.FC<{ 
    item?: MerchandiseItem; 
    onClose: () => void; 
    onSave: (item: MerchandiseItem) => void 
}> = ({ item, onClose, onSave }) => {
    const [photoUrl, setPhotoUrl] = React.useState<string | undefined>(item?.photoUrl);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            setPhotoUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        const newItem: MerchandiseItem = {
            id: item?.id || Math.random().toString(36).substring(2, 9),
            name: fd.get('name') as string,
            category: fd.get('category') as string,
            size: fd.get('size') as string,
            stock: parseInt(fd.get('stock') as string) || 0,
            description: fd.get('description') as string || undefined,
            photoUrl
        };
        onSave(newItem);
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold">{item ? 'Edit Item' : 'Add New Merchandise'}</h3>
                    <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                        <CloseIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="flex flex-col items-center gap-2 mb-4">
                        <div className="relative group w-32 h-32">
                            {photoUrl ? (
                                <img src={photoUrl} alt="Item" className="w-full h-full rounded-xl object-cover border-2 border-gray-100 shadow-sm" />
                            ) : (
                                <div className="w-full h-full rounded-xl bg-gray-100 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300">
                                    <CameraIcon className="w-8 h-8" />
                                    <span className="text-[10px] font-bold">No Image</span>
                                </div>
                            )}
                            <label className="absolute bottom-1 right-1 p-1.5 bg-coral-blue text-white rounded-lg cursor-pointer shadow-lg hover:scale-105 transition-transform">
                                <UploadIcon className="w-4 h-4" />
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                        </div>
                    </div>

                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Item Name</label><input name="name" defaultValue={item?.name} required className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900" placeholder="e.g. Nursery T-Shirt" /></div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Category</label>
                            <select name="category" defaultValue={item?.category} className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900">
                                {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Size</label>
                            <select name="size" defaultValue={item?.size} className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900">
                                {SIZES.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description / Info</label>
                        <textarea name="description" defaultValue={item?.description} className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900 h-20 resize-none" placeholder="Details about the item..." />
                    </div>
                    <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quantity in Stock</label><input name="stock" type="number" defaultValue={item?.stock || 0} className="w-full p-2 border border-gray-300 rounded bg-white text-gray-900" /></div>
                    
                    <div className="flex gap-2 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 bg-gray-100 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                        <button type="submit" className="flex-1 bg-coral-blue text-white font-bold py-3 rounded-xl hover:bg-opacity-90 transition-opacity shadow-md">Save Item</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const MerchandisePage: React.FC<MerchandisePageProps> = ({ 
    merchandise, logs, onAddMerchandise, onUpdateMerchandise, onDeleteMerchandise, onAddLog, onNavigateBack 
}) => {
    const [activeTab, setActiveTab] = React.useState<'inventory' | 'history'>('inventory');
    const [showAddModal, setShowAddModal] = React.useState(false);
    const [editingItem, setEditingItem] = React.useState<MerchandiseItem | null>(null);
    const [transactionItem, setTransactionItem] = React.useState<{ item: MerchandiseItem; type: 'restock' | 'giveaway' } | null>(null);
    const [searchQuery, setSearchQuery] = React.useState('');

    const filteredMerchandise = React.useMemo(() => {
        const query = searchQuery.toLowerCase().trim();
        if (!query) return merchandise;
        return merchandise.filter(item => 
            item.name.toLowerCase().includes(query) || 
            item.category.toLowerCase().includes(query) ||
            item.size?.toLowerCase().includes(query) ||
            item.description?.toLowerCase().includes(query)
        );
    }, [merchandise, searchQuery]);

    const handleLogSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!transactionItem) return;
        const fd = new FormData(e.currentTarget);
        const qty = parseInt(fd.get('qty') as string);
        if (isNaN(qty) || qty <= 0) return;

        const log: MerchandiseLog = {
            id: Math.random().toString(36).substring(2, 9),
            itemId: transactionItem.item.id,
            quantity: qty,
            type: transactionItem.type,
            date: new Date().toISOString(),
            recipient: fd.get('recipient') as string || undefined,
            notes: fd.get('notes') as string || undefined
        };
        onAddLog(log);
        setTransactionItem(null);
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg space-y-6 border-2 border-coral-blue min-h-[70vh]">
            <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-2xl font-bold text-coral-dark flex items-center gap-2">
                    <ShoppingBagIcon className="w-7 h-7 text-coral-blue" />
                    Merchandise Management
                </h2>
                <button onClick={onNavigateBack} className="bg-gray-100 hover:bg-gray-200 text-coral-dark font-bold py-2 px-4 rounded-lg transition-colors border border-gray-200">
                    &larr; Facility
                </button>
            </div>

            <div className="flex border-b">
                <button onClick={() => setActiveTab('inventory')} className={`flex-1 py-3 font-bold transition-all border-b-2 ${activeTab === 'inventory' ? 'text-coral-blue border-coral-blue' : 'text-gray-400 border-transparent'}`}>Stock Inventory</button>
                <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 font-bold transition-all border-b-2 ${activeTab === 'history' ? 'text-coral-blue border-coral-blue' : 'text-gray-400 border-transparent'}`}>Activity Log</button>
            </div>

            {activeTab === 'inventory' && (
                <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="relative flex-grow max-w-md">
                            <input 
                                type="text" 
                                placeholder="Search merchandise by name, size or info..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-blue outline-none bg-white text-gray-900 shadow-sm"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <ShoppingBagIcon className="w-5 h-5" />
                            </div>
                        </div>
                        <button onClick={() => setShowAddModal(true)} className="bg-coral-blue text-white font-bold px-6 py-2 rounded-lg shadow-md hover:bg-opacity-90 transition-all flex items-center justify-center gap-2">
                            <span>+ New Item</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredMerchandise.map(item => (
                            <div key={item.id} className="p-5 border-2 border-gray-100 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all flex flex-col relative group">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="w-24 h-24 bg-coral-blue/5 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100 shadow-inner">
                                        {item.photoUrl ? (
                                            <img src={item.photoUrl} alt={item.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-coral-blue/20">
                                                <ShoppingBagIcon className="w-12 h-12" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-black uppercase text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full mb-1">{item.category}</span>
                                        {item.size && item.size !== 'N/A' && <span className="text-xs font-black text-coral-blue bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">Size: {item.size}</span>}
                                        
                                        <div className="flex gap-1 mt-4">
                                            <button onClick={() => setEditingItem(item)} className="p-2 bg-gray-50 text-gray-500 hover:text-coral-blue hover:bg-blue-50 rounded-lg transition-all border border-gray-100" title="Edit Item Info"><PencilIcon className="w-4 h-4"/></button>
                                            <button onClick={() => { if(confirm('Delete this item and its history forever?')) onDeleteMerchandise(item.id); }} className="p-2 bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all border border-gray-100" title="Delete Item"><TrashIcon className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                </div>
                                
                                <h3 className="font-bold text-gray-800 text-lg mb-1 truncate" title={item.name}>{item.name}</h3>
                                {item.description && (
                                    <p className="text-xs text-gray-500 line-clamp-2 italic mb-4 min-h-[2rem] leading-relaxed">
                                        {item.description}
                                    </p>
                                )}
                                
                                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-xl mb-4 border border-gray-200">
                                    <span className="text-xs font-black text-gray-400 uppercase">Quantity</span>
                                    <span className={`text-2xl font-black ${item.stock < 5 ? 'text-red-500' : 'text-coral-dark'}`}>
                                        {item.stock}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mt-auto">
                                    <button 
                                        onClick={() => setTransactionItem({ item, type: 'giveaway' })}
                                        disabled={item.stock <= 0}
                                        className="bg-coral-green text-coral-dark font-black py-2.5 rounded-xl text-sm shadow-sm hover:brightness-95 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                                    >
                                        Give Away
                                    </button>
                                    <button 
                                        onClick={() => setTransactionItem({ item, type: 'restock' })}
                                        className="bg-white border-2 border-coral-blue text-coral-blue font-black py-2.5 rounded-xl text-sm hover:bg-blue-50 active:scale-95 transition-all shadow-sm"
                                    >
                                        Restock
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    {filteredMerchandise.length === 0 && (
                        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                            <ShoppingBagIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500 font-medium">{searchQuery ? `No items found matching "${searchQuery}"` : 'Your merchandise inventory is empty.'}</p>
                            {searchQuery && <button onClick={() => setSearchQuery('')} className="mt-2 text-coral-blue font-bold hover:underline">Clear search</button>}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'history' && (
                <div className="space-y-4">
                    <div className="overflow-x-auto border-2 border-gray-100 rounded-2xl shadow-sm">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-500 tracking-wider">
                                <tr>
                                    <th className="px-6 py-4 text-left">Date</th>
                                    <th className="px-6 py-4 text-left">Item Details</th>
                                    <th className="px-6 py-4 text-left">Action</th>
                                    <th className="px-6 py-4 text-left">Qty</th>
                                    <th className="px-6 py-4 text-left">Tracking Info</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {logs.map(log => {
                                    const item = merchandise.find(i => i.id === log.itemId);
                                    return (
                                        <tr key={log.id} className="text-sm hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-gray-500 font-medium">
                                                {new Date(log.date).toLocaleDateString()}
                                                <span className="block text-[10px] text-gray-300">{new Date(log.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded border border-gray-100 overflow-hidden flex-shrink-0">
                                                        {item?.photoUrl ? <img src={item.photoUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-200"><ShoppingBagIcon className="w-5 h-5"/></div>}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-800">{item?.name || 'Deleted Item'}</p>
                                                        {item?.size && item.size !== 'N/A' && <p className="text-[10px] font-bold text-coral-blue uppercase">Size: {item.size}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase border shadow-sm ${log.type === 'restock' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                                    {log.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`text-base font-black ${log.type === 'giveaway' ? 'text-orange-600' : 'text-green-600'}`}>
                                                    {log.type === 'giveaway' ? '-' : '+'}{log.quantity}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {log.recipient && <div className="flex items-center gap-1 mb-0.5"><span className="text-[10px] font-black text-gray-400 uppercase">To:</span> <span className="font-bold text-gray-700">{log.recipient}</span></div>}
                                                <div className="text-xs text-gray-500 italic max-w-xs">{log.notes || 'No extra notes recorded.'}</div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {logs.length === 0 && <p className="text-center text-gray-400 py-20 italic bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">No activity logged yet.</p>}
                </div>
            )}

            {/* Modals */}
            {showAddModal && (
                <MerchandiseItemModal 
                    onClose={() => setShowAddModal(false)}
                    onSave={(newItem) => {
                        onAddMerchandise(newItem);
                        setShowAddModal(false);
                    }}
                />
            )}

            {editingItem && (
                <MerchandiseItemModal 
                    item={editingItem}
                    onClose={() => setEditingItem(null)}
                    onSave={(updated) => {
                        onUpdateMerchandise(updated);
                        setEditingItem(null);
                    }}
                />
            )}

            {transactionItem && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-1">
                            <h3 className="text-xl font-bold">{transactionItem.type === 'giveaway' ? 'Log Giveaway' : 'Log Restock'}</h3>
                            <button onClick={() => setTransactionItem(null)} className="text-gray-400 hover:text-gray-600 p-2"><CloseIcon className="w-5 h-5"/></button>
                        </div>
                        <div className="flex items-center gap-3 mb-6 p-2 bg-gray-50 rounded-lg border border-gray-100">
                            <div className="w-10 h-10 rounded border border-gray-200 overflow-hidden flex-shrink-0">
                                {transactionItem.item.photoUrl ? <img src={transactionItem.item.photoUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-white flex items-center justify-center text-gray-300"><ShoppingBagIcon className="w-5 h-5"/></div>}
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-gray-800 text-sm truncate">{transactionItem.item.name}</p>
                                <p className="text-[10px] text-gray-500 uppercase font-black">{transactionItem.item.size !== 'N/A' ? `Size: ${transactionItem.item.size}` : transactionItem.item.category}</p>
                            </div>
                        </div>
                        <form onSubmit={handleLogSubmit} className="space-y-4">
                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Quantity</label><input name="qty" type="number" required min="1" max={transactionItem.type === 'giveaway' ? transactionItem.item.stock : 999} defaultValue="1" className="w-full p-3 border border-gray-300 rounded-xl bg-white text-gray-900 font-bold focus:ring-2 focus:ring-coral-blue outline-none shadow-inner" /></div>
                            {transactionItem.type === 'giveaway' && (
                                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Recipient Name</label><input name="recipient" className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-coral-blue outline-none" placeholder="e.g. Jane Doe" /></div>
                            )}
                            <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Transaction Notes</label><input name="notes" className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-coral-blue outline-none" placeholder="Reason or extra details..." /></div>
                            <div className="flex gap-2 pt-4">
                                <button type="button" onClick={() => setTransactionItem(null)} className="flex-1 bg-gray-100 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors">Cancel</button>
                                <button type="submit" className="flex-1 bg-coral-blue text-white font-bold py-3 rounded-xl hover:bg-opacity-90 transition-opacity shadow-md">Confirm</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MerchandisePage;
