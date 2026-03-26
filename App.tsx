import * as React from 'react';
// Force commit ID: 1711416965
import { flushSync } from 'react-dom';
import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import heic2any from 'heic2any';
import type { 
    Page, Site, Anchor, Tree, CoralBranch, Species, ActivityLogItem, 
    CollectionZone, SubstrateZone, RubbleAnchor, Float, MaintenanceLog, 
    Tank, ToDoItem, VoiceNote, RecordFile, FormItem, R2Settings, 
    TreeShadeExperiment, LongTermStudy, Rule, LockData, PrefixSettings, StructureType, 
    Volunteer, Visitor, Staff, VolunteerShift, GearItem,
    EmailTemplate, MerchandiseItem, MerchandiseLog, TemperatureLogger,
    AuthState, HealthReport, GrowthReport, Photo, BackupData, Reminder, UserRole
} from './types';

// Page Components
import WelcomePage from './components/WelcomePage';
import DashboardPage from './components/DashboardPage';
import SideMenu from './components/SideMenu';
import BranchesPage from './components/BranchesPage';
import AddEditItemsPage from './components/AddEditItemsPage';
import SitesPage from './components/SitesPage';
import AnchorsPage from './components/AnchorsPage';
import CollectionZonesPage from './components/CollectionZonesPage';
import SubstrateZonesPage from './components/SubstrateZonesPage';
import RubbleAnchorsPage from './components/RubbleAnchorsPage';
import TreesPage from './components/TreesPage';
import RopeUnitsPage from './components/RopeUnitsPage';
import DeviceClustersPage from './components/DeviceClustersPage';
import SpeciesIdPage from './components/SpeciesIdPage';
import ReportsPage from './components/ReportsPage';
import RulesPage from './components/RulesPage';
import DataLoggersPage from './components/DataLoggersPage';
import TrendsPage from './components/TrendsPage';
import ExperimentsPage from './components/ExperimentsPage';
import TreeShadeExperimentPage from './components/TreeShadeExperimentPage';
import LongTermStudyPage from './components/LongTermStudyPage';
import BackupRestorePage from './components/BackupRestorePage';
import NotesToDoPage from './components/NotesToDoPage';
import OperationalSchedulePage from './OperationalSchedulePage';
import FloatManagementPage from './components/FloatManagementPage';
import QRCodeGeneratorPage from './components/QRCodeGeneratorPage';
import FacilityPage from './components/FacilityPage';
import FacilityDailyTasksPage from './components/FacilityDailyTasksPage';
import FacilityAddEditMovePage from './components/FacilityAddEditMovePage';
import FacilityTanksPage from './components/FacilityTanksPage';
import DiveGearPage from './components/DiveGearPage';
import PeoplePage from './components/PeoplePage';
import MerchandisePage from './components/MerchandisePage';
import SettingsPage from './components/SettingsPage';
import NumberingSystemPage from './components/NumberingSystemPage';
import CoralBranchDisplay from './components/CoralBranchDisplay';
import RubbleAnchorDisplay from './components/RubbleAnchorDisplay';
import HealthReportsPage from './components/HealthReportsPage';
import GrowthReportsPage from './components/GrowthReportsPage';
import MoveItemsPage from './components/MoveItemsPage';
import SystemMasterMap from './components/SystemMasterMap';
import PhotoManagerModal from './components/PhotoManagerModal';
import SiteDesignPage from './components/SiteDesignPage';
import MonitoringPage from './components/MonitoringPage';
import EnvironmentalPage from './components/EnvironmentalPage';
import SpawningPage from './components/SpawningPage';
import VolunteerPortal from './components/VolunteerPortal';
import ProjectProgress from './components/ProjectProgress';
import GlobalQuickAccess from './components/GlobalQuickAccess';
import PhotoViewerPage from './components/PhotoViewerPage';
import PhotoAlbumPage from './components/PhotoAlbumPage';

// Helpers & Icons
import { toLocalYYYYMMDD } from './components/DashboardPage';
import { HamburgerIcon, ArrowPathIcon, CheckCircleIcon, CloseIcon, CameraIcon, WrenchIcon, LockClosedIcon } from './components/Icons';

const DEVICE_ID = (() => {
    const key = 'rrf_internal_device_id';
    const fallback = `${Date.now()}-${Math.random().toString(36).substring(2, 12)}`;
    try {
        let id = localStorage.getItem(key);
        if (!id) { id = fallback; localStorage.setItem(key, id); }
        return id;
    } catch (e) { return fallback; }
})();

const parseHash = () => {
    const hash = window.location.hash.replace('#/', '');
    if (!hash) return { page: 'welcome' as Page, id: null };
    const [page, queryString] = hash.split('?');
    const params = new URLSearchParams(queryString);
    return { page: page as Page, id: params.get('id') };
};

