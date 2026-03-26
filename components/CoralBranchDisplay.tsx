import * as React from 'react';
import type { CoralBranch, ActivityLogItem, PrefixSettings, StructureType, SubstrateZone, R2Settings, SpawningEventDetails } from '../types';
import { 
    ArrowUpIcon, 
    ArrowDownIcon, 
    MinusIcon, 
    QrCodeIcon, 
    CameraIcon, 
    SparklesIcon, 
    GlobeAltIcon,
    CalendarIcon,
    ChevronRightIcon,
    ArrowRightOnRectangleIcon,
    HeartPulseIcon,
    BeakerIcon,
    StarIcon,
    ArchiveBoxIcon,
    // Fix: Add missing SunIcon import
    SunIcon
} from './Icons';
import { resolveMediaUrl } from './SpeciesIdPage';
import HealthChart from './HealthChart';
import GrowthChart from './GrowthChart';
import QRCodeLabelModal from './QRCodeLabelModal';
import QRCode from 'qrcode';

interface CoralBranchDisplayProps {
  branch: CoralBranch;
  substrateZone?: SubstrateZone;
  activityLog: ActivityLogItem[];
  r2Settings: R2Settings | null;
  prefixSettings: PrefixSettings;
  isReadOnly: boolean;
  onOpenPhotoManager: () => void;
  onNavigateToHealthReports: () => void;
  onNavigateToGrowthReports: () => void;
  onEdit: (branch: CoralBranch) => void;
  onMove: (branch: CoralBranch) => void;
}

