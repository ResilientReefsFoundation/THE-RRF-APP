import * as React from 'react';
import PhotoAlbum from "react-photo-album";
import type { Photo, R2Settings, CoralBranch, Tree, SubstrateZone, RubbleAnchor, Page } from '../types';
import { 
    CloseIcon, CameraIcon, ChevronLeftIcon, ChevronDownIcon, 
    CheckCircleIcon, StarIcon, DatabaseIcon, PlusCircleIcon,
    ChevronRightIcon, WrenchIcon
} from './Icons';
import { resolveMediaUrl } from './SpeciesIdPage';

interface PhotoAlbumPageProps {
    branches: CoralBranch[];
    trees: Tree[];
    substrateZones: SubstrateZone[];
    rubbleAnchors: RubbleAnchor[];
    r2Settings: R2Settings | null;
    onNavigateBack: () => void;
    onNavigateToPage: (page: Page, id?: string) => void;
    initialSelectedId?: string;
}

const FullScreenLightbox: React.FC<{ url: string; title: string; onClose: () => void }> = ({ url, title, onClose }) => (
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
                    <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.4em] mt-2">Maximised Registry Record</p>
                </div>
            </div>
            <button onClick={onClose} className="p-5 bg-white/10 rounded-full hover:bg-white/20 transition-all border border-white/10 shadow-2xl group active:scale-95">
                <CloseIcon className="w-10 h-10 text-white group-hover:rotate-90 transition-transform" />
            </button>
        </div>
        <img 
            src={url} 
            className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-[0_0_150px_rgba(0,0,0,0.9)] animate-scale-in border-4 border-white/5"
            alt="Maximised Registry View"
        />
        <div className="absolute bottom-12 left-0 right-0 flex justify-center">
            <button onClick={onClose} className="px-16 py-6 bg-white text-black font-black rounded-full text-xs uppercase tracking-[0.5em] shadow-2xl hover:scale-105 active:scale-95 transition-all border-b-[10px] border-gray-200">
                Close Document
            </button>
        </div>
    </div>
);

