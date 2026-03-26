
import * as React from 'react';
import type { FormEvent } from 'react';
import type { Tank, TankShape } from '../types';
import { ArchiveBoxIcon, TrashIcon, QrCodeIcon, CloseIcon } from './Icons';
import QRCodeLabelModal from './QRCodeLabelModal';

interface FacilityTanksPageProps {
  tanks: Tank[];
  onAddTank: (shape: TankShape, height: number, length?: number, width?: number, diameter?: number) => { id: string; name: string };
  onDeleteTank: (id: string) => void;
  onNavigateBack: () => void;
  highlightTankId?: string;
}

const FacilityTanksPage: React.FC<FacilityTanksPageProps> = ({ tanks, onAddTank, onDeleteTank, onNavigateBack, highlightTankId }) => {
  const [isAddFormOpen, setIsAddFormOpen] = React.useState(false);
  const [shape, setShape] = React.useState<TankShape>('Rectangle');
  const [height, setHeight] = React.useState('');
  const [length, setLength] = React.useState('');
  const [width, setWidth] = React.useState('');
  const [diameter, setDiameter] = React.useState('');
  const [calculatedVolume, setCalculatedVolume] = React.useState(0);
  const [showQR, setShowQR] = React.useState(false);
  const [createdItem, setCreatedItem] = React.useState<{id: string, name: string} | null>(null);

  React.useEffect(() => {
      const h = parseFloat(height) || 0;
      let vol = 0;
      if (shape === 'Rectangle') {
          const l = parseFloat(length) || 0; const w = parseFloat(width) || 0;
          if (l && w && h) vol = (l * w * h) / 1000;
      } else {
          const d = parseFloat(diameter) || 0;
          if (d && h) vol = (Math.PI * Math.pow(d/2, 2) * h) / 1000;
      }
      setCalculatedVolume(Math.round(vol));
  }, [shape, height, length, width, diameter]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = onAddTank(shape, parseFloat(height), length ? parseFloat(length) : undefined, width ? parseFloat(width) : undefined, diameter ? parseFloat(diameter) : undefined);
    if (result) { setCreatedItem({ id: result.id, name: result.name }); setShowQR(true); }
    setHeight(''); setLength(''); setWidth(''); setDiameter('');
    setIsAddFormOpen(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4"><h2 className="text-2xl font-bold text-coral-dark mb-2 sm:mb-0">Manage Tanks</h2><button onClick={onNavigateBack} className="bg-gray-200 hover:bg-gray-300 text-coral-dark font-bold py-2 px-4 rounded-lg transition-colors self-start sm:self-center">&larr; Back</button></div>

      <div>
        {!isAddFormOpen ? (
          <button onClick={() => setIsAddFormOpen(true)} className="w-full bg-coral-blue text-white font-bold py-4 rounded-xl shadow-md hover:bg-opacity-90 transition-all uppercase tracking-widest text-sm">+ Add New Tank</button>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 border-2 border-coral-blue rounded-xl space-y-6 bg-gray-50 animate-fade-in relative">
            <button type="button" onClick={() => setIsAddFormOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><CloseIcon className="w-5 h-5"/></button>
            <h3 className="font-semibold text-coral-blue text-lg">Add New Tank</h3>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Shape</label><div className="flex gap-4"><button type="button" onClick={() => setShape('Rectangle')} className={`flex-1 py-2 rounded-lg border-2 ${shape === 'Rectangle' ? 'border-coral-blue bg-blue-50 text-coral-blue' : 'bg-white border-gray-200'}`}>Rectangle</button><button type="button" onClick={() => setShape('Round')} className={`flex-1 py-2 rounded-lg border-2 ${shape === 'Round' ? 'border-coral-blue bg-blue-50 text-coral-blue' : 'bg-white border-gray-200'}`}>Round</button></div></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">{shape === 'Rectangle' ? (<><div><label className="block text-sm">Length (cm)</label><input type="number" value={length} onChange={e => setLength(e.target.value)} required className="w-full p-2 border rounded bg-white text-gray-900"/></div><div><label className="block text-sm">Width (cm)</label><input type="number" value={width} onChange={e => setWidth(e.target.value)} required className="w-full p-2 border rounded bg-white text-gray-900"/></div></>) : (<div><label className="block text-sm">Diameter (cm)</label><input type="number" value={diameter} onChange={e => setDiameter(e.target.value)} required className="w-full p-2 border rounded bg-white text-gray-900"/></div>)}<div><label className="block text-sm">Height (cm)</label><input type="number" value={height} onChange={e => setHeight(e.target.value)} required className="w-full p-2 border rounded bg-white text-gray-900"/></div></div>
            <div className="flex items-center justify-between pt-2"><div>Vol: <span className="text-xl font-bold text-coral-blue">{calculatedVolume}L</span></div><div className="flex gap-2"><button type="button" onClick={() => setIsAddFormOpen(false)} className="bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg">Cancel</button><button type="submit" className="bg-coral-blue text-white font-bold py-2 px-6 rounded-lg">Save Tank</button></div></div>
          </form>
        )}
      </div>

      <div>
        <h3 className="font-semibold text-gray-700 text-lg mb-4">Existing Tanks</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">{tanks.map(tank => (<div key={tank.id} className="bg-white border-2 border-gray-200 rounded-lg p-4 shadow-sm hover:border-coral-blue transition-colors flex flex-col justify-between"><div><div className="flex justify-between items-start mb-2"><div className="flex items-center gap-3"><div className="bg-coral-blue/10 p-2 rounded-full text-coral-blue"><ArchiveBoxIcon className="w-6 h-6"/></div><h4 className="font-bold text-xl">{tank.name}</h4></div><span className="text-xs font-semibold bg-gray-100 px-2 py-1 rounded">{tank.shape}</span></div><div className="text-sm text-gray-600 mt-3"><p>Dim: {tank.shape==='Rectangle' ? `${tank.length}x${tank.width}x${tank.height}` : `Ø${tank.diameter}x${tank.height}`} cm</p><p className="font-bold text-coral-blue">{tank.volume} L</p></div></div><div className="mt-4 pt-3 border-t flex justify-between"><button onClick={() => { setCreatedItem({id:tank.name, name:tank.name}); setShowQR(true); }} className="text-sm bg-gray-100 p-2 rounded flex items-center gap-2"><QrCodeIcon className="w-4 h-4"/> Label</button><button onClick={() => { if(confirm(`DELETE TANK: ${tank.name}?\nAll historical logs for this tank will be detached.`)) onDeleteTank(tank.id); }} className="text-red-500 p-2 rounded hover:bg-red-50" title="Delete Tank"><TrashIcon className="w-5 h-5"/></button></div></div>))}</div>
      </div>
      {createdItem && <QRCodeLabelModal isOpen={showQR} onClose={() => setShowQR(false)} itemId={createdItem.id} itemName={createdItem.name} itemType="Tank" />}
    </div>
  );
};

export default FacilityTanksPage;
