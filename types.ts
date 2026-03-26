export type Page = 'dashboard' | 'people' | 'diveGear' | 'branches' | 'addEditItems' | 'sites' | 'anchors' | 'collectionZones' | 'substrateZones' | 'rubbleAnchors' | 'trees' | 'reef2s' | 'reef3s' | 'ropeUnits' | 'deviceClusters' | 'monitoring' | 'environmental' | 'spawning' | 'speciesId' | 'reports' | 'rules' | 'dataLoggers' | 'trends' | 'archive' | 'backupRestore' | 'notesToDo' | 'floatManagement' | 'qrGenerator' | 'schedule' | 'operationalSchedule' | 'numberingSystem' | 'facility' | 'facilityDailyTasks' | 'facilityAddEditMove' | 'facilityTanks' | 'settings' | 'details' | 'rubbleAnchorDetails' | 'healthReports' | 'growthReports' | 'modelComparison' | 'treeShadeExperiment' | 'ropeOnRubbleExperiment' | 'squareRopeFrameExperiment' | 'cubeRopeFrameExperiment' | 'merchandise' | 'experiments' | 'moveItems' | 'systemMap' | 'welcome' | 'volunteerPortal' | 'volunteerProfile' | 'volunteerGear' | 'volunteerShifts' | 'siteDesign' | 'projectProgress' | 'photoViewer' | 'photoAlbum';

export type AddEditSection = 'Sites' | 'Collection Zones' | 'Anchors' | 'Substrate Zones' | 'Rubble Anchors' | 'Trees' | 'Reef²' | 'Reef³' | 'Branches' | 'Strings' | 'Device Clusters' | 'Floats' | 'Rules';

export type UserRole = 'Staff' | 'Volunteer' | 'Public';

export interface AuthState {
    isAuthenticated: boolean;
    role: UserRole;
    userId: string | null;
    userName: string;
}

export type StructureType = 'Tree' | 'Reef2' | 'Reef3';
export type ItemType = 'Branch' | 'RopeUnit' | 'DeviceCluster';

export interface Photo {
    id: string;
    url: string;
    isMain: boolean;
    dateTaken?: string;
    mediaType?: 'photo' | 'video';
    mimeType?: string;
}

export type BleachingLevel = 'None' | 'Mild' | 'Medium' | 'Strong';

export interface HealthReport {
    id: string;
    date: string;
    healthPercentage: number;
    bleaching: BleachingLevel;
    notes: string;
}

export interface GrowthReport {
    id: string;
    date: string;
    surfaceAreaM2: number;
    volumeM3: number;
}

export interface ParentGenotype {
    descriptor: string;
}

export interface SpawningEventDetails {
    spawnDate: string;
    tankId: string;
    autoSpawnerId: string;
    autoSpawnerSettings: string;
    settlementDate: string;
    growOutTankId: string;
    growOutEntryDate: string;
    growOutExitDate: string;
    growOutLightSettings: string;
    growOutTemp: number;
    parents: ParentGenotype[];
}

export interface CoralBranch {
    id: string;
    fragmentId: string;
    genus: string;
    species: string;
    dateAdded: string;
    tree: number;
    treeType?: StructureType;
    site: string;
    face: 1 | 2 | 3 | 4;
    position: number;
    type?: ItemType;
    photos: Photo[];
    healthReports: HealthReport[];
    growthReports: GrowthReport[];
    isHeatTolerant?: boolean;
    isConfirmedSpawned?: boolean;
    isArchived?: boolean;
    substrateZoneId?: string;
    outplantDepth?: number;
    spawningDetails?: SpawningEventDetails;
}

export interface Site {
    id: string;
    name: string;
    photoUrl: string;
    isArchived?: boolean;
}

export interface Anchor {
    id: string;
    name: string;
    siteId: string;
    isArchived?: boolean;
    latitude?: number;
    longitude?: number;
    isDeepwater?: boolean;
    depth?: number;
}

export interface CollectionZone {
    id: string;
    name: string;
    siteId: string;
    isArchived?: boolean;
    latitude?: number;
    longitude?: number;
}

export interface SubstrateZone {
    id: string;
    name: string;
    siteId: string;
    depth: number;
    zoneNumber: number;
    dateAdded: string;
    photos: Photo[];
    healthReports: HealthReport[];
    growthReports: GrowthReport[];
    isArchived?: boolean;
    latitude?: number;
    longitude?: number;
}

