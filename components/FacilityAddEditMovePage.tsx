import * as React from 'react';
import type { Page } from '../types';
import { 
  ArchiveBoxIcon, 
  HeartPulseIcon, 
  SunIcon, 
  SparklesIcon, 
  BeakerIcon, 
  ThermometerIcon, 
  Square2StackIcon 
} from './Icons';

interface FacilityAddEditMovePageProps {
  onNavigateBack: () => void;
  onNavigateToPage: (page: Page) => void;
}

const FacilityAddEditMovePage: React.FC<FacilityAddEditMovePageProps> = ({ onNavigateBack, onNavigateToPage }) => {
  const equipmentTypes = [
    { label: 'Tanks', icon: ArchiveBoxIcon, action: () => onNavigateToPage('facilityTanks') },
    { label: 'Pumps', icon: HeartPulseIcon, action: () => alert('Pumps management coming soon!') },
    { label: 'Lights', icon: SunIcon, action: () => alert('Lights management coming soon!') },
    { label: 'Power', icon: Square2StackIcon, action: () => alert('Power management coming soon!') },
    { label: 'Filters', icon: BeakerIcon, action: () => alert('Filters management coming soon!') },
    { label: 'Filter Socks', icon: BeakerIcon, action: () => alert('Filter Socks management coming soon!') },
    { label: 'Autospawners', icon: SparklesIcon, action: () => alert('Autospawners management coming soon!') },
    { label: 'Chillers', icon: ThermometerIcon, action: () => alert('Chillers management coming soon!') },
  ];

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 animate-fade-in">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-8">
        <h2 className="text-2xl font-bold text-coral-dark">Add / Edit Equipment</h2>
        <button
          onClick={onNavigateBack}
          className="bg-gray-100 hover:bg-gray-200 text-coral-dark font-bold py-2 px-4 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          <span>&larr; Back to Facility</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {equipmentTypes.map((btn, index) => (
          <button
            key={index}
            onClick={btn.action}
            className="bg-coral-blue text-white font-bold py-12 px-6 rounded-2xl shadow-lg hover:brightness-105 active:scale-[0.98] transition-all flex flex-col items-center justify-center gap-4 text-center min-h-[220px]"
          >
            <btn.icon className="w-14 h-14 opacity-90" />
            <span className="text-xl tracking-tight">{btn.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default FacilityAddEditMovePage;