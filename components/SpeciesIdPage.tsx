import * as React from 'react';
import { flushSync } from 'react-dom';
import type { ChangeEvent, FormEvent, DragEvent } from 'react';
import type { Species, Photo, R2Settings } from '../types';
import { BookOpenIcon, CameraIcon, PencilIcon, TrashIcon, CloseIcon, UploadIcon, ChevronLeftIcon, ChevronRightIcon, StarIcon, ArrowPathIcon, GlobeAltIcon } from './Icons';

interface SpeciesIdPageProps {
  speciesList: Species[];
  r2Settings: R2Settings | null;
  onAddSpecies: (species: Species) => void;
  onUpdateSpecies: (species: Species) => void;
  onDeleteSpecies: (id: string) => void;
  onNavigateBack: () => void;
  uploadMedia?: (file: File | Blob, prefix: string) => Promise<string>;
}

/**
 * DETERMINISTIC MEDIA RESOLVER (V15.6.0)
 * Resolves local, cloud, or embedded media strings.
 * Critical: Short-circuits for Data URIs to prevent R2 prefix interference.
 */
export const resolveMediaUrl = (url: any, r2Settings: R2Settings | null): string => {
    if (!url || typeof url !== 'string' || url.trim() === '') return '';
    const trimmed = url.trim();
    
    // 1. FOOLPROOF PROTOCOL SHORT-CIRCUIT
    // If it already has a protocol, return it untouched.
    if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('http')) {
        return trimmed;
    }

    // 2. R2 CLOUD RESOLUTION
    // If it's a relative key from our storage, append the public URL
    if (r2Settings?.publicUrl) {
        let base = r2Settings.publicUrl.trim();
        if (!base.startsWith('http')) base = `https://${base}`;
        const cleanBase = base.replace(/\/+$/, '');
        const cleanPath = trimmed.replace(/^\/+/, '');
        return `${cleanBase}/${cleanPath}`;
    }
    
    // 3. FALLBACK
    return trimmed;
};

