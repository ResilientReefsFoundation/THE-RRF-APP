
import * as React from 'react';
import type { Volunteer, VolunteerShift, GearItem, Staff, EmailTemplate, EmailTemplateType, Visitor, Site } from '../types';
import { UserGroupIcon, CalendarIcon, CheckCircleIcon, QrCodeIcon, CameraIcon, CloseIcon, ClipboardListIcon, ChevronLeftIcon, ChevronRightIcon, TrashIcon, PencilIcon, MailIcon, HeartPulseIcon, WrenchIcon, UploadIcon, BookOpenIcon, SunIcon, BriefcaseIcon, CogIcon, ArchiveBoxIcon, SparklesIcon, GlobeAltIcon, StarIcon } from './Icons';

interface VolunteersPageProps {
  isReadOnly: boolean;
  volunteers: Volunteer[];
  visitors?: Visitor[];
  staffMembers: Staff[];
  shifts: VolunteerShift[];
  sites: Site[];
  gearItems: GearItem[];
  emailTemplates: EmailTemplate[];
  onAddVolunteer: (v: Volunteer) => void;
  onUpdateVolunteer: (v: Volunteer) => void;
  onDeleteVolunteer: (id: string) => void;
  onAddVisitor: (v: Visitor) => void;
  onUpdateVisitor: (v: Visitor) => void;
  onDeleteVisitor: (id: string) => void;
  onAddStaffMember: (s: Staff) => void;
  onUpdateStaffMember: (s: Staff) => void;
  onDeleteStaffMember: (id: string) => void;
  onAddShift: (s: VolunteerShift) => void;
  onUpdateShift: (s: VolunteerShift) => void;
  onDeleteShift: (id: string) => void;
  onUpdateGear: (g: GearItem) => void;
  onAddEmailTemplate: (t: EmailTemplate) => void;
  onUpdateEmailTemplate: (t: EmailTemplate) => void;
  onDeleteEmailTemplate: (id: string) => void;
  onNavigateBack: () => void;
  initialDate?: string | null;
}

