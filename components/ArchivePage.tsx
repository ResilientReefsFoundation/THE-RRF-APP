
import * as React from 'react';
import type { ActivityLogItem, CoralBranch, Site, CollectionZone, Anchor, Tree, LogType, RubbleAnchor, Tank } from '../types';
import { ChevronDownIcon, CloseIcon } from './Icons';

type ArchiveableItemType = 'Site' | 'Collection Zone' | 'Anchor' | 'Tree' | 'Branch' | 'Rubble Anchor' | 'Tank';
const ARCHIVEABLE_ITEM_TYPES: ArchiveableItemType[] = ['Site', 'Collection Zone', 'Anchor', 'Tree', 'Branch', 'Rubble Anchor', 'Tank'];

interface ArchivePageProps {
  isReadOnly: boolean;
  activityLog: ActivityLogItem[];
  activeSites: Site[];
  archivedSites: Site[];
  activeZones: CollectionZone[];
  archivedZones: CollectionZone[];
  activeAnchors: Anchor[];
  archivedAnchors: Anchor[];
  activeTrees: Tree[];
  archivedTrees: Tree[];
  activeBranches: CoralBranch[];
  archivedBranches: CoralBranch[];
  activeRubbleAnchors?: RubbleAnchor[];
  archivedRubbleAnchors?: RubbleAnchor[];
  activeTanks?: Tank[];
  archivedTanks?: Tank[];
  onArchiveItem: (itemType: ArchiveableItemType, itemId: string) => void;
  onClearLog: () => void;
  onNavigateBack: () => void;
}

