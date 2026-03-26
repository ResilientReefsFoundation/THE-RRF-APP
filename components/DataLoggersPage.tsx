
import * as React from 'react';
import type { FormEvent } from 'react';
import { TrashIcon, CloseIcon } from './Icons';
import type { TemperatureLogger, Site, Anchor } from '../types';

interface DataLoggersPageProps {
  onNavigateBack: () => void;
  tempLoggers: TemperatureLogger[];
  sites: Site[];
  anchors: Anchor[];
  onAddTempLogger: (siteId: string, anchorId: string, depth: number) => void;
  onRemoveTempLogger: (loggerId: string) => void;
}

const DEPTH_OPTIONS = Array.from({ length: 50 }, (_, i) => i + 1);

const DataLoggersPage: React.FC<DataLoggersPageProps> = ({ onNavigateBack, tempLoggers, sites: activeSites, anchors: activeAnchors, onAddTempLogger, onRemoveTempLogger }) => {
    const [isAddFormOpen, setIsAddFormOpen] = React.useState(false);
    const [loggerSiteId, setLoggerSiteId] = React.useState('');
    const [loggerAnchorId, setLoggerAnchorId] = React.useState('');
    const [loggerDepth, setLoggerDepth] = React.useState('');

    const handleAddLoggerSubmit = (e: FormEvent) => {
        e.preventDefault();
        onAddTempLogger(loggerSiteId, loggerAnchorId, parseFloat(loggerDepth));
        setLoggerSiteId(''); setLoggerAnchorId(''); setLoggerDepth('');
        setIsAddFormOpen(false);
    };

    const handleRemoveLogger = (id: string, siteName?: string, anchorName?: string) => {
        if (confirm(`REMOVE DATA LOGGER?\n\nThis will remove the logger at ${siteName || 'Unknown Site'} - ${anchorName || 'Unknown Anchor'} from the registry.`)) {
            onRemoveTempLogger(id);
        }
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg space-y-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4">
                <h2 className="text-2xl font-bold text-coral-dark mb-2 sm:mb-0">Data Loggers</h2>
                <button onClick={onNavigateBack} className="bg-gray-200 hover:bg-gray-300 text-coral-dark font-bold py-2 px-4 rounded-lg transition-colors duration-200 self-start sm:self-center">&larr; Back</button>
            </div>
      
            <div className="space-y-6">
                <div>
                  {!isAddFormOpen ? (
                    <button onClick={() => setIsAddFormOpen(true)} className="w-full bg-coral-blue text-white font-bold py-4 rounded-xl shadow-md hover:bg-opacity-90 transition-all uppercase tracking-widest text-sm">+ Register New Logger</button>
                  ) : (
                    <form onSubmit={handleAddLoggerSubmit} className="p-4 border-2 border-coral-blue rounded-xl space-y-4 bg-gray-50 animate-fade-in relative">
                        <button type="button" onClick={() => setIsAddFormOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"><CloseIcon className="w-5 h-5"/></button>
                        <h3 className="font-semibold text-coral-blue text-lg">Register Temperature Logger</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                            <div><label className="block text-sm font-medium text-gray-700">Site</label><select value={loggerSiteId} onChange={e => { setLoggerSiteId(e.target.value); setLoggerAnchorId(''); }} required className="mt-1 block w-full rounded-md border-gray-300 p-2 bg-white text-gray-900"><option value="">-- Choose --</option>{activeSites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                            <div><label className="block text-sm font-medium text-gray-700">Anchor</label><select value={loggerAnchorId} onChange={e => setLoggerAnchorId(e.target.value)} required disabled={!loggerSiteId} className="mt-1 block w-full rounded-md border-gray-300 p-2 bg-white text-gray-900 disabled:bg-gray-100"><option value="">-- Choose --</option>{activeAnchors.filter(a=>a.siteId===loggerSiteId).map(a => <option key={a.id} value={a.id}>{a.name}</option>)}</select></div>
                            <div><label className="block text-sm font-medium text-gray-700">Depth (m)</label><select value={loggerDepth} onChange={e => setLoggerDepth(e.target.value)} required className="mt-1 block w-full rounded-md border-gray-300 p-2 bg-white text-gray-900"><option value="">-- Select --</option>{DEPTH_OPTIONS.map(d => <option key={d} value={d}>{d}m</option>)}</select></div>
                            <div className="flex gap-2"><button type="button" onClick={() => setIsAddFormOpen(false)} className="flex-1 bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-lg">Cancel</button><button type="submit" className="flex-[2] bg-coral-blue text-white font-bold py-2 px-4 rounded-lg">Save</button></div>
                        </div>
                    </form>
                  )}
                </div>

                <div className="p-4 border border-gray-200 rounded-lg">
                    <h3 className="font-semibold text-gray-700 text-lg mb-4">Registered Loggers</h3>
                    {tempLoggers.length > 0 ? (
                        <ul className="divide-y divide-gray-200 bg-white border rounded-md">{tempLoggers.map(logger => {
                            const site = activeSites.find(s => s.id === logger.siteId);
                            const anchor = activeAnchors.find(a => a.id === logger.anchorId);
                            return (<li key={logger.id} className="p-3 flex justify-between items-center"><div><p className="font-semibold">{site?.name} - {anchor?.name}</p><p className="text-sm text-gray-500">Depth: {logger.depth}m</p></div><button onClick={() => handleRemoveLogger(logger.id, site?.name, anchor?.name)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-full"><TrashIcon className="w-5 h-5" /></button></li>);
                        })}</ul>
                    ) : <p className="text-center text-gray-500 py-4 italic">No loggers registered.</p>}
                </div>
            </div>
        </div>
    );
};

export default DataLoggersPage;