const PhotoAlbumViewer: React.FC<{
  photos: Photo[];
  r2Settings: R2Settings | null;
  onClose: () => void;
}> = ({ photos, r2Settings, onClose }) => {
  const [currentIndex, setCurrentIndex] = React.useState(() => {
      const mainIndex = photos.findIndex(p => p.isMain);
      return mainIndex !== -1 ? mainIndex : 0;
  });
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const goToPrevious = () => setCurrentIndex(prev => (prev === 0 ? photos.length - 1 : prev - 1));
  const goToNext = () => setCurrentIndex(prev => (prev === photos.length - 1 ? 0 : prev + 1));

  React.useEffect(() => {
      if (scrollRef.current) {
          const activeThumbnail = scrollRef.current.children[currentIndex] as HTMLElement;
          if (activeThumbnail) activeThumbnail.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
  }, [currentIndex]);

  if (photos.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-[250] flex flex-col items-center justify-center" onClick={onClose}>
      <button className="absolute top-4 right-4 text-white bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors z-50" onClick={onClose}>
        <CloseIcon className="w-8 h-8" />
      </button>
      <div className="flex-grow w-full h-full flex items-center justify-center relative pb-24" onClick={e => e.stopPropagation()}>
          {photos.length > 1 && <button className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-white/10 p-3 rounded-full hover:bg-white/20 z-50" onClick={(e) => { e.stopPropagation(); goToPrevious(); }}><ChevronLeftIcon className="w-8 h-8" /></button>}
          <img src={resolveMediaUrl(photos[currentIndex].url, r2Settings)} alt={`Photo ${currentIndex + 1}`} className="max-w-full max-h-full object-contain shadow-2xl rounded-sm" />
          <div className="absolute bottom-28 left-0 right-0 text-center text-white/70 text-sm pointer-events-none">{currentIndex + 1} / {photos.length}</div>
          {photos.length > 1 && <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-white/10 p-3 rounded-full hover:bg-white/20 z-50" onClick={(e) => { e.stopPropagation(); goToNext(); }}><ChevronRightIcon className="w-8 h-8" /></button>}
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-black/80 backdrop-blur-sm flex items-center gap-2 overflow-x-auto px-4 z-50" onClick={e => e.stopPropagation()}>
         <div ref={scrollRef} className="flex gap-2 mx-auto min-w-min px-4">
            {photos.map((photo, index) => (
                <button key={photo.id} onClick={() => setCurrentIndex(index)} className={`relative w-16 h-16 flex-shrink-0 rounded-md overflow-hidden transition-all border-2 ${index === currentIndex ? 'border-coral-blue scale-110' : 'border-transparent opacity-50'}`}>
                    <img src={resolveMediaUrl(photo.url, r2Settings)} alt="" className="w-full h-full object-cover"/>
                </button>
            ))}
         </div>
      </div>
    </div>
  );
};

const SpeciesDetailView: React.FC<{
    species: Species;
    r2Settings: R2Settings | null;
    onClose: () => void;
    onEdit: () => void;
}> = ({ species, r2Settings, onClose, onEdit }) => {
    const [viewerOpen, setViewerOpen] = React.useState(false);
    const photos = species.photos || [];
    const mainPhoto = photos.find(p => p.isMain) || photos[0];

    return (
        <div className="bg-white rounded-xl overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <button onClick={onClose} className="flex items-center gap-2 text-coral-dark font-black uppercase text-xs hover:text-coral-blue transition-colors">
                    <ChevronLeftIcon className="w-5 h-5" /> Back to Library
                </button>
                <button onClick={onEdit} className="p-2 bg-gray-100 hover:bg-coral-blue/10 text-coral-dark hover:text-coral-blue rounded-xl transition-all">
                    <PencilIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6 lg:p-10">
                <div className="space-y-6">
                    <div onClick={() => photos.length > 0 && setViewerOpen(true)} className={`relative aspect-[4/3] rounded-3xl overflow-hidden bg-gray-100 border-4 border-white shadow-xl ${photos.length > 0 ? 'cursor-pointer group' : ''}`}>
                        {mainPhoto ? <img src={resolveMediaUrl(mainPhoto.url, r2Settings)} alt={species.genus} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /> : <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 gap-4"><CameraIcon className="w-20 h-20" /><span className="font-bold uppercase text-sm">No Imagery</span></div>}
                    </div>
                </div>
                <div className="space-y-8">
                    <div className="space-y-2">
                        <h2 className="text-4xl font-black text-coral-dark italic tracking-tight">{species.genus} {species.species}</h2>
                        {species.commonName && <p className="text-xl font-bold text-coral-blue tracking-tight">{species.commonName}</p>}
                    </div>
                    <div className="text-lg text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
                        {species.description || <span className="text-gray-400 italic">No detailed description recorded.</span>}
                    </div>
                    {species.externalLink && (
                        <div className="pt-6 border-t border-gray-100">
                            <a href={species.externalLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 bg-coral-blue text-white px-8 py-3.5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg hover:shadow-coral-blue/30 transition-all active:scale-95">
                                <GlobeAltIcon className="w-5 h-5" /> Scientific Reference
                            </a>
                        </div>
                    )}
                </div>
            </div>
            {viewerOpen && <PhotoAlbumViewer photos={photos} r2Settings={r2Settings} onClose={() => setViewerOpen(false)} />}
        </div>
    );
};

const AddEditSpeciesModal: React.FC<{
    species?: Species;
    r2Settings: R2Settings | null;
    onClose: () => void;
    onSave: (species: Species) => void;
    onDelete?: (id: string) => void;
    uploadMedia?: (file: File | Blob, prefix: string) => Promise<string>;
}> = ({ species, r2Settings, onClose, onSave, onDelete, uploadMedia }) => {
    const [genus, setGenus] = React.useState(species?.genus || '');
    const [speciesName, setSpeciesName] = React.useState(species?.species || '');
    const [commonName, setCommonName] = React.useState(species?.commonName || '');
    const [description, setDescription] = React.useState(species?.description || '');
    const [externalLink, setExternalLink] = React.useState(species?.externalLink || '');
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const [photos, setPhotos] = React.useState<Photo[]>(species?.photos || []);
    const [isUploading, setIsUploading] = React.useState(false);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        const cleanPhotos = photos.filter(p => !p.id.startsWith('LOCAL-'));
        onSave({ id: species?.id || Math.random().toString(), genus, species: speciesName, commonName, description, externalLink, photos: cleanPhotos });
        onClose();
    };

    const handleFiles = async (files: File[]) => {
        if (!uploadMedia) {
            alert("Storage logic unavailable. Check connection.");
            return;
        }

        const originalPhotos = [...photos.filter(p => !p.id.startsWith('LOCAL-'))];
        flushSync(() => { setIsUploading(true); });

        const optimisticPhotos: Photo[] = files.map(file => ({
            id: `LOCAL-${Math.random()}`,
            url: URL.createObjectURL(file),
            isMain: false,
            dateTaken: new Date().toISOString()
        }));

        flushSync(() => { setPhotos(prev => [...prev, ...optimisticPhotos]); });

        try {
            const uploadedUrls = await Promise.all(files.map(async file => await uploadMedia(file, 'species_library')));
            const permanentPhotos: Photo[] = uploadedUrls.map(url => ({ 
                id: Math.random().toString(36).substr(2, 9), 
                url, 
                isMain: false, 
                dateTaken: new Date().toISOString() 
            }));

            setPhotos(prev => {
                const cleaned = prev.filter(p => !p.id.startsWith('LOCAL-'));
                const combined = [...cleaned, ...permanentPhotos];
                if (cleaned.length === 0 && combined.length > 0) combined[0].isMain = true;
                return combined;
            });
        } catch (err: any) {
            console.error("Binary Push Failed:", err);
            alert(`Registry Failure: ${err.message || 'Cloud storage timeout.'}`);
            setPhotos(originalPhotos);
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black bg-opacity-60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative flex flex-col max-h-[85vh] animate-slide-up">
                <form onSubmit={handleSubmit} className="flex flex-col h-full overflow-hidden">
                    <header className="p-4 border-b flex justify-between items-center bg-gray-50/50 shrink-0">
                        <h2 className="text-xl font-bold text-coral-dark">{species ? 'Edit Species' : 'Add New Species'}</h2>
                        <button type="button" onClick={onClose} disabled={isUploading} className="text-gray-500 hover:text-gray-800"><CloseIcon className="w-6 h-6"/></button>
                    </header>
                    <div className="p-6 space-y-4 overflow-y-auto flex-grow">
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="block text-xs font-black uppercase text-gray-400 mb-1">Genus</label><input type="text" value={genus} onChange={e => setGenus(e.target.value)} required className="w-full rounded-md border-gray-300 p-2 bg-white text-gray-900 border"/></div>
                            <div><label className="block text-xs font-black uppercase text-gray-400 mb-1">Species</label><input type="text" value={speciesName} onChange={e => setSpeciesName(e.target.value.toLowerCase())} required className="w-full rounded-md border-gray-300 p-2 bg-white text-gray-900 border"/></div>
                        </div>
                        <div><label className="block text-xs font-black uppercase text-gray-400 mb-1">Common Name</label><input type="text" value={commonName} onChange={e => setCommonName(e.target.value)} className="w-full rounded-md border-gray-300 p-2 bg-white text-gray-900 border"/></div>
                        <div><label className="block text-xs font-black uppercase text-gray-400 mb-1">Identification Characters</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} className="w-full rounded-md border-gray-300 p-2 bg-white text-gray-900 border"/></div>
                        
                        <div className="pt-4 border-t">
                            <label className="block text-xs font-black uppercase text-gray-400 mb-2">Species Photos</label>
                            <div onClick={() => !isUploading && fileInputRef.current?.click()} className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer flex flex-col items-center gap-2 ${isUploading ? 'opacity-40 cursor-wait' : 'border-gray-200 hover:bg-blue-50 hover:border-coral-blue'}`}>
                                {isUploading ? <ArrowPathIcon className="w-8 h-8 text-coral-blue animate-spin" /> : <UploadIcon className="w-8 h-8 text-gray-400"/>}
                                <span className="text-sm font-bold text-gray-600">{isUploading ? 'Securing Binary...' : 'Upload Media'}</span>
                                <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={e => e.target.files && handleFiles(Array.from(e.target.files))} disabled={isUploading} />
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-4">
                                {photos.map(p => (
                                    <div key={p.id} className="relative aspect-square rounded-lg overflow-hidden border border-gray-100 shadow-sm group">
                                        <img src={resolveMediaUrl(p.url, r2Settings)} className={`w-full h-full object-cover ${p.id.startsWith('LOCAL-') ? 'blur-sm grayscale' : ''}`} alt="" />
                                        {p.id.startsWith('LOCAL-') && <div className="absolute inset-0 flex items-center justify-center"><ArrowPathIcon className="w-4 h-4 text-white animate-spin" /></div>}
                                        {!p.id.startsWith('LOCAL-') && <button type="button" onClick={() => setPhotos(prev => prev.filter(x => x.id !== p.id))} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><CloseIcon className="w-3 h-3" /></button>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <footer className="p-4 bg-gray-50 border-t flex justify-end gap-2">
                        <button type="button" onClick={onClose} disabled={isUploading} className="bg-white border border-gray-300 text-gray-700 font-bold py-2 px-6 rounded-lg">Cancel</button>
                        <button type="submit" disabled={isUploading} className="bg-coral-green text-coral-dark font-bold py-2 px-8 rounded-lg shadow-md active:scale-95 disabled:opacity-40">{isUploading ? 'Syncing...' : 'Save Species'}</button>
                    </footer>
                </form>
            </div>
        </div>
    );
};

const SpeciesIdPage: React.FC<SpeciesIdPageProps> = ({
  speciesList, r2Settings, onAddSpecies, onUpdateSpecies, onDeleteSpecies, onNavigateBack, uploadMedia
}) => {
  const [editingSpecies, setEditingSpecies] = React.useState<Species | null>(null);
  const [isAdding, setIsAdding] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [viewingDetailsSpecies, setViewingDetailsSpecies] = React.useState<Species | null>(null);

  const filteredSpecies = React.useMemo(() => {
      const term = searchTerm.toLowerCase();
      return (speciesList || []).filter(s => (s.genus || '').toLowerCase().includes(term) || (s.species || '').toLowerCase().includes(term) || (s.commonName && s.commonName.toLowerCase().includes(term))).sort((a, b) => `${a.genus} ${a.species}`.localeCompare(`${b.genus} ${b.species}`));
  }, [speciesList, searchTerm]);

  return (
    <div className="space-y-6">
      {viewingDetailsSpecies ? (
          <SpeciesDetailView 
            species={viewingDetailsSpecies} 
            r2Settings={r2Settings} 
            onClose={() => setViewingDetailsSpecies(null)} 
            onEdit={() => setEditingSpecies(viewingDetailsSpecies)}
          />
      ) : (
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg space-y-6 animate-fade-in">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4">
                <h2 className="text-2xl font-bold text-coral-dark mb-2 sm:mb-0">Species Library</h2>
                <button onClick={onNavigateBack} className="bg-gray-200 hover:bg-gray-300 text-coral-dark font-bold py-2 px-4 rounded-lg transition-colors">&larr; Dashboard</button>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <input type="text" placeholder="Search taxonomy..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full sm:w-64 p-2 border border-gray-300 rounded-lg bg-white text-gray-900 shadow-inner"/>
                  <button onClick={() => setIsAdding(true)} className="bg-coral-blue hover:bg-opacity-90 text-white font-bold py-2 px-6 rounded-lg shadow-md transition-all">+ New Species</button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredSpecies.map(species => (
                      <div key={species.id} className="border border-coral-blue/30 rounded-lg overflow-hidden bg-gray-50 flex h-48 group shadow-sm hover:shadow-md transition-all">
                          <div onClick={() => setViewingDetailsSpecies(species)} className="w-32 sm:w-40 shrink-0 bg-gray-200 cursor-pointer overflow-hidden">
                              {species.photos?.[0] ? <img src={resolveMediaUrl(species.photos[0].url, r2Settings)} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><CameraIcon className="w-8 h-8 opacity-50"/></div>}
                          </div>
                          <div className="p-4 flex-grow flex flex-col min-w-0">
                              <div className="flex justify-between items-start">
                                  <div onClick={() => setViewingDetailsSpecies(species)} className="cursor-pointer truncate">
                                      <h3 className="font-bold text-coral-dark italic truncate">{species.genus} {species.species}</h3>
                                      <p className="text-[10px] text-gray-500 font-black uppercase truncate">{species.commonName}</p>
                                  </div>
                                  <button onClick={() => setEditingSpecies(species)} className="p-1 hover:bg-blue-100 rounded text-blue-600"><PencilIcon className="w-4 h-4"/></button>
                              </div>
                              <p className="mt-2 text-[11px] text-gray-600 line-clamp-3 leading-relaxed flex-grow">{species.description || 'No data.'}</p>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {(isAdding || editingSpecies) && (
          <AddEditSpeciesModal 
            species={editingSpecies || undefined}
            r2Settings={r2Settings}
            onClose={() => { setIsAdding(false); setEditingSpecies(null); }}
            onSave={(s) => { editingSpecies ? onUpdateSpecies(s) : onAddSpecies(s); if (viewingDetailsSpecies && s.id === viewingDetailsSpecies.id) setViewingDetailsSpecies(s); }}
            onDelete={onDeleteSpecies}
            uploadMedia={uploadMedia}
          />
      )}
    </div>
  );
};

export default SpeciesIdPage;