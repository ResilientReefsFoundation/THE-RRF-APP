import * as React from 'react';
import type { Volunteer, VolunteerShift, GearItem, Staff, EmailTemplate, Visitor, Site, TimeAwayPeriod, R2Settings } from '../types';
import { UserGroupIcon, CheckCircleIcon, CloseIcon, ChevronLeftIcon, TrashIcon, PencilIcon, MailIcon, StarIcon, SparklesIcon, CogIcon, CalendarIcon, PlusCircleIcon, WrenchIcon, HeartPulseIcon, ArrowPathIcon, EyeIcon, CloudIcon } from './Icons';

interface PeoplePageProps {
  isReadOnly: boolean;
  adminOverride: boolean;
  r2Settings: R2Settings | null;
  syncMode: 'loading' | 'saving' | 'idle' | 'error' | 'capturing';
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
  onUpdateShift: (s: VolunteerShift) => void;
  onNavigateBack: () => void;
  onViewVolunteerPortal?: (volunteerId: string) => void;
}

const PeoplePage: React.FC<PeoplePageProps> = ({ 
    isReadOnly, adminOverride, r2Settings, syncMode, volunteers = [], visitors = [], staffMembers = [], shifts = [], sites = [], onAddVolunteer, onUpdateVolunteer, onDeleteVolunteer, onAddVisitor, onUpdateVisitor, onDeleteVisitor, onAddStaffMember, onUpdateStaffMember, onDeleteStaffMember, onUpdateShift, onNavigateBack, onViewVolunteerPortal
}) => {
    const [activeTab, setActiveTab] = React.useState<'roster' | 'requests'>('roster');
    const [editingStaff, setEditingStaff] = React.useState<Staff | null>(null);
    const [editingVolunteer, setEditingVolunteer] = React.useState<Volunteer | null>(null);
    const [isAddingVolunteer, setIsAddingVolunteer] = React.useState(false);
    const [isProcessing, setIsProcessing] = React.useState(false);

    // Leave/Availability Form State
    const [leaveMode, setLeaveMode] = React.useState<'single' | 'range'>('range');
    const [newLeaveStart, setNewLeaveStart] = React.useState('');
    const [newLeaveEnd, setNewLeaveEnd] = React.useState('');

    const [newVol, setNewVol] = React.useState<Partial<Volunteer>>({
        name: '', email: '', username: '', password: '', status: 'Pending'
    });

    const pendingRequestsCount = React.useMemo(() => {
        return shifts.reduce((acc, s) => {
            const validPendings = (s.pendingVolunteerIds || []).filter(vid => 
                volunteers.some(v => String(v.id).trim() === String(vid).trim())
            );
            return acc + validPendings.length;
        }, 0);
    }, [shifts, volunteers]);

    const handleApproveShift = (volunteerId: string, shiftId: string) => {
        if (isReadOnly) return;
        setIsProcessing(true);
        const shift = shifts.find(s => s.id === shiftId);
        if (!shift) return;
        const updatedPending = (shift.pendingVolunteerIds || []).filter(id => id !== volunteerId);
        const updatedAssigned = [...new Set([...(shift.assignedVolunteerIds || []), volunteerId])];
        onUpdateShift({ ...shift, pendingVolunteerIds: updatedPending, assignedVolunteerIds: updatedAssigned });
        setTimeout(() => setIsProcessing(false), 800);
    };

    const handleSaveNewVolunteer = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newVol.name || isReadOnly) return;
        setIsProcessing(true);
        onAddVolunteer({
            id: Math.random().toString(36).substr(2, 9),
            name: newVol.name || '',
            email: newVol.email || '',
            username: newVol.username || '',
            password: newVol.password || '',
            status: 'Pending',
            daysOut: 0,
            phone: '',
            emergencyContact: '',
            medicalExpiry: '',
            firstAidExpiry: '',
            divemasterNumber: ''
        });
        setNewVol({ name: '', email: '', username: '', password: '', status: 'Pending' });
        setIsAddingVolunteer(false);
        setTimeout(() => setIsProcessing(false), 800);
    };

    const handleAddStaffClick = () => {
        if (isReadOnly) return;
        const name = prompt("Enter new Staff Member name:");
        if (!name) return;
        onAddStaffMember({
            id: Math.random().toString(36).substr(2, 9),
            name,
            role: 'Scientist',
            recurringAwayDays: [],
            timeAway: []
        });
    };

    const toggleAwayDay = (day: number) => {
        if (!editingStaff || isReadOnly) return;
        const current = editingStaff.recurringAwayDays || [];
        const updated = current.includes(day) 
            ? current.filter(d => d !== day) 
            : [...current, day];
        setEditingStaff({...editingStaff, recurringAwayDays: updated});
    };

    const handleAddSpecificLeave = () => {
        if (!editingStaff || isReadOnly) return;
        const start = newLeaveStart;
        const end = leaveMode === 'single' ? newLeaveStart : newLeaveEnd;
        if (!start || !end) return;
        const newPeriod: TimeAwayPeriod = { start, end };
        const updatedTimeAway = [...(editingStaff.timeAway || []), newPeriod].sort((a, b) => a.start.localeCompare(b.start));
        setEditingStaff({ ...editingStaff, timeAway: updatedTimeAway });
        setNewLeaveStart('');
        setNewLeaveEnd('');
    };

    const handleRemoveLeavePeriod = (index: number) => {
        if (!editingStaff || !editingStaff.timeAway || isReadOnly) return;
        const updatedTimeAway = editingStaff.timeAway.filter((_, i) => i !== index);
        setEditingStaff({ ...editingStaff, timeAway: updatedTimeAway });
    };

    const WEEKDAYS = [
        { label: 'M', value: 1 },
        { label: 'T', value: 2 },
        { label: 'W', value: 3 },
        { label: 'T', value: 4 },
        { label: 'F', value: 5 },
        { label: 'S', value: 6 },
        { label: 'S', value: 0 } 
    ];

    const SyncStatusIndicator = () => (
        <div className={`flex items-center justify-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase transition-all ${
            syncMode === 'saving' || isProcessing ? 'bg-blue-50 text-blue-500 animate-pulse' : 
            syncMode === 'error' ? 'bg-red-50 text-red-500 border border-red-200' :
            isReadOnly ? 'bg-amber-50 text-amber-600 border border-amber-200' :
            'bg-green-50 text-green-600 opacity-60'
        }`}>
            {syncMode === 'saving' || isProcessing ? (
                <><ArrowPathIcon className="w-3 h-3 animate-spin" /> {isProcessing ? 'Registry Update in Progress...' : 'Syncing with R2 Cloud...'}</>
            ) : syncMode === 'error' ? (
                <><CloseIcon className="w-3 h-3" /> Cloud Sync Failed</>
            ) : isReadOnly ? (
                <><CloseIcon className="w-3 h-3" /> Cloud Locked: Read Only</>
            ) : (
                <><CheckCircleIcon className="w-3 h-3" /> Data Secured in Cloud</>
            )}
        </div>
    );

    const inputClasses = "w-full p-4 border-2 border-gray-100 rounded-2xl font-bold text-coral-dark outline-none focus:border-coral-blue shadow-inner bg-white text-sm";
    const labelClasses = "block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1";

    return (
        <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl space-y-8 border-2 border-coral-blue animate-fade-in min-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-gray-100 pb-6 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-2xl">
                        <UserGroupIcon className="w-8 h-8 text-coral-blue" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-coral-dark uppercase tracking-tighter italic">Nursery Team</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Registry & Personnel Management</p>
                    </div>
                </div>
                <button onClick={onNavigateBack} className="bg-gray-100 hover:bg-gray-200 text-coral-dark font-black py-2.5 px-6 rounded-2xl transition-all uppercase tracking-widest text-xs">&larr; Dashboard</button>
            </div>
            
            <div className="flex border-b border-gray-100 overflow-x-auto shrink-0">
                <button onClick={() => setActiveTab('roster')} className={`flex-1 py-5 font-black uppercase text-xs tracking-widest transition-all border-b-4 whitespace-nowrap px-6 ${activeTab === 'roster' ? 'text-coral-blue border-coral-blue bg-blue-50/50' : 'text-gray-400 border-transparent hover:text-coral-dark'}`}>Active Roster</button>
                <button onClick={() => setActiveTab('requests')} className={`flex-1 py-5 font-black uppercase text-xs tracking-widest transition-all border-b-4 whitespace-nowrap px-6 flex items-center justify-center gap-3 ${activeTab === 'requests' ? 'text-purple-600 border-purple-600 bg-purple-50/50' : 'text-gray-400 border-transparent hover:text-coral-dark'}`}>
                    Deployment Requests {pendingRequestsCount > 0 && <span className="bg-purple-600 text-white text-[10px] px-3 py-1 rounded-full shadow-md animate-pulse">{pendingRequestsCount}</span>}
                </button>
            </div>

            <div className="flex-grow">
                {activeTab === 'roster' && (
                    <div className="space-y-12 animate-fade-in">
                        <div className="flex flex-col sm:flex-row justify-between items-end gap-4">
                            <div>
                                <h3 className="text-2xl font-black text-coral-dark uppercase tracking-tight italic">Registry Roster</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Official Team Ledger</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={handleAddStaffClick} disabled={isReadOnly} className="bg-gray-900 text-white font-black px-8 py-3 rounded-2xl text-[10px] uppercase tracking-widest shadow-lg hover:bg-black transition-all active:scale-95 disabled:opacity-50">+ Add Staff</button>
                                <button onClick={() => setIsAddingVolunteer(true)} disabled={isReadOnly} className="bg-coral-blue text-white font-black px-8 py-3 rounded-2xl text-[10px] uppercase tracking-widest shadow-lg hover:brightness-110 transition-all active:scale-95 disabled:opacity-50">+ Add Volunteer</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            {/* STAFF SECTION */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b-2 border-gray-100 pb-3">
                                    <StarIcon className="w-5 h-5 text-coral-blue" />
                                    <h4 className="font-black text-coral-dark uppercase tracking-widest text-xs">Foundation Staff</h4>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {staffMembers.map(staff => (
                                        <div key={staff.id} className="bg-white p-6 border-2 border-gray-100 rounded-[2rem] flex flex-col sm:flex-row justify-between sm:items-center shadow-sm hover:border-coral-blue transition-all group gap-4">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 bg-coral-blue text-white rounded-2xl flex items-center justify-center font-black shadow-lg uppercase">{staff.name.charAt(0)}</div>
                                                <div>
                                                    <p className="font-black text-coral-dark text-lg uppercase tracking-tight">{staff.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{staff.role}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 transition-all self-end sm:self-center">
                                                <button onClick={() => setEditingStaff(staff)} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors" title="Edit Staff Profile"><PencilIcon className="w-5 h-5"/></button>
                                                <button onClick={() => { if(!isReadOnly && confirm(`Remove STAFF MEMBER: ${staff.name}?`)) onDeleteStaffMember(staff.id); }} disabled={isReadOnly} className="p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors disabled:opacity-30"><TrashIcon className="w-5 h-5"/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* VOLUNTEER SECTION */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 border-b-2 border-gray-100 pb-3">
                                    <UserGroupIcon className="w-5 h-5 text-coral-green" />
                                    <h4 className="font-black text-coral-dark uppercase tracking-widest text-xs">Certified Volunteers</h4>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    {volunteers.map(volunteer => (
                                        <div key={volunteer.id} className="bg-white p-6 border-2 border-gray-100 rounded-[2.5rem] shadow-sm hover:border-coral-green transition-all group relative">
                                            <div className="flex justify-between items-start">
                                                <div className="flex gap-6 w-full">
                                                    <div className="w-16 h-16 rounded-[1.2rem] bg-gray-50 border-2 border-gray-100 overflow-hidden shrink-0 shadow-inner flex items-center justify-center">
                                                        {volunteer.photoUrl ? (
                                                            <img src={volunteer.photoUrl} className="w-full h-full object-cover" />
                                                        ) : (
                                                            <UserGroupIcon className="w-8 h-8 text-gray-200" />
                                                        )}
                                                    </div>
                                                    <div className="flex-grow min-w-0">
                                                        <div className="flex justify-between items-start">
                                                            <p className="font-black text-coral-dark text-xl tracking-tighter uppercase italic truncate pr-2">{volunteer.name}</p>
                                                            <span className={`shrink-0 px-2 py-0.5 text-[8px] font-black uppercase rounded-full border ${volunteer.status === 'Approved' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-orange-50 text-orange-700 border-orange-200'}`}>
                                                                {volunteer.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-[10px] font-bold text-coral-blue truncate">{volunteer.email}</p>
                                                        <div className="flex gap-4 mt-3">
                                                            <div>
                                                                <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Med Expiry</p>
                                                                <p className={`text-[10px] font-black uppercase ${new Date(volunteer.medicalExpiry || '') < new Date() ? 'text-red-500' : 'text-coral-dark'}`}>
                                                                    {volunteer.medicalExpiry || 'No Data'}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-[7px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">missions</p>
                                                                <p className="text-[10px] font-black uppercase text-coral-dark">{volunteer.daysOut || 0}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-50">
                                                <button onClick={() => onViewVolunteerPortal && onViewVolunteerPortal(volunteer.id)} className="p-2 bg-purple-50 text-purple-600 rounded-xl hover:bg-purple-100" title="View Portal As Volunteer"><EyeIcon className="w-4 h-4"/></button>
                                                <button onClick={() => setEditingVolunteer(volunteer)} className="p-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100" title="Full Profile Edit"><PencilIcon className="w-4 h-4"/></button>
                                                <button onClick={() => { if(!isReadOnly && confirm(`Remove VOLUNTEER: ${volunteer.name}?`)) onDeleteVolunteer(volunteer.id); }} disabled={isReadOnly} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><TrashIcon className="w-4 h-4"/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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
                            {shifts.map(shift => {
                                const validPendingIds = (shift.pendingVolunteerIds || []).filter(vid => 
                                    volunteers.some(v => String(v.id).trim() === String(vid).trim())
                                );
                                if (validPendingIds.length === 0) return null;
                                const site = sites.find(si => String(si.id).trim() === String(shift.siteId || '').trim());
                                return (
                                    <div key={shift.id} className="p-8 bg-white border-2 border-gray-100 rounded-[3rem] shadow-xl space-y-6 group hover:border-purple-200 transition-all">
                                        <div className="flex justify-between items-center border-b border-gray-100 pb-5">
                                            <div>
                                                <p className="font-black uppercase text-coral-dark text-xl tracking-tight italic">{shift.date}</p>
                                                <p className="text-[10px] font-black text-coral-blue uppercase tracking-widest">{site?.name || shift.customSiteName || 'Nursery Open'}</p>
                                            </div>
                                            <span className="text-[9px] font-black bg-gray-100 px-3 py-1 rounded-full text-gray-500 uppercase tracking-widest">{shift.shiftType}</span>
                                        </div>
                                        <div className="space-y-4">
                                            {validPendingIds.map(vid => {
                                                const v = volunteers.find(vol => String(vol.id).trim() === String(vid).trim());
                                                if (!v) return null;
                                                return (
                                                    <div key={vid} className="flex justify-between items-center bg-gray-50 p-5 rounded-[2rem] border border-gray-100 group-hover:bg-white transition-colors">
                                                        <div className="flex items-center gap-5">
                                                            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center font-black shadow-inner uppercase">{(v.name || vid).charAt(0)}</div>
                                                            <div>
                                                                <p className="font-black text-coral-dark uppercase text-sm tracking-tight">{v.name}</p>
                                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Exp: {v.medicalExpiry || 'No Data'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <button 
                                                                onClick={() => handleApproveShift(vid, shift.id)}
                                                                disabled={isReadOnly}
                                                                className="bg-coral-green text-coral-dark font-black px-6 py-3 rounded-2xl text-[10px] uppercase shadow-lg hover:brightness-105 active:scale-95 transition-all border-b-4 border-green-600 disabled:opacity-50"
                                                            >
                                                                Confirm
                                                            </button>
                                                            <button disabled={isReadOnly} className="bg-white border-2 border-red-50 text-red-500 font-black px-6 py-3 rounded-2xl text-[10px] uppercase hover:bg-red-50 disabled:opacity-30">Decline</button>
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
                                <p className="text-gray-300 font-black uppercase tracking-[1em] italic text-xl">No active requests</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="mt-8 pt-4 border-t border-gray-50 shrink-0">
                <SyncStatusIndicator />
            </div>

            {/* VOLUNTEER EDIT MODAL */}
            {editingVolunteer && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setEditingVolunteer(null)}>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-8 shadow-2xl space-y-8 animate-fade-in overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                            <div>
                                <h3 className="text-2xl font-black text-coral-dark uppercase tracking-tighter italic leading-none">Volunteer Profile</h3>
                                <p className="text-[10px] font-black text-coral-blue uppercase tracking-widest mt-1">ID: {editingVolunteer.id}</p>
                            </div>
                            <button onClick={() => setEditingVolunteer(null)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors shadow-sm"><CloseIcon className="w-5 h-5 text-gray-800"/></button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2"><label className={labelClasses}>Display Name</label><input type="text" value={editingVolunteer.name} onChange={e => setEditingVolunteer({...editingVolunteer, name: e.target.value})} className={inputClasses} /></div>
                            
                            <div><label className={labelClasses}>Portal Username</label><input type="text" value={editingVolunteer.username || ''} onChange={e => setEditingVolunteer({...editingVolunteer, username: e.target.value})} className={inputClasses} /></div>
                            <div><label className={labelClasses}>Portal Password</label><input type="password" value={editingVolunteer.password || ''} onChange={e => setEditingVolunteer({...editingVolunteer, password: e.target.value})} className={inputClasses} placeholder="••••" /></div>
                            
                            <div><label className={labelClasses}>Email Address</label><input type="email" value={editingVolunteer.email || ''} onChange={e => setEditingVolunteer({...editingVolunteer, email: e.target.value})} className={inputClasses} /></div>
                            <div><label className={labelClasses}>Phone Number</label><input type="tel" value={editingVolunteer.phone || ''} onChange={e => setEditingVolunteer({...editingVolunteer, phone: e.target.value})} className={inputClasses} /></div>
                            
                            <div className="md:col-span-2"><label className={labelClasses}>Emergency Contact (Name & Phone)</label><input type="text" value={editingVolunteer.emergencyContact || ''} onChange={e => setEditingVolunteer({...editingVolunteer, emergencyContact: e.target.value})} className={inputClasses} placeholder="Jane Doe - 0400 000 000" /></div>
                            
                            <div className="p-5 bg-blue-50/50 rounded-3xl border-2 border-blue-100 space-y-4">
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-3">Field Credentials</p>
                                <div><label className={labelClasses}>Medical Expiry</label><input type="date" value={editingVolunteer.medicalExpiry || ''} onChange={e => setEditingVolunteer({...editingVolunteer, medicalExpiry: e.target.value})} className={inputClasses} /></div>
                                <div><label className={labelClasses}>Divemaster / Prof Number</label><input type="text" value={editingVolunteer.divemasterNumber || ''} onChange={e => setEditingVolunteer({...editingVolunteer, divemasterNumber: e.target.value})} className={inputClasses} placeholder="PADI # / SSI #" /></div>
                            </div>

                            <div className="p-5 bg-green-50/50 rounded-3xl border-2 border-green-100 flex flex-col justify-between">
                                <p className="text-[10px] font-black text-green-500 uppercase tracking-[0.2em] mb-3">Membership Status</p>
                                <select 
                                    value={editingVolunteer.status} 
                                    onChange={e => setEditingVolunteer({...editingVolunteer, status: e.target.value as any})}
                                    className={inputClasses}
                                >
                                    <option value="Pending">Pending Review</option>
                                    <option value="Approved">Approved Active</option>
                                    <option value="Rejected">Access Revoked</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-6">
                            <button onClick={() => { onUpdateVolunteer(editingVolunteer); setEditingVolunteer(null); }} className="w-full bg-coral-blue text-white font-black py-5 rounded-[2rem] shadow-xl border-b-8 border-blue-700 active:scale-95 transition-all text-sm uppercase tracking-widest">Update Profile Records</button>
                        </div>
                    </div>
                </div>
            )}

            {/* STAFF EDIT MODAL */}
            {editingStaff && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setEditingStaff(null)}>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-8 shadow-2xl space-y-8 animate-fade-in overflow-y-auto max-h-[90vh]" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                            <div>
                                <h3 className="text-2xl font-black text-coral-dark uppercase tracking-tighter italic leading-none">Staff Profile</h3>
                                <p className="text-[10px] font-black text-coral-blue uppercase tracking-widest mt-1">Internal Personnel Registry</p>
                            </div>
                            <button onClick={() => setEditingStaff(null)} className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors shadow-sm"><CloseIcon className="w-5 h-5 text-gray-800"/></button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div><label className={labelClasses}>Full Name</label><input type="text" value={editingStaff.name} onChange={e => setEditingStaff({...editingStaff, name: e.target.value})} className={inputClasses} /></div>
                            <div><label className={labelClasses}>Role Title</label><input type="text" value={editingStaff.role} onChange={e => setEditingStaff({...editingStaff, role: e.target.value})} className={inputClasses} /></div>
                            
                            <div className="p-5 bg-blue-50/50 rounded-3xl border-2 border-blue-100 space-y-4 md:col-span-2">
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-1">Access Credentials</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className={labelClasses}>Username</label><input type="text" value={editingStaff.username || ''} onChange={e => setEditingStaff({...editingStaff, username: e.target.value})} className={inputClasses} placeholder="login-name" /></div>
                                    <div><label className={labelClasses}>Password</label><input type="password" value={editingStaff.password || ''} onChange={e => setEditingStaff({...editingStaff, password: e.target.value})} className={inputClasses} placeholder="••••" /></div>
                                </div>
                            </div>

                            {/* AVAILABILITY LOGIC */}
                            <div className="md:col-span-2 space-y-6">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] ml-1">Availability Schedule</p>
                                
                                {/* Recurring Days */}
                                <div className="p-6 bg-gray-50 rounded-[2rem] border-2 border-gray-100">
                                    <label className={labelClasses}>Recurring Away Days (Weekly)</label>
                                    <div className="flex flex-wrap gap-2 mt-4">
                                        {WEEKDAYS.map(day => {
                                            const isActive = (editingStaff.recurringAwayDays || []).includes(day.value);
                                            return (
                                                <button 
                                                    key={day.value}
                                                    type="button"
                                                    onClick={() => toggleAwayDay(day.value)}
                                                    className={`w-10 h-10 rounded-xl font-black text-sm transition-all border-2 ${isActive ? 'bg-orange-500 border-orange-600 text-white shadow-lg' : 'bg-white border-gray-200 text-gray-400 hover:border-orange-200'}`}
                                                >
                                                    {day.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Specific Leave */}
                                <div className="p-6 bg-gray-50 rounded-[2rem] border-2 border-gray-100">
                                    <label className={labelClasses}>Add Time Away / Leave</label>
                                    <div className="flex gap-4 mb-4">
                                        <button type="button" onClick={() => setLeaveMode('range')} className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full border ${leaveMode === 'range' ? 'bg-coral-blue text-white' : 'bg-white text-gray-400'}`}>Date Range</button>
                                        <button type="button" onClick={() => setLeaveMode('single')} className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-full border ${leaveMode === 'single' ? 'bg-coral-blue text-white' : 'bg-white text-gray-400'}`}>Single Day</button>
                                    </div>
                                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                                        <div className="flex-grow w-full">
                                            <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">{leaveMode === 'range' ? 'Start Date' : 'Away Date'}</label>
                                            <input type="date" value={newLeaveStart} onChange={e => setNewLeaveStart(e.target.value)} className={inputClasses} />
                                        </div>
                                        {leaveMode === 'range' && (
                                            <div className="flex-grow w-full">
                                                <label className="text-[9px] font-bold text-gray-400 uppercase ml-1">End Date</label>
                                                <input type="date" value={newLeaveEnd} onChange={e => setNewLeaveEnd(e.target.value)} className={inputClasses} />
                                            </div>
                                        )}
                                        <button 
                                            type="button"
                                            onClick={handleAddSpecificLeave}
                                            disabled={!newLeaveStart || (leaveMode === 'range' && !newLeaveEnd)}
                                            className="h-[52px] px-8 bg-coral-dark text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg hover:bg-black transition-all active:scale-95 disabled:opacity-50"
                                        >
                                            Add
                                        </button>
                                    </div>

                                    {/* List existing leave */}
                                    <div className="mt-6 space-y-2">
                                        {(editingStaff.timeAway || []).map((period, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                                <span className="text-xs font-black text-coral-dark uppercase italic">
                                                    {period.start === period.end ? period.start : `${period.start} to ${period.end}`}
                                                </span>
                                                <button type="button" onClick={() => handleRemoveLeavePeriod(idx)} className="text-red-400 hover:text-red-600 transition-colors"><CloseIcon className="w-4 h-4"/></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-6">
                            <button onClick={() => { onUpdateStaffMember(editingStaff); setEditingStaff(null); }} className="w-full bg-coral-blue text-white font-black py-5 rounded-[2rem] shadow-xl border-b-8 border-blue-700 active:scale-95 transition-all text-sm uppercase tracking-widest">Commit Personnel Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD VOLUNTEER MODAL */}
            {isAddingVolunteer && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setIsAddingVolunteer(false)}>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl animate-fade-in space-y-6" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center">
                            <h3 className="text-2xl font-black text-coral-dark uppercase tracking-tighter italic">Register Volunteer</h3>
                            <button onClick={() => setIsAddingVolunteer(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors shadow-sm"><CloseIcon className="w-5 h-5 text-gray-800"/></button>
                        </div>
                        <form onSubmit={handleSaveNewVolunteer} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div><label className={labelClasses}>Full Legal Name</label><input type="text" value={newVol.name} onChange={e => setNewVol({...newVol, name: e.target.value})} placeholder="e.g. John Doe" className={inputClasses} required /></div>
                                <div><label className={labelClasses}>Primary Email</label><input type="email" value={newVol.email} onChange={e => setNewVol({...newVol, email: e.target.value})} placeholder="email@address.com" className={inputClasses} required /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className={labelClasses}>Portal Username</label><input type="text" value={newVol.username} onChange={e => setNewVol({...newVol, username: e.target.value})} placeholder="jdoe" className={inputClasses} required /></div>
                                    <div><label className={labelClasses}>Portal Password</label><input type="password" value={newVol.password} onChange={e => setNewVol({...newVol, password: e.target.value})} placeholder="••••" className={inputClasses} required /></div>
                                </div>
                            </div>
                            <button type="submit" disabled={isReadOnly} className="w-full bg-coral-blue text-white font-black py-5 rounded-[2rem] uppercase tracking-widest text-sm shadow-xl border-b-8 border-blue-700 mt-4 active:scale-95 transition-all">Add to Registry</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PeoplePage;