const VolunteersPage: React.FC<VolunteersPageProps> = ({ 
    isReadOnly, volunteers = [], visitors = [], staffMembers = [], shifts = [], sites = [], gearItems = [], emailTemplates = [], onAddVolunteer, onUpdateVolunteer, onDeleteVolunteer, onAddVisitor, onUpdateVisitor, onDeleteVisitor, onAddStaffMember, onUpdateStaffMember, onDeleteStaffMember, onAddShift, onUpdateShift, onDeleteShift, onUpdateGear, onAddEmailTemplate, onUpdateEmailTemplate, onDeleteEmailTemplate, onNavigateBack, initialDate 
}) => {
    const [activeTab, setActiveTab] = React.useState<'schedule' | 'roster' | 'requests'>('schedule');
    const [currentDate, setDate] = React.useState(new Date());

    const pendingRequestsCount = React.useMemo(() => {
        return (shifts || []).reduce((acc, s) => acc + (s?.pendingVolunteerIds?.length || 0), 0);
    }, [shifts]);

    const handleApproveShift = (volunteerId: string, shiftId: string) => {
        if (isReadOnly) return;
        const shift = shifts.find(s => s.id === shiftId);
        if (!shift) return;
        const updatedPending = (shift.pendingVolunteerIds || []).filter(id => id !== volunteerId);
        const updatedAssigned = [...new Set([...(shift.assignedVolunteerIds || []), volunteerId])];
        onUpdateShift({ ...shift, pendingVolunteerIds: updatedPending, assignedVolunteerIds: updatedAssigned });
    };

    const handleAddVolunteerClick = () => {
        const name = prompt("Volunteer Name:");
        if (!name) return;
        const email = prompt("Email:");
        onAddVolunteer({
            id: Math.random().toString(36).substr(2, 9),
            name,
            email: email || '',
            status: 'Approved',
            daysOut: 0
        });
    };

    const handleAddStaffClick = () => {
        const name = prompt("Staff Member Name:");
        if (!name) return;
        onAddStaffMember({
            id: Math.random().toString(36).substr(2, 9),
            name,
            role: 'Scientist'
        });
    };

    const calendarDays = React.useMemo(() => {
        const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        const firstDay = (new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay() + 6) % 7;
        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);
        return days;
    }, [currentDate]);

    return (
        <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl space-y-8 border-2 border-coral-blue animate-fade-in">
            <div className="flex justify-between items-center border-b border-gray-100 pb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-2xl">
                        <UserGroupIcon className="w-8 h-8 text-coral-blue" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-coral-dark uppercase tracking-tighter italic">Volunteer Command</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Resilient Reefs Foundation</p>
                    </div>
                </div>
                <button onClick={onNavigateBack} className="bg-gray-100 hover:bg-gray-200 text-coral-dark font-black py-2.5 px-6 rounded-2xl transition-all uppercase tracking-widest text-xs">&larr; Dashboard</button>
            </div>
            
            <div className="flex border-b border-gray-100 overflow-x-auto">
                <button onClick={() => setActiveTab('schedule')} className={`flex-1 py-5 font-black uppercase text-xs tracking-widest transition-all border-b-4 whitespace-nowrap px-6 ${activeTab === 'schedule' ? 'text-coral-blue border-coral-blue bg-blue-50/50' : 'text-gray-400 border-transparent hover:text-coral-dark'}`}>Operational Schedule</button>
                <button onClick={() => setActiveTab('requests')} className={`flex-1 py-5 font-black uppercase text-xs tracking-widest transition-all border-b-4 whitespace-nowrap px-6 flex items-center justify-center gap-3 ${activeTab === 'requests' ? 'text-purple-600 border-purple-600 bg-purple-50/50' : 'text-gray-400 border-transparent hover:text-coral-dark'}`}>
                    Deployment Requests {pendingRequestsCount > 0 && <span className="bg-purple-600 text-white text-[10px] px-3 py-1 rounded-full shadow-md animate-pulse">{pendingRequestsCount}</span>}
                </button>
                <button onClick={() => setActiveTab('roster')} className={`flex-1 py-5 font-black uppercase text-xs tracking-widest transition-all border-b-4 whitespace-nowrap px-6 ${activeTab === 'roster' ? 'text-coral-blue border-coral-blue bg-blue-50/50' : 'text-gray-400 border-transparent hover:text-coral-dark'}`}>Registry Team</button>
            </div>

            {activeTab === 'requests' && (
                <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
                    <div className="bg-purple-50 p-10 rounded-[3rem] border-2 border-purple-100 shadow-inner">
                        <div className="flex items-center gap-6 mb-2">
                             <div className="p-4 bg-white rounded-3xl shadow-lg border-2 border-purple-200">
                                 <SparklesIcon className="w-10 h-10 text-purple-600" />
                             </div>
                             <div>
                                 <h3 className="text-3xl font-black text-purple-900 uppercase tracking-tighter italic leading-none">Assignment Desk</h3>
                                 <p className="text-[10px] font-black text-purple-600 uppercase tracking-[0.3em] mt-2">Validate interest and assign mission slots</p>
                             </div>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {(shifts || []).filter(s => (s?.pendingVolunteerIds?.length || 0) > 0).map(shift => {
                            const site = sites.find(si => si.id === shift.siteId);
                            const siteName = shift.customSiteName || site?.name || 'Location TBD';
                            return (
                                <div key={shift.id} className="p-8 bg-white border-2 border-gray-100 rounded-[3rem] shadow-xl space-y-6 group hover:border-purple-200 transition-all">
                                    <div className="flex justify-between items-center border-b border-gray-100 pb-5">
                                        <div>
                                            <p className="font-black uppercase text-coral-dark text-xl tracking-tight italic">{shift.date}</p>
                                            <p className="text-[10px] font-black text-coral-blue uppercase tracking-widest">{siteName}</p>
                                        </div>
                                        <span className="text-[9px] font-black bg-gray-100 px-3 py-1 rounded-full text-gray-500 uppercase tracking-widest">{shift.shiftType}</span>
                                    </div>
                                    <div className="space-y-4">
                                        {shift.pendingVolunteerIds?.map(vid => {
                                            const v = (volunteers || []).find(vol => vol.id === vid);
                                            return (
                                                <div key={vid} className="flex justify-between items-center bg-gray-50 p-5 rounded-[2rem] border border-gray-100 group-hover:bg-white transition-colors">
                                                    <div className="flex items-center gap-5">
                                                        <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center font-black shadow-inner">{(v?.name || String(vid)).charAt(0)}</div>
                                                        <div>
                                                            <p className="font-black text-coral-dark uppercase text-sm tracking-tight">{v?.name || `Unknown (${String(vid).slice(0, 4)})`}</p>
                                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Exp: {v?.medicalExpiry || 'No Data'}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => handleApproveShift(vid, shift.id)}
                                                            className="bg-coral-green text-coral-dark font-black px-6 py-3 rounded-2xl text-[10px] uppercase shadow-lg hover:brightness-105 active:scale-95 transition-all border-b-4 border-green-600"
                                                        >
                                                            Confirm
                                                        </button>
                                                        <button className="bg-white border-2 border-red-50 text-red-500 font-black px-6 py-3 rounded-2xl text-[10px] uppercase hover:bg-red-50">Decline</button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {pendingRequestsCount === 0 && (
                        <div className="text-center py-40 border-4 border-dashed border-gray-100 rounded-[4rem]">
                            <p className="text-gray-300 font-black uppercase tracking-[1em] italic text-xl">All Tasks Clear</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'schedule' && (
                <div className="grid grid-cols-7 gap-px bg-gray-100 border-4 border-gray-100 rounded-[3rem] overflow-hidden shadow-2xl">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (<div key={day} className="bg-white p-6 text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.4em] border-b border-gray-100">{day}</div>))}
                    {calendarDays.map((day, idx) => {
                        if (day === null) return <div key={`empty-${idx}`} className="bg-gray-50/50 aspect-square border-r border-b border-white"></div>;
                        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dayShifts = shifts.filter(s => s && s.date === dateStr);
                        return (
                            <div key={day} className="bg-white aspect-square p-4 border-r border-b border-gray-50 flex flex-col cursor-pointer hover:bg-blue-50/50 transition-all group">
                                <span className="text-2xl font-black text-coral-dark group-hover:text-coral-blue transition-colors">{day}</span>
                                <div className="mt-auto flex flex-col gap-1.5">
                                    {dayShifts.map(s => (
                                        <div key={s.id} className="h-2 w-full bg-coral-blue/40 rounded-full group-hover:bg-coral-blue transition-colors"></div>
                                    ))}
                                    {dayShifts.some(s => (s.pendingVolunteerIds?.length || 0) > 0) && (
                                        <div className="h-2 w-2 bg-purple-600 rounded-full mx-auto animate-ping mt-1"></div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {activeTab === 'roster' && (
                <div className="space-y-12 animate-fade-in">
                    <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
                        <div>
                            <h3 className="text-2xl font-black text-coral-dark uppercase tracking-tight italic">Registry Roster</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Official Team Ledger</p>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={handleAddStaffClick} disabled={isReadOnly} className="bg-gray-900 text-white font-black px-6 py-3 rounded-2xl text-[10px] uppercase tracking-widest shadow-lg hover:bg-black transition-all active:scale-95 disabled:opacity-50">+ Add Staff</button>
                            <button onClick={handleAddVolunteerClick} disabled={isReadOnly} className="bg-coral-blue text-white font-black px-6 py-3 rounded-2xl text-[10px] uppercase tracking-widest shadow-lg hover:brightness-110 transition-all active:scale-95 disabled:opacity-50">+ Add Volunteer</button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 border-b-2 border-gray-100 pb-3">
                                <StarIcon className="w-5 h-5 text-coral-blue" />
                                <h4 className="font-black text-coral-dark uppercase tracking-widest text-xs">Foundation Staff</h4>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {(staffMembers || []).map(staff => (
                                    <div key={staff.id} className="bg-white p-6 border-2 border-gray-100 rounded-[2rem] flex justify-between items-center shadow-sm hover:border-coral-blue transition-colors">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 bg-coral-blue text-white rounded-2xl flex items-center justify-center font-black shadow-lg">
                                                {staff.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-coral-dark text-lg uppercase tracking-tight">{staff.name}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{staff.role}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => !isReadOnly && onDeleteStaffMember(staff.id)} disabled={isReadOnly} className="p-2 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-30"><TrashIcon className="w-5 h-5"/></button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center gap-3 border-b-2 border-gray-100 pb-3">
                                <UserGroupIcon className="w-5 h-5 text-coral-green" />
                                <h4 className="font-black text-coral-dark uppercase tracking-widest text-xs">Certified Volunteers</h4>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {(volunteers || []).map(volunteer => (
                                    <div key={volunteer.id} className="bg-white p-6 border-2 border-gray-100 rounded-[2.5rem] shadow-sm hover:border-coral-green transition-all group overflow-hidden relative">
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-6">
                                                <div className="w-20 h-20 rounded-[1.5rem] bg-gray-50 border-2 border-gray-100 overflow-hidden shrink-0 shadow-inner flex items-center justify-center">
                                                    {volunteer.photoUrl ? (
                                                        <img src={volunteer.photoUrl} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <UserGroupIcon className="w-8 h-8 text-gray-200" />
                                                    )}
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="font-black text-coral-dark text-xl tracking-tighter uppercase italic">{volunteer.name}</p>
                                                    <p className="text-xs font-bold text-gray-400">{volunteer.email}</p>
                                                    <div className="flex gap-2 mt-3">
                                                        <span className={`px-2.5 py-1 text-[9px] font-black uppercase rounded-full border ${volunteer.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                                            {volunteer.status}
                                                        </span>
                                                        <span className="px-2.5 py-1 text-[9px] font-black uppercase rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                                            {volunteer.daysOut || 0} Missions
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <button onClick={() => !isReadOnly && onDeleteVolunteer(volunteer.id)} disabled={isReadOnly} className="p-2 text-gray-200 hover:text-red-500 transition-colors"><TrashIcon className="w-5 h-5"/></button>
                                                <button disabled={isReadOnly} className="p-2 text-gray-200 hover:text-coral-blue transition-colors"><MailIcon className="w-5 h-5"/></button>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-6 pt-4 border-t border-gray-50 grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Medical Review</p>
                                                <p className={`text-[10px] font-black ${new Date(volunteer.medicalExpiry || '') < new Date() ? 'text-red-500' : 'text-gray-700'}`}>
                                                    {volunteer.medicalExpiry || 'NO DATA'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Emergency Contact</p>
                                                <p className="text-[10px] font-black text-gray-700 truncate">{volunteer.emergencyContact || 'UNSET'}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VolunteersPage;