export default function App() {
    const [auth, setAuth] = React.useState<AuthState>(() => {
        const saved = localStorage.getItem('rrf_auth');
        const parsed = saved ? JSON.parse(saved) : null;
        return { 
            isAuthenticated: !!parsed?.isAuthenticated, 
            role: parsed?.role || 'Public', 
            userId: parsed?.userId || null, 
            userName: parsed?.userName || '' 
        };
    });

    const [currentPage, setCurrentPage] = React.useState<Page>(() => {
        const { page } = parseHash();
        return (page as Page) || 'welcome';
    });
    
    const [navigationSignal, setNavigationSignal] = React.useState<string | undefined>(() => {
        const { id } = parseHash();
        return id || undefined;
    });

    const [isInitialLoadComplete, setIsInitialLoadComplete] = React.useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = React.useState(false);
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    
    const databaseRef = React.useRef<BackupData>({
        coralBranches: [],
        rules: [], sites: [], zones: [], anchors: [], substrateZones: [], 
        rubbleAnchors: [], trees: [], floats: [], activityLog: [], maintenanceLogs: [], 
        tanks: [], speciesList: [], toDoItems: [], voiceNotes: [], records: [], 
        forms: [], staffMembers: [], volunteers: [], visitors: [], shifts: [], 
        gearItems: [], emailTemplates: [], prefixSettings: undefined, merchandise: [], 
        merchandiseLogs: [], tempLoggers: [], treeShadeExperiment: null, longTermStudy: null,
        pageLocks: {}
    });

    const [sites, _setSites] = React.useState<Site[]>([]);
    const [zones, _setZones] = React.useState<CollectionZone[]>([]);
    const [anchors, _setAnchors] = React.useState<Anchor[]>([]);
    const [substrateZones, _setSubstrateZones] = React.useState<SubstrateZone[]>([]);
    const [rubbleAnchors, _setRubbleAnchors] = React.useState<RubbleAnchor[]>([]);
    const [trees, _setTrees] = React.useState<Tree[]>([]);
    const [floats, _setFloats] = React.useState<Float[]>([]);
    const [branches, _setBranches] = React.useState<CoralBranch[]>([]);
    const [speciesList, _setSpeciesList] = React.useState<Species[]>([]);
    const [activityLog, _setActivityLog] = React.useState<ActivityLogItem[]>([]);
    const [maintenanceLogs, _setMaintenanceLogs] = React.useState<MaintenanceLog[]>([]);
    const [tanks, _setTanks] = React.useState<Tank[]>([]);
    const [toDoItems, _setToDoItems] = React.useState<ToDoItem[]>([]);
    const [voiceNotes, _setVoiceNotes] = React.useState<VoiceNote[]>([]);
    const [records, _setRecords] = React.useState<RecordFile[]>([]);
    const [forms, _setForms] = React.useState<FormItem[]>([]);
    const [rules, _setRules] = React.useState<Rule[]>([]);
    const [volunteers, _setVolunteers] = React.useState<Volunteer[]>([]);
    const [visitors, _setVisitors] = React.useState<Visitor[]>([]);
    const [staffMembers, _setStaffMembers] = React.useState<Staff[]>([]);
    const [shifts, _setShifts] = React.useState<VolunteerShift[]>([]);
    const [gearItems, _setGearItems] = React.useState<GearItem[]>([]);
    const [emailTemplates, _setEmailTemplates] = React.useState<EmailTemplate[]>([]);
    const [merchandise, _setMerchandise] = React.useState<MerchandiseItem[]>([]);
    const [merchandiseLogs, _setMerchandiseLogs] = React.useState<MerchandiseLog[]>([]);
    const [tempLoggers, _setTempLoggers] = React.useState<TemperatureLogger[]>([]);
    const [treeShadeExperiment, _setTreeShadeExperiment] = React.useState<TreeShadeExperiment | null>(null);
    const [longTermStudy, _setLongTermStudy] = React.useState<LongTermStudy | null>(null);
    const [pageLocks, _setPageLocks] = React.useState<Record<string, boolean>>({});
    const [prefixSettings, _setPrefixSettings] = React.useState<PrefixSettings>({ 
        tree: 'Tree', reef2: 'Reef²', reef3: 'Reef³', branch: 'Branch', ropeUnit: 'String', deviceCluster: 'Cluster',
        site: 'Site', collectionZone: 'CZ', anchor: 'Anchor', substrateZone: 'SZ', rubbleAnchor: 'RA', float: 'Float',
        tank: 'Tank', pump: 'Pump', light: 'Light', power: 'Power', filter: 'Filter', filterSock: 'Sock',
        autospawner: 'Spawner', chiller: 'Chiller'
    });

    const [globalReadOnly, setGlobalReadOnly] = React.useState<boolean>(() => localStorage.getItem('rrf_global_readonly') === 'true');
    const [adminOverride, setAdminOverride] = React.useState<boolean>(() => localStorage.getItem('rrf_admin_override') === 'true');
    const [lockInfo, setLockInfo] = React.useState<LockData | null>(null);
    const [r2Settings, setR2Settings] = React.useState<R2Settings | null>(() => {
        try { const saved = localStorage.getItem('coral_r2_config'); return saved ? JSON.parse(saved) : null; } catch (e) { return null; }
    });

    const [isOnline, setIsOnline] = React.useState(navigator.onLine);
    const [syncMode, setSyncMode] = React.useState<'loading' | 'saving' | 'synced' | 'idle' | 'error' | 'capturing'>('idle');

    const isReadOnly = React.useMemo(() => {
        if (auth.role === 'Volunteer') return true; 
        if (adminOverride) return false;
        if (globalReadOnly) return true;
        return !isOnline || !r2Settings || !lockInfo || lockInfo.sessionId !== DEVICE_ID;
    }, [lockInfo, r2Settings, isOnline, globalReadOnly, adminOverride, auth.role]);

    const getS3Client = React.useCallback(() => {
        if (!r2Settings) return null;
        return new S3Client({
            region: "auto",
            endpoint: `https://${r2Settings.accountId}.r2.cloudflarestorage.com`,
            credentials: { accessKeyId: r2Settings.accessKeyId, secretAccessKey: r2Settings.secretAccessKey },
            forcePathStyle: true,
        });
    }, [r2Settings]);

    const checkLock = React.useCallback(async (): Promise<LockData | null> => {
        if (!r2Settings) return null;
        try {
            const client = getS3Client();
            if (!client) return null;
            const response = await client.send(new GetObjectCommand({ 
                Bucket: r2Settings.bucketName, 
                Key: 'session_lock.json' 
            }));
            const str = await response.Body?.transformToString();
            return str ? JSON.parse(str) : null;
        } catch (e) {
            return null;
        }
    }, [r2Settings, getS3Client]);

    const acquireLock = React.useCallback(async () => {
        if (!r2Settings || !auth.isAuthenticated || auth.role === 'Volunteer') return;
        
        const currentLock = await checkLock();
        const now = Date.now();
        const staleThreshold = 60000; // 1 minute

        // If no lock exists, or it's ours, or it's stale (> 1 min old), we can take/refresh it
        if (!currentLock || currentLock.sessionId === DEVICE_ID || (now - currentLock.timestamp > staleThreshold)) {
            try {
                const client = getS3Client();
                if (!client) return;
                const newLock: LockData = {
                    lockedBy: auth.userName || 'Unknown User',
                    timestamp: now,
                    sessionId: DEVICE_ID
                };
                await client.send(new PutObjectCommand({
                    Bucket: r2Settings.bucketName,
                    Key: 'session_lock.json',
                    Body: JSON.stringify(newLock),
                    ContentType: 'application/json'
                }));
                setLockInfo(newLock);
            } catch (e) {
                console.error("Failed to acquire lock", e);
            }
        } else {
            // Someone else has a fresh lock
            setLockInfo(currentLock);
        }
    }, [r2Settings, auth, checkLock, getS3Client]);

    const releaseLock = React.useCallback(async () => {
        if (!r2Settings) return;
        try {
            const client = getS3Client();
            if (!client) return;
            // Only delete if it's actually our lock
            const currentLock = await checkLock();
            if (currentLock && currentLock.sessionId === DEVICE_ID) {
                await client.send(new DeleteObjectCommand({
                    Bucket: r2Settings.bucketName,
                    Key: 'session_lock.json'
                }));
            }
            setLockInfo(null);
        } catch (e) {
            console.error("Failed to release lock", e);
        }
    }, [r2Settings, checkLock, getS3Client]);

    React.useEffect(() => {
        if (!r2Settings || !auth.isAuthenticated || auth.role === 'Volunteer') {
            setLockInfo(null);
            return;
        }

        // Initial acquire
        acquireLock();

        // Heartbeat every 30 seconds to keep the lock fresh
        const interval = setInterval(acquireLock, 30000);

        // Release on tab close / navigation away
        const handleUnload = () => {
            // Note: releaseLock is async, might not finish in all browsers on unload
            // but we try anyway.
            releaseLock();
        };
        window.addEventListener('beforeunload', handleUnload);

        return () => {
            clearInterval(interval);
            window.removeEventListener('beforeunload', handleUnload);
            releaseLock();
        };
    }, [r2Settings, auth.isAuthenticated, auth.role, acquireLock, releaseLock]);

    const commitRegistryChanges = React.useCallback((updates: Partial<BackupData>) => {
        Object.keys(updates).forEach((key) => {
            const val = (updates as any)[key];
            if (val !== undefined) (databaseRef.current as any)[key] = val;
        });

        if (updates.sites !== undefined) _setSites([...updates.sites]);
        if (updates.zones !== undefined) _setZones([...updates.zones]);
        if (updates.anchors !== undefined) _setAnchors([...updates.anchors]);
        if (updates.substrateZones !== undefined) _setSubstrateZones([...updates.substrateZones]);
        if (updates.rubbleAnchors !== undefined) _setRubbleAnchors([...updates.rubbleAnchors]);
        if (updates.trees !== undefined) _setTrees([...updates.trees]);
        if (updates.floats !== undefined) _setFloats([...updates.floats]);
        if (updates.coralBranches !== undefined) _setBranches([...updates.coralBranches]);
        if (updates.speciesList !== undefined) _setSpeciesList([...updates.speciesList]);
        if (updates.activityLog !== undefined) _setActivityLog([...updates.activityLog]);
        if (updates.maintenanceLogs !== undefined) _setMaintenanceLogs([...updates.maintenanceLogs]);
        if (updates.tanks !== undefined) _setTanks([...updates.tanks]);
        if (updates.toDoItems !== undefined) _setToDoItems([...updates.toDoItems]);
        if (updates.voiceNotes !== undefined) _setVoiceNotes([...updates.voiceNotes]);
        if (updates.records !== undefined) _setRecords([...updates.records]);
        if (updates.forms !== undefined) _setForms([...updates.forms]);
        if (updates.rules !== undefined) _setRules([...updates.rules]);
        if (updates.volunteers !== undefined) _setVolunteers([...updates.volunteers]);
        if (updates.visitors !== undefined) _setVisitors([...updates.visitors]);
        if (updates.staffMembers !== undefined) _setStaffMembers([...updates.staffMembers]);
        if (updates.shifts !== undefined) _setShifts([...updates.shifts]);
        if (updates.gearItems !== undefined) _setGearItems([...updates.gearItems]);
        if (updates.emailTemplates !== undefined) _setEmailTemplates([...updates.emailTemplates]);
        if (updates.merchandise !== undefined) _setMerchandise([...updates.merchandise]);
        if (updates.merchandiseLogs !== undefined) _setMerchandiseLogs([...updates.merchandiseLogs]);
        if (updates.tempLoggers !== undefined) _setTempLoggers([...updates.tempLoggers]);
        if (updates.treeShadeExperiment !== undefined) _setTreeShadeExperiment(updates.treeShadeExperiment);
        if (updates.longTermStudy !== undefined) _setLongTermStudy(updates.longTermStudy);
        if (updates.prefixSettings !== undefined) _setPrefixSettings(updates.prefixSettings);
        if (updates.pageLocks !== undefined) _setPageLocks(updates.pageLocks);

        setHasUnsavedChanges(true);
    }, []);

    const saveToCloudManual = async (overrides?: VolunteerShift[]): Promise<boolean> => {
        if (!r2Settings || (isReadOnly && !adminOverride) || !isInitialLoadComplete) return false;
        setSyncMode('saving');
        try {
            const client = getS3Client();
            if (!client) throw new Error("Cloud Storage unreachable.");
            const backupData: BackupData = { 
                ...databaseRef.current,
                shifts: overrides || databaseRef.current.shifts 
            };
            await client.send(new PutObjectCommand({ 
                Bucket: r2Settings.bucketName, 
                Key: 'coral_backup_latest.json', 
                Body: JSON.stringify(backupData, null, 2), 
                ContentType: 'application/json' 
            }));
            setHasUnsavedChanges(false);
            setSyncMode('synced');
            setTimeout(() => setSyncMode('idle'), 3000); 
            return true;
        } catch (e) { 
            console.error("Cloud Commit Failed:", e);
            setSyncMode('error'); 
            return false;
        }
    };

    const uploadMedia = React.useCallback(async (file: File | Blob, folder: string): Promise<string> => {
        const settings = r2Settings || JSON.parse(localStorage.getItem('coral_r2_config') || 'null');
        if (!settings) throw new Error("Storage not configured.");
        const client = new S3Client({
            region: "auto",
            endpoint: `https://${settings.accountId}.r2.cloudflarestorage.com`,
            credentials: { accessKeyId: settings.accessKeyId, secretAccessKey: settings.secretAccessKey },
            forcePathStyle: true,
        });
        const key = `${folder}/${Date.now()}-${(file as any).name || 'upload.jpg'}`;
        await client.send(new PutObjectCommand({ Bucket: settings.bucketName, Key: key, Body: file, ContentType: (file as any).type || 'image/jpeg' }));
        return key;
    }, [r2Settings]);

    const handleUpdatePhotos = React.useCallback(async (parentId: string, action: 'add' | 'delete' | 'main', payload: any) => {
        if (isReadOnly) return;
        setSyncMode('saving');
        try {
            const allBranches = [...databaseRef.current.coralBranches];
            const allTrees = [...databaseRef.current.trees];
            const allRA = [...databaseRef.current.rubbleAnchors];
            const allSZ = [...databaseRef.current.substrateZones];
            
            let target: any = null;
            const pid = String(parentId).trim();
            target = allBranches.find(b => b.id === pid) || allTrees.find(t => t.id === pid) || allRA.find(r => r.id === pid) || allSZ.find(z => z.id === pid);
            
            if (!target) return;
            if (action === 'add') {
                const files = payload as File[];
                const uploaded = [];
                for (const file of files) {
                    const url = await uploadMedia(file, `inventory/${pid}`);
                    uploaded.push({ id: Math.random().toString(36).substr(2, 9), url, isMain: false, dateTaken: new Date().toISOString() });
                }
                target.photos = [...(target.photos || []), ...uploaded];
            } else if (action === 'delete') {
                target.photos = (target.photos || []).filter((p: any) => !payload.includes(p.id));
            } else if (action === 'main') {
                target.photos = (target.photos || []).map((p: any) => ({ ...p, isMain: p.id === payload }));
            }
            commitRegistryChanges({ coralBranches: allBranches, trees: allTrees, rubbleAnchors: allRA, substrateZones: allSZ });
            await saveToCloudManual();
        } finally { setSyncMode('idle'); }
    }, [isReadOnly, commitRegistryChanges, uploadMedia]);

    const handleRestoreData = React.useCallback((data: any) => {
        if (!data) return;
        databaseRef.current = data;
        commitRegistryChanges(data);
    }, [commitRegistryChanges]);

    const handleNavigate = React.useCallback((page: Page, highlightId?: string) => {
        const url = `/#/${page}${highlightId ? `?id=${highlightId}` : ''}`;
        window.history.pushState({ page, highlightId }, '', url);
        setCurrentPage(page);
        setNavigationSignal(highlightId);
    }, []);

    const handleGoBack = React.useCallback(() => { window.history.back(); }, []);

    const renderPageContent = () => {
        if (currentPage === 'welcome') return <WelcomePage staffMembers={staffMembers} volunteers={volunteers} onAddStaff={(s) => commitRegistryChanges({ staffMembers: [...staffMembers, s] })} onLogin={(role, name, id) => { setAuth({ isAuthenticated: true, role, userName: name, userId: id }); localStorage.setItem('rrf_auth', JSON.stringify({ isAuthenticated: true, role, userName: name, userId: id })); handleNavigate('dashboard'); }} />;
        
        switch (currentPage) {
            case 'dashboard':
                return <DashboardPage isReadOnly={isReadOnly} r2Settings={r2Settings} prefixSettings={prefixSettings} branches={branches} sites={sites} trees={trees} substrateZones={substrateZones} rubbleAnchors={rubbleAnchors} anchors={anchors} shifts={shifts} staffMembers={staffMembers} volunteers={volunteers} visitors={visitors} onSelectBranch={(id) => handleNavigate('details', id)} onNavigateToTree={(id) => handleNavigate('trees', id)} onNavigateToBranch={(id) => handleNavigate('details', id)} onNavigateToPage={(p, id) => handleNavigate(p as Page, id)} reminders={[]} zones={zones} />;
            case 'photoViewer':
                return <PhotoViewerPage branches={branches} trees={trees} substrateZones={substrateZones} rubbleAnchors={rubbleAnchors} r2Settings={r2Settings} onUpdatePhotos={handleUpdatePhotos} uploadMedia={uploadMedia} onNavigateBack={handleGoBack} onNavigateToPage={handleNavigate} initialSelectedId={navigationSignal} />;
            case 'photoAlbum':
                return <PhotoAlbumPage branches={branches} trees={trees} substrateZones={substrateZones} rubbleAnchors={rubbleAnchors} r2Settings={r2Settings} onNavigateBack={handleGoBack} onNavigateToPage={handleNavigate} initialSelectedId={navigationSignal || undefined} />;
            case 'addEditItems':
                return <AddEditItemsPage initialSection="Branches" activeBranches={branches} onSelectBranch={(id) => handleNavigate('details', id)} onNavigateBack={() => handleNavigate('dashboard')} onNavigateToPage={handleNavigate} lockInfo={lockInfo} isCheckingLock={false} onCheckLock={async () => lockInfo} onAcquireLock={async () => true} onReleaseLock={async () => {}} currentSessionId={DEVICE_ID} isReadOnly={isReadOnly} userName={auth.userName} />;
            case 'people':
                return <PeoplePage isReadOnly={isReadOnly} adminOverride={adminOverride} r2Settings={r2Settings} syncMode={syncMode} volunteers={volunteers} staffMembers={staffMembers} shifts={shifts} sites={sites} gearItems={[]} emailTemplates={[]} onAddVolunteer={(v) => commitRegistryChanges({ volunteers: [...volunteers, v] })} onUpdateVolunteer={(v) => commitRegistryChanges({ volunteers: volunteers.map(x => x.id === v.id ? v : x) })} onDeleteVolunteer={(id) => commitRegistryChanges({ volunteers: volunteers.filter(x => x.id !== id) })} onAddStaffMember={(s) => commitRegistryChanges({ staffMembers: [...staffMembers, s] })} onUpdateStaffMember={(s) => commitRegistryChanges({ staffMembers: staffMembers.map(x => x.id === s.id ? s : x) })} onDeleteStaffMember={(id) => commitRegistryChanges({ staffMembers: staffMembers.filter(x => x.id !== id) })} onUpdateShift={(s) => commitRegistryChanges({ shifts: shifts.map(x => x.id === s.id ? s : x) })} onNavigateBack={handleGoBack} />;
            case 'monitoring':
                return <MonitoringPage branches={branches} sites={sites} trees={trees} anchors={anchors} prefixSettings={prefixSettings} isReadOnly={isReadOnly} onAddHealthReport={(id, report) => {}} onNavigateBack={handleGoBack} onSelectBranch={(id) => handleNavigate('details', id)} onLogMaintenance={(log) => {}} />;
            case 'settings':
                return <SettingsPage r2Settings={r2Settings} adminOverride={adminOverride} globalReadOnly={globalReadOnly} onToggleGlobalReadOnly={setGlobalReadOnly} onToggleAdminOverride={setAdminOverride} onApplySettings={(s) => { localStorage.setItem('coral_r2_config', JSON.stringify(s)); setR2Settings(s); }} onNavigateBack={handleGoBack} onNavigateToPage={handleNavigate} onUpdateStaff={(s) => commitRegistryChanges({ staffMembers: staffMembers.map(x => x.id === s.id ? s : x) })} currentStaff={staffMembers.find(s => s.name === auth.userName)} />;
            case 'details':
                const b = branches.find(x => String(x.id).trim() === String(navigationSignal).trim());
                return b ? <CoralBranchDisplay branch={b} activityLog={activityLog} r2Settings={r2Settings} prefixSettings={prefixSettings} isReadOnly={isReadOnly} onOpenPhotoManager={() => handleNavigate('photoViewer', b.id)} onNavigateToHealthReports={() => handleNavigate('healthReports')} onNavigateToGrowthReports={() => handleNavigate('growthReports')} onEdit={() => handleNavigate('branches', b.id)} onMove={() => handleNavigate('moveItems', b.id)} /> : null;
            case 'operationalSchedule':
                return <OperationalSchedulePage isReadOnly={isReadOnly} shifts={shifts} sites={sites} volunteers={volunteers} staffMembers={staffMembers} gearItems={[]} onUpdateGear={() => {}} onAddShift={(s) => commitRegistryChanges({ shifts: [...shifts, s] })} onUpdateShift={(s) => commitRegistryChanges({ shifts: shifts.map(x => x.id === s.id ? s : x) })} onDeleteShift={(id) => commitRegistryChanges({ shifts: shifts.filter(x => x.id !== id) })} onForceSync={saveToCloudManual} onNavigateBack={handleGoBack} initialDate={navigationSignal} />;
            case 'environmental':
                return <EnvironmentalPage onNavigateBack={handleGoBack} />;
            case 'spawning':
                return <SpawningPage sites={sites} anchors={anchors} trees={trees} branches={branches} prefixSettings={prefixSettings} onUpdateSpawnStatus={(id, status) => { const b = branches.find(x => x.id === id); if(b) commitRegistryChanges({ coralBranches: branches.map(x => x.id === id ? {...x, isConfirmedSpawned: status} : x) }); }} onNavigateBack={handleGoBack} />;
            case 'speciesId':
                return <SpeciesIdPage speciesList={speciesList} r2Settings={r2Settings} onAddSpecies={(s) => commitRegistryChanges({ speciesList: [...speciesList, s] })} onUpdateSpecies={(s) => commitRegistryChanges({ speciesList: speciesList.map(x => x.id === s.id ? s : x) })} onDeleteSpecies={(id) => commitRegistryChanges({ speciesList: speciesList.filter(x => x.id !== id) })} onNavigateBack={handleGoBack} uploadMedia={uploadMedia} />;
            case 'reports':
                return <ReportsPage onNavigateBack={handleGoBack} coralBranches={branches} activityLog={activityLog} records={records} onAddRecord={(r) => commitRegistryChanges({ records: [...records, r] })} onUpdateRecord={(r) => commitRegistryChanges({ records: records.map(x => x.id === r.id ? r : x) })} forms={forms} onAddForm={(f) => commitRegistryChanges({ forms: [...forms, f] })} trees={trees} rubbleAnchors={rubbleAnchors} speciesList={speciesList} initialSignal={navigationSignal} uploadMedia={uploadMedia} />;
            case 'trends':
                return <TrendsPage coralBranches={branches} maintenanceLogs={maintenanceLogs} sites={sites} trees={trees} anchors={anchors} onNavigateBack={handleGoBack} />;
            case 'experiments':
                return <ExperimentsPage onNavigateToPage={handleNavigate} lockInfo={lockInfo} currentSessionId={DEVICE_ID} isReadOnly={isReadOnly} />;
            case 'treeShadeExperiment':
                /**
                 * FIXED: Removed duplicate onAddLog prop from TreeShadeExperimentPage call.
                 */
                return <TreeShadeExperimentPage experiment={treeShadeExperiment} trees={trees} branches={branches} onStart={(c, s, l) => commitRegistryChanges({ treeShadeExperiment: { isActive: true, controlTreeId: c, shadedTreeId: s, shadeLevel: l, startDate: new Date().toISOString(), reports: [] } })} onAddReport={(n) => { if(treeShadeExperiment) { const r = { id: Math.random().toString(), date: new Date().toISOString(), controlTreeHealth: 100, shadedTreeHealth: 100, controlTreeBleachingCount: 0, shadedTreeBleachingCount: 0, notes: n }; commitRegistryChanges({ treeShadeExperiment: { ...treeShadeExperiment, reports: [...treeShadeExperiment.reports, r] } }); } }} onAddLog={(l) => commitRegistryChanges({ maintenanceLogs: [...maintenanceLogs, { ...l, id: Math.random().toString(), timestamp: new Date().toISOString() }] })} onEnd={() => commitRegistryChanges({ treeShadeExperiment: null })} onNavigateBack={handleGoBack} />;
            case 'backupRestore':
                return <BackupRestorePage onNavigateBack={handleGoBack} backupData={databaseRef.current} onWipeAllData={() => { if(confirm('WIPE ALL DATA?')) { handleRestoreData({ coralBranches: [], rules: [], sites: [], zones: [], anchors: [], substrateZones: [], rubbleAnchors: [], trees: [], floats: [], activityLog: [], maintenanceLogs: [], tanks: [], speciesList: [], toDoItems: [], voiceNotes: [], records: [], forms: [], staffMembers: [], volunteers: [], visitors: [], shifts: [], gearItems: [], emailTemplates: [], merchandise: [], merchandiseLogs: [], tempLoggers: [], treeShadeExperiment: null, longTermStudy: null, pageLocks: {} }); return true; } return false; }} onRestoreData={handleRestoreData} onImportData={(type, data) => commitRegistryChanges({ [type]: data })} onImportSpecies={(s) => commitRegistryChanges({ speciesList: s })} r2Settings={r2Settings} legacyPhotoCount={0} isMigratingPhotos={false} onMigratePhotosToCloud={() => {}} />;
            case 'notesToDo':
                return <NotesToDoPage toDoItems={toDoItems} voiceNotes={voiceNotes} onAddToDo={(t, u, m) => commitRegistryChanges({ toDoItems: [...toDoItems, { id: Math.random().toString(), text: t, mediaUrl: u, mediaType: m }] })} onDeleteToDo={(id) => commitRegistryChanges({ toDoItems: toDoItems.filter(x => x.id !== id) })} onAddVoiceNote={(u, d) => commitRegistryChanges({ voiceNotes: [...voiceNotes, { id: Math.random().toString(), audioUrl: u, duration: d }] })} onDeleteVoiceNote={(id) => commitRegistryChanges({ voiceNotes: voiceNotes.filter(x => x.id !== id) })} onNavigateBack={handleGoBack} uploadMedia={uploadMedia} />;
            case 'facility':
                return <FacilityPage onNavigateBack={handleGoBack} onNavigateToPage={handleNavigate} lockInfo={lockInfo} currentSessionId={DEVICE_ID} isReadOnly={isReadOnly} />;
            case 'facilityDailyTasks':
                return <FacilityDailyTasksPage onNavigateBack={() => handleNavigate('facility')} records={records} onAddRecord={(r) => commitRegistryChanges({ records: [...records, r] })} onUpdateRecord={(r) => commitRegistryChanges({ records: records.map(x => x.id === r.id ? r : x) })} initialSignal={navigationSignal} />;
            case 'facilityAddEditMove':
                return <FacilityAddEditMovePage onNavigateBack={() => handleNavigate('facility')} onNavigateToPage={handleNavigate} />;
            case 'facilityTanks':
                return <FacilityTanksPage tanks={tanks} onAddTank={(sh, h, l, w, d) => { const n = { id: Math.random().toString(), name: `Tank ${tanks.length + 1}`, shape: sh, height: h, length: l, width: w, diameter: d, volume: 0 }; commitRegistryChanges({ tanks: [...tanks, n] }); return n; }} onDeleteTank={(id) => commitRegistryChanges({ tanks: tanks.filter(x => x.id !== id) })} onNavigateBack={() => handleNavigate('facilityAddEditMove')} />;
            case 'volunteerPortal':
                return <VolunteerPortal authState={auth} volunteers={volunteers} shifts={shifts} sites={sites} gearItems={gearItems} onUpdateVolunteer={(v) => commitRegistryChanges({ volunteers: volunteers.map(x => x.id === v.id ? v : x) })} onUpdateGear={(g) => commitRegistryChanges({ gearItems: gearItems.map(x => x.id === g.id ? g : x) })} onRequestShift={(vId, sId) => { const s = shifts.find(x => x.id === sId); if(s) commitRegistryChanges({ shifts: shifts.map(x => x.id === sId ? {...x, pendingVolunteerIds: [...(x.pendingVolunteerIds || []), vId]} : x) }); }} onAddRecord={(r) => commitRegistryChanges({ records: [...records, r] })} onNavigateToPage={handleNavigate} onLogout={() => { setAuth({ isAuthenticated: false, role: 'Public', userId: null, userName: '' }); localStorage.removeItem('rrf_auth'); handleNavigate('welcome'); }} />;
            case 'siteDesign':
                return <SiteDesignPage pageLocks={pageLocks} onToggleLock={(id, v) => commitRegistryChanges({ pageLocks: {...pageLocks, [id]: v} })} onBatchToggleLocks={(l) => commitRegistryChanges({ pageLocks: l })} onNavigateBack={handleGoBack} />;
            case 'projectProgress':
                return <ProjectProgress pageLocks={pageLocks} onNavigateBack={handleGoBack} onNavigateToPage={handleNavigate} />;
            case 'sites':
                return <SitesPage isReadOnly={isReadOnly} sites={sites} onAddSite={(n, u) => { const id = Math.random().toString(); commitRegistryChanges({ sites: [...sites, { id, name: n, photoUrl: u }] }); return id; }} onUpdateSite={(s) => commitRegistryChanges({ sites: sites.map(x => x.id === s.id ? s : x) })} onArchiveSite={(id) => commitRegistryChanges({ sites: sites.map(x => x.id === id ? {...x, isArchived: true} : x) })} onNavigateBack={() => handleNavigate('addEditItems')} />;
            case 'anchors':
                return <AnchorsPage sites={sites} anchors={anchors} isReadOnly={isReadOnly} onAddAnchor={(n, s, la, lo, d, de) => { const id = Math.random().toString(); commitRegistryChanges({ anchors: [...anchors, { id, name: n, siteId: s, latitude: la, longitude: lo, isDeepwater: d, depth: de }] }); return id; }} onUpdateAnchor={(a) => commitRegistryChanges({ anchors: anchors.map(x => x.id === a.id ? a : x) })} onArchiveAnchor={(id) => commitRegistryChanges({ anchors: anchors.map(x => x.id === id ? {...x, isArchived: true} : x) })} onNavigateBack={() => handleNavigate('addEditItems')} />;
            case 'collectionZones':
                return <CollectionZonesPage sites={sites} zones={zones} isReadOnly={isReadOnly} onAddZone={(n, s, la, lo) => { const id = Math.random().toString(); commitRegistryChanges({ zones: [...zones, { id, name: n, siteId: s, latitude: la, longitude: lo }] }); return id; }} onUpdateZone={(z) => commitRegistryChanges({ zones: zones.map(x => x.id === z.id ? z : x) })} onArchiveZone={(id) => commitRegistryChanges({ zones: zones.map(x => x.id === id ? {...x, isArchived: true} : x) })} onNavigateBack={() => handleNavigate('addEditItems')} />;
            case 'substrateZones':
                return <SubstrateZonesPage sites={sites} zones={substrateZones} activeBranches={branches} r2Settings={r2Settings} isReadOnly={isReadOnly} onAddZone={(n, s, d, la, lo) => { const id = Math.random().toString(); commitRegistryChanges({ substrateZones: [...substrateZones, { id, name: n || `SZ-${substrateZones.length+1}`, siteId: s, depth: d, latitude: la, longitude: lo, dateAdded: new Date().toISOString(), photos: [], healthReports: [], growthReports: [] }] }); return id; }} onUpdateZone={(z) => commitRegistryChanges({ substrateZones: substrateZones.map(x => x.id === z.id ? z : x) })} onArchiveZone={(id) => commitRegistryChanges({ substrateZones: substrateZones.map(x => x.id === id ? {...x, isArchived: true} : x) })} onAddReport={(id, type, report) => { const z = substrateZones.find(x => x.id === id); if(z) { const updated = {...z}; if(type==='health') updated.healthReports = [...z.healthReports, report as HealthReport]; else updated.growthReports = [...z.growthReports, report as GrowthReport]; commitRegistryChanges({ substrateZones: substrateZones.map(x => x.id === id ? updated : x) }); } }} onAddPhoto={(id, p) => { const z = substrateZones.find(x => x.id === id); if(z) commitRegistryChanges({ substrateZones: substrateZones.map(x => x.id === id ? {...z, photos: [...z.photos, p]} : x) }); }} onNavigateBack={() => handleNavigate('addEditItems')} onSelectBranch={(id) => handleNavigate('details', id)} initialZoneId={navigationSignal} />;
            case 'rubbleAnchors':
                return <RubbleAnchorsPage sites={sites} substrateZones={substrateZones} rubbleAnchors={rubbleAnchors} speciesList={speciesList} onAddRubbleAnchor={(z, d, g, s) => { const id = Math.random().toString(); const n = { id, name: `RA-${rubbleAnchors.length+1}`, substrateZoneId: z, depth: d, genus: g, species: s, dateAdded: new Date().toISOString(), healthReports: [], growthReports: [], photos: [] }; commitRegistryChanges({ rubbleAnchors: [...rubbleAnchors, n] }); return n; }} onUpdateRubbleAnchor={(a) => commitRegistryChanges({ rubbleAnchors: rubbleAnchors.map(x => x.id === a.id ? a : x) })} onDeleteRubbleAnchor={(id) => commitRegistryChanges({ rubbleAnchors: rubbleAnchors.filter(x => x.id !== id) })} onNavigateBack={() => handleNavigate('addEditItems')} onNavigateToSpecies={() => handleNavigate('speciesId')} highlightAnchorId={navigationSignal} isReadOnly={isReadOnly} />;
            case 'trees':
                return <TreesPage structureType="Tree" sites={sites} anchors={anchors} trees={trees} floats={floats} branches={branches} activityLog={activityLog} prefixSettings={prefixSettings} r2Settings={r2Settings} onAddTree={(a, t, la, lo, d) => { const id = Math.random().toString(); const n = { id, number: trees.length + 1, type: t, anchorId: a, currentDepth: d || 10, normalDepth: d || 10, dateAdded: new Date().toISOString(), photos: [], latitude: la, longitude: lo }; commitRegistryChanges({ trees: [...trees, n] }); return { id, name: `T${n.number}` }; }} onUpdateTree={(t) => commitRegistryChanges({ trees: trees.map(x => x.id === t.id ? t : x) })} onAddFloat={(id) => commitRegistryChanges({ floats: [...floats, { id: Math.random().toString(), treeId: id, name: `F-${floats.length+1}` }] })} onMoveTreeUp={() => {}} onMoveTreeDown={() => {}} onMoveTree={() => {}} onArchiveTree={(id) => commitRegistryChanges({ trees: trees.map(x => x.id === id ? {...x, isArchived: true} : x) })} onNavigateBack={() => handleNavigate('addEditItems')} onNavigateToPage={handleNavigate} onOpenGallery={(id) => handleNavigate('photoViewer', id)} />;
            case 'branches':
                return <BranchesPage sites={sites} anchors={anchors} trees={trees} branches={branches} speciesList={speciesList} r2Settings={r2Settings} onNavigateToSpecies={() => handleNavigate('speciesId')} activityLog={activityLog} prefixSettings={prefixSettings} onAddBranch={(s, t, f, p, h, g, sp) => { const id = Math.random().toString(); const tree = trees.find(x => x.id === t); const site = sites.find(x => x.id === s); if(!tree || !site) return null; const n = { id, fragmentId: `B-${branches.length+1}`, genus: g, species: sp, dateAdded: new Date().toISOString(), tree: tree.number, treeType: tree.type, site: site.name, face: f, position: p, photos: [], healthReports: [], growthReports: [], isHeatTolerant: h }; commitRegistryChanges({ coralBranches: [...branches, n] }); return n; }} onMoveBranch={() => {}} onSelectBranch={(id) => handleNavigate('details', id)} onUpdateBranch={(b) => commitRegistryChanges({ coralBranches: branches.map(x => x.id === b.id ? b : x) })} onArchiveBranch={(id) => commitRegistryChanges({ coralBranches: branches.map(x => x.id === id ? {...x, isArchived: true} : x) })} onNavigateBack={() => handleNavigate('addEditItems')} onOpenGallery={(id) => handleNavigate('photoViewer', id)} isReadOnly={isReadOnly} />;
            case 'ropeUnits':
                return <RopeUnitsPage isReadOnly={isReadOnly} r2Settings={r2Settings} sites={sites} anchors={anchors} trees={trees} substrateZones={substrateZones} speciesList={speciesList} onNavigateToSpecies={() => handleNavigate('speciesId')} ropeUnits={branches.filter(b => b.type === 'RopeUnit')} activityLog={activityLog} prefixSettings={prefixSettings} onAddRopeUnit={(s, t, f, p, h, g, sp) => { const id = Math.random().toString(); const tree = trees.find(x => x.id === t); const site = sites.find(x => x.id === s); if(!tree || !site) return null; const n = { id, fragmentId: `S-${branches.filter(b => b.type === 'RopeUnit').length+1}`, type: 'RopeUnit' as any, genus: g, species: sp, dateAdded: new Date().toISOString(), tree: tree.number, treeType: tree.type, site: site.name, face: f, position: p, photos: [], healthReports: [], growthReports: [], isHeatTolerant: h }; commitRegistryChanges({ coralBranches: [...branches, n] }); return n; }} onMoveRopeUnit={() => {}} onOutplantRopeUnit={() => {}} onSelectRopeUnit={(id) => handleNavigate('details', id)} onUpdateRopeUnit={(b) => commitRegistryChanges({ coralBranches: branches.map(x => x.id === b.id ? b : x) })} onNavigateBack={() => handleNavigate('addEditItems')} onOpenGallery={(id) => handleNavigate('photoViewer', id)} />;
            case 'deviceClusters':
                return <DeviceClustersPage isReadOnly={isReadOnly} r2Settings={r2Settings} sites={sites} anchors={anchors} trees={trees} speciesList={speciesList} onNavigateToSpecies={() => handleNavigate('speciesId')} deviceClusters={branches.filter(b => b.type === 'DeviceCluster')} prefixSettings={prefixSettings} onAddDeviceCluster={(s, t, f, p, h, g, sp, sd) => { const id = Math.random().toString(); const tree = trees.find(x => x.id === t); const site = sites.find(x => x.id === s); if(!tree || !site) return null; const n = { id, fragmentId: `C-${branches.filter(b => b.type === 'DeviceCluster').length+1}`, type: 'DeviceCluster' as any, genus: g, species: sp, dateAdded: new Date().toISOString(), tree: tree.number, treeType: tree.type, site: site.name, face: f, position: p, photos: [], healthReports: [], growthReports: [], isHeatTolerant: h, spawningDetails: sd }; commitRegistryChanges({ coralBranches: [...branches, n] }); return n; }} onMoveDeviceCluster={() => {}} onSelectDeviceCluster={(id) => handleNavigate('details', id)} onUpdateDeviceCluster={(b) => commitRegistryChanges({ coralBranches: branches.map(x => x.id === b.id ? b : x) })} onNavigateBack={() => handleNavigate('addEditItems')} onOpenGallery={(id) => handleNavigate('photoViewer', id)} />;
            case 'numberingSystem':
                return <NumberingSystemPage settings={prefixSettings} onUpdate={(s) => commitRegistryChanges({ prefixSettings: s })} onNavigateBack={() => handleNavigate('addEditItems')} />;
            case 'qrGenerator':
                return <QRCodeGeneratorPage onNavigateBack={() => handleNavigate('addEditItems')} />;
            case 'rules':
                return <RulesPage rules={rules} onAddRule={(r) => commitRegistryChanges({ rules: [...rules, { ...r, id: Math.random().toString() }] })} onUpdateRule={(r) => commitRegistryChanges({ rules: rules.map(x => x.id === r.id ? r : x) })} onDeleteRule={(id) => commitRegistryChanges({ rules: rules.filter(x => x.id !== id) })} onNavigateBack={() => handleNavigate('addEditItems')} isReadOnly={isReadOnly} />;
            default:
                return <div className="text-center py-20 uppercase font-black italic">Route Not Implemented: {currentPage}</div>;
        }
    };

    React.useEffect(() => {
        const loadInitialData = async () => {
            if (!r2Settings) { setIsInitialLoadComplete(true); return; }
            try {
                const client = getS3Client();
                if (!client) return;
                const response = await client.send(new GetObjectCommand({ Bucket: r2Settings.bucketName, Key: 'coral_backup_latest.json' }));
                const str = await response.Body?.transformToString();
                if (str) handleRestoreData(JSON.parse(str));
            } catch (e) { console.error("Load failed", e); }
            finally { setIsInitialLoadComplete(true); }
        };
        loadInitialData();
    }, [r2Settings, handleRestoreData, getS3Client]);

    return (
        <div className="min-h-screen bg-coral-sand flex flex-col">
            <header className="bg-blue-500 border-b border-blue-600 px-4 py-3 flex justify-between items-center sticky top-0 z-50 shadow-sm print:hidden">
                <div className="flex items-center gap-4">
                    <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-blue-600 rounded-lg transition-colors">
                        <HamburgerIcon className="w-6 h-6 text-white" />
                    </button>
                    <button onClick={() => handleNavigate('dashboard')} className="flex items-center hover:opacity-70 transition-opacity text-left">
                        <span className="text-[10px] font-black bg-coral-dark text-white px-2 py-0.5 rounded italic shadow-sm uppercase">Dashboard</span>
                    </button>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        {adminOverride ? (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-md border border-amber-600 animate-pulse">
                                <WrenchIcon className="w-3 h-3" />
                                <span>Admin Mode</span>
                            </div>
                        ) : !isReadOnly ? (
                            <div className="flex items-center gap-1.5 px-3 py-1 bg-green-500 text-white rounded-full text-[9px] font-black uppercase tracking-widest shadow-md border border-green-600">
                                <CheckCircleIcon className="w-3 h-3" />
                                <span>Session Active</span>
                            </div>
                        ) : (
                            <div className="px-3 py-1 bg-blue-600/40 text-white border border-blue-400/30 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                                <span>Read Only</span>
                            </div>
                        )}
                    </div>
                    <div className="h-6 w-px bg-blue-400/30 hidden sm:block mx-1"></div>
                    <div className="text-white">
                        <GlobalQuickAccess trees={trees} branches={branches} sites={sites} anchors={anchors} tanks={tanks} rubbleAnchors={rubbleAnchors} prefixSettings={prefixSettings} onNavigateToTree={(id) => handleNavigate('trees', id)} onNavigateToBranch={(id) => handleNavigate('details', id)} onNavigateToTank={(id) => handleNavigate('facilityTanks', id)} onNavigateToRubbleAnchor={(id) => handleNavigate('rubbleAnchors', id)} onNavigateToPage={handleNavigate} isReadOnly={isReadOnly} />
                    </div>
                </div>
            </header>

            <main className="flex-grow container mx-auto px-4 py-8">
                {renderPageContent()}
            </main>

            <SideMenu 
                isOpen={isMenuOpen} 
                onClose={() => setIsMenuOpen(false)} 
                onNavigateToAddEdit={() => handleNavigate('addEditItems')} 
                onNavigateToPage={handleNavigate} 
                isLockedByOthers={!!lockInfo && lockInfo.sessionId !== DEVICE_ID} 
                lockedBy={lockInfo?.lockedBy} 
                currentPage={currentPage}
            />
        </div>
    );
}