import * as React from 'react';
import type { RubbleAnchor, ActivityLogItem, PrefixSettings, Site, SubstrateZone, R2Settings } from '../types';
import { ArrowUpIcon, ArrowDownIcon, MinusIcon, QrCodeIcon, CameraIcon } from './Icons';
import { resolveMediaUrl } from './SpeciesIdPage';
import HealthChart from './HealthChart';
import GrowthChart from './GrowthChart';
import QRCodeLabelModal from './QRCodeLabelModal';
import QRCode from 'qrcode';

interface RubbleAnchorDisplayProps {
  anchor: RubbleAnchor;
  sites: Site[];
  substrateZones: SubstrateZone[];
  r2Settings: R2Settings | null;
  activityLog: ActivityLogItem[];
  prefixSettings: PrefixSettings;
  onOpenPhotoManager: () => void;
  onNavigateToHealthReports: () => void;
  onNavigateToGrowthReports: () => void;
  onEdit: (anchor: RubbleAnchor) => void;
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

const getHealthStatus = (percentage: number): { color: string; textColor: string } => {
    if (percentage > 87.5) return { color: 'bg-green-500', textColor: 'text-green-600' };
    if (percentage > 62.5) return { color: 'bg-yellow-400', textColor: 'text-yellow-500' };
    if (percentage > 37.5) return { color: 'bg-orange-400', textColor: 'text-orange-500' };
    if (percentage > 12.5) return { color: 'bg-orange-600', textColor: 'text-orange-700' };
    return { color: 'bg-red-500', textColor: 'text-red-600' };
};

const InfoCard: React.FC<{ title: string; children: React.ReactNode; headerContent?: React.ReactNode }> = ({ title, children, headerContent }) => (
  <div className="bg-white p-6 rounded-lg shadow-md border-2 border-coral-blue">
    <div className="flex justify-between items-baseline border-b-2 border-coral-green pb-2 mb-4">
        <h3 className="text-lg font-semibold text-coral-dark">{title}</h3>
        {headerContent}
    </div>
    {children}
  </div>
);

const DetailItem: React.FC<{ label: string; value?: string | number; children?: React.ReactNode }> = ({ label, value, children }) => (
  <div className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0">
    <span className="text-gray-600 text-sm">{label}</span>
    {value !== undefined && <span className="font-medium text-coral-dark text-right text-sm">{value}</span>}
    {children}
  </div>
);

const RubbleAnchorDisplay: React.FC<RubbleAnchorDisplayProps> = ({ anchor, sites, substrateZones, r2Settings, activityLog, prefixSettings, onOpenPhotoManager, onNavigateToHealthReports, onNavigateToGrowthReports, onEdit }) => {
  const ageInDays = calculateAgeInDays(anchor.dateAdded);
  const formattedAge = formatAge(ageInDays);
  
  // Safe sort to prevent crash if arrays are undefined
  const sortedHealth = [...(anchor.healthReports ?? [])].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latestHealthReport = sortedHealth[0];
  
  const sortedGrowth = [...(anchor.growthReports ?? [])].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const latestGrowthReport = sortedGrowth[0];
  
  const mainPhoto = (anchor.photos ?? []).find(p => p.isMain) || (anchor.photos ?? [])[0];

  const [showQR, setShowQR] = React.useState(false);
  const [qrCodeUrl, setQrCodeUrl] = React.useState('');

  const zone = substrateZones.find(z => z.id === anchor.substrateZoneId);
  const site = sites.find(s => s.id === zone?.siteId);

  React.useEffect(() => {
    QRCode.toDataURL(anchor.name, { width: 120, margin: 1, color: { dark: '#000000', light: '#FFFFFF' } })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error(err));
  }, [anchor.name]);
  
