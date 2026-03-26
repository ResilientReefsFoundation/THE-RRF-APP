import * as React from 'react';
import type { AddEditSection, Page } from '../types';
import { CloseIcon } from './Icons';

interface SideMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToAddEdit: (section: AddEditSection) => void;
  onNavigateToPage: (page: Page) => void;
  isLockedByOthers: boolean;
  lockedBy?: string;
  currentPage?: Page;
}

const SideMenu: React.FC<SideMenuProps> = ({ isOpen, onClose, onNavigateToPage, isLockedByOthers, lockedBy, currentPage }) => {
  const handlePageNav = (page: Page) => {
    onNavigateToPage(page);
    onClose();
  };
  
  return (
    <>
      <div
        className={`fixed inset-0 bg-black/60 z-[100] transition-opacity duration-300 ease-in-out ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      ></div>

      <div
        className={`fixed top-0 left-0 h-full bg-white w-72 shadow-2xl z-[110] transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="menu-title"
      >
        <div className="flex flex-col h-full overflow-hidden">
          <header className="p-6 flex justify-between items-center border-b shrink-0 bg-coral-dark">
            <div>
              <h2 id="menu-title" className="text-xl font-black text-white uppercase tracking-tighter italic">Registry</h2>
              <p className="text-[9px] font-black text-coral-blue uppercase tracking-widest mt-1 opacity-60">System Navigation</p>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors" aria-label="Close menu">
              <CloseIcon className="w-5 h-5 text-white" />
            </button>
          </header>
          
          <nav className="flex-grow overflow-y-auto py-2 custom-scrollbar bg-white">
            <div className="flex flex-col">
              <MenuItem label="Dashboard" onClick={() => handlePageNav('dashboard')} active={currentPage === 'dashboard'} />
              <MenuItem label="Schedule" onClick={() => handlePageNav('operationalSchedule')} active={currentPage === 'operationalSchedule'} />
              <MenuItem label="Facility" onClick={() => handlePageNav('facility')} active={['facility', 'facilityDailyTasks', 'facilityAddEditMove', 'facilityTanks', 'diveGear', 'merchandise'].includes(currentPage || '')} />
              
              <div className="my-2 border-y border-gray-50 bg-gray-50/30">
                <MenuItem label="Media Gallery (Classic)" onClick={() => handlePageNav('photoViewer')} active={currentPage === 'photoViewer'} />
                <MenuItem label="react photo album (New)" onClick={() => handlePageNav('photoAlbum')} active={currentPage === 'photoAlbum'} />
              </div>

              <MenuItem label="Notes / ToDo" onClick={() => handlePageNav('notesToDo')} active={currentPage === 'notesToDo'} />
              <MenuItem label="Add / Edit Hub" onClick={() => handlePageNav('addEditItems')} active={['addEditItems', 'sites', 'anchors', 'collectionZones', 'substrateZones', 'rubbleAnchors', 'trees', 'reef2s', 'reef3s', 'ropeUnits', 'deviceClusters', 'floatManagement', 'numberingSystem', 'qrGenerator', 'dataLoggers'].includes(currentPage || '')} />
              <MenuItem label="Monitoring" onClick={() => handlePageNav('monitoring')} active={currentPage === 'monitoring' || currentPage === 'details' || currentPage === 'rubbleAnchorDetails' || currentPage === 'healthReports' || currentPage === 'growthReports'} />
              <MenuItem label="Environmental" onClick={() => handlePageNav('environmental')} active={currentPage === 'environmental'} />
              <MenuItem label="Spawning" onClick={() => handlePageNav('spawning')} active={currentPage === 'spawning'} />
              <MenuItem label="Species ID" onClick={() => handlePageNav('speciesId')} active={currentPage === 'speciesId'} />
              <MenuItem label="Reports / Forms" onClick={() => handlePageNav('reports')} active={currentPage === 'reports' || currentPage === 'rules'} />
              <MenuItem label="Experiments" onClick={() => handlePageNav('experiments')} active={['experiments', 'treeShadeExperiment', 'ropeOnRubbleExperiment', 'squareRopeFrameExperiment', 'cubeRopeFrameExperiment'].includes(currentPage || '')} />
              <MenuItem label="Trends" onClick={() => handlePageNav('trends')} active={currentPage === 'trends'} />
              <MenuItem label="Personnel" onClick={() => handlePageNav('people')} active={currentPage === 'people'} />
              <MenuItem label="Volunteer Portal" onClick={() => handlePageNav('volunteerPortal')} active={currentPage === 'volunteerPortal'} />
              <MenuItem label="Design Locks" onClick={() => handlePageNav('siteDesign')} active={currentPage === 'siteDesign'} />
              <MenuItem label="Project Progress" onClick={() => handlePageNav('projectProgress')} active={currentPage === 'projectProgress'} />
              <MenuItem label="Backup / Restore" onClick={() => handlePageNav('backupRestore')} active={currentPage === 'backupRestore'} />
              <MenuItem label="Settings" onClick={() => handlePageNav('settings')} active={currentPage === 'settings' || currentPage === 'systemMap'} />
            </div>
          </nav>
          
          {isLockedByOthers && (
            <footer className="p-4 bg-red-600 shrink-0">
              <p className="text-[10px] font-black text-white uppercase tracking-widest text-center italic">
                LOCKED BY {lockedBy ? lockedBy.toUpperCase() : 'USER'}
              </p>
            </footer>
          )}
        </div>
      </div>
    </>
  );
};

const MenuItem: React.FC<{
  label: string;
  onClick: () => void;
  active: boolean;
}> = ({ label, onClick, active }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center px-8 py-4 text-left transition-all border-l-4 ${
      active 
        ? 'bg-blue-50 text-coral-blue border-coral-blue font-black' 
        : 'text-gray-600 border-transparent hover:bg-gray-50 font-bold'
    }`}
  >
    <span className="text-[11px] uppercase tracking-[0.2em]">
      {label}
    </span>
  </button>
);

export default SideMenu;