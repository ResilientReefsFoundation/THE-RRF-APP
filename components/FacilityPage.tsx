import * as React from 'react';
import type { Page, LockData } from '../types';
import { 
  ClipboardListIcon, 
  PencilIcon, 
  ArchiveBoxIcon, 
  BriefcaseIcon, 
  ShoppingBagIcon, 
  SparklesIcon, 
  MoonIcon, 
  BeakerIcon 
} from './Icons';

interface FacilityPageProps {
  onNavigateBack: () => void;
  onNavigateToPage: (page: Page) => void;
  lockInfo: LockData | null;
  currentSessionId: string;
  isReadOnly: boolean;
}

const FacilityPage: React.FC<FacilityPageProps> = ({ onNavigateBack, onNavigateToPage, lockInfo, currentSessionId, isReadOnly }) => {
  const isLockedByOthers = lockInfo && lockInfo.sessionId !== currentSessionId;
  const showAsLocked = isLockedByOthers && isReadOnly;

  const facilityButtons = [
    { label: 'Daily Tasks', icon: ClipboardListIcon, action: () => onNavigateToPage('facilityDailyTasks') },
    { label: 'Add/Edit/Move Equipment', icon: PencilIcon, action: () => onNavigateToPage('facilityAddEditMove') },
    { label: 'Tanks', icon: ArchiveBoxIcon, action: () => onNavigateToPage('facilityTanks') },
    { label: 'Dive Gear', icon: BriefcaseIcon, action: () => onNavigateToPage('diveGear') },
    { label: 'Merchandise', icon: ShoppingBagIcon, action: () => onNavigateToPage('merchandise') },
    { label: 'Autospawners', icon: SparklesIcon, action: () => alert('Autospawner management coming soon!') },
    { label: 'Clams', icon: MoonIcon, action: () => alert('Clam inventory coming soon!') },
    { label: 'Water Quality', icon: BeakerIcon, action: () => alert('Water quality logs coming soon!') },
  ];

  const handleAction = (btn: any) => {
    if (showAsLocked) {
        alert(`Facility Access Denied: Equipment is currently being managed by ${lockInfo?.lockedBy}.`);
        return;
    }
    btn.action();
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 animate-fade-in">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-8">
        <h2 className="text-2xl font-bold text-coral-dark">Facility Management</h2>
        <button
          onClick={onNavigateBack}
          className="bg-gray-100 hover:bg-gray-200 text-coral-dark font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          <span>&larr; Back to Dashboard</span>
        </button>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all ${showAsLocked ? 'opacity-40 pointer-events-none grayscale' : 'opacity-100'}`}>
        {facilityButtons.map((btn, index) => (
          <button
            key={index}
            onClick={() => handleAction(btn)}
            className="bg-coral-blue text-white font-bold py-12 px-6 rounded-2xl shadow-lg hover:brightness-105 active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-4 text-center min-h-[220px]"
          >
            <btn.icon className="w-14 h-14 opacity-90" />
            <span className="text-xl tracking-tight">{btn.label}</span>
          </button>
        ))}
      </div>

      {showAsLocked && (
        <div className="text-center p-8 mt-12 bg-red-50 rounded-2xl border-2 border-dashed border-red-200">
            <p className="text-red-500 font-bold mb-1 uppercase tracking-wider text-xs">Facility Locked</p>
            <p className="text-gray-600 font-medium italic">
                Logs and equipment are currently being managed by {lockInfo?.lockedBy}.
            </p>
        </div>
      )}
    </div>
  );
};

export default FacilityPage;