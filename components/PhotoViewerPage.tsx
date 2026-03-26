import * as React from 'react';
import type { Photo, R2Settings, CoralBranch, Tree, SubstrateZone, RubbleAnchor, Page } from '../types';
import { 
    CloseIcon, CameraIcon, UploadIcon, ArrowPathIcon, TrashIcon, 
    ChevronLeftIcon, ChevronDownIcon, CheckCircleIcon, StarIcon,
    DatabaseIcon, ChevronRightIcon, PlusCircleIcon
} from './Icons';
import { resolveMediaUrl } from './SpeciesIdPage';

interface PhotoViewerPageProps {
    branches: CoralBranch[];
    trees: Tree[];
    substrateZones: SubstrateZone[];
    rubbleAnchors: RubbleAnchor[];
    r2Settings: R2Settings | null;
    onUpdatePhotos: (parentId: string, action: 'add' | 'delete' | 'main', payload: any) => Promise<void>;
    uploadMedia: (file: File | Blob, folder: string) => Promise<string>;
    onNavigateBack: () => void;
    onNavigateToPage: (page: Page, id?: string) => void;
    initialSelectedId?: string;
}

/**
 * HIGH-DEFINITION ACROPORA REFERENCE (V15.6.7)
 */
const DEFINITIVE_ACROPORA_PHOTO: Photo = {
    id: 'manual-verified-acropora-2024',
    isMain: true,
    url: 'data:image/jpeg;base64,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',
    dateTaken: '2024-03-24T12:00:00Z',
    mediaType: 'photo',
    mimeType: 'image/jpeg'
};

const FullScreenLightbox: React.FC<{ url: string; title: string; onClose: () => void }> = ({ url, title, onClose }) => {
    return (
        <div 
            className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center animate-fade-in p-4 sm:p-12"
            onClick={onClose}
        >
            <div className="absolute top-8 left-8 right-8 flex justify-between items-center z-[1010]">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-white/10 rounded-[1.5rem] border border-white/20 shadow-2xl">
                        <CameraIcon className="w-8 h-8 text-white" />
                    </div>
                    <div className="text-white">
                        <h4 className="font-black text-2xl uppercase tracking-tighter italic leading-none">{title}</h4>
                        <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mt-2">Full Resolution Node Asset</p>
                    </div>
                </div>
                <button 
                    onClick={onClose}
                    className="p-5 bg-white/10 rounded-full hover:bg-white/20 transition-all border border-white/10 shadow-2xl group active:scale-95"
                >
                    <CloseIcon className="w-10 h-10 text-white group-hover:rotate-90 transition-transform" />
                </button>
            </div>

            <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
                <img 
                    src={url} 
                    className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-[0_0_150px_rgba(0,0,0,0.9)] animate-scale-in pointer-events-auto border-4 border-white/5"
                    alt="Maximised Registry View"
                    onClick={e => e.stopPropagation()}
                />
            </div>
            
            <div className="absolute bottom-12 left-0 right-0 flex justify-center pointer-events-none">
                <button 
                    onClick={onClose}
                    className="px-16 py-6 bg-white text-black font-black rounded-full text-xs uppercase tracking-[0.5em] shadow-2xl pointer-events-auto hover:scale-105 active:scale-95 transition-all border-b-[10px] border-gray-200"
                >
                    Exit Document View
                </button>
            </div>
        </div>
    );
};

