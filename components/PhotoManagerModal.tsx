
import * as React from 'react';
import type { Photo, R2Settings } from '../types';
import { StarIcon, TrashIcon, UploadIcon, CheckCircleIcon, CloseIcon, ArrowPathIcon, CameraIcon, DatabaseIcon } from './Icons';
import { resolveMediaUrl } from './SpeciesIdPage';

interface PhotoManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  photos: Photo[];
  r2Settings: R2Settings | null;
  onAddPhotos: (files: File[]) => void;
  onDeletePhotos: (photoIds: string[]) => void;
  onSetMainPhoto: (photoId: string) => void;
  isSaving?: boolean;
  syncStage?: string | null;
}

const PhotoManagerModal: React.FC<PhotoManagerModalProps> = ({
  isOpen, onClose, photos = [], r2Settings, onAddPhotos, onDeletePhotos, onSetMainPhoto, isSaving = false, syncStage = null
}) => {
  const [selectedPhotoIds, setSelectedPhotoIds] = React.useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  
  const [localInitiatedUpload, setLocalInitiatedUpload] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!isSaving && syncStage === null) {
      setLocalInitiatedUpload(false);
    }
  }, [isSaving, syncStage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []) as File[];
      if (files.length > 0) {
          setLocalInitiatedUpload(true);
          onAddPhotos(files);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const files = (Array.from(e.dataTransfer.files) as File[]).filter(f => 
          f.type.startsWith('image/') || 
          f.name.toLowerCase().endsWith('.heic') || 
          f.name.toLowerCase().endsWith('.heif')
      );
      
      if (files.length > 0) {
          setLocalInitiatedUpload(true);
          onAddPhotos(files);
      }
  };

  if (!isOpen) return null;

  const localPhotos = (photos || []).filter(p => String(p.id).startsWith('LOCAL-'));
  const permanentPhotos = (photos || []).filter(p => !String(p.id).startsWith('LOCAL-'));
  
  const isUploadActive = localInitiatedUpload || localPhotos.length > 0;
  const isSyncOnlyActive = isSaving && !isUploadActive;
  const isBusy = isSaving || isUploadActive || isSyncOnlyActive;

  return (
    <div className="fixed inset-0 bg-black/90 z-[200] flex justify-center items-center p-4 backdrop-blur-md animate-fade-in">
      
      <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col relative overflow-hidden animate-slide-up border-4 border-white/20">
        
        <header className="p-6 border-b flex justify-between items-center shrink-0 bg-white">
          <div>
            <h2 className="text-2xl font-black text-coral-dark uppercase tracking-tighter italic leading-none">
              {isSelectMode ? `Selection (${selectedPhotoIds.length})` : "Photo Registry"}
            </h2>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                {isBusy ? "Registry Lock Active" : "Active Visual Database"}
            </p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors shadow-sm">
            <CloseIcon className="w-5 h-5 text-gray-800"/>
          </button>
        </header>

        <div className="p-6 overflow-y-auto flex-grow bg-gray-50/50 space-y-6">
            
            {/* COMPACT BUSY STATUS (ONLY WHEN BUSY) */}
            {isBusy && (
                <div className={`${isUploadActive ? 'bg-coral-blue' : 'bg-coral-dark'} rounded-3xl p-6 shadow-xl border-4 border-white animate-fade-in flex items-center justify-between gap-6 transition-colors duration-500`}>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/10 rounded-2xl border border-white/30 backdrop-blur-md">
                            <ArrowPathIcon className="w-8 h-8 text-white animate-spin" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tighter italic leading-none">
                                {isUploadActive ? 'Uploading' : 'Syncing'}
                            </h3>
                            <p className="text-[9px] font-black text-white/60 uppercase tracking-widest mt-1">
                                {syncStage || 'PROCESS ACTIVE'}
                            </p>
                        </div>
                    </div>
                    {localPhotos.length > 0 && (
                        <div className="flex -space-x-4">
                            {localPhotos.slice(0, 3).map((p, i) => (
                                <div key={i} className="w-10 h-10 rounded-full bg-white/20 border-2 border-white overflow-hidden shadow-lg">
                                    <img src={p.url} className="w-full h-full object-cover blur-[1px]" />
                                </div>
                            ))}
                            {localPhotos.length > 3 && (
                                <div className="w-10 h-10 rounded-full bg-white text-coral-blue flex items-center justify-center text-[10px] font-black border-2 border-white shadow-lg">
                                    +{localPhotos.length - 3}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* INTEGRATED GRID GALLERY */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 ml-2 border-b border-gray-200 pb-2">
                    <DatabaseIcon className="w-4 h-4 text-gray-300" />
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Imagery Roster
                    </h3>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {/* UPLOAD BOX - NOW INTEGRATED INTO GRID */}
                    {!isSelectMode && (
                        <div 
                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                            onDragLeave={() => setIsDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => !isBusy && fileInputRef.current?.click()}
                            className={`aspect-square border-4 border-dashed rounded-[1.5rem] flex flex-col items-center justify-center gap-2 transition-all cursor-pointer shadow-inner relative overflow-hidden ${
                                isDragging ? 'border-coral-blue bg-blue-50 scale-[0.98]' : 'border-gray-200 bg-white hover:border-coral-blue hover:bg-blue-50/30'
                            } ${isBusy ? 'opacity-40 cursor-wait' : ''}`}
                        >
                            <div className={`p-3 bg-blue-50 rounded-2xl text-coral-blue shadow-sm transition-all`}>
                                {isBusy ? <ArrowPathIcon className="w-6 h-6 animate-spin" /> : <CameraIcon className="w-8 h-8" />}
                            </div>
                            <div className="text-center px-2">
                                <p className="text-[10px] font-black text-coral-dark uppercase tracking-widest leading-tight">
                                    {isBusy ? 'Wait...' : 'Add Photo'}
                                </p>
                                {!isBusy && <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mt-1">Drag or Tap</p>}
                            </div>
                            <input type="file" multiple accept="image/*,.heic,.heif" className="hidden" ref={fileInputRef} onChange={handleFileChange} disabled={isBusy} />
                        </div>
                    )}

                    {/* RENDER ALL PHOTOS (INCLUDING OPTIMISTIC LOCAL PREVIEWS) */}
                    {(photos || []).map((photo) => {
                        const isSelected = selectedPhotoIds.includes(String(photo.id));
                        const isLocal = String(photo.id).startsWith('LOCAL-');
                        
                        return (
                            <div 
                                key={photo.id} 
                                className={`relative aspect-square rounded-[1.5rem] overflow-hidden cursor-pointer shadow-sm group transition-all ${isSelected ? 'ring-4 ring-coral-blue ring-offset-2' : ''} ${isBusy && isSelectMode ? 'opacity-60 scale-95 grayscale-[0.3]' : ''}`}
                                onClick={() => isSelectMode && !isBusy ? (isSelected ? setSelectedPhotoIds(prev => prev.filter(id => id !== String(photo.id))) : setSelectedPhotoIds(prev => [...prev, String(photo.id)])) : null}
                            >
                                <img 
                                    src={resolveMediaUrl(photo.url, r2Settings)} 
                                    alt="Coral" 
                                    className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${isLocal ? 'blur-[2px] opacity-70' : ''}`}
                                />
                                
                                {isLocal && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 z-10 animate-fade-in">
                                        <ArrowPathIcon className="w-6 h-6 text-white animate-spin shadow-lg" />
                                        <span className="text-[7px] font-black text-white uppercase tracking-[0.2em] bg-coral-blue px-2 py-0.5 rounded-full shadow-lg border border-white/20">Securing</span>
                                    </div>
                                )}

                                {photo.isMain && (
                                    <div className="absolute top-2 left-2 p-1 bg-yellow-400 text-white rounded-lg shadow-lg border border-white">
                                        <StarIcon className="w-2.5 h-2.5"/>
                                    </div>
                                )}
                                {isSelectMode && !isLocal && (
                                    <div className={`absolute top-2 right-2 p-1 rounded-full border-2 shadow-md transition-all ${isSelected ? 'bg-coral-blue border-white text-white' : 'bg-white/50 border-white/50 text-transparent'}`}>
                                        <CheckCircleIcon className="w-3 h-3"/>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    
                    {permanentPhotos.length === 0 && isSelectMode && (
                        <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-100">
                             <p className="text-gray-300 font-black uppercase tracking-widest text-xs italic">Registry Empty</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        <footer className="p-6 border-t bg-white flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
            <div className="flex gap-2 w-full sm:w-auto">
                <button 
                  onClick={() => { setIsSelectMode(!isSelectMode); setSelectedPhotoIds([]); }} 
                  disabled={isBusy}
                  className={`flex-1 sm:flex-none px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${isSelectMode ? 'bg-coral-dark text-white shadow-xl' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'} disabled:opacity-20`}
                >
                  {isSelectMode ? 'Cancel' : 'Manage Gallery'}
                </button>
            </div>

            {isSelectMode ? (
                <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                        onClick={() => { onSetMainPhoto(selectedPhotoIds[0]); setIsSelectMode(false); setSelectedPhotoIds([]); }}
                        disabled={selectedPhotoIds.length !== 1 || isBusy}
                        className="flex-1 sm:flex-none px-8 py-5 bg-yellow-400 text-white font-black rounded-2xl text-[10px] uppercase shadow-xl disabled:opacity-30 active:scale-95 transition-all border-b-4 border-yellow-600"
                    >
                        Set Main
                    </button>
                    <button 
                        onClick={() => { if(confirm('Are you sure you want to delete photos?')) { onDeletePhotos(selectedPhotoIds); setIsSelectMode(false); setSelectedPhotoIds([]); } }}
                        disabled={selectedPhotoIds.length === 0 || isBusy}
                        className="flex-1 sm:flex-none px-8 py-5 bg-red-50 text-white font-black rounded-2xl text-[10px] uppercase shadow-xl disabled:opacity-30 active:scale-95 transition-all border-b-4 border-red-700"
                    >
                        Delete
                    </button>
                </div>
            ) : (
                <button 
                    onClick={onClose} 
                    className={`w-full sm:w-auto px-28 py-6 font-black rounded-[2rem] text-xs uppercase tracking-[0.4em] shadow-2xl active:scale-95 transition-all border-b-[10px] ${
                        isBusy ? 'bg-blue-600 text-white border-blue-800' : 'bg-coral-blue text-white border-blue-700 hover:brightness-110'
                    }`}
                >
                    {isBusy ? (
                        <div className="flex items-center gap-8">
                            <ArrowPathIcon className="w-6 h-6 animate-spin" />
                            <span>{isUploadActive ? 'UPLOADING...' : 'SYNCING...'}</span>
                        </div>
                    ) : 'Done'}
                </button>
            )}
        </footer>
      </div>
    </div>
  );
};

export default PhotoManagerModal;
