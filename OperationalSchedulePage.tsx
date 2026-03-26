import * as React from 'react';
import type { VolunteerShift, Site, Volunteer, Staff, Visitor, GearItem } from './types';
import { 
    CalendarIcon, ChevronLeftIcon, ChevronRightIcon, CheckCircleIcon, 
    SparklesIcon, CloseIcon, TrashIcon, ArrowPathIcon, PlusCircleIcon
} from './components/Icons';
import { toLocalYYYYMMDD, getSiteName } from './components/DashboardPage';

interface OperationalSchedulePageProps {
  isReadOnly: boolean;
  shifts: VolunteerShift[];
  sites: Site[];
  volunteers: Volunteer[];
  staffMembers: Staff[];
  visitors?: Visitor[];
  gearItems: GearItem[];
  onUpdateGear: (g: GearItem) => void;
  onAddShift: (s: VolunteerShift) => void;
  onUpdateShift: (s: VolunteerShift) => void;
  onDeleteShift: (id: string) => void;
  onForceSync: (overrides?: VolunteerShift[]) => Promise<boolean | undefined>;
  onNavigateBack: () => void;
  onClearSignal?: () => void;
  initialDate?: string | null;
}

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

const formatStaffNameShort = (name: string = '') => {
    const parts = name.trim().split(' ');
    return parts[0]; 
};

