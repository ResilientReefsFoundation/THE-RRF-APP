
import * as React from 'react';
import type { 
    Reminder, CoralBranch, Site, Tree, CollectionZone, 
    SubstrateZone, RubbleAnchor, Anchor, Page, PrefixSettings, 
    StructureType, HealthReport, R2Settings, VolunteerShift, Staff, Volunteer, Visitor
} from '../types';
import { 
    BellIcon, ChevronDownIcon, CalendarIcon, ChevronRightIcon,
    HeartPulseIcon, CheckCircleIcon, SparklesIcon, CloseIcon, ClipboardListIcon, CameraIcon
} from './Icons';
import { resolveMediaUrl } from './SpeciesIdPage';

interface StatCardProps {
  title: string;
  value: string | number;
  onClick?: () => void;
}

// Add the missing interface for DashboardPage props
interface DashboardPageProps {
  isReadOnly: boolean;
  r2Settings: R2Settings | null;
  prefixSettings: PrefixSettings;
  branches: CoralBranch[];
  sites: Site[];
  trees: Tree[];
  substrateZones: SubstrateZone[];
  rubbleAnchors: RubbleAnchor[];
  anchors: Anchor[];
  shifts: VolunteerShift[];
  staffMembers: Staff[];
  volunteers: Volunteer[];
  visitors: Visitor[];
  onSelectBranch: (branchId: string) => void;
  onNavigateToTree: (treeId: string) => void;
  onNavigateToBranch: (branchId: string) => void;
  onNavigateToPage: (page: Page, highlightId?: string) => void;
  reminders: Reminder[];
  zones: CollectionZone[];
}

const StatCard: React.FC<StatCardProps> = ({ title, value, onClick }) => (
    <div 
        onClick={onClick}
        className={`bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-28 ${onClick ? 'cursor-pointer hover:border-coral-blue hover:shadow-md transition-all active:scale-95 group' : ''}`}
    >
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-2 group-hover:text-coral-blue transition-colors">{title}</p>
      <p className="text-4xl font-black text-[#333333] leading-none group-hover:text-coral-dark transition-colors">{value}</p>
    </div>
);

/**
 * Strict Local Time Date Formatter
 * Used to ensure calendar cells and stored shift dates match regardless of timezone.
 */
export const toLocalYYYYMMDD = (date: Date | string) => {
    if (!date) return '';
    
    if (typeof date === 'string') {
        const base = date.split('T')[0];
        const parts = base.split(/[-/]/);
        if (parts.length === 3) {
            const y = parts[0].length === 4 ? parts[0] : parts[2];
            const m = parts[1].padStart(2, '0');
            const d = (parts[0].length === 4 ? parts[2] : parts[0]).padStart(2, '0');
            return `${y}-${m}-${d}`;
        }
        return base;
    }

    try {
        const d = date;
        if (isNaN(d.getTime())) return '';
        // Use local time components to match browser's calendar UI
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch (e) { return ''; }
};

export const getSiteName = (shift: VolunteerShift, sites: Site[]) => {
    if (!shift) return '';
    if (shift.siteId && shift.siteId !== 'CUSTOM_SITE_MARKER') {
        const site = (sites || []).find(si => String(si.id).trim() === String(shift.siteId).trim());
        if (site) return site.name;
    }
    return shift.customSiteName || '';
};

const isStaffAwayOnDate = (staff: Staff, dateStr: string) => {
    if (!staff) return false;
    const target = new Date(dateStr + 'T12:00:00Z');
    const dayOfWeek = target.getUTCDay();
    if (staff.recurringAwayDays?.includes(dayOfWeek)) return true;
    if (staff.timeAway && staff.timeAway.length > 0) {
        return staff.timeAway.some(p => {
            if (!p || !p.start || !p.end) return false;
            const start = new Date(p.start + 'T00:00:00Z');
            const end = new Date(p.end + 'T23:59:59Z');
            const tTime = target.getTime();
            return tTime >= start.getTime() && tTime <= end.getTime();
        });
    }
    return false;
};

const formatVolunteerNameShort = (name: string = '') => {
    const parts = name.trim().split(' ');
    if (parts.length <= 1) return name;
    return `${parts[0]} ${parts[parts.length - 1][0]}.`;
};

const calculateAgeInDays = (dateString: string): number => {
  if (!dateString) return NaN;
  const addedDate = new Date(dateString);
  if (isNaN(addedDate.getTime())) return NaN;
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - addedDate.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

const formatAge = (totalDays: number): string => {
  if (isNaN(totalDays)) return "";
  if (totalDays === 0) return "Added today";
  if (totalDays < 365) return `${totalDays} ${totalDays === 1 ? 'day' : 'days'}`;
  const years = Math.floor(totalDays / 365);
  const remainingDays = totalDays % 365;
  const yearText = `${years} ${years === 1 ? 'year' : 'years'}`;
  if (remainingDays === 0) return yearText;
  return `${yearText} and ${remainingDays} ${remainingDays === 1 ? 'day' : 'days'}`;
};

const HEALTH_BUCKETS = [
    { key: '100%', color: 'bg-[#10B981]', label: '100%' },
    { key: '75%', color: 'bg-[#F59E0B]', label: '75%' },
    { key: '50%', color: 'bg-[#F97316]', label: '50%' },
    { key: '25%', color: 'bg-[#EA580C]', label: '25%' },
    { key: '0%', color: 'bg-[#EF4444]', label: '0%' },
];

const getHealthStatusFromReports = (reports?: HealthReport[]): string => {
    if (!reports || reports.length === 0) return '100%';
    const sorted = [...reports].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestReport = sorted[0];
    const p = latestReport.healthPercentage;
    if (p > 87.5) return '100%';
    if (p > 62.5) return '75%';
    if (p > 37.5) return '50%';
    if (p > 12.5) return '25%';
    return '0%';
};

const DashboardPage: React.FC<DashboardPageProps> = ({
  isReadOnly, r2Settings, prefixSettings, branches, sites, trees, substrateZones, rubbleAnchors, anchors, shifts, staffMembers, volunteers, visitors, onSelectBranch, onNavigateToTree, onNavigateToBranch, onNavigateToPage, reminders, zones
}) => {
    const [viewingCollection, setViewingCollection] = React.useState<{ title: string, items: any[] } | null>(null);
    const [viewingSimpleList, setViewingSimpleList] = React.useState<{ title: string, items: string[] } | null>(null);
    
    const stats = React.useMemo(() => {
        const activeBranches = (branches || []).filter(b => !b.isArchived);
        const activeRubble = (rubbleAnchors || []).filter(ra => !ra.isArchived);

        const uniqueGenera = new Set([
            ...activeBranches.map(b => b.genus),
            ...activeRubble.map(ra => ra.genus)
        ]);
        
        const uniqueSpecies = new Set([
            ...activeBranches.map(b => `${b.genus} ${b.species}`),
            ...activeRubble.map(ra => `${ra.genus} ${ra.species}`)
        ]);

        return {
            totalBranches: activeBranches.filter(b => !b.type || b.type === 'Branch').length,
            strings: activeBranches.filter(b => b.type === 'RopeUnit').length,
            deviceClusters: activeBranches.filter(b => b.type === 'DeviceCluster').length,
            rubbleAnchors: activeRubble.length,
            nurseryTrees: (trees || []).filter(t => !t.isArchived && (!t.type || t.type === 'Tree')).length,
            reef2: (trees || []).filter(t => !t.isArchived && t.type === 'Reef2').length,
            reef3: (trees || []).filter(t => !t.isArchived && t.type === 'Reef3').length,
            substrateZones: (substrateZones || []).filter(z => !z.isArchived).length,
            collectionZones: (zones || []).filter(z => !z.isArchived).length,
            genera: uniqueGenera.size,
            species: uniqueSpecies.size,
            sites: (sites || []).filter(s => !s.isArchived).length
        };
    }, [branches, rubbleAnchors, trees, substrateZones, zones, sites]);

    const calendarDays = React.useMemo(() => {
        const today = new Date();
        const dayOfWeek = today.getDay(); 
        const diff = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek; 
        const start = new Date(today);
        start.setDate(today.getDate() + diff);
        
        return Array.from({ length: 14 }, (_, i) => {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            return d;
        });
    }, []);

    const larvaePotential = (stats.totalBranches + stats.strings + stats.deviceClusters) * 60000;
    const todayStr = toLocalYYYYMMDD(new Date());

    const handleViewSnapshot = (type: string) => {
        const activeBranches = (branches || []).filter(b => !b.isArchived);
        let items: any[] = [];
        let title = type;

        switch (type) {
            case 'Branches': items = activeBranches.filter(b => !b.type || b.type === 'Branch'); break;
            case 'Strings': items = activeBranches.filter(b => b.type === 'RopeUnit'); break;
            case 'Clusters': items = activeBranches.filter(b => b.type === 'DeviceCluster'); break;
            case 'Rubble Anchors': items = (rubbleAnchors || []).filter(ra => !ra.isArchived); break;
            case 'Trees': items = (trees || []).filter(t => !t.isArchived && (!t.type || t.type === 'Tree')); break;
            case 'Reef²': items = (trees || []).filter(t => !t.isArchived && t.type === 'Reef2'); break;
            case 'Reef³': items = (trees || []).filter(t => !t.isArchived && t.type === 'Reef3'); break;
            case 'Substrate Zones': items = (substrateZones || []).filter(z => !z.isArchived); break;
            case 'Collection Zones': items = (zones || []).filter(z => !z.isArchived); break;
            case 'Sites': items = (sites || []).filter(s => !s.isArchived); break;
        }
        setViewingCollection({ title, items });
    };

    const handleViewGenera = () => {
        const activeBranches = (branches || []).filter(b => !b.isArchived);
        const activeRubble = (rubbleAnchors || []).filter(ra => !ra.isArchived);
        const combined = [...activeBranches, ...activeRubble];
        const list = Array.from(new Set(combined.map(item => item.genus))).filter(Boolean).sort();
        setViewingSimpleList({ title: 'Unique Genera', items: list });
    };

    const handleViewSpecies = () => {
        const activeBranches = (branches || []).filter(b => !b.isArchived);
        const activeRubble = (rubbleAnchors || []).filter(ra => !ra.isArchived);
        const combined = [...activeBranches, ...activeRubble];
        const list = Array.from(new Set(combined.map(item => `${item.genus} ${item.species}`))).filter(x => x.trim() !== '').sort();
        setViewingSimpleList({ title: 'Unique Species', items: list });
    };

    return (
        <div className="space-y-12 animate-fade-in pb-20 pt-4 relative">
            
            {/* ACTION ITEMS */}
            <div className="bg-white border-2 border-[#50E3C2] rounded-2xl p-5 flex justify-between items-center shadow-sm relative z-10">
                <div className="flex items-center gap-4">
                    <HeartPulseIcon className="w-6 h-6 text-[#50E3C2]" />
                    <h2 className="text-xl font-black text-[#333333] uppercase tracking-tighter">Action Items</h2>
                    <span className="text-sm font-bold text-gray-400 uppercase tracking-widest ml-4">All Clear</span>
                </div>
                <ChevronDownIcon className="w-6 h-6 text-gray-300" />
            </div>

            {/* SCHEDULE */}
            <div className="space-y-6 relative z-0">
                <div className="flex justify-between items-center px-2">
                    <h3 className="text-2xl font-black text-[#333333] uppercase tracking-tighter italic">Operational Schedule</h3>
                    <button 
                        onClick={() => onNavigateToPage('operationalSchedule')}
                        className="bg-coral-blue/10 hover:bg-coral-blue/20 text-coral-blue font-black px-5 py-2 rounded-xl text-[10px] uppercase tracking-widest transition-all cursor-pointer relative z-10"
                    >
                        Full Calendar
                    </button>
                </div>
                
                <div className="bg-white rounded-[2.5rem] shadow-sm border-2 border-gray-100 overflow-hidden">
                    <div className="grid grid-cols-7 gap-px bg-gray-50 border-b border-gray-100">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                            <div key={idx} className="bg-white py-3 text-center text-[9px] font-black text-gray-400 uppercase tracking-[0.3em]">{day}</div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-px bg-gray-100">
                        {calendarDays.map((date, i) => {
                            const dateStr = toLocalYYYYMMDD(date);
                            const dayShifts = shifts.filter(s => toLocalYYYYMMDD(s.date) === dateStr);
                            const awayStaff = staffMembers.filter(s => isStaffAwayOnDate(s, dateStr));
                            const isToday = dateStr === todayStr;

                            return (
                                <div 
                                    key={i} 
                                    onClick={() => onNavigateToPage('operationalSchedule', dateStr)}
                                    className={`h-40 p-2 flex flex-col gap-0.5 cursor-pointer hover:bg-blue-50/30 transition-all border-r border-b border-gray-50 relative ${isToday ? 'bg-blue-50/20' : 'bg-white'}`}
                                >
                                    <span className={`text-[10px] font-bold leading-none mb-1 ${isToday ? 'text-coral-blue' : 'text-gray-400'}`}>{date.getDate()}</span>
                                    <div className="flex flex-col gap-0.5 overflow-hidden w-full">
                                        {awayStaff.map(s => (
                                            <p key={s.id} className="text-[11px] font-bold text-[#F59E0B] italic leading-tight truncate">
                                                {s.name.split(' ')[0]} away
                                            </p>
                                        ))}
                                        {dayShifts.map(s => {
                                            const siteName = getSiteName(s, sites);
                                            return (
                                                <div key={s.id} className="flex flex-col gap-0.5 mt-0.5">
                                                    <p className="text-[9px] font-black text-coral-blue uppercase leading-tight truncate">
                                                        {siteName || 'LOCATION TBD'}
                                                    </p>
                                                    <div className="flex flex-col">
                                                        {(s.assignedStaffIds || []).map(sid => {
                                                            const staff = staffMembers.find(st => String(st.id).trim() === String(sid).trim());
                                                            return (
                                                                <p key={sid} className="text-[9px] font-bold text-black leading-tight truncate">
                                                                    {staff ? staff.name.split(' ')[0] : 'Staff'}
                                                                </p>
                                                            );
                                                        })}
                                                        {(s.assignedVolunteerIds || []).map(vid => {
                                                            const vol = volunteers.find(v => String(v.id).trim() === String(vid).trim());
                                                            return (
                                                                <p key={vid} className="text-[9px] font-medium text-coral-blue leading-tight truncate">
                                                                    {vol ? formatVolunteerNameShort(vol.name) : 'Volunteer'}
                                                                </p>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* NURSERY SNAPSHOT */}
            <div className="space-y-6">
                <h3 className="text-2xl font-black text-[#333333] uppercase tracking-tighter italic ml-2">Nursery Snapshot</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <StatCard title="Total Branches" value={stats.totalBranches} onClick={() => handleViewSnapshot('Branches')} />
                    <StatCard title="Strings" value={stats.strings} onClick={() => handleViewSnapshot('Strings')} />
                    <StatCard title="Device Clusters" value={stats.deviceClusters} onClick={() => handleViewSnapshot('Clusters')} />
                    <StatCard title="Rubble Anchors" value={stats.rubbleAnchors} onClick={() => handleViewSnapshot('Rubble Anchors')} />
                    
                    <StatCard title="Nursery Trees" value={stats.nurseryTrees} onClick={() => handleViewSnapshot('Trees')} />
                    <StatCard title="Reef² Units" value={stats.reef2} onClick={() => handleViewSnapshot('Reef²')} />
                    <StatCard title="Reef³ Units" value={stats.reef3} onClick={() => handleViewSnapshot('Reef³')} />
                    <StatCard title="Substrate Zones" value={stats.substrateZones} onClick={() => handleViewSnapshot('Substrate Zones')} />
                    
                    <StatCard title="Collection Zones" value={stats.collectionZones} onClick={() => handleViewSnapshot('Collection Zones')} />
                    <StatCard title="Unique Genera" value={stats.genera} onClick={handleViewGenera} />
                    <StatCard title="Unique Species" value={stats.species} onClick={handleViewSpecies} />
                    <StatCard title="Sites" value={stats.sites} onClick={() => handleViewSnapshot('Sites')} />
                </div>
            </div>

            {/* ECOSYSTEM CONTRIBUTION */}
            <div className="space-y-6">
                <h3 className="text-2xl font-black text-[#333333] uppercase tracking-tighter italic ml-2">Ecosystem Contribution</h3>
                <div className="bg-white border-2 border-[#50E3C2]/30 rounded-[2rem] p-10 shadow-sm relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-6">Estimated Annual Larvae Production Potential</p>
                        <div className="flex items-baseline gap-4">
                            <span className="text-7xl font-black text-[#333333]">{larvaePotential.toLocaleString()}</span>
                            <span className="text-sm font-bold text-gray-400 uppercase tracking-widest">Larvae</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* SITE HEALTH BREAKDOWN */}
            <div className="space-y-6">
                <h3 className="text-3xl font-black text-[#333333] uppercase tracking-tighter italic ml-2">Site Health Breakdown</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {(sites || []).filter(s => !s.isArchived).map(site => {
                        const normalizedSiteName = site.name.trim().toLowerCase();
                        const siteZoneIds = new Set((substrateZones || []).filter(z => String(z.siteId).trim() === String(site.id).trim()).map(z => z.id));
                        const siteAnchorIds = new Set((anchors || []).filter(a => String(a.siteId).trim() === String(site.id).trim()).map(a => a.id));

                        const siteItems = [
                            ...branches.filter(b => {
                                if (b.isArchived) return false;
                                if ((b.site || '').trim().toLowerCase() === normalizedSiteName) return true;
                                if (b.substrateZoneId && siteZoneIds.has(String(b.substrateZoneId).trim())) return true;
                                const tree = trees.find(t => Number(t.number) === Number(b.tree) && (t.type || 'Tree') === (b.treeType || 'Tree'));
                                if (tree && siteAnchorIds.has(String(tree.anchorId).trim())) return true;
                                return false;
                            }),
                            ...rubbleAnchors.filter(ra => {
                                if (ra.isArchived) return false;
                                return ra.substrateZoneId && siteZoneIds.has(String(ra.substrateZoneId).trim());
                            })
                        ];
                        
                        const buckets: { [key: string]: number } = { '100%': 0, '75%': 0, '50%': 0, '25%': 0, '0%': 0 };
                        siteItems.forEach(item => {
                            const status = getHealthStatusFromReports(item.healthReports);
                            buckets[status]++;
                        });

                        return (
                            <div key={site.id} className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 space-y-12">
                                <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                                    <div className="w-4 h-4 bg-[#4A90E2] rounded-full shadow-sm"></div>
                                    <h4 className="text-2xl font-black text-[#333333] uppercase tracking-tighter italic">{site.name}</h4>
                                </div>
                                
                                <div className="flex justify-between items-end px-4">
                                    {HEALTH_BUCKETS.map(bucket => (
                                        <button 
                                            key={bucket.key} 
                                            onClick={() => {
                                                const itemsInBucket = siteItems.filter(item => getHealthStatusFromReports(item.healthReports) === bucket.key);
                                                setViewingCollection({ 
                                                    title: `Branches at ${site.name} (${bucket.label})`, 
                                                    items: itemsInBucket 
                                                });
                                            }}
                                            className="flex flex-col items-center gap-5 cursor-pointer hover:scale-105 active:scale-95 transition-transform group"
                                        >
                                            <div className={`w-16 h-16 rounded-full ${bucket.color} flex items-center justify-center text-white font-black text-2xl shadow-xl border-[6px] border-white group-hover:shadow-2xl`}>
                                                {buckets[bucket.key]}
                                            </div>
                                            <span className="text-[12px] font-black text-gray-400 uppercase tracking-[0.2em] group-hover:text-coral-blue transition-colors">
                                                {bucket.label}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* UNIFIED RICH DETAILS MODAL */}
            {viewingCollection && (
                <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setViewingCollection(null)}>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                            <div>
                                <h3 className="text-xl font-black text-coral-dark uppercase tracking-tight italic">
                                    {viewingCollection.title}
                                </h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                                    {viewingCollection.items.length} items found
                                </p>
                            </div>
                            <button onClick={() => setViewingCollection(null)} className="p-3 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors">
                                <CloseIcon className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-white">
                            {viewingCollection.items.map(item => {
                                const isSite = !(item as any).siteId && !(item as any).fragmentId && !(item as any).anchorId && !(item as any).substrateZoneId && !(item as any).number && !(item as any).dateAdded;
                                const isTree = !!(item as any).anchorId;
                                const isRubble = !!(item as any).substrateZoneId && !(item as any).tree; 
                                const isZone = !!(item as any).siteId && !(item as any).anchorId && !(item as any).fragmentId && !(item as any).substrateZoneId;

                                let displayName = '';
                                let photo = null;
                                let displayLoc = '';
                                let ageString = '';
                                let latestNote = '';
                                let healthColor = '';
                                
                                if (isTree) {
                                    displayName = `${prefixSettings.tree} ${(item as Tree).number}`;
                                    if ((item as Tree).type === 'Reef2') displayName = `${prefixSettings.reef2} ${(item as Tree).number}`;
                                    if ((item as Tree).type === 'Reef3') displayName = `${prefixSettings.reef3} ${(item as Tree).number}`;
                                    photo = (item as Tree).photos?.[0];
                                    displayLoc = `Depth: ${(item as Tree).currentDepth}m`;
                                    ageString = formatAge(calculateAgeInDays((item as Tree).dateAdded));
                                } else if (isZone) {
                                    displayName = (item as SubstrateZone).name;
                                    displayLoc = `Depth: ${(item as SubstrateZone).depth}m`;
                                    photo = (item as SubstrateZone).photos?.[0];
                                    ageString = formatAge(calculateAgeInDays((item as SubstrateZone).dateAdded));
                                } else if (isSite) {
                                    displayName = (item as Site).name;
                                    photo = { url: (item as Site).photoUrl } as any;
                                    displayLoc = 'Nursery Location';
                                } else {
                                    displayName = isRubble ? (item as any).name : (item as any).fragmentId;
                                    photo = (item as any).photos && (item as any).photos.length > 0 
                                        ? ((item as any).photos.find((p: any) => p.isMain) || (item as any).photos[0]) 
                                        : null;
                                    displayLoc = isRubble 
                                        ? `Zone ${(item as any).substrateZoneId ? substrateZones.find(z=>z.id===(item as any).substrateZoneId)?.name : '?'}`
                                        : `Tree ${(item as any).tree}\nFace ${(item as any).face} - Position ${(item as any).position}`;
                                    ageString = formatAge(calculateAgeInDays((item as any).dateAdded));
                                    latestNote = (item as any).healthReports?.[0]?.notes || 'Initial planting';
                                    const healthStatus = getHealthStatusFromReports((item as any).healthReports);
                                    healthColor = HEALTH_BUCKETS.find(h => h.key === healthStatus)?.color || 'bg-gray-400';
                                }

                                return (
                                    <div 
                                        key={item.id}
                                        onClick={() => {
                                            if (isRubble) onNavigateToPage('rubbleAnchorDetails', item.id);
                                            else if (isTree) onNavigateToPage('trees', item.id); 
                                            else if (isZone) onNavigateToPage('substrateZones', item.id);
                                            else if (isSite) onNavigateToPage('sites'); 
                                            else onNavigateToPage('details', item.id);
                                        }}
                                        className="flex gap-5 pb-6 border-b border-gray-100 last:border-0 cursor-pointer group"
                                    >
                                        <div className="w-20 h-20 rounded-xl bg-gray-100 overflow-hidden shrink-0 shadow-sm group-hover:shadow-md transition-shadow">
                                            {photo && photo.url ? (
                                                <img src={resolveMediaUrl(photo.url, r2Settings)} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <CameraIcon className="w-8 h-8" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-grow min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="font-black text-coral-dark text-lg uppercase tracking-tighter">{displayName}</h4>
                                                {ageString && <span className="text-xs font-black text-gray-400 uppercase tracking-wide bg-gray-50 px-2 py-0.5 rounded">{ageString}</span>}
                                            </div>
                                            
                                            {displayLoc && <p className="text-xs font-medium text-gray-500 whitespace-pre-line mb-2">{displayLoc}</p>}
                                            
                                            {healthColor && (
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="text-xs font-bold text-gray-400">Health</span>
                                                    <div className={`w-3 h-3 rounded-full ${healthColor}`}></div>
                                                </div>
                                            )}
                                            
                                            {(item as any).species && <p className="text-sm italic text-gray-600 font-serif mb-2">{(item as any).genus} {(item as any).species}</p>}
                                            
                                            {latestNote && (
                                                <p className="text-[10px] text-gray-400 border-t border-gray-50 pt-2 flex gap-1">
                                                    <span className="font-bold">Latest Note:</span> 
                                                    <span className="italic truncate">{latestNote}</span>
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                            <button onClick={() => setViewingCollection(null)} className="bg-coral-blue text-white font-bold py-3 px-8 rounded-xl shadow-lg hover:brightness-110 active:scale-95 transition-all text-sm uppercase tracking-widest">
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* GENERA/SPECIES LIST MODAL (SIMPLE) */}
            {viewingSimpleList && (
                <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={() => setViewingSimpleList(null)}>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                            <div>
                                <h3 className="text-xl font-black text-coral-dark uppercase tracking-tight italic">{viewingSimpleList.title}</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                                    {viewingSimpleList.items.length} Unique Entries Found
                                </p>
                            </div>
                            <button onClick={() => setViewingSimpleList(null)} className="p-3 bg-white rounded-full shadow-sm hover:bg-gray-100 transition-colors">
                                <CloseIcon className="w-5 h-5 text-gray-500" />
                            </button>
                        </div>
                        <div className="flex-grow overflow-y-auto p-4 space-y-2 bg-gray-50/50">
                            {viewingSimpleList.items.map((item, index) => (
                                <div key={index} className="p-4 bg-white border-2 border-gray-100 rounded-2xl flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                        <ClipboardListIcon className="w-4 h-4" />
                                    </div>
                                    <span className="font-bold text-gray-700 italic">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardPage;
