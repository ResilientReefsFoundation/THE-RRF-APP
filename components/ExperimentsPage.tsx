import * as React from 'react';
import type { Page, LockData } from '../types';
import { 
  BeakerIcon, 
  ArrowPathIcon, 
  Square2StackIcon, 
  CubeIcon, 
  SparklesIcon 
} from './Icons';

interface ExperimentsPageProps {
  onNavigateToPage: (page: Page) => void;
  lockInfo: LockData | null;
  currentSessionId: string;
  isReadOnly: boolean;
}

const ExperimentsPage: React.FC<ExperimentsPageProps> = ({ onNavigateToPage, lockInfo, currentSessionId, isReadOnly }) => {
  const isLockedByOthers = lockInfo && lockInfo.sessionId !== currentSessionId;
  const showAsLocked = isLockedByOthers && isReadOnly;

  const experimentButtons = [
    { label: 'Tree Shade', icon: BeakerIcon, action: () => onNavigateToPage('treeShadeExperiment') },
    { label: 'Rope on Rubble', icon: ArrowPathIcon, action: () => onNavigateToPage('ropeOnRubbleExperiment') },
    { label: 'Square Rope Frame', icon: Square2StackIcon, action: () => onNavigateToPage('squareRopeFrameExperiment') },
    { label: 'Cube Rope Frame', icon: CubeIcon, action: () => onNavigateToPage('cubeRopeFrameExperiment') },
    { label: 'Coming Soon', icon: SparklesIcon, action: () => {}, disabled: true },
    { label: 'Coming Soon', icon: SparklesIcon, action: () => {}, disabled: true },
  ];

  const handleAction = (btn: any) => {
    if (showAsLocked) {
        alert(`Experiment Access Denied: System is currently being updated by ${lockInfo?.lockedBy}.`);
        return;
    }
    btn.action();
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 animate-fade-in">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-8">
        <h2 className="text-2xl font-bold text-coral-dark">Experiments</h2>
        <button
          onClick={() => onNavigateToPage('dashboard')}
          className="bg-gray-100 hover:bg-gray-200 text-coral-dark font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          <span>&larr; Back to Dashboard</span>
        </button>
      </div>

      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all ${showAsLocked ? 'opacity-40 pointer-events-none grayscale' : 'opacity-100'}`}>
        {experimentButtons.map((btn, index) => (
          <button
            key={index}
            onClick={() => handleAction(btn)}
            disabled={btn.disabled}
            className={`bg-coral-blue text-white font-bold py-12 px-6 rounded-2xl shadow-lg transition-all flex flex-col items-center justify-center gap-4 text-center min-h-[220px] ${
              btn.disabled ? 'opacity-40 cursor-not-allowed' : 'hover:brightness-105 active:scale-[0.98]'
            }`}
          >
            <btn.icon className="w-14 h-14 opacity-90" />
            <span className="text-xl tracking-tight">{btn.label}</span>
          </button>
        ))}
      </div>

      {showAsLocked && (
        <div className="text-center p-8 mt-12 bg-red-50 rounded-2xl border-2 border-dashed border-red-200">
            <p className="text-red-500 font-bold mb-1 uppercase tracking-wider text-xs">Research Locked</p>
            <p className="text-gray-600 font-medium italic">
                Ongoing studies are currently being recorded by ${lockInfo?.lockedBy}.
            </p>
        </div>
      )}
    </div>
  );
};

export default ExperimentsPage;