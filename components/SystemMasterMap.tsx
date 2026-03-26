import * as React from 'react';
import { 
    HomeIcon, CubeIcon, UserGroupIcon, PencilIcon, HeartPulseIcon, 
    ThermometerIcon, SparklesIcon, BookOpenIcon, ChartBarIcon, ClipboardListIcon, 
    BeakerIcon, TrendingUpIcon, ArchiveBoxIcon, DatabaseIcon, CogIcon, 
    PencilSquareIcon, CameraIcon, GlobeAltIcon, CloseIcon, BriefcaseIcon, 
    ShoppingBagIcon, MailIcon, QrCodeIcon, StarIcon, ArrowPathIcon, WrenchIcon,
    PlusCircleIcon, CheckCircleIcon, SunIcon, ArrowRightOnRectangleIcon,
    CalendarIcon, ChevronRightIcon, BellIcon, CloudIcon, Square2StackIcon,
    MoonIcon, MicrophoneIcon, EyeIcon
} from './Icons';

interface FieldSpec {
    label: string;
    type: 'Input' | 'Logic' | 'Data' | 'Select' | 'Toggle' | 'Trigger' | 'View' | 'Action';
    details: string;
}

const TechnicalPageCard: React.FC<{
    title: string;
    parent?: string;
    icon: any;
    fields: FieldSpec[];
    logic: string[];
    color: string;
    id?: string;
}> = ({ title, parent, icon: Icon, fields, logic, color, id }) => (
    <div id={id} className="bg-white border-2 border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl transition-all flex flex-col gap-6 break-inside-avoid group relative overflow-hidden h-full">
        <div className="absolute -right-6 -top-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <Icon className="w-40 h-40" />
        </div>
        
        <div className="relative z-10 flex flex-col h-full">
            <div className="flex justify-between items-start border-b border-gray-100 pb-5 mb-6">
                <div className="flex items-center gap-5">
                    <div className={`p-4 ${color} text-white rounded-2xl group-hover:scale-110 transition-transform shadow-lg`}>
                        <Icon className="w-7 h-7" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-coral-dark uppercase tracking-tighter italic leading-none">{title}</h3>
                        {parent && <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1 italic">{parent}</p>}
                    </div>
                </div>
            </div>

            <div className="space-y-8 flex-grow">
                <div>
                    <p className="text-[10px] font-black text-coral-blue uppercase tracking-[0.3em] mb-4 ml-1 flex items-center gap-2">
                        <PlusCircleIcon className="w-3.5 h-3.5" /> Registry Schema
                    </p>
                    <div className="grid grid-cols-1 gap-2">
                        {fields.map((f, i) => (
                            <div key={i} className="flex flex-col p-3.5 bg-gray-50 rounded-2xl border border-gray-100 group/field hover:border-coral-blue/30 transition-colors">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[11px] font-black text-gray-700 uppercase truncate pr-2 tracking-tight">{f.label}</span>
                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${
                                        f.type === 'Logic' ? 'bg-orange-100 text-orange-600' :
                                        f.type === 'Trigger' ? 'bg-purple-100 text-purple-600' :
                                        f.type === 'View' ? 'bg-green-100 text-green-600' :
                                        f.type === 'Action' ? 'bg-coral-blue text-white' :
                                        'bg-blue-100 text-blue-600'
                                    }`}>{f.type}</span>
                                </div>
                                <p className="text-[9px] text-gray-400 font-bold leading-tight uppercase tracking-wide">{f.details}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <p className="text-[10px] font-black text-coral-green uppercase tracking-[0.3em] mb-4 ml-1 flex items-center gap-2">
                        <CheckCircleIcon className="w-3.5 h-3.5" /> Built-in Logic
                    </p>
                    <ul className="space-y-3">
                        {logic.map((l, i) => (
                            <li key={i} className="text-[10px] text-gray-500 font-bold leading-snug flex items-start gap-3 italic">
                                <span className="text-coral-green font-black shrink-0">»</span> {l}
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    </div>
);

const SiloHeader: React.FC<{ title: string; subtitle: string; icon: any; color: string }> = ({ title, subtitle, icon: Icon, color }) => (
    <div className="flex flex-col mb-16 animate-fade-in scroll-mt-24">
        <div className="flex items-center gap-8">
            <div className={`p-6 ${color} text-white rounded-[3rem] shadow-2xl scale-110`}>
                <Icon className="w-10 h-10" />
            </div>
            <div className="flex-grow">
                <h2 className="text-6xl font-black text-coral-dark uppercase tracking-tighter italic leading-none">{title}</h2>
                <p className="text-sm font-black text-coral-blue uppercase tracking-[0.5em] mt-2">{subtitle}</p>
            </div>
        </div>
        <div className="h-2 bg-gradient-to-r from-coral-blue via-gray-200 to-transparent mt-8 opacity-40 rounded-full"></div>
    </div>
);

const SystemMasterMap: React.FC<{ onNavigateBack: () => void }> = ({ onNavigateBack }) => {
    return (
        <div className="bg-coral-sand min-h-screen p-4 sm:p-12 space-y-64 animate-fade-in print:bg-white print:p-0">
            {/* MASTER DOCUMENT HEADER */}
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-end border-b-[20px] border-coral-dark pb-16 print:hidden">
                <div className="space-y-4">
                    <div className="flex items-center gap-6 mb-2">
                        <div className="bg-coral-dark p-4 rounded-3xl shadow-xl">
                            <CogIcon className="w-20 h-20 text-coral-blue animate-spin-slow" />
                        </div>
                        <div>
                            <h1 className="text-8xl sm:text-[10rem] font-black text-coral-dark uppercase tracking-tighter italic leading-none">The Blueprint</h1>
                            <p className="text-3xl sm:text-4xl font-bold text-coral-blue uppercase tracking-[0.4em] ml-2 mt-2 italic">Definitive Registry v15.0</p>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-6 mt-12 lg:mt-0 w-full lg:w-auto">
                    <button onClick={() => window.print()} className="bg-coral-green text-coral-dark font-black px-16 py-8 rounded-[3rem] shadow-2xl hover:brightness-105 active:scale-95 transition-all uppercase tracking-widest text-base flex items-center justify-center gap-6 border-b-[10px] border-green-600 group">
                        <ArchiveBoxIcon className="w-10 h-10 group-hover:scale-110 transition-transform" /> 
                        <span>Export Technical Manual</span>
                    </button>
                    <button onClick={onNavigateBack} className="bg-gray-900 text-white font-black px-12 py-8 rounded-[3rem] shadow-xl hover:bg-black active:scale-95 transition-all uppercase tracking-widest text-sm border-b-[10px] border-black">
                        Exit Registry
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto space-y-96">
                
                {/* 01. DASHBOARD */}
                <section>
                    <SiloHeader title="01. Dashboard" subtitle="Central Mission Control" icon={HomeIcon} color="bg-coral-blue" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        <TechnicalPageCard 
                            title="Primary Controls" parent="Dashboard" icon={CogIcon} color="bg-coral-blue"
                            fields={[
                                { label: "Sync Status", type: "View", details: "Real-time indicator for Cloudflare R2 persistence." },
                                { label: "Admin Mode", type: "Toggle", details: "Pin-protected override for full write permissions." },
                                { label: "Snapshot Engine", type: "Trigger", details: "High-res canvas capture for reference." },
                                { label: "QR Linkage", type: "Trigger", details: "Internal scanner for all unique Nursery IDs." }
                            ]}
                            logic={["Auto-syncs local JSON store to R2 Bucket every 400ms.", "Soft-lock preventing dual-user write collision."]}
                        />
                        <TechnicalPageCard 
                            title="Ops Calendar" parent="Dashboard" icon={CalendarIcon} color="bg-coral-blue"
                            fields={[
                                { label: "2-Week Forecast", type: "View", details: "Rolling window of upcoming nursery deployments." },
                                { label: "Shift Indicator", type: "Data", details: "Blue line indicating active boat/site missions." },
                                { label: "Away Indicator", type: "Data", details: "Orange line indicating staff leave/availability." }
                            ]}
                            logic={["Links directly to Silo 03 for detailed shift management.", "Automated medical-expiry check for assigned personnel."]}
                        />
                        <TechnicalPageCard 
                            title="Nursery Snapshot" parent="Dashboard" icon={ChartBarIcon} color="bg-coral-blue"
                            fields={[
                                { label: "Inventory Sum", type: "Data", details: "Count of Branches, Strings, Clusters, Rubble Anchors." },
                                { label: "Spatial Sum", type: "Data", details: "Count of Trees, Reef² Units, Reef³ Units, Zones." },
                                { label: "Taxonomy Sum", type: "Data", details: "Count of Unique Genera and Species." },
                                { label: "Health Matrix", type: "View", details: "5 colored dots: 100%, 75%, 50%, 25%, 0%." }
                            ]}
                            logic={["Calculates 60,000 larvae per branch for Contribution Metric.", "Recalculates ecosystem total dynamically on every sync."]}
                        />
                    </div>
                </section>

                {/* 02. FACILITY */}
                <section>
                    <SiloHeader title="02. Facility" subtitle="Logistics & Daily Life Support" icon={CubeIcon} color="bg-coral-blue" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        <TechnicalPageCard 
                            title="Daily Tasks" parent="Facility" icon={ClipboardListIcon} color="bg-coral-blue"
                            fields={[
                                { label: "Time Filter", type: "Select", details: "View 7 Days, Month, 3 Months, or All Time." },
                                { label: "Stats Matrix", type: "Input", details: "Temp, Salinity, pH, Alk, Socks, Skimmer." },
                                { label: "Status Flag", type: "Logic", details: "Automated 'Failure Detected' warning triggers." }
                            ]}
                            logic={["Aggregates OCR results from digitised logs into time-series data.", "Exports custom facility reports to PDF/Print."]}
                        />
                        <TechnicalPageCard 
                            title="Record Digitizer" parent="Facility" icon={CameraIcon} color="bg-coral-blue"
                            fields={[
                                { label: "Template Library", type: "Select", details: "Pre-defined forms for Health, Maintenance, LSS." },
                                { label: "Vision OCR", type: "Trigger", details: "Gemini 3 Pro Vision extraction from paper logs." },
                                { label: "Log Viewer", type: "View", details: "Chronological ledger of all Facility uploads." }
                            ]}
                            logic={["Correction engine for skewed or low-light document photos.", "Maps extracted values to global chemistry trends."]}
                        />
                         <TechnicalPageCard 
                            title="Hardware Registry" parent="Facility" icon={DatabaseIcon} color="bg-coral-blue"
                            fields={[
                                { label: "Tank Geometry", type: "Logic", details: "Volume auto-calc based on shape (Round/Rect)." },
                                { label: "Gear Status", type: "Select", details: "Dive gear: Available, In-Use, Faulty, Service Due." },
                                { label: "Inventory Logic", type: "Data", details: "Autospawners, Clams, and Water Quality units." }
                            ]}
                            logic={["Triggers service alerts on Dashboard based on interval months.", "Links dive gear to specific volunteer IDs in shift rosters."]}
                        />
                    </div>
                </section>

                {/* 03. VOLUNTEERS */}
                <section>
                    <SiloHeader title="03. Volunteers" subtitle="Personnel & Certifications" icon={UserGroupIcon} color="bg-coral-blue" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        <TechnicalPageCard 
                            title="Roster Management" parent="Volunteers" icon={UserGroupIcon} color="bg-coral-blue"
                            fields={[
                                { label: "Med Expiry", type: "Input", details: "Legal dive medical verification date." },
                                { label: "DM Number", type: "Input", details: "Professional dive certification string." },
                                { label: "History", type: "Data", details: "Total days out/shift participation count." }
                            ]}
                            logic={["Blocks shift assignment if medicalExpiry < Today.", "Stores Profile Photo as R2 cloud reference URL."]}
                        />
                        <TechnicalPageCard 
                            title="Shift Scheduler" parent="Volunteers" icon={CalendarIcon} color="bg-coral-blue"
                            fields={[
                                { label: "Team Slotting", type: "Action", details: "Assign Staff, Volunteers, or Visitors." },
                                { label: "Capacity Limit", type: "Logic", details: "Max personnel check based on boat/site limits." },
                                { label: "Gear Linking", type: "Action", details: "Auto-assignment of Reg/BCD/Comp per person." }
                            ]}
                            logic={["Cross-references Staff Leave Calendar to prevent double-booking.", "Triggers Confirm/Cancel Email Templates to personal emails."]}
                        />
                    </div>
                </section>

                {/* 04. NOTES / TODO */}
                <section>
                    <SiloHeader title="04. Notes & Media" subtitle="Field Observations" icon={PencilSquareIcon} color="bg-coral-blue" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <TechnicalPageCard 
                            title="Task List" parent="Notes" icon={CheckCircleIcon} color="bg-coral-blue"
                            fields={[
                                { label: "ToDo String", type: "Input", details: "Natural language task description." },
                                { label: "Media Attachment", type: "Action", details: "Photo/Video reference per task item." },
                                { label: "Swipe UI", type: "Trigger", details: "Gesture-based deletion/completion logic." }
                            ]}
                            logic={["Syncs attachments to 'todo_media' folder in R2.", "Maintains sort order across cloud sessions."]}
                        />
                        <TechnicalPageCard 
                            title="Voice Memo" parent="Notes" icon={MicrophoneIcon} color="bg-coral-blue"
                            fields={[
                                { label: "Audio Stream", type: "Action", details: "In-browser microphone capture (WebM/MP4)." },
                                { label: "Duration", type: "Data", details: "Length of recording in seconds." },
                                { label: "Playback UI", type: "View", details: "Custom waveform-style progress bar." }
                            ]}
                            logic={["Writes temporary Blob to cloud storage with UUID key.", "Enables hands-free field observation logging."]}
                        />
                    </div>
                </section>

                {/* 05. ADD / EDIT / MOVE */}
                <section>
                    <SiloHeader title="05. Master Registry" subtitle="The System Schema" icon={PencilIcon} color="bg-purple-600" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        
                        <TechnicalPageCard 
                            title="Spatial Nodes" parent="Registry" icon={GlobeAltIcon} color="bg-purple-600"
                            fields={[
                                { label: "Site ID", type: "Input", details: "Primary geofence label." },
                                { label: "Decimal GPS", type: "Input", details: "Lat/Lng for GIS mapping." },
                                { label: "Anchor Link", type: "Select", details: "Physical sea-floor mooring association." }
                            ]}
                            logic={["Sites act as root parent for all recursive child nodes.", "Trigger external navigation to Google Maps."]}
                        />

                        <TechnicalPageCard 
                            title="Structures" parent="Registry" icon={CubeIcon} color="bg-purple-600"
                            fields={[
                                { label: "Hull Number", type: "Input", details: "Unique sequential structure ID." },
                                { label: "Model Type", type: "Select", details: "Tree, Reef², Reef³, or Rope Frame." },
                                { label: "Depth Rating", type: "Select", details: "Target restoration depth (6-24m)." }
                            ]}
                            logic={["Calculates raising schedule based on 14-day intervals.", "Links Floats as sub-inventory units."]}
                        />

                        <TechnicalPageCard 
                            title="Biologicals" parent="Registry" icon={PencilIcon} color="bg-purple-600"
                            fields={[
                                { label: "Face (1-4)", type: "Input", details: "Compass orientation on nursery limb." },
                                { label: "Slot (1-10)", type: "Input", details: "Vertical position coordinate." },
                                { label: "Stress Marker", type: "Toggle", details: "Heat tolerant genotype indicator." }
                            ]}
                            logic={["Prevents dual-entry on occupied position coordinates.", "Auto-generates Fragment ID via global prefix system."]}
                        />

                        <TechnicalPageCard 
                            title="Heritage Nodes" parent="Registry" icon={ArrowPathIcon} color="bg-purple-600"
                            fields={[
                                { label: "Parent Array", type: "Input", details: "Descriptors for genotype lineage tracing." },
                                { label: "Spawn Date", type: "Data", details: "Timestamp of gamete release event." },
                                { label: "Settlement", type: "Data", details: "Larvae recruitment timestamp." }
                            ]}
                            logic={["Maps Strings/Clusters back to parent branch records.", "Links to Spawning Silo for success tracking."]}
                        />

                    </div>
                </section>

                {/* 06. MONITORING */}
                <section>
                    <SiloHeader title="06. Monitoring" subtitle="Bio-Analytics & Health" icon={HeartPulseIcon} color="bg-coral-green" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        <TechnicalPageCard 
                            title="Health Scoring" parent="Monitoring" icon={HeartPulseIcon} color="bg-coral-green"
                            fields={[
                                { label: "Health %", type: "Select", details: "Score: 0, 25, 50, 75, or 100%." },
                                { label: "Bleaching", type: "Select", details: "Severity: None, Mild, Medium, Strong." },
                                { label: "Status Dot", type: "View", details: "Colored indicator mapping (Green to Red)." }
                            ]}
                            logic={["Interpolates points for SVG historical health charts.", "Writes global 'latestStatus' to parent asset."]}
                        />
                        <TechnicalPageCard 
                            title="Maintenance" parent="Monitoring" icon={SparklesIcon} color="bg-coral-green"
                            fields={[
                                { label: "Sponge Level", type: "Select", details: "Growth presence: None to Large." },
                                { label: "Cleaning Effort", type: "Select", details: "Scrub intensity: Light to Heavy." },
                                { label: "Hardware Check", type: "Toggle", details: "Cable tie / Tether status check." }
                            ]}
                            logic={["Alerts technician if cleaning interval exceeds site norm.", "Maintains MaintenanceLog ledger for trend analysis."]}
                        />
                    </div>
                </section>

                {/* SILOS 07-16 (SYSTEM INFRASTRUCTURE) */}
                <section>
                    <SiloHeader title="07-16. System Infrastructure" subtitle="Cloud, AI & Backup" icon={CogIcon} color="bg-coral-blue" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                        <TechnicalPageCard 
                            title="Environmental" parent="Telemetry" icon={ThermometerIcon} color="bg-coral-blue"
                            fields={[
                                { label: "Tide Feed", type: "Data", details: "Live height and trend from BOM Cairns." },
                                { label: "UV Index", type: "Data", details: "Real-time radiation risk levels." },
                                { label: "SST Feed", type: "Data", details: "Fitzroy Island Sea Temp fetch." }
                            ]}
                            logic={["Calculates moon cycle for spawning forecast alerts.", "Fetches seatemperature.info HTML via CORS proxy."]}
                        />
                        <TechnicalPageCard 
                            title="AI Trends" parent="Analytics" icon={SparklesIcon} color="bg-coral-blue"
                            fields={[
                                { label: "JSON Context", type: "Data", details: "Full inventory database feed to AI." },
                                { label: "Gemini Query", type: "Input", details: "Natural language query interface." },
                                { label: "Curves", type: "View", details: "Cumulative mortality and growth charts." }
                            ]}
                            logic={["Gemini 3 Flash reasoning over site health averages.", "Visualizes cleaning frequency vs new branch growth."]}
                        />
                        <TechnicalPageCard 
                            title="Storage Sync" parent="Cloud" icon={CloudIcon} color="bg-coral-blue"
                            fields={[
                                { label: "R2 Persistence", type: "Logic", details: "Bucket-level synchronization engine." },
                                { label: "Wipe / Reset", type: "Action", details: "Destructive database clearing tool." },
                                { label: "JSON Backup", type: "Action", details: "Manual export/import of state file." }
                            ]}
                            logic={["Verifies Navigator.onLine before write attempts.", "QR-based configuration sharing for team sync."]}
                        />
                    </div>
                </section>

                <div className="text-center pb-40 border-t-8 border-gray-100 pt-20">
                    <p className="text-[14px] text-gray-300 font-black uppercase tracking-[1.5em] leading-relaxed">
                        Reef Recovery Foundation v15.0.0 Technical Guide
                        <br/>Blueprint exported on {new Date().toLocaleDateString()}
                    </p>
                </div>
            </div>

            {/* DEFINITIVE PRINT ENGINE (PDF DOSSIER) */}
            <div className="printable-content-wrapper hidden">
                <div className="p-20 font-sans text-black max-w-[1200px] mx-auto bg-white">
                    <div className="h-[95vh] flex flex-col justify-center items-center text-center border-[40px] border-black p-24">
                        <ArchiveBoxIcon className="w-64 h-64 mb-16" />
                        <h1 className="text-[12rem] font-black mb-8 uppercase tracking-tighter italic leading-none">THE BLUEPRINT</h1>
                        <p className="text-6xl font-bold uppercase tracking-[0.5em] text-gray-500 mb-24">Technical Manual v15</p>
                        <div className="w-[500px] h-6 bg-black mb-20"></div>
                        <div className="space-y-8 text-4xl font-black uppercase tracking-[0.3em] italic">
                            <p>RRF Operational Software v15.0.0</p>
                            <p>Export Date: {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemMasterMap;