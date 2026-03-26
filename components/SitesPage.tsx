
import * as React from 'react';
import type { FormEvent, ChangeEvent } from 'react';
import type { Site } from '../types';
import { CloseIcon, PencilIcon, UploadIcon, CameraIcon, TrashIcon } from './Icons';
import QRCodeLabelModal from './QRCodeLabelModal';

interface SitesPageProps {
  isReadOnly: boolean;
  sites: Site[];
  onAddSite: (name: string, photoUrl: string) => string;
  onUpdateSite: (updatedSite: Site) => void;
  onArchiveSite: (id: string) => void;
  onNavigateBack: () => void;
}

const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 1024;
                const MAX_HEIGHT = 1024;
                let width = img.width;
                let height = img.height;
                if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
                else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0, width, height);
                resolve(canvas.toDataURL('image/jpeg', 0.7)); 
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

const EditSiteModal: React.FC<{
  site: Site; onClose: () => void; onUpdateSite: (updatedSite: Site) => void;
}> = ({ site, onClose, onUpdateSite }) => {
  const [name, setName] = React.useState(site.name);
  const [previewUrl, setPreviewUrl] = React.useState<string>(site.photoUrl);
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) compressImage(e.target.files[0]).then(setPreviewUrl);
  };
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onUpdateSite({ ...site, name, photoUrl: previewUrl });
    onClose();
  };
  return (
     <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative">
        <form onSubmit={handleSubmit}>
            <header className="p-4 border-b flex justify-between items-center"><h2 className="text-xl font-bold text-coral-dark">Edit Site</h2><button type="button" onClick={onClose} className="text-gray-500 hover:text-gray-800"><CloseIcon className="w-6 h-6"/></button></header>
            <div className="p-6 space-y-4">
                <div><label className="block text-sm font-medium text-gray-700">Site Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900 border"/></div>
                <div><label className="block text-sm font-medium text-gray-700">Site Photo</label><div className="mt-1 flex items-center gap-4">{previewUrl ? <img src={previewUrl} className="w-24 h-24 object-cover rounded-lg"/> : <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300"><CameraIcon className="w-8 h-8" /></div>}<label className="cursor-pointer bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"><span>Change</span><input type="file" className="sr-only" onChange={handleFileChange} accept="image/*"/></label></div></div>
            </div>
            <footer className="p-4 bg-gray-50 rounded-b-2xl flex justify-end gap-2"><button type="button" onClick={onClose} className="bg-gray-200 text-coral-dark font-bold py-2 px-4 rounded-lg">Cancel</button><button type="submit" className="bg-coral-green text-coral-dark font-bold py-2 px-4 rounded-lg">Save</button></footer>
        </form>
      </div>
    </div>
  );
};

const SitesPage: React.FC<SitesPageProps> = ({ isReadOnly, sites, onAddSite, onUpdateSite, onArchiveSite, onNavigateBack }) => {
  const [isAddFormOpen, setIsAddFormOpen] = React.useState(false);
  const [newSiteName, setNewSiteName] = React.useState('');
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [editingSite, setEditingSite] = React.useState<Site | null>(null);
  const [showQR, setShowQR] = React.useState(false);
  const [createdItem, setCreatedItem] = React.useState<{id: string, name: string} | null>(null);

  const activeSites = React.useMemo(() => sites.filter(s => !s.isArchived), [sites]);

  const handleAddSite = (e: FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    if (newSiteName.trim()) {
      const newId = onAddSite(newSiteName.trim(), previewUrl || '');
      setCreatedItem({ id: newId, name: newSiteName.trim() }); setShowQR(true);
      setNewSiteName(''); setPreviewUrl(null);
      setIsAddFormOpen(false);
    } else alert('Please provide a site name.');
  };

  return (
    <>
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg space-y-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4">
          <h2 className="text-2xl font-bold text-coral-dark mb-2 sm:mb-0">Manage Sites</h2>
          <button onClick={onNavigateBack} className="bg-gray-200 hover:bg-gray-300 text-coral-dark font-bold py-2 px-4 rounded-lg transition-colors self-start sm:self-center">&larr; Back</button>
        </div>

        <div>
          {!isAddFormOpen ? (
            <button onClick={() => setIsAddFormOpen(true)} disabled={isReadOnly} className="w-full bg-coral-blue text-white font-bold py-4 rounded-xl shadow-md hover:bg-opacity-90 transition-all uppercase tracking-widest text-sm disabled:opacity-50">+ Add New Site</button>
          ) : (
            <form onSubmit={handleAddSite} className="p-4 border-2 border-coral-blue rounded-xl space-y-4 bg-gray-50 animate-fade-in relative">
              <button type="button" onClick={() => setIsAddFormOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><CloseIcon className="w-5 h-5"/></button>
              <h3 className="font-semibold text-coral-blue text-lg">Add New Site</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div><label className="block text-sm font-medium text-gray-700">Site Name</label><input type="text" value={newSiteName} onChange={e => setNewSiteName(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900 border"/></div>
                <div className="flex items-end gap-4">
                  {previewUrl ? <img src={previewUrl} className="w-20 h-20 object-cover rounded-lg"/> : <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 border border-gray-300"><CameraIcon className="w-8 h-8" /></div>}
                  <div className="flex-grow"><label className="block text-sm font-medium text-gray-700">Photo (Opt)</label><input type="file" onChange={e => e.target.files?.[0] && compressImage(e.target.files[0]).then(setPreviewUrl)} accept="image/*" className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-coral-blue/10 file:text-coral-blue hover:file:bg-coral-blue/20"/></div>
                </div>
              </div>
              <div className="flex justify-end gap-2"><button type="button" onClick={() => setIsAddFormOpen(false)} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg">Cancel</button><button type="submit" className="bg-coral-blue text-white font-bold py-2 px-4 rounded-lg">Save Site</button></div>
            </form>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-gray-700 text-lg mb-4">Current Sites</h3>
          {activeSites.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeSites.map(site => (
                <div key={site.id} className="border-2 border-coral-blue rounded-lg shadow-sm overflow-hidden group bg-white">
                  {site.photoUrl ? <img src={site.photoUrl} className="w-full h-40 object-cover" alt={site.name}/> : <div className="w-full h-40 bg-gray-100 flex flex-col items-center justify-center text-gray-400"><CameraIcon className="w-12 h-12 mb-2" /><span className="text-sm font-bold uppercase tracking-widest text-[10px]">No Photo</span></div>}
                  <div className="p-4 flex justify-between items-center">
                    <h4 className="font-bold text-coral-dark truncate mr-2">{site.name}</h4>
                    <div className="flex gap-1 shrink-0">
                        <button onClick={() => setEditingSite(site)} disabled={isReadOnly} className="p-2 rounded-lg hover:bg-blue-50 text-blue-600 border border-transparent hover:border-blue-100 transition-all disabled:opacity-30" title="Edit Site">
                            <PencilIcon className="w-5 h-5"/>
                        </button>
                        <button onClick={() => { if(!isReadOnly && confirm(`ARCHIVE SITE: ${site.name}?\nAll assets associated with this site will also be hidden.`)) onArchiveSite(site.id); }} disabled={isReadOnly} className="p-2 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 border border-transparent hover:border-red-100 transition-all disabled:opacity-30" title="Archive & Remove Site">
                            <TrashIcon className="w-5 h-5"/>
                        </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-center text-gray-500 py-10 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">No sites added yet.</p>}
        </div>
      </div>
      {editingSite && <EditSiteModal site={editingSite} onClose={() => setEditingSite(null)} onUpdateSite={onUpdateSite} />}
      {createdItem && <QRCodeLabelModal isOpen={showQR} onClose={() => setShowQR(false)} itemId={createdItem.name} itemName={createdItem.name} itemType="Site" />}
    </>
  );
};

export default SitesPage;