const LogSection: React.FC<{
  title: string;
  log: ActivityLogItem[];
  onExport: () => void;
}> = ({ title, log, onExport }) => {
  const [isOpen, setIsOpen] = React.useState(true);

  return (
    <div className="border-2 border-coral-blue rounded-lg overflow-hidden">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 bg-gray-50 p-3 border-b-2 border-coral-blue">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center text-left">
                <h3 className="font-semibold text-gray-700 text-lg">{title} ({log.length})</h3>
                <ChevronDownIcon className={`w-5 h-5 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            <button
                onClick={onExport}
                disabled={log.length === 0}
                className="text-sm bg-coral-green hover:bg-opacity-90 text-coral-dark font-semibold py-1 px-3 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed self-end sm:self-center"
            >
              Export
            </button>
        </div>
        {isOpen && (
            <div className="max-h-96 overflow-y-auto bg-white">
              {log.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {log.map(item => (
                    <li key={item.id} className="p-3">
                      <p className="text-sm text-gray-800">{item.message}</p>
                      <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleString()}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-center text-gray-500 p-8">No activity recorded for this category.</p>
              )}
            </div>
        )}
    </div>
  );
};


const ArchivePage: React.FC<ArchivePageProps> = ({ 
    isReadOnly,
    activityLog,
    activeSites, archivedSites,
    activeZones, archivedZones,
    activeAnchors, archivedAnchors,
    activeTrees, archivedTrees,
    activeBranches, archivedBranches,
    activeRubbleAnchors = [], archivedRubbleAnchors = [],
    activeTanks = [], archivedTanks = [],
    onArchiveItem,
    onClearLog, 
    onNavigateBack 
}) => {
  const [itemType, setItemType] = React.useState<ArchiveableItemType | ''>('');
  const [itemId, setItemId] = React.useState('');

  const movementLog = React.useMemo(() => activityLog.filter(item => item.type === 'movement'), [activityLog]);
  const monitoringLog = React.useMemo(() => activityLog.filter(item => item.type === 'monitoring'), [activityLog]);
  const maintenanceLog = React.useMemo(() => activityLog.filter(item => item.type === 'maintenance'), [activityLog]);
  const generalLog = React.useMemo(() => activityLog.filter(item => item.type === 'general'), [activityLog]);
  const archiveLog = React.useMemo(() => activityLog.filter(item => item.type === 'archive'), [activityLog]);


  const handleArchiveClick = () => {
    if (!itemType || !itemId) {
      alert('Please select an item type and an item to archive.');
      return;
    }
    if (isReadOnly) {
        alert("Session lock required to perform archival.");
        return;
    }

    const items = getItemsForType();
    const item = items.find(i => i.id === itemId);
    const itemName = item ? item.name : 'this item';

    if (confirm(`ARCHIVE ${itemType.toUpperCase()}: ${itemName}?\n\nThis will remove the item from all active nursery views. It can be found later in the logs but will not appear in the dashboard.`)) {
        onArchiveItem(itemType, itemId);
        setItemType('');
        setItemId('');
    }
  };

  const handleExportLog = (log: ActivityLogItem[], type: LogType) => {
    const logContent = log
      .map(item => `${new Date(item.timestamp).toLocaleString()}: ${item.message}`)
      .join('\n');
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const timestamp = new Date().toISOString().replace(/:/g, '-').slice(0, 19);
    link.download = `activity-log-${type}-${timestamp}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getItemsForType = () => {
      switch (itemType) {
          case 'Site': return activeSites.filter(s => !s.isArchived).map(s => ({ id: s.id, name: s.name }));
          case 'Collection Zone': return activeZones.filter(z => !z.isArchived).map(z => ({ id: z.id, name: z.name }));
          case 'Anchor': return activeAnchors.filter(a => !a.isArchived).map(a => ({ id: a.id, name: a.name }));
          case 'Tree': return activeTrees.filter(t => !t.isArchived).map(t => ({ id: t.id, name: `T${t.number}` }));
          case 'Branch': return activeBranches.filter(b => !b.isArchived).map(b => ({ id: b.id, name: b.fragmentId }));
          case 'Rubble Anchor': return activeRubbleAnchors.filter(a => !a.isArchived).map(a => ({ id: a.id, name: a.name }));
          // Correctly handle optional activeTanks and its items' properties
          case 'Tank': return (activeTanks || []).filter(t => !t.isArchived).map(t => ({ id: t.id, name: t.name }));
          default: return [];
      }
  };

  const getAllArchived = () => {
      const all = [
          ...archivedSites.map(s => `Site: ${s.name}`),
          ...archivedZones.map(z => `Collection Zone: ${z.name}`),
          ...archivedAnchors.map(a => `Anchor: ${a.name}`),
          ...archivedTrees.map(t => `Tree: T${t.number}`),
          ...archivedBranches.map(b => `Branch: ${b.fragmentId}`),
          ...archivedRubbleAnchors.map(a => `Rubble Anchor: ${a.name}`),
          ...archivedTanks.map(t => `Tank: ${t.name}`)
      ];
      return all;
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4">
        <h2 className="text-2xl font-bold text-coral-dark mb-2 sm:mb-0">Archive & Logs</h2>
        <button
          onClick={onNavigateBack}
          className="bg-gray-200 hover:bg-gray-300 text-coral-dark font-bold py-2 px-4 rounded-lg transition-colors duration-200 self-start sm:self-center"
        >
          &larr; Back to Dashboard
        </button>
      </div>

      {isReadOnly && (
          <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3 text-red-700 animate-fade-in shadow-sm">
              <CloseIcon className="w-6 h-6 shrink-0"/>
              <div>
                  <p className="font-black uppercase text-[10px] tracking-widest">Read-Only Mode Active</p>
                  <p className="text-sm font-medium">You must click <span className="font-black">"Start Session"</span> in the top header before you can move items to the archive. This ensures your changes are saved to the cloud.</p>
              </div>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Archive Items Section */}
          <div className={`p-4 border-2 border-coral-blue rounded-lg bg-gray-50 space-y-4 transition-opacity ${isReadOnly ? 'opacity-50' : ''}`}>
              <h3 className="font-semibold text-gray-700 text-lg">Archive Item</h3>
              <p className="text-sm text-gray-600">Soft delete items here. They remain in the database for analysis but are hidden from daily operations.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                  <div>
                      <label className="block text-sm font-medium text-gray-700">Item Type</label>
                      <select value={itemType} onChange={e => { setItemType(e.target.value as ArchiveableItemType); setItemId(''); }} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900">
                          <option value="">-- Select Type --</option>
                          {ARCHIVEABLE_ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-gray-700">Item</label>
                      <select value={itemId} onChange={e => setItemId(e.target.value)} disabled={!itemType} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white disabled:bg-gray-100 text-gray-900">
                          <option value="">-- Select Item --</option>
                          {getItemsForType().map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                      </select>
                  </div>
                  <button 
                    onClick={handleArchiveClick}
                    disabled={!itemType || !itemId || isReadOnly}
                    className="sm:col-span-2 w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:bg-gray-400 shadow-md"
                  >
                      {isReadOnly ? 'Session Required' : 'Move to Archive'}
                  </button>
              </div>
          </div>

          {/* Archived Items Explorer */}
          <div className="p-4 border-2 border-gray-100 rounded-lg bg-white space-y-4 shadow-inner">
              <h3 className="font-semibold text-gray-700 text-lg">Archived Assets Explorer</h3>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                  {getAllArchived().map((item, i) => (
                      <div key={i} className="text-sm text-gray-600 bg-gray-50 p-2 rounded border border-gray-200 flex justify-between items-center">
                          <span>{item}</span>
                          <span className="text-[9px] font-black text-coral-blue uppercase tracking-widest bg-blue-50 px-1.5 py-0.5 rounded">Archived</span>
                      </div>
                  ))}
                  {getAllArchived().length === 0 && <p className="text-center text-gray-400 py-10 italic">No archived assets yet.</p>}
              </div>
          </div>
      </div>

      {/* Logs Section */}
      <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-700 text-lg">Activity Logs</h3>
            <button onClick={() => { if(!isReadOnly && confirm('⚠️ WARNING: WIPE ACTIVITY LOGS? ⚠️\n\nThis will permanently delete the history of every movement, monitoring check, and maintenance task in the nursery. This cannot be undone.')) onClearLog(); }} disabled={isReadOnly} className="text-sm text-red-500 hover:underline disabled:opacity-30">Clear History</button>
          </div>
          
          <LogSection title="Archive History" log={archiveLog} onExport={() => handleExportLog(archiveLog, 'archive')} />
          <LogSection title="Movement History" log={movementLog} onExport={() => handleExportLog(movementLog, 'movement')} />
          <LogSection title="Monitoring History" log={monitoringLog} onExport={() => handleExportLog(monitoringLog, 'monitoring')} />
          <LogSection title="Maintenance History" log={maintenanceLog} onExport={() => handleExportLog(maintenanceLog, 'maintenance')} />
          <LogSection title="General Activity" log={generalLog} onExport={() => handleExportLog(generalLog, 'general')} />
      </div>
    </div>
  );
};

export default ArchivePage;
