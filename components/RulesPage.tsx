import * as React from 'react';
import type { FormEvent } from 'react';
import type { Rule, RuleTarget, CheckType } from '../types';
import { PencilIcon, TrashIcon, CloseIcon, PlusCircleIcon, SparklesIcon, CheckCircleIcon, ArrowPathIcon, DatabaseIcon } from './Icons';

interface RulesPageProps {
  rules: Rule[];
  onAddRule: (newRule: Omit<Rule, 'id'>) => void;
  onUpdateRule: (updatedRule: Rule) => void;
  onDeleteRule: (id: string) => void;
  onNavigateBack: () => void;
  isReadOnly: boolean;
}

const RULE_TARGETS: (RuleTarget | 'Other')[] = ['Site', 'Collection Zone', 'Anchor', 'Tree', 'Branch', 'Float', 'Substrate Zone', 'Rubble Anchor', 'Other'];
const CHECK_TYPES: (CheckType | 'Other')[] = ['Health Report', 'Scan', 'Check', 'Maintenance', 'Service', 'Other'];
const INTERVAL_UNITS: ('days' | 'weeks' | 'months')[] = ['days', 'weeks', 'months'];

const RulesPage: React.FC<RulesPageProps> = ({ rules, onAddRule, onUpdateRule, onDeleteRule, onNavigateBack, isReadOnly }) => {
    const [isAddFormOpen, setIsAddFormOpen] = React.useState(false);
    
    // Form State
    const [isRecurring, setIsRecurring] = React.useState(true);
    const [newRuleTarget, setNewRuleTarget] = React.useState<RuleTarget | 'Other'>('Branch');
    const [customTarget, setCustomTarget] = React.useState('');
    const [newRuleIntervalValue, setNewRuleIntervalValue] = React.useState<string>('3');
    const [newRuleIntervalUnit, setNewRuleIntervalUnit] = React.useState<'days' | 'weeks' | 'months'>('months');
    const [newRuleCheckType, setNewRuleCheckType] = React.useState<CheckType | 'Other'>('Health Report');
    const [customCheckType, setCustomCheckType] = React.useState('');

    const handleAddRuleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (isReadOnly) return;

        const targetValue = newRuleTarget === 'Other' ? customTarget : newRuleTarget;
        const checkTypeValue = newRuleCheckType === 'Other' ? customCheckType : newRuleCheckType;

        if (!targetValue || !checkTypeValue) {
            alert("Please provide values for both Category and Activity Type.");
            return;
        }

        onAddRule({ 
            target: targetValue, 
            intervalValue: parseInt(newRuleIntervalValue, 10) || 1, 
            intervalUnit: newRuleIntervalUnit,
            isRecurring,
            checkType: checkTypeValue 
        });

        setIsAddFormOpen(false);
        setNewRuleTarget('Branch'); 
        setCustomTarget('');
        setNewRuleIntervalValue('3');
        setNewRuleIntervalUnit('months');
        setNewRuleCheckType('Health Report');
        setCustomCheckType('');
        setIsRecurring(true);
    };

    const inputClasses = "w-full p-4 border-2 border-gray-100 rounded-2xl font-bold text-coral-dark outline-none focus:border-coral-blue shadow-inner bg-white transition-all text-sm";
    const selectClasses = "w-full p-4 border-2 border-gray-100 rounded-2xl font-bold text-coral-dark outline-none focus:border-coral-blue shadow-inner bg-white transition-all text-sm appearance-none";
    const labelClasses = "block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1";

    return (
        <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl space-y-8 border-2 border-coral-blue animate-fade-in min-h-[70vh]">
            <div className="flex justify-between items-center border-b border-gray-100 pb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-50 rounded-2xl">
                        <PlusCircleIcon className="w-8 h-8 text-coral-blue" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-coral-dark uppercase tracking-tighter italic">Nursery Protocols</h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Automation & Monitoring Intervals</p>
                    </div>
                </div>
                <button onClick={onNavigateBack} className="bg-gray-100 hover:bg-gray-200 text-coral-dark font-black py-2.5 px-6 rounded-2xl transition-all uppercase tracking-widest text-xs italic shadow-sm">&larr; Registry</button>
            </div>
            
            <div className="bg-blue-50 p-6 rounded-[2rem] border-2 border-blue-100 shadow-inner">
                <p className="text-sm text-blue-800 font-bold leading-relaxed">
                    Define maintenance and health check cycles. Protocols automatically trigger <span className="text-coral-blue">Action Items</span> on the Dashboard when checks are overdue.
                </p>
            </div>

            <div>
              {!isAddFormOpen ? (
                <button 
                    onClick={() => setIsAddFormOpen(true)} 
                    disabled={isReadOnly}
                    className="w-full bg-coral-blue text-white font-black py-5 rounded-[2rem] shadow-xl hover:brightness-110 transition-all uppercase tracking-widest text-sm active:scale-95 disabled:opacity-50 border-b-8 border-blue-700"
                >
                    + Define New Monitoring Protocol
                </button>
              ) : (
                <form onSubmit={handleAddRuleSubmit} className="p-8 border-4 border-coral-blue rounded-[3rem] space-y-8 bg-white shadow-2xl animate-fade-in relative">
                    <button type="button" onClick={() => setIsAddFormOpen(false)} className="absolute top-6 right-6 text-gray-300 hover:text-gray-600 transition-colors"><CloseIcon className="w-6 h-6"/></button>
                    
                    {/* Recurrence Segmented Control */}
                    <div className="flex justify-center">
                        <div className="inline-flex p-1.5 bg-gray-100 rounded-3xl gap-1 border-2 border-gray-200">
                            <button 
                                type="button" 
                                onClick={() => setIsRecurring(true)}
                                className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${isRecurring ? 'bg-coral-blue text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                Recurring Cycle
                            </button>
                            <button 
                                type="button" 
                                onClick={() => setIsRecurring(false)}
                                className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all ${!isRecurring ? 'bg-orange-500 text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                One-Time Check
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* ITEM CATEGORY */}
                        <div className="space-y-3">
                            <label className={labelClasses}>Asset Category</label>
                            <div className="relative">
                                <select 
                                    value={newRuleTarget} 
                                    onChange={(e) => setNewRuleTarget(e.target.value as any)} 
                                    className={selectClasses}
                                >
                                    {RULE_TARGETS.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ArrowPathIcon className="w-4 h-4 transform rotate-90" /></div>
                            </div>
                            {newRuleTarget === 'Other' && (
                                <input 
                                    type="text" 
                                    value={customTarget} 
                                    onChange={e => setCustomTarget(e.target.value)} 
                                    placeholder="Enter Custom Category..." 
                                    className={`${inputClasses} border-coral-blue/50 animate-fade-in`}
                                    autoFocus
                                />
                            )}
                        </div>

                        {/* INTERVAL WITH UNIT */}
                        <div className="space-y-3">
                            <label className={labelClasses}>{isRecurring ? 'Repeat Every' : 'Trigger After'}</label>
                            <div className="flex gap-2">
                                <input 
                                    type="number" 
                                    value={newRuleIntervalValue} 
                                    onChange={(e) => setNewRuleIntervalValue(e.target.value)} 
                                    min="1" 
                                    className={`${inputClasses} flex-1`} 
                                />
                                <div className="relative w-1/2">
                                    <select 
                                        value={newRuleIntervalUnit} 
                                        onChange={(e) => setNewRuleIntervalUnit(e.target.value as any)} 
                                        className={selectClasses}
                                    >
                                        {INTERVAL_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ArrowPathIcon className="w-4 h-4 transform rotate-90" /></div>
                                </div>
                            </div>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wide ml-1 italic">
                                {isRecurring 
                                    ? `Checks will repeat every ${newRuleIntervalValue} ${newRuleIntervalUnit}.` 
                                    : `Single check triggered once ${newRuleIntervalValue} ${newRuleIntervalUnit} after asset creation.`}
                            </p>
                        </div>

                        {/* ACTIVITY TYPE */}
                        <div className="space-y-3">
                            <label className={labelClasses}>Activity Type</label>
                            <div className="relative">
                                <select 
                                    value={newRuleCheckType} 
                                    onChange={(e) => setNewRuleCheckType(e.target.value as any)} 
                                    className={selectClasses}
                                >
                                    {CHECK_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"><ArrowPathIcon className="w-4 h-4 transform rotate-90" /></div>
                            </div>
                            {newRuleCheckType === 'Other' && (
                                <input 
                                    type="text" 
                                    value={customCheckType} 
                                    onChange={e => setCustomCheckType(e.target.value)} 
                                    placeholder="Enter Custom Activity..." 
                                    className={`${inputClasses} border-coral-blue/50 animate-fade-in`}
                                    autoFocus
                                />
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-50">
                        <button type="button" onClick={() => setIsAddFormOpen(false)} className="bg-gray-100 text-gray-500 font-black py-4 px-10 rounded-2xl uppercase tracking-widest text-[10px] transition-all hover:bg-gray-200">Discard</button>
                        <button type="submit" className="bg-coral-blue text-white font-black py-4 px-12 rounded-2xl uppercase tracking-widest text-[10px] transition-all hover:brightness-110 shadow-lg active:scale-95 flex items-center gap-3">
                            <CheckCircleIcon className="w-5 h-5" /> Save Protocol
                        </button>
                    </div>
                </form>
              )}
            </div>

            <div className="space-y-6">
                <h3 className="text-xl font-black text-coral-dark uppercase tracking-tight italic ml-2 flex items-center gap-2">
                    <DatabaseIcon className="w-5 h-5 text-gray-400" />
                    Protocol Registry
                </h3>
                <div className="overflow-hidden border-2 border-gray-100 rounded-[2.5rem] shadow-sm bg-white">
                    <table className="min-w-full divide-y divide-gray-100">
                        <thead className="bg-gray-50">
                            <tr className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
                                <th className="px-8 py-5 text-left">Nursery Asset</th>
                                <th className="px-8 py-5 text-left">Activity</th>
                                <th className="px-8 py-5 text-left">Occurrence Logic</th>
                                <th className="px-8 py-5 text-right">Admin</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                            {rules.map(rule => (
                                <tr key={rule.id} className="hover:bg-blue-50/30 transition-colors group">
                                    <td className="px-8 py-6 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-2 h-2 rounded-full ${rule.isRecurring ? 'bg-coral-blue' : 'bg-orange-500'}`}></div>
                                            <span className="text-sm font-black text-coral-dark uppercase tracking-tight">{rule.target}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap">
                                        <span className="bg-blue-50 text-blue-700 px-4 py-1.5 rounded-xl font-black text-[10px] uppercase tracking-widest border border-blue-100 shadow-sm">{rule.checkType}</span>
                                    </td>
                                    <td className="px-8 py-6 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase border ${rule.isRecurring ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                                {rule.isRecurring ? 'Every' : 'Once @'}
                                            </span>
                                            <span className="text-sm text-gray-500 font-black uppercase tracking-tighter">
                                                {rule.intervalValue} {rule.intervalUnit || 'months'}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button 
                                            onClick={() => { if(!isReadOnly && confirm('Delete this monitoring protocol?')) onDeleteRule(rule.id); }} 
                                            disabled={isReadOnly}
                                            className="p-2.5 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-20"
                                        >
                                            <TrashIcon className="w-5 h-5"/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {(!rules || rules.length === 0) && (
                        <div className="text-center py-32 bg-gray-50 border-t border-gray-100">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                                <SparklesIcon className="w-10 h-10 text-gray-200" />
                            </div>
                            <p className="text-gray-300 font-black uppercase tracking-[0.5em] text-[10px] italic">Registry currently empty</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RulesPage;