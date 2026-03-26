import * as React from 'react';
import type { AddEditSection, CoralBranch, Page, LockData } from '../types';
import { 
  GlobeAltIcon, 
  DatabaseIcon, 
  PlusCircleIcon, 
  CubeIcon, 
  PencilIcon, 
  ClipboardListIcon,
  ChevronDownIcon,
  QrCodeIcon,
  CalendarIcon
} from './Icons';

const SECTIONS_CONFIG: { label: AddEditSection; icon: any; page: Page }[] = [
  { label: 'Sites', icon: GlobeAltIcon, page: 'sites' },
  { label: 'Collection Zones', icon: DatabaseIcon, page: 'collectionZones' },
  { label: 'Anchors', icon: DatabaseIcon, page: 'anchors' },
  { label: 'Substrate Zones', icon: GlobeAltIcon, page: 'substrateZones' },
  { label: 'Rubble Anchors', icon: DatabaseIcon, page: 'rubbleAnchors' },
  { label: 'Trees', icon: CubeIcon, page: 'trees' },
  { label: 'Reef²', icon: CubeIcon, page: 'reef2s' },
  { label: 'Reef³', icon: CubeIcon, page: 'reef3s' },
  { label: 'Branches', icon: PencilIcon, page: 'branches' },
  { label: 'Strings', icon: PencilIcon, page: 'ropeUnits' },
  { label: 'Device Clusters', icon: CubeIcon, page: 'deviceClusters' },
  { label: 'Floats', icon: ChevronDownIcon, page: 'floatManagement' },
  { label: 'Rules', icon: ClipboardListIcon, page: 'rules' },
];

interface AddEditItemsPageProps {
  initialSection: AddEditSection;
  activeBranches: CoralBranch[];
  onSelectBranch: (branchId: string) => void;
  onNavigateBack: () => void;
  onNavigateToPage: (page: Page) => void;
  lockInfo: LockData | null;
  isCheckingLock: boolean;
  onCheckLock: () => Promise<LockData | null>;
  onAcquireLock: () => Promise<boolean>;
  onReleaseLock: () => Promise<void>;
  userName?: string;
  currentSessionId: string;
  isReadOnly: boolean;
}

const AddEditItemsPage: React.FC<AddEditItemsPageProps> = ({
  onNavigateBack,
  onNavigateToPage,
  lockInfo,
  currentSessionId,
  onAcquireLock,
  isReadOnly
}) => {
  const isLockedByOthers = lockInfo && lockInfo.sessionId !== currentSessionId;
  const showAsLocked = isLockedByOthers && isReadOnly;

  const handleSectionClick = async (page: Page) => {
    if (showAsLocked) {
        alert(`Access Denied: Application is currently locked by ${lockInfo.lockedBy}.`);
        return;
    }
    // Only attempt lock acquisition if we aren't already an admin and aren't the owner
    if (!isReadOnly && isLockedByOthers === false && lockInfo === null) {
        await onAcquireLock();
    }
    onNavigateToPage(page);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 animate-fade-in">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-8">
        <h2 className="text-2xl font-bold text-coral-dark">Nursery Registry</h2>
        <button
          onClick={onNavigateBack}
          className="bg-gray-100 hover:bg-gray-200 text-coral-dark font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          <span>&larr; Back to Dashboard</span>
        </button>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 transition-all ${showAsLocked ? 'opacity-40 pointer-events-none grayscale' : 'opacity-100'}`}>
        {SECTIONS_CONFIG.map((section, index) => (
          <button
            key={index}
            onClick={() => handleSectionClick(section.page)}
            className="bg-coral-blue text-white font-bold py-12 px-6 rounded-2xl shadow-lg hover:brightness-105 active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-4 text-center min-h-[220px]"
          >
            <section.icon className="w-14 h-14 opacity-90" />
            <span className="text-xl tracking-tight">{section.label}</span>
          </button>
        ))}

        <button
          onClick={() => handleSectionClick('numberingSystem')}
          className="bg-coral-blue text-white font-bold py-12 px-6 rounded-2xl shadow-lg hover:brightness-105 active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-4 text-center min-h-[220px]"
        >
          <ClipboardListIcon className="w-14 h-14 opacity-90" />
          <span className="text-xl tracking-tight">Prefix Settings</span>
        </button>

        <button
          onClick={() => handleSectionClick('dataLoggers')}
          className="bg-coral-blue text-white font-bold py-12 px-6 rounded-2xl shadow-lg hover:brightness-105 active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-4 text-center min-h-[220px]"
        >
          <DatabaseIcon className="w-14 h-14 opacity-90" />
          <span className="text-xl tracking-tight">Data Loggers</span>
        </button>

        <button
          onClick={() => handleSectionClick('qrGenerator')}
          className="bg-coral-blue text-white font-bold py-12 px-6 rounded-2xl shadow-lg hover:brightness-105 active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-4 text-center min-h-[220px]"
        >
          <QrCodeIcon className="w-14 h-14 opacity-90" />
          <span className="text-xl tracking-tight">QR Generator</span>
        </button>

        <button
          onClick={() => handleSectionClick('schedule')}
          className="bg-coral-blue text-white font-bold py-12 px-6 rounded-2xl shadow-lg hover:brightness-105 active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-4 text-center min-h-[220px]"
        >
          <CalendarIcon className="w-14 h-14 opacity-90" />
          <span className="text-xl tracking-tight">Raising Schedule</span>
        </button>
      </div>

      {showAsLocked && (
        <div className="text-center p-12 mt-12 bg-red-50/50 rounded-[2.5rem] border-2 border-dashed border-red-200 animate-pulse flex flex-col items-center gap-2">
            <div className="flex items-center gap-3 text-red-600 font-black text-xs uppercase tracking-[0.3em] mb-1">
                <div className="w-2.5 h-2.5 bg-red-600 rounded-full shadow-[0_0_8px_rgba(220,38,38,0.5)]"></div>
                LOCKED BY {lockInfo?.lockedBy ? lockInfo.lockedBy.toUpperCase() : 'ANOTHER USER'}
            </div>
            <p className="text-gray-500 font-bold italic text-sm">
                Registry write-access is reserved for the active field scientist.
            </p>
        </div>
      )}
    </div>
  );
};

export default AddEditItemsPage;