const calculateAgeInDays = (dateString: string): number => {
  const addedDate = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - addedDate.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

const formatAge = (totalDays: number): string => {
  if (totalDays === 0) return "Added today";
  if (totalDays < 365) return `${totalDays} ${totalDays === 1 ? 'day' : 'days'}`;
  const years = Math.floor(totalDays / 365);
  const remainingDays = totalDays % 365;
  const yearText = `${years} ${years === 1 ? 'year' : 'years'}`;
  if (remainingDays === 0) return yearText;
  return `${yearText} and ${remainingDays} ${remainingDays === 1 ? 'day' : 'days'}`;
};

const getHealthTheme = (percentage: number) => {
    if (percentage >= 80) return { bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200', dot: 'bg-green-500' };
    if (percentage >= 50) return { bg: 'bg-yellow-50', text: 'text-yellow-600', border: 'border-yellow-200', dot: 'bg-yellow-500' };
    return { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', dot: 'bg-red-500' };
};

const SectionHeader: React.FC<{ title: string; icon: any; color?: string }> = ({ title, icon: Icon, color = "text-coral-blue" }) => (
    <div className="flex items-center gap-2 mb-4 border-b border-gray-100 pb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">{title}</h3>
    </div>
);

const DetailRow: React.FC<{ label: string; value: string | number; icon?: any }> = ({ label, value, icon: Icon }) => (
  <div className="flex justify-between items-center py-3 border-b border-gray-50 last:border-b-0 group">
    <div className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4 text-gray-300 group-hover:text-coral-blue transition-colors" />}
        <span className="text-gray-500 text-xs font-bold uppercase tracking-tight">{label}</span>
    </div>
    <span className="font-black text-coral-dark text-sm">{value}</span>
  </div>
);

const SpawningDataCard: React.FC<{ details: SpawningEventDetails }> = ({ details }) => (
    <div className="bg-purple-50/50 p-8 rounded-[2rem] border-2 border-purple-100 shadow-sm space-y-6 animate-fade-in">
        <SectionHeader title="Heritage & Spawning" icon={SparklesIcon} color="text-purple-600" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
            <DetailRow label="Spawn Date" value={new Date(details.spawnDate).toLocaleDateString()} />
            <DetailRow label="Settlement" value={new Date(details.settlementDate).toLocaleDateString()} />
            <DetailRow label="Primary Tank" value={details.tankId || 'N/A'} />
            <DetailRow label="Auto-Spawner" value={details.autoSpawnerId || 'N/A'} />
            <DetailRow label="Grow-out Tank" value={details.growOutTankId || 'N/A'} />
            <DetailRow label="Entry Date" value={details.growOutEntryDate ? new Date(details.growOutEntryDate).toLocaleDateString() : 'N/A'} />
            <DetailRow label="Exit Date" value={details.growOutExitDate ? new Date(details.growOutExitDate).toLocaleDateString() : 'N/A'} />
            <DetailRow label="Target Temp" value={`${details.growOutTemp}°C`} />
        </div>

        {details.parents && details.parents.length > 0 && (
            <div className="mt-4 pt-4 border-t border-purple-100">
                <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-3">Parent Lineage</p>
                <div className="flex flex-wrap gap-2">
                    {details.parents.map((p, i) => (
                        <span key={i} className="bg-white px-3 py-1 rounded-full text-[10px] font-black text-purple-600 border border-purple-200 shadow-sm uppercase tracking-tight">
                            {p.descriptor}
                        </span>
                    ))}
                </div>
            </div>
        )}
        
        {details.growOutLightSettings && (
            <div className="mt-4 p-3 bg-white rounded-2xl border border-purple-100 shadow-inner">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Light Protocol</p>
                <p className="text-xs font-bold text-gray-700 italic">{details.growOutLightSettings}</p>
            </div>
        )}
    </div>
);

const CoralBranchDisplay: React.FC<CoralBranchDisplayProps> = ({ 
    branch, 
    substrateZone, 
    activityLog, 
    r2Settings, 
    prefixSettings, 
    isReadOnly, 
    onOpenPhotoManager, 
    onNavigateToHealthReports, 
    onNavigateToGrowthReports, 
    onEdit, 
    onMove 
}) => {
  const ageInDays = calculateAgeInDays(branch.dateAdded);
  const sortedHealth = [...branch.healthReports].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const currentHealth = sortedHealth[0]?.healthPercentage ?? 100;
  const theme = getHealthTheme(currentHealth);
  const mainPhoto = branch.photos.find(p => p.isMain) || branch.photos[0];

  const [showQR, setShowQR] = React.useState(false);
  const [qrCodeUrl, setQrCodeUrl] = React.useState('');

  React.useEffect(() => {
    QRCode.toDataURL(branch.fragmentId, { width: 120, margin: 1, color: { dark: '#000000', light: '#FFFFFF' } })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error(err));
  }, [branch.fragmentId]);

  const history = React.useMemo(() => {
    return activityLog
        .filter(item => item.message.includes(`[${branch.id}]`) || item.message.includes(branch.fragmentId))
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);
  }, [activityLog, branch]);

  const structurePrefix = branch.treeType === 'Reef2' ? prefixSettings.reef2 : branch.treeType === 'Reef3' ? prefixSettings.reef3 : prefixSettings.tree;
  const typeLabel = branch.type === 'RopeUnit' ? 'String' : branch.type === 'DeviceCluster' ? 'Cluster' : 'Branch';

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
          <div className="flex items-center gap-6">
              <div className={`w-20 h-20 rounded-3xl ${theme.bg} ${theme.border} border-2 flex items-center justify-center`}>
                  <span className={`text-3xl font-black ${theme.text}`}>{currentHealth}%</span>
              </div>
              <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-4xl font-black text-coral-dark uppercase tracking-tighter">{branch.fragmentId}</h1>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border shadow-sm ${
                        branch.type === 'RopeUnit' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                        branch.type === 'DeviceCluster' ? 'bg-purple-50 text-purple-600 border-purple-100' : 
                        'bg-gray-100 text-gray-500 border-gray-200'
                    }`}>{typeLabel}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                      <div className={`w-2 h-2 rounded-full ${theme.dot} animate-pulse`}></div>
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                          {branch.substrateZoneId ? 'Outplanted' : 'Nursery Stock'} • {branch.site}
                      </p>
                  </div>
              </div>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
              <button onClick={() => onEdit(branch)} disabled={isReadOnly} className="flex-1 md:flex-none bg-gray-900 text-white font-black px-6 py-3 rounded-2xl text-[10px] uppercase tracking-widest shadow-lg hover:bg-black transition-all active:scale-95 disabled:opacity-50">Edit Record</button>
              <button onClick={() => setShowQR(true)} className="p-3 bg-white border-2 border-gray-100 rounded-2xl text-coral-dark hover:bg-gray-50 transition-all shadow-sm"><QrCodeIcon className="w-6 h-6"/></button>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* LEFT COLUMN: VISUALS & METADATA */}
          <div className="lg:col-span-1 space-y-6">
              <div 
                onClick={onOpenPhotoManager}
                className="relative aspect-square rounded-[2.5rem] overflow-hidden bg-gray-900 shadow-xl group cursor-pointer border-4 border-white"
              >
                  {mainPhoto ? (
                      <img src={resolveMediaUrl(mainPhoto.url, r2Settings)} alt="Coral" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-90 group-hover:opacity-100" />
                  ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-600 gap-4">
                          <CameraIcon className="w-12 h-12" />
                          <span className="text-sm font-medium">No Image Available</span>
                      </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <div className="bg-white/90 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-coral-dark opacity-0 group-hover:opacity-100 transition-all shadow-xl">
                          Manage Photos
                      </div>
                  </div>
              </div>
              
              <div className="flex flex-col gap-2">
                  <button onClick={() => onMove(branch)} disabled={isReadOnly} className="w-full bg-blue-100 text-blue-700 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest hover:bg-blue-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2">
                      <ArrowRightOnRectangleIcon className="w-4 h-4" /> Relocate Item
                  </button>
              </div>

              {branch.isHeatTolerant && (
                <div className="p-6 bg-orange-50 border-2 border-orange-100 rounded-[2rem] shadow-inner flex items-center gap-4">
                    {/* Fix: SunIcon is now correctly imported */}
                    <SunIcon className="w-8 h-8 text-orange-500" />
                    <div>
                        <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Resilience Marker</p>
                        <p className="text-sm font-black text-orange-900 uppercase">Heat Tolerant Genotype</p>
                    </div>
                </div>
              )}
          </div>

          {/* RIGHT COLUMN: DATA & TRENDS */}
          <div className="lg:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                      <SectionHeader title="Deployment Data" icon={GlobeAltIcon} />
                      <div className="space-y-1">
                          <DetailRow label="Site" value={branch.site} />
                          <DetailRow label="Structure" value={`${structurePrefix} ${branch.tree}`} />
                          <DetailRow label="Face / Position" value={`Face ${branch.face} • Pos ${branch.position}`} />
                          <DetailRow label="Age" value={formatAge(ageInDays)} />
                          {substrateZone && <DetailRow label="Outplant Zone" value={substrateZone.name} />}
                          {branch.outplantDepth && <DetailRow label="Outplant Depth" value={`${branch.outplantDepth}m`} />}
                      </div>
                  </div>

                  <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                      <SectionHeader title="Scientific Data" icon={BeakerIcon} />
                      <div className="space-y-1">
                          <DetailRow label="Genus" value={branch.genus} />
                          <DetailRow label="Species" value={branch.species} />
                          <DetailRow label="Resilient" value={branch.isHeatTolerant ? 'YES' : 'NO'} />
                          <DetailRow label="Spawn Verified" value={branch.isConfirmedSpawned ? 'YES' : 'NO'} />
                          {branch.type === 'DeviceCluster' && <DetailRow label="Unit Count" value="5 (Standard)" />}
                      </div>
                  </div>
              </div>

              {/* Spawning Details for Clusters/Strings */}
              {branch.spawningDetails && <SpawningDataCard details={branch.spawningDetails} />}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                          <SectionHeader title="Health History" icon={HeartPulseIcon} />
                          <button onClick={onNavigateToHealthReports} className="text-[10px] font-black text-coral-blue hover:underline uppercase tracking-widest">Full Log</button>
                      </div>
                      <HealthChart reports={branch.healthReports} />
                  </div>
                  <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                          <SectionHeader title="Growth Analytics" icon={ArrowUpIcon} />
                          <button onClick={onNavigateToGrowthReports} className="text-[10px] font-black text-coral-blue hover:underline uppercase tracking-widest">Full Log</button>
                      </div>
                      <GrowthChart reports={branch.growthReports} />
                  </div>
              </div>

              <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
                  <SectionHeader title="Activity Ledger" icon={CalendarIcon} />
                  <div className="space-y-3">
                      {history.map(item => (
                          <div key={item.id} className="flex justify-between items-start gap-4 py-3 border-b border-gray-50 last:border-0 group/item">
                              <p className="text-xs font-medium text-gray-700 leading-relaxed">{item.message}</p>
                              <span className="text-[10px] font-black text-gray-300 shrink-0 uppercase">{new Date(item.timestamp).toLocaleDateString()}</span>
                          </div>
                      ))}
                      {history.length === 0 && <p className="text-xs text-gray-400 italic">No historical logs found for this item.</p>}
                  </div>
              </div>
          </div>
      </div>

      {showQR && <QRCodeLabelModal isOpen={showQR} onClose={() => setShowQR(false)} itemId={branch.fragmentId} itemName={branch.fragmentId} itemType={typeLabel} />}
    </div>
  );
};

export default CoralBranchDisplay;