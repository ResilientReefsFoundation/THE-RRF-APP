import * as React from 'react';
import type { Volunteer, VolunteerShift, GearItem, Site, RecordFile, AuthState, Page } from '../types';
import { 
    UserGroupIcon, CalendarIcon, BriefcaseIcon, CameraIcon, SparklesIcon, 
    CheckCircleIcon, ChevronRightIcon, QrCodeIcon, UploadIcon, DatabaseIcon, 
    CloseIcon, CogIcon, ClipboardListIcon, HeartPulseIcon, EyeIcon
} from './Icons';
import { getSiteName } from './DashboardPage';

interface VolunteerPortalProps {
    authState: AuthState;
    volunteers: Volunteer[];
    shifts: VolunteerShift[];
    sites: Site[];
    gearItems: GearItem[];
    onUpdateVolunteer: (v: Volunteer) => void;
    onUpdateGear: (g: GearItem) => void;
    onRequestShift: (volunteerId: string, shiftId: string) => void;
    onAddRecord: (record: RecordFile) => void;
    onNavigateToPage: (page: Page) => void;
    onLogout: () => void;
}

const VolunteerPortal: React.FC<VolunteerPortalProps> = ({
    authState, volunteers, shifts, sites, gearItems, onUpdateVolunteer, onUpdateGear, onRequestShift, onAddRecord, onNavigateToPage, onLogout
}) => {
    // Set 'shifts' (Deploy) as the initial loading page
    const [activeSubTab, setActiveSubTab] = React.useState<'home' | 'profile' | 'shifts' | 'gear' | 'tools'>('shifts');
    const myProfile = volunteers.find(v => v.id.toString() === authState.userId?.toString()) || volunteers.find(v => v.name === authState.userName);

    const isStaffPreview = authState.role === 'Staff';

    const renderHeader = (title: string, subtitle: string) => (
        <div className="mb-8">
            <h2 className="text-4xl font-black text-coral-dark uppercase tracking-tighter italic leading-none">{title}</h2>
            <p className="text-xs font-black text-coral-blue uppercase tracking-[0.3em] mt-1">{subtitle}</p>
        </div>
    );

    const NavButton: React.FC<{ tab: any; icon: any; label: string }> = ({ tab, icon: Icon, label }) => (
        <button 
            onClick={() => setActiveSubTab(tab)}
            className={`flex flex-col items-center gap-1.5 p-3 rounded-2xl transition-all ${activeSubTab === tab ? 'bg-coral-blue text-white shadow-lg scale-110' : 'text-gray-400 hover:text-coral-blue hover:bg-blue-50'}`}
        >
            <Icon className="w-6 h-6" />
            <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
        </button>
    );

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20 mt-4 px-4 sm:px-0">
            
            {/* Staff Preview Banner */}
            {isStaffPreview && (
                <div className="bg-purple-600 p-4 rounded-[2rem] shadow-xl border-4 border-white flex justify-between items-center animate-bounce-subtle">
                    <div className="flex items-center gap-4 text-white px-4">
                        <EyeIcon className="w-8 h-8" />
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest leading-none">Portal Preview Mode</p>
                            <p className="text-lg font-black uppercase tracking-tighter">Viewing as: {authState.userName}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onLogout}
                        className="bg-white text-purple-600 font-black px-8 py-3 rounded-2xl text-xs uppercase tracking-widest shadow-lg hover:bg-gray-100 transition-all active:scale-95"
                    >
                        Exit Preview
                    </button>
                </div>
            )}

            {/* Branded Tab Bar */}
            <div className="bg-white p-4 rounded-[2rem] shadow-xl border-2 border-coral-blue/10 flex justify-between items-center sticky top-2 z-50 backdrop-blur-md bg-white/90">
                <div className="flex gap-4">
                    <NavButton tab="shifts" icon={CalendarIcon} label="Deploy" />
                    <NavButton tab="home" icon={SparklesIcon} label="Hub" />
                    <NavButton tab="gear" icon={BriefcaseIcon} label="Locker" />
                    <NavButton tab="tools" icon={QrCodeIcon} label="Tools" />
                    <NavButton tab="profile" icon={UserGroupIcon} label="Me" />
                </div>
                <button onClick={onLogout} className="p-4 text-gray-400 hover:text-red-500 transition-colors">
                    <CloseIcon className="w-6 h-6" />
                </button>
            </div>

            <div className="bg-white p-6 sm:p-10 rounded-[3rem] shadow-sm border border-gray-100 min-h-[70vh]">
                {activeSubTab === 'shifts' && (
                    <div className="space-y-8 animate-fade-in">
                        {renderHeader("Field Deployment", "Express Interest in Missions")}
                        <div className="space-y-4">
                            {shifts.filter(s => new Date(s.date) >= new Date()).map(shift => {
                                const siteName = getSiteName(shift, sites);
                                const isPending = shift.pendingVolunteerIds?.includes(authState.userId || '');
                                const isAssigned = shift.assignedVolunteerIds?.includes(authState.userId || '');
                                
                                return (
                                    <div key={shift.id} className="p-6 bg-white border-2 border-gray-100 rounded-[2.5rem] shadow-sm hover:border-coral-blue transition-all flex flex-col sm:flex-row justify-between items-center gap-8 group">
                                        <div className="flex items-center gap-8 w-full sm:w-auto">
                                            <div className="text-center p-4 bg-gray-50 rounded-[2rem] min-w-[90px] border border-gray-100 group-hover:bg-blue-50 transition-colors">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{new Date(shift.date).toLocaleString('default', { month: 'short' })}</p>
                                                <p className="text-3xl font-black text-coral-dark">{new Date(shift.date).getDate()}</p>
                                            </div>
                                            <div>
                                                <h4 className="text-2xl font-black text-coral-dark uppercase tracking-tighter italic">{siteName}</h4>
                                                <p className="text-[10px] font-black text-coral-blue uppercase tracking-[0.3em] mt-1">{shift.shiftType}</p>
                                            </div>
                                        </div>
                                        
                                        {isAssigned ? (
                                            <div className="flex items-center gap-3 text-green-600 bg-green-50 px-10 py-4 rounded-[2rem] border-2 border-green-200 font-black uppercase text-xs tracking-widest shadow-lg">
                                                <CheckCircleIcon className="w-5 h-5" /> Confirmed
                                            </div>
                                        ) : isPending ? (
                                            <div className="flex items-center gap-3 text-orange-600 bg-orange-50 px-10 py-4 rounded-[2rem] border-2 border-orange-200 font-black uppercase text-xs tracking-widest animate-pulse shadow-md">
                                                <SparklesIcon className="w-5 h-5" /> Pending Review
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => onRequestShift(authState.userId!, shift.id)}
                                                className="w-full sm:w-auto px-12 py-5 bg-coral-blue text-white font-black rounded-[2rem] shadow-2xl hover:scale-105 active:scale-95 transition-all text-xs uppercase tracking-widest border-b-[6px] border-blue-700"
                                            >
                                                Apply for Shift
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                            {shifts.length === 0 && <p className="text-center text-gray-400 py-32 font-black uppercase tracking-[0.5em] opacity-20 italic">No missions listed.</p>}
                        </div>
                    </div>
                )}

                {activeSubTab === 'home' && (
                    <div className="space-y-8 animate-fade-in">
                        {renderHeader("Resilient Feed", "Updates & Stats")}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-8 bg-blue-50 rounded-[2.5rem] border-2 border-blue-100 flex flex-col justify-between group">
                                <div>
                                    <h4 className="text-2xl font-black text-blue-900 uppercase tracking-tight">Deployment Window</h4>
                                    <p className="text-[10px] font-black text-blue-400 uppercase mt-2 tracking-widest">Upcoming Nursery Boat Missions</p>
                                </div>
                                <button onClick={() => setActiveSubTab('shifts')} className="mt-12 w-full py-5 bg-white text-coral-blue font-black rounded-2xl shadow-sm group-hover:shadow-md transition-all uppercase tracking-widest text-xs border border-blue-200">View Roster</button>
                            </div>
                            <div className="p-8 bg-coral-sand rounded-[2.5rem] border-2 border-gray-100 flex flex-col justify-between">
                                <h4 className="text-2xl font-black text-coral-dark uppercase tracking-tight">Mission Log</h4>
                                <div className="grid grid-cols-2 gap-4 mt-8">
                                    <div className="text-center p-4 bg-white rounded-3xl shadow-sm border border-gray-50">
                                        <p className="text-3xl font-black text-coral-blue">{myProfile?.daysOut || 0}</p>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Days Out</p>
                                    </div>
                                    <div className="text-center p-4 bg-white rounded-3xl shadow-sm border border-gray-50">
                                        <p className={`text-xl font-black ${myProfile?.status === 'Approved' ? 'text-green-600' : 'text-orange-500'}`}>{myProfile?.status || 'Pending'}</p>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Status</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeSubTab === 'profile' && (
                    <div className="space-y-8 animate-fade-in">
                        {renderHeader("My Profile", "Credentials & Documentation")}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                            <div className="space-y-8">
                                <div className="flex items-center gap-8">
                                    <div className="w-36 h-36 bg-gray-50 rounded-[2.5rem] overflow-hidden border-4 border-white shadow-2xl relative group">
                                        {myProfile?.photoUrl ? (
                                            <img src={myProfile.photoUrl} alt="Profile" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-200"><CameraIcon className="w-12 h-12"/></div>
                                        )}
                                        <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                            <UploadIcon className="w-8 h-8 text-white" />
                                            <input type="file" className="hidden" />
                                        </label>
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black text-coral-dark italic tracking-tighter">{authState.userName}</h3>
                                        <span className={`px-4 py-1.5 ${myProfile?.status === 'Approved' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'} text-[10px] font-black uppercase rounded-full border border-current mt-2 inline-block`}>
                                            {myProfile?.status === 'Approved' ? 'Validated Member' : 'Under Review'}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2">Qualified Credentials</p>
                                    <div className="p-6 bg-gray-50 rounded-[2.5rem] space-y-6 border border-gray-100 shadow-inner">
                                        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                                            <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Medical Review</span>
                                            <span className={`text-sm font-black uppercase ${new Date(myProfile?.medicalExpiry || '') < new Date() ? 'text-red-500' : 'text-green-600'}`}>{myProfile?.medicalExpiry || 'Unset'}</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-4 border-b border-gray-200">
                                            <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Emergency Care</span>
                                            <span className="text-sm font-black text-coral-dark uppercase">{myProfile?.firstAidExpiry || 'Unset'}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-black text-gray-500 uppercase tracking-widest">Professional ID</span>
                                            <span className="text-sm font-black text-coral-blue uppercase tracking-widest">{myProfile?.divemasterNumber || 'None'}</span>
                                        </div>
                                    </div>
                                    <button className="w-full py-5 bg-gray-900 text-white font-black rounded-3xl shadow-xl hover:bg-black active:scale-95 transition-all text-xs uppercase tracking-widest flex items-center justify-center gap-4">
                                        <ClipboardListIcon className="w-5 h-5" /> Sync Documents (PDF/JPG)
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-8">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-2 mb-4">Emergency Contact</p>
                                    <div className="p-8 bg-coral-sand rounded-[3rem] border-2 border-gray-100/50 shadow-sm">
                                        <p className="text-xl font-black text-coral-dark uppercase tracking-tight">{myProfile?.emergencyContact || 'Not Recorded'}</p>
                                        <p className="text-[10px] font-black text-gray-400 uppercase mt-2 tracking-widest italic">Validated Relative / Partner</p>
                                    </div>
                                </div>
                                <div className="p-8 bg-blue-50/50 rounded-[3rem] border border-blue-100">
                                    <h4 className="text-xs font-black text-blue-900 uppercase tracking-widest mb-4">Quick Stats</h4>
                                    <p className="text-[11px] text-blue-700 leading-relaxed font-bold uppercase italic">
                                        Successfully participated in <span className="text-blue-900 font-black">{myProfile?.daysOut || 0} missions</span> this year.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeSubTab === 'gear' && (
                    <div className="space-y-8 animate-fade-in">
                        {renderHeader("The Locker", "Personal Equipment Inventory")}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            {gearItems.filter(g => g.assignedVolunteerId === authState.userId).map(gear => (
                                <div key={gear.id} className="p-8 bg-white border-2 border-gray-100 rounded-[3rem] shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-8 relative z-10">
                                        <div className="p-5 bg-gray-50 text-coral-blue rounded-3xl group-hover:scale-110 transition-transform shadow-inner border border-gray-100">
                                            {gear.type === 'BCD' ? <BriefcaseIcon className="w-8 h-8" /> : <CogIcon className="w-8 h-8" />}
                                        </div>
                                        <span className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full border-2 shadow-sm ${gear.status === 'Available' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>{gear.status}</span>
                                    </div>
                                    <h4 className="text-3xl font-black text-coral-dark uppercase tracking-tighter italic relative z-10">{gear.name}</h4>
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.4em] mt-2 font-mono relative z-10">UNIT: {gear.qrCode}</p>
                                    
                                    <div className="mt-10 grid grid-cols-2 gap-3 relative z-10">
                                        <button className="py-4 bg-coral-sand text-coral-dark font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-gray-100 border border-gray-200 transition-all active:scale-95 shadow-sm">Maintained</button>
                                        <button className="py-4 bg-red-50 text-red-600 font-black rounded-2xl text-[10px] uppercase tracking-widest hover:bg-red-100 border border-red-100 transition-all active:scale-95 shadow-sm">Faulty</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full py-20 border-4 border-dashed border-gray-100 rounded-[3rem] text-gray-300 font-black uppercase tracking-[0.5em] hover:border-coral-blue hover:text-coral-blue hover:bg-blue-50 transition-all group active:scale-98">
                            + Add Gear To Locker
                        </button>
                    </div>
                )}

                {activeSubTab === 'tools' && (
                    <div className="space-y-8 animate-fade-in">
                        {renderHeader("Field Ops", "Field Scanning & Digitization")}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="p-10 border-4 border-coral-blue rounded-[3rem] bg-blue-50/20 flex flex-col items-center text-center gap-8 group hover:shadow-2xl transition-all cursor-pointer">
                                <div className="p-8 bg-coral-blue text-white rounded-[2.5rem] shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-transform">
                                    <QrCodeIcon className="w-16 h-16" />
                                </div>
                                <div>
                                    <h4 className="text-3xl font-black text-coral-dark uppercase italic tracking-tighter">Maintenance Scan</h4>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-4 tracking-[0.2em] leading-relaxed">Update cleaning status or report damage on site anchors and nursery structures.</p>
                                </div>
                                <button className="w-full py-6 bg-coral-blue text-white font-black rounded-[2rem] shadow-xl uppercase tracking-[0.2em] text-sm border-b-[8px] border-blue-700">Launch Active Scanner</button>
                            </div>

                            <div className="p-10 border-4 border-coral-green rounded-[3rem] bg-green-50/20 flex flex-col items-center text-center gap-8 group hover:shadow-2xl transition-all cursor-pointer">
                                <div className="p-8 bg-coral-green text-white rounded-[2.5rem] shadow-2xl group-hover:scale-110 group-hover:-rotate-3 transition-transform">
                                    <HeartPulseIcon className="w-16 h-16" />
                                </div>
                                <div>
                                    <h4 className="text-3xl font-black text-coral-dark uppercase italic tracking-tighter">Digitize Form</h4>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-4 tracking-[0.2em] leading-relaxed">Instantly convert filled paper health logs or maintenance sheets into digital records.</p>
                                </div>
                                <button className="w-full py-6 bg-coral-green text-white font-black rounded-[2rem] shadow-xl uppercase tracking-[0.2em] text-sm border-b-[8px] border-green-700">Open Vision OCR</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-[1em] opacity-40">Resilient Reefs Foundation Field Registry</p>
        </div>
    );
};

export default VolunteerPortal;