export interface RubbleAnchor {
    id: string;
    name: string;
    substrateZoneId: string;
    depth: number;
    genus: string;
    species: string;
    dateAdded: string;
    isArchived?: boolean;
    healthReports: HealthReport[];
    growthReports: GrowthReport[];
    photos: Photo[];
}

export interface Tree {
    id: string;
    number: number;
    type?: StructureType;
    anchorId: string;
    currentDepth: number;
    normalDepth: number;
    dateAdded: string;
    lastMovedDate?: string;
    photos: Photo[];
    isArchived?: boolean;
    latitude?: number;
    longitude?: number;
}

export interface Float {
    id: string;
    treeId: string;
    name: string;
}

export type LogType = 'movement' | 'monitoring' | 'maintenance' | 'general' | 'archive';

export interface ActivityLogItem {
    id: string;
    timestamp: string;
    message: string;
    type: LogType;
}

export type SpongeLevel = 'None' | 'Small' | 'Medium' | 'Large';
export type HydroidLevel = 'None' | 'Small' | 'Medium' | 'Large';
export type AlgaeLevel = 'None' | 'Small' | 'Medium' | 'Lots';
export type CleaningEffort = 'None' | 'Light scrub' | 'Medium scrub' | 'Heavy scrub';

export interface MaintenanceLog {
    id: string;
    timestamp: string;
    target: string;
    tasks: string[];
    notes: string;
    siteId?: string;
    treeId?: string;
    branchId?: string;
    anchorId?: string;
    spongeRemoved?: SpongeLevel;
    hydroidsCleaned?: HydroidLevel;
    algaeCleaned?: AlgaeLevel;
    cableTiesAdded?: boolean;
    cleaningEffort?: CleaningEffort;
    anchorConditionOk?: boolean;
    anchorHolding?: boolean;
    equipmentCleaned?: boolean;
    abrasionVisible?: boolean;
}

export type TankShape = 'Rectangle' | 'Round';

export interface Tank {
    id: string;
    name: string;
    volume: number;
    shape?: TankShape;
    height?: number;
    length?: number;
    width?: number;
    diameter?: number;
    isArchived?: boolean;
}

export interface ToDoItem {
    id: string;
    text: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
}

export interface VoiceNote {
    id: string;
    audioUrl: string;
    duration: number;
}

export type DigitizedRecordType = 'health' | 'maintenance' | 'equipment';

export interface DigitizedRecordData {
    recordType: DigitizedRecordType;
    date?: string;
    site?: string;
    surveyor?: string;
    branchId?: string;
    notes?: string;
    healthReport?: {
        healthScore: number;
        bleaching: string;
        diseases: string[];
        predators: string[];
    };
    equipmentReport?: {
        temperature: number;
        salinity: number;
        pH?: number;
        alkalinity?: number;
        socksChanged?: boolean;
        skimmerCleaned?: boolean;
        carbonChanged?: boolean;
        returnPumpOk?: boolean;
        wavemakersOk?: boolean;
        chillerOk?: boolean;
        heatersOk?: boolean;
        failuresDetected?: boolean;
    };
    treeMaintenanceReport?: {
        cleaned: boolean;
        floatsScrubbed: boolean;
        ropeCondition: string;
        brokenBranchesReplaced: number;
    };
}

export interface RecordFile {
    id: string;
    name: string;
    dateUploaded: string;
    url: string;
    digitizedData?: DigitizedRecordData;
}

export interface FormItem {
    id: string;
    name: string;
    dateUploaded: string;
    url?: string;
}

export interface R2Settings {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    publicUrl: string;
    userName: string;
}

export interface TreeShadeExperiment {
    isActive: boolean;
    controlTreeId: string;
    shadedTreeId: string;
    shadeLevel: 30 | 50;
    startDate: string;
    reports: any[];
}

export interface LongTermStudy {
    isActive: boolean;
    startDate: string;
    reports: any[];
}

export type RuleTarget = 'Site' | 'Collection Zone' | 'Anchor' | 'Tree' | 'Branch' | 'Float' | 'Substrate Zone' | 'Rubble Anchor';
export type CheckType = 'Health Report' | 'Scan' | 'Check' | 'Maintenance' | 'Service';

export interface Rule {
    id: string;
    target: string;
    intervalValue: number;
    intervalUnit: 'days' | 'weeks' | 'months';
    isRecurring: boolean;
    checkType: string;
}

export interface LockData {
    lockedBy: string;
    timestamp: number;
    sessionId: string;
}

export interface PrefixSettings {
    tree: string;
    reef2: string;
    reef3: string;
    branch: string;
    ropeUnit: string;
    deviceCluster: string;
    site: string;
    collectionZone: string;
    anchor: string;
    substrateZone: string;
    rubbleAnchor: string;
    float: string;
    tank: string;
    pump: string;
    light: string;
    power: string;
    filter: string;
    filterSock: string;
    autospawner: string;
    chiller: string;
}

export interface Species {
    id: string;
    genus: string;
    species: string;
    commonName?: string;
    description?: string;
    photos: Photo[];
    externalLink?: string;
}

export interface Volunteer {
    id: string;
    name: string;
    email: string;
    username?: string;
    password?: string;
    phone?: string;
    photoUrl?: string;
    emergencyContact?: string;
    divemasterNumber?: string;
    medicalExpiry?: string;
    medicalFileUrl?: string;
    firstAidExpiry?: string;
    firstAidFileUrl?: string;
    status: 'Pending' | 'Approved' | 'Rejected';
    daysOut?: number;
}

export interface TimeAwayPeriod {
    start: string;
    end: string;
}

export interface Staff {
    id: string;
    name: string;
    role: string;
    username?: string;
    password?: string;
    webAuthnCredentialId?: string;
    recurringAwayDays?: number[];
    timeAway?: TimeAwayPeriod[];
}

export interface Visitor {
    id: string;
    name: string;
    email?: string;
}

export interface VolunteerShift {
    id: string;
    date: string;
    siteId?: string;
    customSiteName?: string;
    shiftType: 'Full Day' | 'AM' | 'PM';
    assignedStaffIds: string[];
    assignedVolunteerIds: string[];
    assignedVisitorIds: string[];
    pendingVolunteerIds: string[];
    maxCapacity: number;
}

/**
 * FIXED: Defined and exported GearStatus
 */
export type GearStatus = 'Available' | 'In Use' | 'Faulty' | 'Service Due';

export type GearItem = {
    id: string;
    name: string;
    qrCode: string;
    type: 'Regulator' | 'BCD' | 'Computer' | 'Tank' | 'Other';
    /**
     * FIXED: Use exported GearStatus type
     */
    status: GearStatus;
    assignedVolunteerId?: string;
    maintenanceLogs: any[];
    lastServiceDate?: string;
    serviceIntervalMonths?: number;
}

export type EmailTemplateType = 'Shift Confirmation' | 'Shift Cancellation' | 'General Announcement';

export interface EmailTemplate {
    id: string;
    type: string;
    subject: string;
    body: string;
}

export interface Reminder {
    branchId: string;
    branchFragmentId: string;
    site: string;
    tree: number;
    face: number;
    position: number;
    message: string;
    status: 'due' | 'overdue' | 'complete';
}

export interface ScheduleItem {
    tree: Tree;
    fromDepth: number;
    toDepth: number;
    date: string;
}

export interface ParentGenotype {
    descriptor: string;
}

export interface TemperatureLogger {
    id: string;
    siteId: string;
    anchorId: string;
    depth: number;
}

export interface MerchandiseItem {
    id: string;
    name: string;
    category: string;
    size?: string;
    stock: number;
    description?: string;
    photoUrl?: string;
}

export interface MerchandiseLog {
    id: string;
    itemId: string;
    quantity: number;
    type: 'restock' | 'giveaway';
    date: string;
    recipient?: string;
    notes?: string;
}

export interface BackupData {
    coralBranches: CoralBranch[];
    rules: Rule[];
    sites: Site[];
    zones: CollectionZone[];
    anchors: Anchor[];
    substrateZones: SubstrateZone[];
    rubbleAnchors: RubbleAnchor[];
    trees: Tree[];
    floats: Float[];
    activityLog: ActivityLogItem[];
    maintenanceLogs: MaintenanceLog[];
    tanks: Tank[];
    speciesList: Species[];
    toDoItems: ToDoItem[];
    voiceNotes: VoiceNote[];
    records: RecordFile[];
    forms: FormItem[];
    staffMembers: Staff[];
    volunteers: Volunteer[];
    visitors: Visitor[];
    shifts: VolunteerShift[];
    gearItems: GearItem[];
    emailTemplates: EmailTemplate[];
    prefixSettings?: PrefixSettings;
    globalReadOnly?: boolean;
    merchandise?: MerchandiseItem[];
    merchandiseLogs?: MerchandiseLog[];
    tempLoggers?: TemperatureLogger[];
    treeShadeExperiment?: TreeShadeExperiment | null;
    longTermStudy?: LongTermStudy | null;
    pageLocks?: Record<string, boolean>;
}