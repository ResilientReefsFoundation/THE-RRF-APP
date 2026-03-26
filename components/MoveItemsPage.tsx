import * as React from 'react';
import type { FormEvent } from 'react';
import type { Site, Anchor, Tree, CoralBranch } from '../types';

interface MoveItemsPageProps {
    activeSites: Site[];
    activeAnchors: Anchor[];
    activeTrees: Tree[];
    activeBranches: CoralBranch[];
    initialBranchToMove?: CoralBranch;
    onMoveTree: (treeId: string, newAnchorId: string) => void;
    onMoveBranch: (branchId: string, newTreeId: string, newFace: 1 | 2 | 3 | 4, newPosition: number) => void;
    onNavigateBack: () => void;
}

const MoveItemsPage: React.FC<MoveItemsPageProps> = ({
    activeSites,
    activeAnchors,
    activeTrees,
    activeBranches,
    initialBranchToMove,
    onMoveTree,
    onMoveBranch,
    onNavigateBack
}) => {
    // State for Move Tree form
    const [moveTreeId, setMoveTreeId] = React.useState('');
    const [newAnchorId, setNewAnchorId] = React.useState('');

    // State for Move Branch form
    const [moveBranchId, setMoveBranchId] = React.useState(initialBranchToMove?.id || '');
    const [newTreeId, setNewTreeId] = React.useState('');
    const [newFace, setNewFace] = React.useState('');
    const [newPosition, setNewPosition] = React.useState('');

    const selectedNewTree = activeTrees.find(t => t.id === newTreeId);
    const isTargetReef2 = selectedNewTree?.type === 'Reef2';

    // Auto-select if landed from detail page
    React.useEffect(() => {
        if (initialBranchToMove) {
            setMoveBranchId(initialBranchToMove.id);
        }
    }, [initialBranchToMove]);

    const handleMoveTreeSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (!moveTreeId || !newAnchorId) {
            alert('Please select a tree and a new anchor.');
            return;
        }
        onMoveTree(moveTreeId, newAnchorId);
        setMoveTreeId('');
        setNewAnchorId('');
        alert('Tree moved successfully!');
    };
    
    const handleMoveBranchSubmit = (e: FormEvent) => {
        e.preventDefault();
        const faceNum = isTargetReef2 ? 1 : parseInt(newFace, 10);
        const posNum = parseInt(newPosition, 10);

        if (!moveBranchId || !newTreeId) {
            alert('Please select a branch and a new location.');
            return;
        }
        
        if (!isTargetReef2 && (isNaN(faceNum) || faceNum < 1 || faceNum > 4)) {
            alert('Face must be 1-4.');
            return;
        }
        
        if (isNaN(posNum) || posNum < 1 || posNum > 10) {
            alert('Position must be 1-10.');
            return;
        }

        onMoveBranch(moveBranchId, newTreeId, faceNum as 1 | 2 | 3 | 4, posNum);

        setMoveBranchId('');
        setNewTreeId('');
        setNewFace('');
        setNewPosition('');
        alert('Branch moved successfully!');
    };

    const getPrefix = (type?: string) => type === 'Reef2' ? 'R2-' : type === 'Reef3' ? 'R3-' : 'T';

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4">
                <h2 className="text-2xl font-bold text-coral-dark mb-2 sm:mb-0">Movement Hub</h2>
                <button
                    onClick={onNavigateBack}
                    className="bg-gray-200 hover:bg-gray-300 text-coral-dark font-bold py-2 px-4 rounded-lg transition-colors duration-200 self-start sm:self-center"
                >
                    &larr; Back
                </button>
            </div>

            {/* Move Branch Form */}
            <form onSubmit={handleMoveBranchSubmit} className={`p-5 border-2 border-coral-blue rounded-2xl space-y-6 bg-white shadow-sm ${initialBranchToMove ? 'ring-2 ring-coral-green ring-offset-4' : ''}`}>
                <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-bold text-coral-dark text-lg uppercase tracking-tight">Move a Coral Unit</h3>
                    {initialBranchToMove && <span className="text-[10px] font-black uppercase text-green-600 bg-green-50 px-2 py-1 rounded">Target Selected</span>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                        <label htmlFor="branchToMove" className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest ml-1">Coral Unit to Relocate</label>
                        <select id="branchToMove" value={moveBranchId} onChange={e => setMoveBranchId(e.target.value)} required className="w-full p-3 border-2 border-gray-100 rounded-xl bg-gray-50 font-bold text-gray-800 outline-none focus:border-coral-blue shadow-inner">
                            <option value="">-- Select Item --</option>
                            {activeBranches.filter(b => !b.isArchived).sort((a,b) => a.fragmentId.localeCompare(b.fragmentId, undefined, {numeric: true})).map(b => (
                                <option key={b.id} value={b.id}>{b.fragmentId} ({b.genus} {b.species})</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="newTree" className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest ml-1">Destination Structure</label>
                        <select id="newTree" value={newTreeId} onChange={e => { setNewTreeId(e.target.value); setNewFace('1'); }} required className="w-full p-3 border-2 border-gray-100 rounded-xl bg-white font-bold text-gray-800 outline-none focus:border-coral-blue shadow-sm">
                            <option value="">-- Select Destination --</option>
                            {activeTrees.map(t => <option key={t.id} value={t.id}>{getPrefix(t.type)}{t.number} ({activeSites.find(s=>s.id === activeAnchors.find(a=>a.id === t.anchorId)?.siteId)?.name})</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {!isTargetReef2 && (
                             <div>
                                <label htmlFor="newFace" className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest ml-1">New Face (1-4)</label>
                                <input type="number" id="newFace" value={newFace} onChange={e => setNewFace(e.target.value)} required min="1" max="4" className="w-full p-3 border-2 border-gray-100 rounded-xl bg-white font-bold text-gray-800 outline-none focus:border-coral-blue shadow-sm"/>
                            </div>
                        )}
                        <div className={isTargetReef2 ? "col-span-2" : ""}>
                            <label htmlFor="newPosition" className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest ml-1">New Position (1-10)</label>
                            <input type="number" id="newPosition" value={newPosition} onChange={e => setNewPosition(e.target.value)} required min="1" max="10" className="w-full p-3 border-2 border-gray-100 rounded-xl bg-white font-bold text-gray-800 outline-none focus:border-coral-blue shadow-sm"/>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end pt-2">
                    <button type="submit" className="w-full sm:w-auto bg-coral-blue hover:bg-opacity-90 text-white font-black py-4 px-12 rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest text-sm">
                        Relocate Unit
                    </button>
                </div>
            </form>

            {/* Move Tree Form */}
            <form onSubmit={handleMoveTreeSubmit} className="p-5 border-2 border-gray-100 rounded-2xl space-y-6 bg-gray-50/50 shadow-sm">
                <h3 className="font-bold text-coral-dark text-lg border-b pb-2 uppercase tracking-tight">Move Entire Structure</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                    <div>
                        <label htmlFor="treeToMove" className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest ml-1">Structure to Move</label>
                        <select id="treeToMove" value={moveTreeId} onChange={e => setMoveTreeId(e.target.value)} required className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white font-bold text-gray-800 outline-none focus:border-coral-blue">
                            <option value="">-- Select Tree/Reef --</option>
                            {activeTrees.sort((a,b) => a.number - b.number).map(t => <option key={t.id} value={t.id}>{getPrefix(t.type)}{t.number}</option>)}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="newAnchor" className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-widest ml-1">New Anchor Point</label>
                        <select id="newAnchor" value={newAnchorId} onChange={e => setNewAnchorId(e.target.value)} required className="w-full p-3 border-2 border-gray-200 rounded-xl bg-white font-bold text-gray-800 outline-none focus:border-coral-blue">
                            <option value="">-- Select New Anchor --</option>
                            {activeAnchors.map(a => <option key={a.id} value={a.id}>{a.name} ({activeSites.find(s=>s.id === a.siteId)?.name})</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2 flex justify-end">
                        <button type="submit" className="w-full sm:w-auto bg-coral-dark hover:bg-black text-white font-black py-4 px-12 rounded-2xl shadow-lg transition-all active:scale-95 uppercase tracking-widest text-sm">
                            Move Structure
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default MoveItemsPage;