  const history = React.useMemo(() => {
    const logs = (activityLog ?? []).filter(item => item.message.includes(`[${anchor.id}]`));
    const creationEntry: ActivityLogItem = {
        id: `creation-${anchor.id}`,
        timestamp: anchor.dateAdded,
        message: `Rubble Anchor deployed to Substrate Zone ${zone?.name || 'Unknown'}.`,
        type: 'movement'
    };
    return [creationEntry, ...logs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [activityLog, anchor.id, anchor.dateAdded, zone]);

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6">
            <div className="flex flex-col items-start gap-6">
                <div 
                    onClick={onOpenPhotoManager}
                    className="w-full h-48 sm:h-64 bg-gray-100 rounded-lg overflow-hidden cursor-pointer relative group border border-gray-200 flex items-center justify-center"
                >
                    {mainPhoto ? (
                        <img src={resolveMediaUrl(mainPhoto.url, r2Settings)} alt="Main" className="w-full h-full object-cover transition-opacity group-hover:opacity-90" />
                    ) : (
                        <div className="flex flex-col items-center justify-center text-gray-400 gap-2">
                            <CameraIcon className="w-12 h-12" />
                            <span className="text-sm font-medium">No Image Available</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <div className="bg-white/90 px-3 py-1 rounded-full text-xs font-semibold text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                            Manage Photos
                        </div>
                    </div>
                </div>

                <div className="w-full">
                    <div className="flex justify-between items-start">
                        <div>
                            <h1 className="text-4xl font-bold text-coral-blue mb-1">{anchor.name}</h1>
                            <p className="text-xl italic text-gray-600 mb-2">{anchor.genus} {anchor.species}</p>
                            <p className="text-gray-500 text-lg">
                                <span className="font-medium text-gray-700">Location:</span> {site?.name || 'Unknown Site'}, Zone {zone?.name || 'None'}
                            </p>
                        </div>
                        {qrCodeUrl && (
                            <div className="border border-gray-200 rounded p-1 ml-4 flex-shrink-0 bg-white shadow-sm">
                                <img src={qrCodeUrl} alt="QR" className="w-20 h-20 sm:w-24 sm:h-24" />
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-y-3 text-sm sm:text-base border-t pt-4 border-gray-100">
                        <div className="flex justify-between md:justify-start md:gap-12">
                            <span className="text-gray-500 w-24">Date Added:</span>
                            <span className="font-medium text-gray-900">{new Date(anchor.dateAdded).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between md:justify-start md:gap-12">
                            <span className="text-gray-500 w-24">Age:</span>
                            <span className="font-medium text-gray-900">{formattedAge}</span>
                        </div>
                        <div className="flex justify-between md:justify-start md:gap-12 items-center">
                            <span className="text-gray-500 w-24">Depth:</span>
                            <span className="font-medium text-gray-900">{anchor.depth}m</span>
                        </div>
                        <div className="flex justify-between md:justify-start md:gap-12 items-center">
                            <span className="text-gray-500 w-24">Latest Status:</span>
                            {latestHealthReport ? (
                                <div className="flex items-center gap-2">
                                     <span className={`w-3 h-3 rounded-full ${getHealthStatus(latestHealthReport.healthPercentage).color}`}></span>
                                     <span className="font-medium text-gray-900">{latestHealthReport.healthPercentage}%</span>
                                </div>
                            ) : <span className="text-gray-400">No Data</span>}
                        </div>
                    </div>
                </div>
            </div>
            <div className="flex flex-wrap gap-4 mt-6">
                <button onClick={() => onEdit(anchor)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors">Edit Details</button>
                <button onClick={() => setShowQR(true)} className="flex-1 bg-coral-blue hover:bg-opacity-90 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                    <QrCodeIcon className="w-5 h-5"/> Label
                </button>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <InfoCard title="Health History">
              <HealthChart reports={anchor.healthReports ?? []} />
              <div className="mt-4">
                <button onClick={onNavigateToHealthReports} className="w-full text-sm bg-gray-200 hover:bg-gray-300 text-coral-dark font-semibold py-2 px-4 rounded-lg transition-colors">View Reports</button>
              </div>
            </InfoCard>
            <InfoCard title="Growth Data">
              {latestGrowthReport ? (
                <>
                  <div className="space-y-3">
                    <DetailItem label="Surface Area" value={`${latestGrowthReport.surfaceAreaM2} m²`} />
                    <DetailItem label="Volume" value={`${latestGrowthReport.volumeM3} m³`} />
                  </div>
                  <div className="mt-4 pt-4 border-t">
                     <GrowthChart reports={anchor.growthReports ?? []} />
                     <div className="mt-4">
                        <button onClick={onNavigateToGrowthReports} className="w-full text-sm bg-gray-200 hover:bg-gray-300 text-coral-dark font-semibold py-2 px-4 rounded-lg transition-colors">Growth History</button>
                     </div>
                   </div>
                </>
              ) : <p className="text-gray-500 text-sm">No growth reports available.</p>}
            </InfoCard>
          </div>
        </div>

        <div className="lg:col-span-1 space-y-8">
           <InfoCard title="Anchor Activity Log">
             {history.length > 0 ? (
                <ul className="space-y-3 text-sm max-h-64 overflow-y-auto">
                    {history.map(item => (
                        <li key={item.id} className="border-b pb-2 last:border-b-0">
                            <p className="font-semibold text-gray-700">{new Date(item.timestamp).toLocaleString()}</p>
                            <p className="text-gray-600">{item.message}</p>
                        </li>
                    ))}
                </ul>
             ) : (
                <p className="text-sm text-gray-500">No history recorded.</p>
             )}
           </InfoCard>
        </div>
      </div>
      
      <QRCodeLabelModal
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        itemId={anchor.name}
        itemName={anchor.name}
        itemType="Rubble Anchor"
        detail={`${anchor.genus} ${anchor.species}`}
      />
    </div>
  );
};

export default RubbleAnchorDisplay;