const PhotoAlbumPage: React.FC<PhotoAlbumPageProps> = ({
    branches,
    trees,
    substrateZones,
    rubbleAnchors,
    r2Settings,
    onNavigateBack,
    onNavigateToPage,
    initialSelectedId
}) => {
    const [selectedId, setSelectedId] = React.useState<string>(initialSelectedId || 'GLOBAL');
    const [layout, setLayout] = React.useState<"rows" | "masonry" | "columns">("rows");
    const [fullScreenPhoto, setFullScreenPhoto] = React.useState<{ url: string; title: string } | null>(null);

    // 1. GENERATE REGISTRY LIST
    const allItems = React.useMemo(() => [
        { id: 'GLOBAL', displayName: 'All Nursery Imagery', typeName: 'Universal' },
        ...branches.map(b => ({ id: b.id, displayName: b.fragmentId, typeName: 'Branch', photos: b.photos || [] })),
        ...trees.map(t => ({ 
            id: t.id, 
            displayName: `${t.type === 'Reef2' ? 'R2' : t.type === 'Reef3' ? 'R3' : 'Tree'} ${t.number}`, 
            typeName: t.type || 'Tree',
            photos: t.photos || [] 
        })),
        ...substrateZones.map(z => ({ id: z.id, displayName: z.name, typeName: 'Substrate Zone', photos: z.photos || [] })),
        ...rubbleAnchors.map(ra => ({ id: ra.id, displayName: ra.name, typeName: 'Rubble Anchor', photos: ra.photos || [] }))
    ].sort((a, b) => {
        if (a.id === 'GLOBAL') return -1;
        if (b.id === 'GLOBAL') return 1;
        return a.displayName.localeCompare(b.displayName, undefined, { numeric: true });
    }), [branches, trees, substrateZones, rubbleAnchors]);

    // 2. AGGREGATE MEDIA BASED ON SELECTION
    const albumPhotos = React.useMemo(() => {
        const pool: any[] = [];

        const processPhotos = (photos: any[], parentName: string) => {
            photos.forEach((p, i) => {
                const resolved = resolveMediaUrl(p.url, r2Settings);
                if (!resolved) return;
                pool.push({
                    src: resolved,
                    width: 1024,
                    height: i % 3 === 0 ? 1365 : 768, 
                    title: parentName,
                    date: p.dateTaken,
                    key: p.id,
                    isMain: p.isMain
                });
            });
        };

        if (selectedId === 'GLOBAL') {
            branches.forEach(b => processPhotos(b.photos || [], b.fragmentId));
            trees.forEach(t => processPhotos(t.photos || [], `${t.type || 'Tree'} ${t.number}`));
            substrateZones.forEach(z => processPhotos(z.photos || [], z.name));
            rubbleAnchors.forEach(ra => processPhotos(ra.photos || [], ra.name));
        } else {
            const item = allItems.find(i => i.id === selectedId);
            if (item && (item as any).photos) {
                processPhotos((item as any).photos, item.displayName);
            }
        }

        return pool;
    }, [selectedId, branches, trees, substrateZones, rubbleAnchors, r2Settings, allItems]);

    return (
        <div className="min-h-screen bg-coral-sand flex flex-col animate-fade-in pb-20">
            <header className="bg-white border-b border-gray-200 px-6 py-6 sticky top-0 z-30 shadow-md">
                <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-8 w-full lg:w-auto">
                        <button onClick={onNavigateBack} className="p-4 hover:bg-gray-100 rounded-2xl transition-all group active:scale-95 border border-transparent hover:border-gray-200">
                            <ChevronLeftIcon className="w-8 h-8 text-gray-400 group-hover:text-coral-dark" />
                        </button>
                        <div className="flex flex-col mr-4">
                            <h1 className="text-3xl font-black text-coral-dark tracking-tighter uppercase italic leading-none">react photo album</h1>
                            <p className="text-[10px] font-black text-coral-blue uppercase tracking-[0.4em] mt-1">Universal Registry Comparison</p>
                        </div>
                        <div className="relative group flex-grow lg:flex-grow-0 min-w-[280px]">
                            <select 
                                value={selectedId}
                                onChange={(e) => setSelectedId(e.target.value)}
                                className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl px-6 py-4 font-black uppercase text-xs appearance-none pr-12 focus:border-coral-blue focus:ring-4 focus:ring-blue-50 outline-none transition-all cursor-pointer shadow-inner"
                            >
                                {allItems.map(item => (
                                    <option key={item.id} value={item.id}>
                                        {item.displayName} ({item.typeName})
                                    </option>
                                ))}
                            </select>
                            <ChevronDownIcon className="w-5 h-5 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 transition-transform group-hover:translate-y-[-40%]" />
                        </div>

                        {selectedId !== 'GLOBAL' && (
                            <button 
                                onClick={() => onNavigateToPage('photoViewer', selectedId)}
                                className="bg-coral-blue text-white font-black px-8 py-4 rounded-2xl text-[10px] uppercase shadow-xl hover:brightness-110 active:scale-95 transition-all border-b-4 border-blue-800 flex items-center gap-3"
                            >
                                <WrenchIcon className="w-4 h-4" />
                                Manage Photos
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-[2rem] border border-gray-200">
                        <LayoutButton active={layout === 'rows'} label="Rows" onClick={() => setLayout('rows')} />
                        <LayoutButton active={layout === 'masonry'} label="Masonry" onClick={() => setLayout('masonry')} />
                        <LayoutButton active={layout === 'columns'} label="Columns" onClick={() => setLayout('columns')} />
                    </div>
                </div>
            </header>

            <main className="flex-grow p-8 sm:p-12">
                <div className="max-w-[1600px] mx-auto space-y-12">
                    {albumPhotos.length > 0 && typeof PhotoAlbum !== 'undefined' ? (
                        <div className="bg-white p-10 rounded-[4rem] shadow-2xl border-4 border-white animate-slide-up">
                            <PhotoAlbum 
                                layout={layout} 
                                photos={albumPhotos} 
                                spacing={32}
                                padding={0}
                                targetRowHeight={350}
                                onClick={({ photo }) => setFullScreenPhoto({ url: photo.src, title: (photo as any).title })}
                                render={{
                                    photo: (props: any) => {
                                        const { photo, wrapperStyle, imageProps } = props;
                                        return (
                                            <div 
                                                style={wrapperStyle} 
                                                className="group relative rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-zoom-in active:scale-95 border-4 border-transparent hover:border-coral-blue/20"
                                            >
                                                <img 
                                                    {...imageProps} 
                                                    className={`${imageProps.className} transition-transform duration-1000 group-hover:scale-105`} 
                                                />
                                                
                                                {/* Hover Overlay */}
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-8 flex flex-col justify-end gap-1 pointer-events-none">
                                                    <p className="text-[10px] font-black text-coral-blue uppercase tracking-[0.3em] leading-none mb-1">Record Node</p>
                                                    <p className="text-xl font-black text-white uppercase tracking-tight italic">
                                                        {(photo as any).title}
                                                    </p>
                                                    {(photo as any).date && (
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase mt-2">
                                                            Recorded: {new Date((photo as any).date).toLocaleDateString()}
                                                        </p>
                                                    )}
                                                </div>

                                                {(photo as any).isMain && (
                                                    <div className="absolute top-6 left-6 bg-coral-blue text-white p-2 rounded-2xl shadow-xl border-4 border-white/30 z-10">
                                                        <CheckCircleIcon className="w-5 h-5" />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }
                                }}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-48 text-center gap-10 opacity-20 group">
                            <div className="w-40 h-40 bg-gray-200 rounded-[4rem] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                <DatabaseIcon className="w-20 h-20 text-gray-400" />
                            </div>
                            <div className="space-y-3">
                                <p className="font-black uppercase tracking-[0.8em] italic text-2xl text-coral-dark">Selection Empty</p>
                                <p className="text-xs font-bold uppercase tracking-[0.4em]">No Documentation Found</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>

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

const LayoutButton: React.FC<{ active: boolean; label: string; onClick: () => void }> = ({ active, label, onClick }) => (
    <button 
        onClick={onClick}
        className={`px-8 py-3 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${active ? 'bg-coral-blue text-white shadow-lg scale-105' : 'text-gray-400 hover:text-coral-dark'}`}
    >
        {label}
    </button>
);

export default PhotoAlbumPage;