const OperationalSchedulePage: React.FC<OperationalSchedulePageProps> = ({ 
    isReadOnly, shifts = [], sites = [], volunteers = [], staffMembers = [], onAddShift, onUpdateShift, onDeleteShift, onForceSync, onNavigateBack, onClearSignal, initialDate 
}) => {
    const [currentDate, setDate] = React.useState(new Date());
    const [selectedDate, setSelectedDate] = React.useState<string | null>(initialDate || null);
    const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'synced'>('idle');

    // LOCAL DRAFT STATE: This is the current visual registry for the session.
    const [draftShifts, setDraftShifts] = React.useState<VolunteerShift[]>(() => [...(shifts || [])]);

    // Synchronize draft shifts whenever the parent props update (i.e. after a load)
    // Only do this if the modal is not open to avoid overwriting current edits.
    React.useEffect(() => {
        if (!selectedDate) {
            setDraftShifts([...(shifts || [])]);
        }
    }, [shifts, selectedDate]);

    const calendarDays = React.useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const startingDay = (firstDayOfMonth.getDay() + 6) % 7;
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        for (let i = 0; i < startingDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);
        return days;
    }, [currentDate]);

    const changeMonth = (offset: number) => {
        setDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    const handleCreateShift = (date: string) => {
        if (isReadOnly) return;
        const normalizedDate = toLocalYYYYMMDD(date);
        const newShift: VolunteerShift = {
            id: `SHIFT-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            date: normalizedDate, 
            shiftType: 'Full Day',
            assignedStaffIds: [],
            assignedVolunteerIds: [],
            assignedVisitorIds: [],
            pendingVolunteerIds: [],
            maxCapacity: 12,
            siteId: '' 
        };
        setDraftShifts(prev => [...prev, newShift]);
    };

    const handleUpdate = (updatedShift: VolunteerShift) => {
        if (isReadOnly) return;
        const cleanShift = { 
            ...updatedShift, 
            date: toLocalYYYYMMDD(updatedShift.date),
            assignedStaffIds: updatedShift.assignedStaffIds || [],
            assignedVolunteerIds: updatedShift.assignedVolunteerIds || [],
            assignedVisitorIds: updatedShift.assignedVisitorIds || [],
            pendingVolunteerIds: updatedShift.pendingVolunteerIds || []
        };
        setDraftShifts(prev => prev.map(s => String(s.id).trim() === String(updatedShift.id).trim() ? cleanShift : s));
    };

    const handleDelete = (shiftId: string) => {
        if (isReadOnly) return;
        setDraftShifts(prev => prev.filter(s => String(s.id).trim() !== String(shiftId).trim()));
    };

    /**
     * TERMINAL SAVE AND CLOSE
     * Triggers a direct cloud write with the EXACT content currently in draftShifts.
     */
    const handleSaveAndClose = async () => {
        if (isReadOnly) {
            setSelectedDate(null);
            if (onClearSignal) onClearSignal();
            return;
        }

        setSaveStatus('saving');
        
        // This is a blocking terminal write. Wait for the Cloudflare R2 response.
        const success = await onForceSync(draftShifts);
        
        if (success !== false) {
            setSaveStatus('synced');
            // Force the 'Verified' message to stay visible for 2 seconds before closing
            setTimeout(() => {
                setSelectedDate(null);
                setSaveStatus('idle');
                if (onClearSignal) onClearSignal();
            }, 1200);
        } else {
            setSaveStatus('idle');
            alert("CLOUD COMMIT FAILED: Registry sync was interrupted.");
        }
    };

    const handleWipeMonth = async () => {
        if (isReadOnly) return;
        const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
        
        if (confirm(`PERMANENTLY DELETE ALL CLOUD DATA FOR ${monthName.toUpperCase()}?\n\nThis will trigger an immediate atomic sync.`)) {
            setSaveStatus('saving');
            const yearStr = currentDate.getFullYear();
            const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
            const monthPrefix = `${yearStr}-${monthStr}`;
            
            const remainingShifts = (draftShifts || []).filter(s => {
                if (!s || !s.date) return true;
                const d = toLocalYYYYMMDD(s.date);
                return !d.startsWith(monthPrefix);
            });

            const success = await onForceSync(remainingShifts);
            
            if (success !== false) {
                setSaveStatus('synced');
                setTimeout(() => setSaveStatus('idle'), 2000);
            } else {
                setSaveStatus('idle');
                alert("SYNC ERROR: Cloud deletion failed.");
            }
        }
    };

    const handleCloseModalOnly = () => {
        if (saveStatus === 'saving') return;
        setSelectedDate(null);
        if (onClearSignal) onClearSignal();
    };

    const todayStr = toLocalYYYYMMDD(new Date());

    return (
        <div className="bg-white p-6 sm:p-8 rounded-[3rem] shadow-2xl space-y-8 border-2 border-coral-blue animate-fade-in min-h-[85vh] flex flex-col">
            {/* TOP HEADER */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-8 shrink-0">
                <div className="flex items-center gap-6">
                    <div className="p-4 bg-blue-50 rounded-[1.5rem] shadow-sm text-coral-blue">
                        {saveStatus === 'saving' ? <ArrowPathIcon className="w-8 h-8 animate-spin" /> : <CalendarIcon className="w-8 h-8" />}
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-coral-dark uppercase tracking-tighter italic leading-none">Mission Schedule</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Operational Deployment Ledger</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {!isReadOnly && (
                        <button 
                            onClick={handleWipeMonth} 
                            disabled={saveStatus !== 'idle'}
                            className="bg-red-50 text-red-500 font-black py-2.5 px-6 rounded-2xl hover:bg-red-100 transition-all uppercase tracking-widest text-[10px] border border-red-100 disabled:opacity-50 flex items-center gap-2"
                        >
                            {saveStatus === 'saving' ? 'Syncing...' : 'Wipe Month'}
                        </button>
                    )}
                    <button onClick={onNavigateBack} className="bg-gray-100 hover:bg-gray-200 text-coral-dark font-black py-2.5 px-8 rounded-2xl transition-all uppercase tracking-widest text-[10px]">&larr; Dashboard</button>
                </div>
            </div>

            {/* MONTH NAV */}
            <div className="flex items-center justify-center gap-6 px-4 shrink-0">
                <button onClick={() => changeMonth(-1)} className="p-3 hover:bg-gray-50 rounded-full transition-colors"><ChevronLeftIcon className="w-6 h-6 text-gray-300" /></button>
                <h3 className="text-3xl font-black text-coral-dark uppercase italic tracking-tighter min-w-[260px] text-center">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={changeMonth.bind(null, 1)} className="p-3 hover:bg-gray-50 rounded-full transition-colors"><ChevronRightIcon className="w-6 h-6 text-gray-300" /></button>
            </div>

            {/* CALENDAR GRID */}
            <div className="w-full overflow-x-auto custom-scrollbar rounded-[3.5rem] shadow-2xl flex-grow border-4 border-gray-100">
                <div className="grid grid-cols-7 gap-px bg-gray-100 min-w-[800px]">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <div key={day} className="bg-white p-6 text-center text-[11px] font-black text-coral-dark uppercase tracking-[0.4em] border-b border-gray-100 shadow-sm">{day}</div>
                    ))}
                    {calendarDays.map((day, idx) => {
                        if (day === null) return <div key={`empty-${idx}`} className="bg-gray-50/30 aspect-square"></div>;
                        const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const dayShifts = (draftShifts || []).filter(s => s && toLocalYYYYMMDD(s.date) === dateStr);
                        const awayStaff = staffMembers.filter(s => isStaffAwayOnDate(s, dateStr));
                        const isToday = todayStr === dateStr;
                        const isPast = dateStr < todayStr;
                        
                        return (
                            <div 
                                key={dateStr} 
                                onClick={() => setSelectedDate(dateStr)} 
                                className={`bg-white aspect-square p-4 border-r border-b border-gray-50 flex flex-col items-start cursor-pointer hover:bg-blue-50/50 transition-all group relative ${isToday ? 'bg-blue-50/20' : ''} ${isPast ? 'opacity-40 grayscale-[0.5]' : ''}`}
                            >
                                <span className={`text-base font-black px-2 py-0.5 rounded-lg mb-2 ${isToday ? 'bg-coral-blue text-white shadow-md' : 'text-black'} group-hover:bg-coral-blue group-hover:text-white transition-all`}>{day}</span>
                                
                                <div className="flex flex-col gap-1.5 overflow-hidden w-full">
                                    {awayStaff.map(s => (
                                        <p key={s.id} className="text-[11px] font-bold text-[#F59E0B] leading-none truncate italic">
                                            {formatStaffNameShort(s.name)} away
                                        </p>
                                    ))}
                                    {dayShifts.map(s => {
                                        const siteName = getSiteName(s, sites);
                                        return (
                                            <div key={s.id} className="mt-1 space-y-1 w-full">
                                                <p className="text-[12px] font-black text-coral-blue leading-tight truncate uppercase tracking-tighter">
                                                    {siteName || 'LOCATION TBD'}
                                                </p>
                                                <div className="flex flex-col">
                                                    {(s.assignedStaffIds || []).map(sid => (
                                                        <p key={sid} className="text-[11px] font-bold text-black leading-tight truncate">
                                                            {formatStaffNameShort(staffMembers.find(st => String(st.id).trim() === String(sid).trim())?.name)}
                                                        </p>
                                                    ))}
                                                    {(s.assignedVolunteerIds || []).map(vid => (
                                                        <p key={vid} className="text-[11px] font-medium text-coral-blue leading-tight truncate">
                                                            {formatVolunteerNameShort(volunteers.find(v => String(v.id).trim() === String(vid).trim())?.name)}
                                                        </p>
                                                    ))}
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

            {/* MISSION PLAN MODAL */}
            {selectedDate && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4" onClick={handleCloseModalOnly}>
                    <div className="bg-white rounded-[2rem] w-full max-w-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col animate-fade-in gap-4" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center border-b pb-3 shrink-0 sticky top-0 bg-white z-10">
                            <div>
                                <h3 className="text-xl font-black text-coral-dark uppercase tracking-tighter italic leading-none">TODAYS SHIFTS</h3>
                                <p className="text-[10px] font-black text-coral-blue uppercase tracking-widest mt-1">{selectedDate}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {!isReadOnly && (
                                    <button 
                                        onClick={() => handleCreateShift(selectedDate)}
                                        className="bg-coral-blue text-white font-black px-4 py-2 rounded-xl text-[10px] uppercase shadow-md hover:brightness-110 transition-all flex items-center gap-2 border-b-4 border-blue-700 active:scale-95"
                                    >
                                        <PlusCircleIcon className="w-4 h-4" />
                                        Add Shift
                                    </button>
                                )}
                                <button onClick={handleCloseModalOnly} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors shadow-sm"><CloseIcon className="w-4 h-4 text-coral-dark"/></button>
                            </div>
                        </div>

                        <div className="space-y-4 flex-grow">
                            {draftShifts.filter(s => toLocalYYYYMMDD(s.date) === selectedDate).length === 0 && (
                                <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-3xl">
                                    <p className="text-gray-300 font-black uppercase tracking-widest text-[10px] italic">No shifts planned for this date</p>
                                </div>
                            )}
                            <div className="space-y-4">
                                {draftShifts.filter(s => toLocalYYYYMMDD(s.date) === selectedDate).map(shift => {
                                    const isOtherSelected = shift.siteId === 'CUSTOM_SITE_MARKER' || (shift.customSiteName && !shift.siteId);
                                    const currentSId = shift.siteId ? String(shift.siteId).trim().toLowerCase() : '';
                                    const assignedVolIds = shift.assignedVolunteerIds || [];
                                    const availableVolunteers = volunteers.filter(v => 
                                        !assignedVolIds.includes(String(v.id).trim()) && 
                                        (v.status === 'Approved' || !v.status)
                                    ).sort((a,b) => a.name.localeCompare(b.name));
                                    
                                    return (
                                        <div key={shift.id} className="p-4 border-2 border-coral-blue/10 rounded-3xl space-y-4 bg-white relative group shadow-inner">
                                            {!isReadOnly && <button onClick={() => { if(confirm('DELETE MISSION?')) handleDelete(shift.id); }} className="absolute top-4 right-4 text-gray-200 hover:text-red-500 transition-colors"><TrashIcon className="w-4 h-4" /></button>}
                                            
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-coral-blue uppercase tracking-widest border-l-4 border-coral-blue pl-2">Deployment Site</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {sites.filter(s => !s.isArchived).map(s => {
                                                        const sId = String(s.id).trim().toLowerCase();
                                                        const isSelected = currentSId === sId || currentSId === s.name.trim().toLowerCase();
                                                        return (
                                                            <button 
                                                                key={s.id} 
                                                                onClick={() => handleUpdate({...shift, siteId: String(s.id).trim(), customSiteName: undefined})} 
                                                                disabled={isReadOnly} 
                                                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all border ${isSelected ? 'bg-coral-blue border-blue-700 text-white shadow-md scale-105' : 'bg-white border-gray-100 text-gray-400 hover:border-blue-200 hover:text-coral-blue'}`}
                                                            >
                                                                {s.name}
                                                            </button>
                                                        );
                                                    })}
                                                    <button 
                                                        onClick={() => handleUpdate({...shift, siteId: 'CUSTOM_SITE_MARKER', customSiteName: shift.customSiteName || ''})} 
                                                        disabled={isReadOnly} 
                                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all border ${isOtherSelected ? 'bg-orange-600 border-orange-700 text-white shadow-md scale-105' : 'bg-white border-gray-100 text-gray-400 hover:border-blue-200 hover:text-orange-600'}`}
                                                    >
                                                        Custom Site...
                                                    </button>
                                                </div>
                                                
                                                {isOtherSelected && (
                                                    <div className="mt-2 animate-fade-in">
                                                        <input 
                                                            type="text"
                                                            value={shift.customSiteName || ''}
                                                            onChange={(e) => handleUpdate({...shift, customSiteName: e.target.value})}
                                                            placeholder="Enter custom location name..."
                                                            className="w-full p-3 border border-orange-100 rounded-xl bg-white font-bold text-coral-dark text-sm outline-none focus:border-orange-500 transition-all shadow-inner"
                                                            disabled={isReadOnly}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-l-4 border-blue-600 pl-2">Assigned Staff</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {staffMembers.map(s => {
                                                        const sid = String(s.id).trim();
                                                        const isAssigned = (shift.assignedStaffIds || []).some(id => String(id).trim() === sid);
                                                        return (
                                                            <button 
                                                                key={s.id} 
                                                                onClick={() => { 
                                                                    const currentIds = Array.isArray(shift.assignedStaffIds) ? shift.assignedStaffIds : []; 
                                                                    const newIds = isAssigned ? currentIds.filter(id => String(id).trim() !== sid) : [...currentIds, sid]; 
                                                                    handleUpdate({...shift, assignedStaffIds: newIds}); 
                                                                }} 
                                                                disabled={isReadOnly} 
                                                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all border ${isAssigned ? 'bg-blue-600 border-blue-700 text-white shadow-md' : 'bg-white border-gray-100 text-gray-400 hover:border-blue-200 hover:text-blue-600'}`}
                                                            >
                                                                {s.name}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-2">
                                                <p className="text-[10px] font-black text-green-600 uppercase tracking-widest border-l-4 border-green-600 pl-2">Field Volunteers</p>
                                                <div className="space-y-1">
                                                    {(shift.assignedVolunteerIds || []).map(vid => {
                                                        const v = volunteers.find(vol => String(vol.id).trim() === String(vid).trim());
                                                        return (
                                                            <div key={vid} className="flex items-center gap-2 w-full bg-green-50 text-green-700 px-3 py-2 rounded-xl border border-green-100 text-[11px] font-black uppercase justify-between group shadow-sm">
                                                                {v?.name || 'Volunteer'}
                                                                <button onClick={() => { if (isReadOnly) return; const currentVols = Array.isArray(shift.assignedVolunteerIds) ? shift.assignedVolunteerIds : []; handleUpdate({...shift, assignedVolunteerIds: currentVols.filter(id => String(id).trim() !== String(vid).trim())}); }} className="opacity-0 group-hover:opacity-100 text-red-500 p-1 hover:bg-red-100 rounded-lg transition-all font-black text-sm">&times;</button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                                
                                                {!isReadOnly && (
                                                    <div className="relative mt-2">
                                                        <select
                                                            onChange={(e) => {
                                                                if (e.target.value) {
                                                                    handleUpdate({
                                                                        ...shift,
                                                                        assignedVolunteerIds: [...assignedVolIds, e.target.value]
                                                                    });
                                                                }
                                                            }}
                                                            value=""
                                                            className="w-full p-3 border-2 border-green-50 rounded-xl bg-white text-green-700 font-black uppercase text-[10px] outline-none focus:border-green-500 transition-all appearance-none cursor-pointer hover:border-green-200 shadow-sm"
                                                        >
                                                            <option value="">+ Add Volunteer to Roster...</option>
                                                            {availableVolunteers.map(v => (
                                                                <option key={v.id} value={v.id}>{v.name}</option>
                                                            ))}
                                                        </select>
                                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-green-600 bg-green-50 p-1 rounded-full">
                                                            <PlusCircleIcon className="w-3 h-3" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex flex-col gap-2 sticky bottom-0 bg-white pt-3 shrink-0 border-t">
                            <button 
                                onClick={handleSaveAndClose} 
                                disabled={saveStatus === 'saving'}
                                className={`w-full py-5 font-black rounded-2xl uppercase tracking-widest text-xs shadow-xl active:scale-95 active:translate-y-1 transition-all flex items-center justify-center gap-4 border-b-8 ${
                                    saveStatus === 'synced' ? 'bg-green-600 text-white border-green-800' : 'bg-coral-dark text-white border-black'
                                } hover:brightness-110 disabled:opacity-70 disabled:cursor-not-allowed`}
                            >
                                {saveStatus === 'saving' ? (
                                    <>
                                        <ArrowPathIcon className="w-6 h-6 animate-spin" />
                                        COMMITTING REGISTRY TO R2...
                                    </>
                                ) : saveStatus === 'synced' ? (
                                    <>
                                        <CheckCircleIcon className="w-6 h-6 text-white" />
                                        SUCCESS: REGISTRY ANCHORED
                                    </>
                                ) : (
                                    <>
                                        <CheckCircleIcon className="w-6 h-6" /> 
                                        SAVE AND CLOSE
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OperationalSchedulePage;