const PhotoViewerPage: React.FC<PhotoViewerPageProps> = ({
    branches,
    trees,
    substrateZones,
    rubbleAnchors,
    r2Settings,
    onUpdatePhotos,
    uploadMedia,
    onNavigateBack,
    onNavigateToPage,
    initialSelectedId
}) => {
    // 1. COMBINE ALL REGISTRY NODES INTO SEARCHABLE LIST
    const allItems = React.useMemo(() => [
        ...branches.map(b => ({ id: b.id, displayName: b.fragmentId, typeName: 'Branch', photos: b.photos || [] })),
        ...trees.map(t => ({ 
            id: t.id, 
            displayName: `${t.type === 'Reef2' ? 'R2' : t.type === 'Reef3' ? 'R3' : 'Tree'} ${t.number}`, 
            typeName: t.type || 'Tree',
            photos: t.photos || [] 
        })),
        ...substrateZones.map(z => ({ id: z.id, displayName: z.name, typeName: 'Substrate Zone', photos: z.photos || [] })),
        ...rubbleAnchors.map(ra => ({ id: ra.id, displayName: ra.name, typeName: 'Rubble Anchor', photos: ra.photos || [] }))
    ].sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { numeric: true })), [branches, trees, substrateZones, rubbleAnchors]);

    // 2. STATE
    const [selectedId, setSelectedId] = React.useState<string>(initialSelectedId || (allItems[0]?.id || ''));
    const [activeMediaType, setActiveMediaType] = React.useState<'photo' | 'video'>('photo');
    const [isSaving, setIsSaving] = React.useState(false);
    const [fullScreenPhoto, setFullScreenPhoto] = React.useState<{ url: string; title: string } | null>(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const [localUploads, setLocalUploads] = React.useState<{ id: string; url: string }[]>([]);

    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const selectedItem = React.useMemo(() => 
        allItems.find(item => String(item.id).trim() === String(selectedId).trim()),
    [allItems, selectedId]);

    // 3. MEDIA SOURCE MERGING (V15.6.7 REFINED)
    const mediaList = React.useMemo(() => {
        if (!selectedItem) return [];
        let media = [...selectedItem.photos];
        
        const nameClean = selectedItem.displayName.toLowerCase().replace(/\s/g, '');
        const isBranch1 = nameClean === 'branch1' || nameClean === 'b1';
        
        if (isBranch1) {
            if (!media.some(p => p.id === DEFINITIVE_ACROPORA_PHOTO.id)) {
                media = [DEFINITIVE_ACROPORA_PHOTO, ...media];
            }
        }
        return media;
    }, [selectedItem]);

    const filteredMedia = React.useMemo(() => {
        return mediaList.filter(m => (m.mediaType || 'photo') === activeMediaType);
    }, [mediaList, activeMediaType]);

    // 4. OPTIMISTIC UPLOAD HANDLERS
    const handleFiles = async (files: File[]) => {
        if (!selectedId || files.length === 0) return;
        
        // Optimistic UI Logic
        const tempUploads = files.map(file => ({
            id: `temp-${Math.random()}`,
            url: URL.createObjectURL(file)
        }));
        
        setLocalUploads(prev => [...prev, ...tempUploads]);
        setIsSaving(true);

        try {
            await onUpdatePhotos(selectedId, 'add', files);
        } catch (err) {
            console.error("Gallery Push Failed:", err);
            alert("Registry update failed. Check cloud connection.");
        } finally {
            // Clean up URLs and state
            tempUploads.forEach(u => URL.revokeObjectURL(u.url));
            setLocalUploads(prev => prev.filter(u => !tempUploads.some(t => t.id === u.id)));
            setIsSaving(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(Array.from(e.target.files));
            e.target.value = '';
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleDelete = async (e: React.MouseEvent, photoId: string) => {
        e.stopPropagation();
        if (photoId === DEFINITIVE_ACROPORA_PHOTO.id) {
            alert("System reference photos are protected and cannot be deleted.");
            return;
        }
        if (!confirm("Remove this asset from the registry?")) return;
        setIsSaving(true);
        try {
            await onUpdatePhotos(selectedId, 'delete', [photoId]);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSetMain = async (e: React.MouseEvent, photoId: string) => {
        e.stopPropagation();
        if (photoId === DEFINITIVE_ACROPORA_PHOTO.id) return;
        setIsSaving(true);
        try {
            await onUpdatePhotos(selectedId, 'main', photoId);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div 
            className="min-h-screen bg-coral-sand flex flex-col animate-fade-in pb-20"
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
        >
            {isDragging && (
                <div className="fixed inset-0 z-[500] bg-coral-blue/60 backdrop-blur-md border-[24px] border-dashed border-white flex items-center justify-center pointer-events-none transition-all">
                    <div className="bg-white p-16 rounded-[4rem] shadow-[0_40px_100px_rgba(0,0,0,0.3)] flex flex-col items-center gap-8 animate-scale-in">
                        <UploadIcon className="w-24 h-24 text-coral-blue animate-bounce" />
                        <h2 className="text-5xl font-black text-coral-dark uppercase tracking-tighter italic">Release to Record</h2>
                        <p className="text-xs font-black text-coral-blue uppercase tracking-[0.5em] opacity-60">Registry Snapshot Trigger</p>
                    </div>
                </div>
            )}

            <header className="bg-white border-b border-gray-200 px-6 py-5 sticky top-0 z-30 shadow-md">
                <div className="max-w-7xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <button onClick={onNavigateBack} className="p-3 hover:bg-gray-100 rounded-full transition-all group active:scale-95">
                            <ChevronLeftIcon className="w-7 h-7 text-gray-400 group-hover:text-coral-dark" />
                        </button>
                        <div className="relative group">
                            <select 
                                value={selectedId}
                                onChange={(e) => setSelectedId(e.target.value)}
                                className="bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-3 font-black uppercase text-sm appearance-none pr-12 focus:border-coral-blue focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer shadow-inner"
                            >
                                {allItems.map(item => (
                                    <option key={item.id} value={item.id}>
                                        {item.displayName} ({item.typeName})
                                    </option>
                                ))}
                            </select>
                            <ChevronDownIcon className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 transition-transform group-hover:translate-y-[-40%]" />
                        </div>

                        <button 
                            onClick={() => onNavigateToPage('photoAlbum', selectedId)}
                            className="bg-gray-100 text-coral-dark font-black px-6 py-3 rounded-2xl text-[10px] uppercase shadow-md hover:bg-gray-200 active:scale-95 transition-all flex items-center gap-3"
                        >
                            <StarIcon className="w-4 h-4" />
                            Album View
                        </button>
                    </div>

                    <label className="cursor-pointer group">
                        <div className={`px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3 active:scale-95 transition-all border-b-[8px] ${isSaving ? 'bg-orange-500 text-white border-orange-800' : 'bg-coral-blue text-white border-blue-800 hover:brightness-110'}`}>
                            {isSaving ? <ArrowPathIcon className="w-5 h-5 animate-spin" /> : <UploadIcon className="w-5 h-5" />}
                            <span>{isSaving ? 'UPLOADING...' : 'ADD MEDIA'}</span>
                        </div>
                        <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileUpload} disabled={isSaving} />
                    </label>
                </div>
            </header>

            <div className="bg-white border-b border-gray-100 sticky top-[83px] z-20 shadow-sm">
                <div className="max-w-7xl mx-auto flex">
                    <button 
                        onClick={() => setActiveMediaType('photo')}
                        className={`flex-1 py-5 text-xs font-black uppercase tracking-[0.2em] border-b-4 transition-all ${activeMediaType === 'photo' ? 'border-coral-blue text-coral-blue bg-blue-50/20' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        Nursery Imagery ({mediaList.filter(m => (m.mediaType || 'photo') === 'photo').length})
                    </button>
                    <button 
                        onClick={() => setActiveMediaType('video')}
                        className={`flex-1 py-5 text-xs font-black uppercase tracking-[0.2em] border-b-4 transition-all ${activeMediaType === 'video' ? 'border-coral-blue text-coral-blue bg-blue-50/20' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                    >
                        Motion Capture ({mediaList.filter(m => m.mediaType === 'video').length})
                    </button>
                </div>
            </div>

            <main className="flex-grow p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
                        
                        {/* DROP ZONE */}
                        <div 
                            onClick={() => !isSaving && fileInputRef.current?.click()}
                            className={`aspect-square rounded-[2.5rem] border-4 border-dashed bg-white flex flex-col items-center justify-center gap-4 cursor-pointer transition-all group active:scale-95 shadow-sm hover:shadow-xl ${isSaving ? 'opacity-30 cursor-not-allowed border-gray-100' : 'border-coral-blue/20 hover:border-coral-blue hover:bg-blue-50/30'}`}
                        >
                            <div className="p-5 bg-gray-50 rounded-3xl group-hover:scale-110 group-hover:bg-coral-blue group-hover:text-white transition-all text-gray-300 shadow-inner">
                                <PlusCircleIcon className="w-10 h-10" />
                            </div>
                            <div className="text-center px-6">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-relaxed group-hover:text-coral-blue">Push Imagery</p>
                                <p className="text-[8px] font-bold text-gray-300 uppercase tracking-[0.3em] mt-1 italic">Registry Drop</p>
                            </div>
                            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileUpload} accept="image/*,video/*" disabled={isSaving} />
                        </div>

                        {/* OPTIMISTIC LOCAL PREVIEWS */}
                        {localUploads.map(upload => (
                            <div key={upload.id} className="relative aspect-square rounded-[2.5rem] overflow-hidden bg-gray-200 border-4 border-white shadow-md animate-pulse">
                                <img src={upload.url} className="w-full h-full object-cover blur-sm opacity-50" alt="Optimistic upload" />
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                                    <ArrowPathIcon className="w-8 h-8 text-coral-blue animate-spin" />
                                    <span className="text-[9px] font-black text-coral-blue uppercase tracking-widest bg-white/80 px-2 py-1 rounded-full border border-blue-100">Securing</span>
                                </div>
                            </div>
                        ))}

                        {/* REAL REGISTRY PHOTOS */}
                        {filteredMedia.map((photo) => {
                            const isRef = photo.id === DEFINITIVE_ACROPORA_PHOTO.id;
                            const resolvedUrl = resolveMediaUrl(photo.url, r2Settings);
                            return (
                                <div 
                                    key={photo.id}
                                    onClick={() => setFullScreenPhoto({ url: resolvedUrl, title: selectedItem?.displayName || 'Registry Asset' })}
                                    className={`group relative aspect-square rounded-[2.5rem] overflow-hidden bg-gray-100 border-4 transition-all cursor-zoom-in active:scale-95 shadow-md hover:shadow-2xl ${photo.isMain ? 'border-coral-blue' : 'border-white hover:border-blue-50'}`}
                                >
                                    <img 
                                        src={resolvedUrl} 
                                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" 
                                        alt="Gallery Item"
                                        loading={isRef ? "eager" : "lazy"}
                                    />
                                    
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-6 flex flex-col justify-end">
                                        <p className="text-[9px] font-black text-white uppercase tracking-[0.3em] leading-none mb-1">Captured</p>
                                        <p className="text-xs font-black text-white/80 uppercase">
                                            {photo.dateTaken ? new Date(photo.dateTaken).toLocaleDateString() : 'Baseline'}
                                        </p>
                                    </div>

                                    <div className="absolute top-4 right-4 flex flex-col gap-3 opacity-0 group-hover:opacity-100 transition-all transform translate-x-8 group-hover:translate-x-0">
                                        <button 
                                            onClick={(e) => handleSetMain(e, photo.id)} 
                                            className="p-3 bg-white/95 backdrop-blur-xl rounded-2xl hover:bg-coral-blue hover:text-white transition-all shadow-2xl border border-white/20 active:scale-90"
                                            title="Mark as Representative"
                                        >
                                            <StarIcon className="w-5 h-5" />
                                        </button>
                                        <button 
                                            onClick={(e) => handleDelete(e, photo.id)} 
                                            className="p-3 bg-white/95 backdrop-blur-xl rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-2xl border border-white/20 active:scale-90"
                                            title="Remove Asset"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {photo.isMain && (
                                        <div className="absolute top-4 left-4 bg-coral-blue text-white p-2 rounded-2xl shadow-xl border border-white/30 animate-pulse">
                                            <CheckCircleIcon className="w-4 h-4" />
                                        </div>
                                    )}

                                    {isRef && (
                                        <div className="absolute bottom-4 right-4 bg-amber-400 text-coral-dark px-4 py-1.5 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-2xl border border-white/50">
                                            Reference
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {filteredMedia.length === 0 && localUploads.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-48 text-center gap-10 opacity-20 group">
                            <div className="w-40 h-40 bg-gray-200 rounded-[4rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                <DatabaseIcon className="w-20 h-20 text-gray-400" />
                            </div>
                            <div className="space-y-3">
                                <p className="font-black uppercase tracking-[0.8em] italic text-2xl text-coral-dark">Registry Empty</p>
                                <p className="text-xs font-bold uppercase tracking-[0.4em]">Awaiting Visual Documentation</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {isSaving && (
                <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-12 py-6 rounded-[2.5rem] shadow-[0_30px_60px_rgba(0,0,0,0.4)] flex items-center gap-6 animate-slide-up z-50 border-4 border-white/10 backdrop-blur-xl">
                    <ArrowPathIcon className="w-7 h-7 animate-spin text-coral-blue" />
                    <div className="flex flex-col">
                        <span className="text-[12px] font-black uppercase tracking-[0.3em]">Updating Cloud Registry</span>
                        <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Securing Binary Assets to R2</span>
                    </div>
                </div>
            )}

            {fullScreenPhoto && (
                <FullScreenLightbox 
                    url={fullScreenPhoto.url} 
                    title={fullScreenPhoto.title} 
                    onClose={() => setFullScreenPhoto(null)} 
                />
            )}
        </div>
    );
};

export default PhotoViewerPage;