import * as React from 'react';
import type { Tree, CoralBranch, Site, Anchor, Tank, R2Settings, RubbleAnchor, PrefixSettings, Page } from '../types';
import { CloseIcon, QrCodeIcon } from './Icons';
import jsQR from 'jsqr';

interface GlobalQuickAccessProps {
    trees: Tree[];
    branches: CoralBranch[];
    sites: Site[];
    anchors: Anchor[];
    tanks: Tank[];
    rubbleAnchors: RubbleAnchor[];
    prefixSettings: PrefixSettings;
    onNavigateToTree: (treeId: string, mode: 'manage' | 'monitor' | 'branches') => void;
    onNavigateToBranch: (branchId: string, mode: 'manage' | 'monitor' | 'details') => void;
    onNavigateToTank: (tankId: string) => void;
    onNavigateToRubbleAnchor: (anchorId: string) => void;
    onApplySettings?: (settings: R2Settings) => void;
    onNavigateToPage: (page: Page, highlightId?: string) => void;
    isReadOnly: boolean;
}

const SearchIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
);

const QRScannerModal: React.FC<{ onClose: () => void; onScan: (code: string) => void }> = ({ onClose, onScan }) => {
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const canvasRef = React.useRef<HTMLCanvasElement>(null);
    const [error, setError] = React.useState('');

    React.useEffect(() => {
        let stream: MediaStream | null = null;
        let animationFrameId: number;

        const startStream = async () => {
            setError('');
            try {
                try {
                    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
                } catch (err) {
                    stream = await navigator.mediaDevices.getUserMedia({ video: true });
                }

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.setAttribute('playsinline', 'true'); 
                    videoRef.current.play();
                    requestAnimationFrame(tick);
                }
            } catch (err: any) {
                console.error("Camera Error:", err);
                setError('No camera access found.');
            }
        };

        const tick = () => {
            if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
                const video = videoRef.current;
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    canvas.height = video.videoHeight;
                    canvas.width = video.videoWidth;
                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                    const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "dontInvert" });
                    if (code) {
                        onScan(code.data);
                        return; 
                    }
                }
            }
            animationFrameId = requestAnimationFrame(tick);
        };

        startStream();

        return () => {
            if (stream) stream.getTracks().forEach(track => track.stop());
            cancelAnimationFrame(animationFrameId);
        };
    }, [onScan]);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-[100] flex flex-col justify-center items-center p-4" onClick={onClose}>
            <div className="w-full max-w-md bg-white rounded-xl overflow-hidden relative shadow-2xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 bg-gray-100 border-b flex justify-between items-center">
                    <h3 className="font-bold text-gray-800">Scan Code</h3>
                    <button onClick={onClose} className="p-2 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors">
                        <CloseIcon className="w-5 h-5 text-gray-600"/>
                    </button>
                </div>
                <div className="relative bg-black flex-grow flex items-center justify-center min-h-[300px]">
                    {!error ? (
                        <>
                            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" muted playsInline></video>
                            <canvas ref={canvasRef} className="hidden"></canvas>
                        </>
                    ) : <p className="text-white text-sm">{error}</p>}
                </div>
                <div className="p-6 bg-white text-center">
                    <p className="text-xs text-gray-500">Scan an Item ID or a Setup QR code to configure this device.</p>
                </div>
            </div>
        </div>
    );
};

const GlobalQuickAccess: React.FC<GlobalQuickAccessProps> = ({ 
    trees, branches, sites, anchors, tanks, rubbleAnchors, prefixSettings, onNavigateToTree, onNavigateToBranch, onNavigateToTank, onNavigateToRubbleAnchor, onApplySettings, onNavigateToPage, isReadOnly
}) => {
    const [input, setInput] = React.useState('');
    const [showSearchInput, setShowSearchInput] = React.useState(false);
    const [isScannerOpen, setIsScannerOpen] = React.useState(false);

    const performSearch = (query: string) => {
        const term = query.trim().toUpperCase();
        if (!term) return;

        // FORM PROTOCOL HANDLER
        if (term.startsWith('ACTION:DIGITIZE_')) {
            const formType = term.replace('ACTION:DIGITIZE_', '');
            if (formType === 'EQUIPMENT') {
                onNavigateToPage('facilityDailyTasks', 'AUTO_OPEN_DIGITIZER');
            } else {
                onNavigateToPage('reports', `AUTO_OPEN_DIGITIZER_${formType}`);
            }
            setInput('');
            setShowSearchInput(false);
            return;
        }

        // Detect setup link
        if (query.includes('#setup=')) {
            try {
                const encodedData = query.split('#setup=')[1];
                const decodedData = JSON.parse(atob(decodeURIComponent(encodedData)));
                if (decodedData && onApplySettings) {
                    if (confirm("New Team Configuration detected! Apply these settings and connect to Cloud Storage?")) {
                        onApplySettings({ ...decodedData, userName: '' });
                        alert("Settings applied! App will now refresh. Please set your identity in Settings.");
                        window.location.reload();
                        return;
                    }
                }
            } catch (e) { console.error("Scanned setup failed", e); }
        }

        // Standard IDs
        const tankMatch = tanks.find(t => t.name.toUpperCase() === term);
        if (tankMatch) { onNavigateToTank(tankMatch.id); setInput(''); setShowSearchInput(false); return; }

        const branchMatch = branches.find(b => b.fragmentId.toUpperCase() === term);
        if (branchMatch) { onNavigateToBranch(branchMatch.id, 'details'); setInput(''); setShowSearchInput(false); return; }

        const raMatch = rubbleAnchors.find(ra => ra.name.toUpperCase() === term);
        if (raMatch) { onNavigateToRubbleAnchor(raMatch.id); setInput(''); setShowSearchInput(false); return; }

        let treeMatch = trees.find(t => {
            const prefix = (t.type === 'Reef2' ? prefixSettings.reef2 : t.type === 'Reef3' ? prefixSettings.reef3 : prefixSettings.tree).toUpperCase();
            return `${prefix}${t.number}` === term || `${prefix} ${t.number}` === term;
        });

        if (treeMatch) { onNavigateToTree(treeMatch.id, 'manage'); setInput(''); setShowSearchInput(false); return; }

        alert(`Item not found: ${term}`);
    };

    return (
        <div className="flex items-center gap-2 relative">
            {showSearchInput ? (
                <form onSubmit={(e) => { e.preventDefault(); performSearch(input); }} className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden h-10 w-48 sm:w-64">
                    <input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Search ID..." className="flex-grow px-3 text-sm text-gray-800 outline-none bg-transparent" autoFocus />
                    <button type="button" onClick={() => setShowSearchInput(false)} className="px-3 text-gray-400 hover:text-gray-600 border-l border-gray-100"><CloseIcon className="w-4 h-4" /></button>
                </form>
            ) : (
                <div className="flex gap-2">
                    <button onClick={() => setShowSearchInput(true)} className="h-10 w-10 bg-white text-coral-blue rounded-xl flex items-center justify-center transition-all shadow-md active:scale-95 hover:bg-gray-50" title="Search ID"><SearchIcon className="w-5 h-5" /></button>
                    <button onClick={() => setIsScannerOpen(true)} className="h-10 w-10 bg-white text-coral-blue rounded-xl transition-all shadow-md flex items-center justify-center flex-shrink-0 active:scale-95 hover:bg-gray-50" title="Scan QR Code"><QrCodeIcon className="w-6 h-6" /></button>
                </div>
            )}
            {isScannerOpen && <QRScannerModal onClose={() => setIsScannerOpen(false)} onScan={(data) => { setIsScannerOpen(false); performSearch(data); }} />}
        </div>
    );
};

export default GlobalQuickAccess;