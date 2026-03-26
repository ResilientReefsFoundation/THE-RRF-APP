import * as React from 'react';
import type { ChangeEvent } from 'react';
import type { RecordFile, DigitizedRecordData, DigitizedRecordType, FormItem, CoralBranch, ActivityLogItem, Tree, RubbleAnchor, Species } from '../types';
import { ChartBarIcon, CalendarDaysIcon, UploadIcon, ArrowDownIcon, BookOpenIcon, CameraIcon, SparklesIcon, ClipboardListIcon, CheckCircleIcon, ArrowPathIcon } from './Icons';
import { GoogleGenAI, Type } from "@google/genai";
import QRCode from 'qrcode';
import heic2any from 'heic2any';

interface ReportsPageProps {
  onNavigateBack: () => void;
  coralBranches: CoralBranch[];
  activityLog: ActivityLogItem[];
  records: RecordFile[];
  onAddRecord: (record: RecordFile) => void;
  onUpdateRecord: (record: RecordFile) => void;
  forms: FormItem[];
  onAddForm: (form: FormItem) => void;
  uploadMedia?: (file: File | Blob, prefix: string) => Promise<string>;
  trees: Tree[];
  rubbleAnchors: RubbleAnchor[];
  speciesList: Species[];
  initialSignal?: string;
}

interface ReportStats { 
  newBranches: number; 
  newTrees: number; 
  newCollectionZones: number; 
  extraFloatsAdded: number; 
  healthChecksDone: number; 
  growthChecksDone: number; 
  newSpeciesAdded: number; 
  newGenusAdded: number; 
  branchesRemovedAndReplaced: number; 
}

interface CustomReportItem { id: string; label: string; value: string; isIncluded: boolean; }

const PERIOD_OPTIONS = [
  { title: "Last Month", days: 30 },
  { title: "Last 2 Months", days: 60 },
  { title: "Last 3 Months", days: 90 },
  { title: "Last 4 Months", days: 120 },
  { title: "Last 6 Months", days: 180 }
];

// --- Perspective Crop Helpers ---
interface Point { x: number; y: number; }
function getPerspectiveTransform(src: Point[], dst: Point[]) {
    const a: number[][] = []; const b: number[] = [];
    for (let i = 0; i < 4; ++i) {
        a.push([src[i].x, src[i].y, 1, 0, 0, 0, -src[i].x * dst[i].x, -src[i].y * dst[i].x]);
        a.push([0, 0, 0, src[i].x, src[i].y, 1, -src[i].x * dst[i].y, -src[i].y * dst[i].y]);
        b.push(dst[i].x); b.push(dst[i].y);
    }
    const x = solveLinearSystem(a, b);
    return [x[0], x[1], x[2], x[3], x[4], x[5], x[6], x[7], 1];
}
function solveLinearSystem(A: number[][], B: number[]) {
    const n = A.length;
    for (let i = 0; i < n; i++) {
        let maxRow = i;
        for (let k = i + 1; k < n; k++) if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) maxRow = k;
        [A[i], A[maxRow]] = [A[maxRow], A[i]]; [B[i], B[maxRow]] = [B[maxRow], B[i]];
        for (let k = i + 1; k < n; k++) {
            const factor = A[k][i] / A[i][i];
            for (let j = i; j < n; j++) A[k][j] -= factor * A[i][j];
            B[k] -= factor * B[i];
        }
    }
    const X = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) { let sum = 0; for (let j = i + 1; j < n; j++) sum += A[i][j] * X[j]; X[i] = (B[i] - sum) / A[i][i]; }
    return X;
}

const ImageCropper: React.FC<{ src: string; onConfirm: (croppedBlob: Blob) => void; onCancel: () => void }> = ({ src, onConfirm, onCancel }) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const imgRef = React.useRef<HTMLImageElement>(null);
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [displaySrc, setDisplaySrc] = React.useState(src);
    const [corners, setCorners] = React.useState<Point[]>([{ x: 15, y: 15 }, { x: 85, y: 15 }, { x: 85, y: 85 }, { x: 15, y: 85 }]);
    const [activeCornerIndex, setActiveCornerIndex] = React.useState<number | null>(null);

    const handlePointerDown = (e: any, index: number) => { e.preventDefault(); e.stopPropagation(); setActiveCornerIndex(index); };
    React.useEffect(() => {
        const handleMove = (e: MouseEvent | TouchEvent) => {
            if (activeCornerIndex === null || !containerRef.current) return; e.preventDefault();
            let clientX, clientY;
            if ('touches' in e) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
            else { clientX = (e as MouseEvent).clientX; clientY = (e as MouseEvent).clientY; }
            const rect = containerRef.current.getBoundingClientRect();
            const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
            const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
            setCorners(prev => { const n = [...prev]; n[activeCornerIndex] = { x, y }; return n; });
        };
        const handleUp = () => setActiveCornerIndex(null);
        if (activeCornerIndex !== null) {
            window.addEventListener('mousemove', handleMove, { passive: false }); window.addEventListener('mouseup', handleUp);
            window.addEventListener('touchmove', handleMove, { passive: false }); window.addEventListener('touchend', handleUp);
        }
        return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); window.removeEventListener('touchmove', handleMove); window.removeEventListener('touchend', handleUp); };
    }, [activeCornerIndex]);

    const handleRotate = () => {
        setIsProcessing(true); const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas'); canvas.width = img.height; canvas.height = img.width;
            const ctx = canvas.getContext('2d');
            if (ctx) { ctx.translate(canvas.width / 2, canvas.height / 2); ctx.rotate(90 * Math.PI / 180); ctx.drawImage(img, -img.width / 2, -img.height / 2); setDisplaySrc(canvas.toDataURL('image/jpeg', 0.95)); }
            setIsProcessing(false);
        };
        img.src = displaySrc;
    };

    const performWarp = async () => {
        if (!imgRef.current) return; setIsProcessing(true); await new Promise(r => setTimeout(r, 50));
        const img = imgRef.current; const width = img.naturalWidth; const height = img.naturalHeight;
        const srcPoints = corners.map(c => ({ x: (c.x / 100) * width, y: (c.y / 100) * height }));
        const tw = Math.sqrt(Math.pow(srcPoints[1].x - srcPoints[0].x, 2) + Math.pow(srcPoints[1].y - srcPoints[0].y, 2));
        const bw = Math.sqrt(Math.pow(srcPoints[2].x - srcPoints[3].x, 2) + Math.pow(srcPoints[2].y - srcPoints[3].y, 2));
        const lh = Math.sqrt(Math.pow(srcPoints[3].x - srcPoints[0].x, 2) + Math.pow(srcPoints[3].y - srcPoints[0].y, 2));
        const rh = Math.sqrt(Math.pow(srcPoints[2].x - srcPoints[1].x, 2) + Math.pow(srcPoints[2].y - srcPoints[1].y, 2));
        let dw = Math.max(tw, bw); let dh = Math.max(lh, rh);
        const MAX_DIM = 2048; if (dw > MAX_DIM || dh > MAX_DIM) { const r = Math.min(MAX_DIM / dw, MAX_DIM / dh); dw *= r; dh *= r; }
        dw = Math.round(dw); dh = Math.round(dh);
        const dstPoints = [{ x: 0, y: 0 }, { x: dw, y: 0 }, { x: dw, y: dh }, { x: 0, y: dh }];
        const H = getPerspectiveTransform(dstPoints, srcPoints);
        const canvas = document.createElement('canvas'); canvas.width = dw; canvas.height = dh;
        const ctx = canvas.getContext('2d'); if (!ctx) return;
        const srcCanvas = document.createElement('canvas'); srcCanvas.width = width; srcCanvas.height = height;
        const srcCtx = srcCanvas.getContext('2d'); if (!srcCtx) return;
        srcCtx.drawImage(img, 0, 0); const srcData = srcCtx.getImageData(0, 0, width, height); const dstData = ctx.createImageData(dw, dh);
        const srcPixels = srcData.data; const dstPixels = dstData.data;
        for (let y = 0; y < dh; y++) {
            for (let x = 0; x < dw; x++) {
                const denom = H[6] * x + H[7] * y + 1;
                const srcX = (H[0] * x + H[1] * y + H[2]) / denom; const srcY = (H[3] * x + H[4] * y + H[5]) / denom;
                if (srcX >= 0 && srcX < width - 1 && srcY >= 0 && srcY < height - 1) {
                    const x0 = Math.floor(srcX); const y0 = Math.floor(srcY); const dx = srcX - x0; const dy = srcY - y0;
                    const i00 = (y0 * width + x0) * 4; const i10 = (y0 * width + (x0 + 1)) * 4;
                    const i01 = ((y0 + 1) * width + x0) * 4; const i11 = ((y0 + 1) * width + (x0 + 1)) * 4;
                    const dstIdx = (y * dw + x) * 4;
                    for (let k = 0; k < 4; k++) dstPixels[dstIdx + k] = srcPixels[i00 + k] * (1 - dx) * (1 - dy) + srcPixels[i10 + k] * dx * (1 - dy) + srcPixels[i01 + k] * (1 - dx) * dy + srcPixels[i11 + k] * dx * dy;
                }
            }
        }
        ctx.putImageData(dstData, 0, 0);
        canvas.toBlob((blob) => { if (blob) onConfirm(blob); setIsProcessing(false); }, 'image/jpeg', 0.95);
    };

    const p = corners.map(c => `${c.x},${c.y}`).join(' ');
    const maskPath = `M 0,0 L 100,0 L 100,100 L 0,100 Z M ${p} Z`;

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col h-full w-full touch-none">
            <div className="flex justify-between items-center p-4 bg-gray-900 text-white shrink-0 z-10 border-b border-gray-800">
                <button onClick={onCancel} className="text-gray-300 px-3 py-1 hover:text-white">Cancel</button>
                <div className="flex items-center gap-4"><h3 className="font-bold text-lg hidden sm:block">Adjust Corners</h3><button onClick={handleRotate} disabled={isProcessing} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"><ArrowPathIcon className="w-5 h-5 text-white" /></button></div>
                <button onClick={performWarp} disabled={isProcessing} className={`text-coral-blue font-bold px-3 py-1 hover:text-blue-400 ${isProcessing ? 'opacity-50' : ''}`}>{isProcessing ? 'Warping...' : 'Done'}</button>
            </div>
            <div className="flex-grow relative flex items-center justify-center bg-black overflow-hidden p-4">
                <div ref={containerRef} className="relative inline-block max-w-full max-h-full">
                    <img ref={imgRef} src={displaySrc} alt="Crop target" className="max-w-full max-h-[80vh] object-contain block pointer-events-none select-none"/>
                    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none"><path d={maskPath} fill="rgba(0,0,0,0.6)" fillRule="evenodd" /><polygon points={p} fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="1,1" /></svg>
                    {corners.map((corner, i) => (<div key={i} className="absolute w-8 h-8 -ml-4 -mt-4 z-20 flex items-center justify-center cursor-move" style={{ left: `${corner.x}%`, top: `${corner.y}%`, touchAction: 'none' }} onMouseDown={(e) => handlePointerDown(e, i)} onTouchStart={(e) => handlePointerDown(e, i)}><div className="w-4 h-4 bg-white rounded-full border-2 border-coral-blue shadow-md"></div></div>))}
                </div>
            </div>
        </div>
    );
};

const FormHeaderQRCode: React.FC<{ text: string }> = ({ text }) => {
    const [src, setSrc] = React.useState('');
    React.useEffect(() => { QRCode.toDataURL(text, { margin: 0, width: 80 }).then(setSrc).catch(err => console.error(err)); }, [text]);
    if (!src) return <div className="w-20 h-20 bg-gray-100 animate-pulse"></div>;
    return <img src={src} alt="Form QR" className="w-20 h-20" />;
}

const BlankHealthForm: React.FC = () => (
    <div className="bg-white p-5 w-full h-full max-h-screen text-black font-sans box-border relative flex flex-col">
        <div className="absolute top-4 right-4"><FormHeaderQRCode text="ACTION:DIGITIZE_HEALTH" /></div>
        <div className="text-center border-b-2 border-black pb-2 mb-4 pt-2"><h1 className="text-2xl font-bold uppercase text-black">Detailed Health Report</h1><p className="text-xs text-gray-900 mt-1">Coral Nursery Monitoring Program</p></div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-4 text-sm"><div className="border-b border-black pb-1 flex justify-between"><span className="font-bold uppercase mr-2 text-black">Date:</span><span className="flex-grow"></span></div><div className="border-b border-black pb-1 flex justify-between"><span className="font-bold uppercase mr-2 text-black">Surveyor:</span><span className="flex-grow"></span></div><div className="border-b border-black pb-1 flex justify-between"><span className="font-bold uppercase mr-2 text-black">Site Name:</span><span className="flex-grow"></span></div><div className="border-b border-black pb-1 flex justify-between"><span className="font-bold uppercase mr-2 text-black">Branch/Tree ID:</span><span className="flex-grow"></span></div></div>
        <div className="mb-4 p-3 border border-black rounded-lg"><h3 className="font-bold text-base mb-3 uppercase text-black">1. Overall Health Score (Circle One)</h3><div className="flex justify-between items-center px-4">{[0, 25, 50, 75, 100].map(score => (<div key={score} className="flex flex-col items-center gap-1"><div className="w-10 h-10 rounded-full border-2 border-black flex items-center justify-center text-base font-bold text-black">{score}</div><span className="text-[10px] uppercase font-bold text-black">{score}%</span></div>))}</div></div>
        <div className="mb-4 p-3 border border-black rounded-lg"><h3 className="font-bold text-base mb-3 uppercase text-black">2. Bleaching Level (Circle One)</h3><div className="flex justify-between items-center px-2">{['None', 'Mild', 'Medium', 'Strong'].map(level => (<div key={level} className="flex flex-col items-center gap-1"><div className="w-24 h-10 border-2 border-black flex items-center justify-center font-bold rounded-full text-black text-sm">{level}</div></div>))}</div></div>
        <div className="grid grid-cols-2 gap-4 mb-4 flex-grow"><div className="p-3 border border-black rounded-lg flex flex-col"><h3 className="font-bold text-base mb-3 uppercase text-black">3. Diseases (CIRCLE ALL)</h3><div className="space-y-4 flex-grow">{['White Syndrome', 'Black Band', 'Brown Band', 'Skeletal Eroding Band'].map(item => (<div key={item} className="flex items-center"><span className="text-base font-medium text-black px-2 py-0.5">{item}</span></div>))}</div></div><div className="p-3 border border-black rounded-lg flex flex-col"><h3 className="font-bold text-base mb-3 uppercase text-black">4. Predators (CIRCLE ALL)</h3><div className="space-y-4 flex-grow">{['Crown of Thorns', 'Drupella Snails', 'Parrotfish Bites', 'Unknown Scars'].map(item => (<div key={item} className="flex items-center"><span className="text-base font-medium text-black px-2 py-0.5">{item}</span></div>))}</div></div></div>
        <div className="p-3 border border-black rounded-lg min-h-[120px]"><h3 className="font-bold text-base mb-2 uppercase text-black">5. Notes & Observations</h3><div className="space-y-6 mt-4"><div className="border-b border-black border-dashed"></div><div className="border-b border-black border-dashed"></div><div className="border-b border-black border-dashed"></div></div></div>
    </div>
);
const BlankTreeMaintenanceForm: React.FC = () => (
    <div className="bg-white p-5 w-full h-full max-h-screen text-black font-sans box-border relative flex flex-col">
        <div className="absolute top-4 right-4"><FormHeaderQRCode text="ACTION:DIGITIZE_MAINTENANCE" /></div>
        <div className="text-center border-b-2 border-black pb-2 mb-4 pt-2"><h1 className="text-2xl font-bold uppercase text-black">Tree Maintenance Log</h1><p className="text-xs text-gray-900 mt-1">Structure Cleaning & Repairs</p></div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-4 text-sm"><div className="border-b border-black pb-1 flex justify-between"><span className="font-bold uppercase mr-2 text-black">Date:</span><span className="flex-grow"></span></div><div className="border-b border-black pb-1 flex justify-between"><span className="font-bold uppercase mr-2 text-black">Surveyor:</span><span className="flex-grow"></span></div><div className="border-b border-black pb-1 flex justify-between"><span className="font-bold uppercase mr-2 text-black">Site Name:</span><span className="flex-grow"></span></div><div className="border-b border-black pb-1 flex justify-between"><span className="font-bold uppercase mr-2 text-black">Tree ID:</span><span className="flex-grow"></span></div></div>
        <div className="mb-4 p-4 border border-black rounded-lg"><h3 className="font-bold text-base mb-4 uppercase text-black">1. Cleaning (Circle Y/N)</h3><div className="space-y-4"><div className="flex justify-between items-center border-b border-gray-300 pb-2"><span className="text-base font-medium">Structure Cleaned?</span><div className="flex gap-4"><div className="w-10 h-10 rounded-full border-2 border-black flex items-center justify-center font-bold">Y</div><div className="w-10 h-10 rounded-full border-2 border-black flex items-center justify-center font-bold">N</div></div></div><div className="flex justify-between items-center border-b border-gray-300 pb-2"><span className="text-base font-medium">Floats Scrubbed?</span><div className="flex gap-4"><div className="w-10 h-10 rounded-full border-2 border-black flex items-center justify-center font-bold">Y</div><div className="w-10 h-10 rounded-full border-2 border-black flex items-center justify-center font-bold">N</div></div></div></div></div>
        <div className="mb-4 p-4 border border-black rounded-lg flex-grow"><h3 className="font-bold text-base mb-4 uppercase text-black">2. Repairs & Status</h3><div className="grid grid-cols-1 gap-6"><div><h4 className="font-bold mb-2 text-sm uppercase">Rope/Tether Condition (Circle One)</h4><div className="flex justify-between items-center px-4">{['Good', 'Fair', 'Poor'].map(level => (<div key={level} className="w-24 h-10 border-2 border-black flex items-center justify-center font-bold rounded-full text-black text-sm">{level}</div>))}</div></div><div><h4 className="font-bold mb-2 text-sm uppercase">Broken Branches Replaced?</h4><div className="flex items-center gap-4 mt-2"><span className="text-base">Count:</span><div className="border-b border-black w-32 h-8"></div></div></div></div></div>
        <div className="p-4 border border-black rounded-lg min-h-[150px]"><h3 className="font-bold text-base mb-2 uppercase text-black">3. Notes & Observations</h3><div className="space-y-6 mt-4"><div className="border-b border-black border-dashed"></div><div className="border-b border-black border-dashed"></div><div className="border-b border-black border-dashed"></div></div></div>
    </div>
);
const BlankBulkHealthForm: React.FC = () => (
    <div className="bg-white p-5 w-full h-full max-h-screen text-black font-sans box-border relative flex flex-col">
        <div className="absolute top-4 right-4"><FormHeaderQRCode text="ACTION:DIGITIZE_BULK_HEALTH" /></div>
        <div className="text-center border-b-2 border-black pb-2 mb-4 pt-2"><h1 className="text-2xl font-bold uppercase text-black">Bulk Health Assessment</h1><p className="text-xs text-gray-900 mt-1">Rapid Monitoring Log</p></div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-4 mb-4 text-sm"><div className="border-b border-black pb-1 flex justify-between"><span className="font-bold uppercase mr-2 text-black">Date:</span><span className="flex-grow"></span></div><div className="border-b border-black pb-1 flex justify-between"><span className="font-bold uppercase mr-2 text-black">Surveyor:</span><span className="flex-grow"></span></div><div className="border-b border-black pb-1 flex justify-between"><span className="font-bold uppercase mr-2 text-black">Site Name:</span><span className="flex-grow"></span></div><div className="border-b border-black pb-1 flex justify-between"><span className="font-bold uppercase mr-2 text-black">Structure ID:</span><span className="flex-grow"></span></div></div>
        <div className="flex-grow"><table className="w-full border-collapse border border-black text-xs"><thead><tr className="bg-gray-100"><th className="border border-black p-2 w-20">Tag / ID</th><th className="border border-black p-2 w-16">Health %</th><th className="border border-black p-2 w-20">Bleaching</th><th className="border border-black p-2 w-16">Disease</th><th className="border border-black p-2 w-16">Predator</th><th className="border border-black p-2">Notes</th></tr></thead><tbody>{Array.from({ length: 18 }).map((_, i) => (<tr key={i} className="h-8"><td className="border border-black p-1"></td><td className="border border-black p-1"></td><td className="border border-black p-1"></td><td className="border border-black p-1 text-center text-[8px] text-gray-400">Y / N</td><td className="border border-black p-1 text-center text-[8px] text-gray-400">Y / N</td><td className="border border-black p-1"></td></tr>))}</tbody></table></div>
        <div className="mt-2 text-[10px] text-gray-600">* Health: 0, 25, 50, 75, 100% | Bleaching: None, Mild, Med, Strong</div>
    </div>
);

// ... Reusable components ...
const ReportContent: React.FC<{ title: string; items: CustomReportItem[]; notes?: string; }> = ({ title, items, notes }) => (
    <div className="bg-white p-8 w-full border-2 border-gray-200 print:border-none">
        <div className="text-center border-b-2 border-coral-blue pb-6 mb-6 print:pb-2 print:mb-4"><h1 className="text-3xl font-bold text-coral-dark print:text-2xl">Coral Nursery Report</h1><p className="text-gray-500 mt-2 print:text-sm">Period: {title}</p><p className="text-sm text-gray-400 mt-1 print:text-xs">Generated on {new Date().toLocaleDateString()}</p></div>
        <div className="grid grid-cols-1 gap-6 print:gap-3">{items.filter(i => i.isIncluded).map(item => (<div key={item.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100 print:bg-white print:border-b print:border-gray-200 print:rounded-none print:p-2 print:border-t-0 print:border-x-0"><span className="text-lg font-medium text-gray-700 print:text-base">{item.label}</span><span className="text-2xl font-bold text-coral-blue print:text-lg">{item.value}</span></div>))}</div>
        <div className="mt-12 pt-6 border-t border-gray-200 print:mt-6 print:pt-4"><h4 className="font-bold text-gray-800 mb-2 print:text-sm">Summary Notes</h4><div className="hidden print:block h-32 border border-gray-300 rounded p-4 print:h-24"></div><div className="print:hidden text-gray-500 italic">{notes || "Add optional summary notes here before printing..."}</div></div>
        <div className="mt-8 text-center text-xs text-gray-400 print:fixed print:bottom-4 print:left-0 print:w-full">Coral Nursery Manager - Internal Report</div>
    </div>
);
const ScaledPreview: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [scale, setScale] = React.useState(1);
    React.useEffect(() => {
        const calculateScale = () => {
            if (containerRef.current) {
                const parent = containerRef.current.parentElement;
                if (parent) { const availableWidth = parent.clientWidth - 32; const contentWidth = 794; setScale(Math.min(1, availableWidth / contentWidth)); }
            }
        };
        calculateScale(); window.addEventListener('resize', calculateScale);
        const timer = setTimeout(calculateScale, 100);
        return () => { window.removeEventListener('resize', calculateScale); clearTimeout(timer); };
    }, []);
    return (<div ref={containerRef} className="origin-top transition-transform duration-200 ease-out bg-white shadow-lg" style={{ transform: `scale(${scale})`, width: '794px', minHeight: '1123px' }}>{children}</div>);
};

const ReportsPage: React.FC<ReportsPageProps> = ({ onNavigateBack, coralBranches, activityLog, records, onAddRecord, onUpdateRecord, forms, onAddForm, uploadMedia, trees, rubbleAnchors, speciesList, initialSignal }) => {
    const [activeTab, setActiveTab] = React.useState<'reports' | 'forms' | 'records'>('reports');
    const [selectedPeriod, setSelectedPeriod] = React.useState<number>(0);
    const [isCustomDate, setIsCustomDate] = React.useState(false);
    const [customStart, setCustomStart] = React.useState('');
    const [customEnd, setCustomEnd] = React.useState('');
    const [isCustomizing, setIsCustomizing] = React.useState(false);
    const [reportItems, setReportItems] = React.useState<CustomReportItem[]>([
        { id: 'newBranches', label: 'New Branches Planted', value: '0', isIncluded: true },
        { id: 'newTrees', label: 'New Trees Installed', value: '0', isIncluded: true },
        { id: 'newCollectionZones', label: 'New Zones Established', value: '0', isIncluded: true },
        { id: 'extraFloatsAdded', label: 'Extra Floats Added', value: '0', isIncluded: true },
        { id: 'healthChecksDone', label: 'Health Checks Completed', value: '0', isIncluded: true },
        { id: 'growthChecksDone', label: 'Growth Measurements', value: '0', isIncluded: true },
        { id: 'newSpeciesAdded', label: 'New Species Added', value: '0', isIncluded: true },
        { id: 'newGenusAdded', label: 'New Genera Added', value: '0', isIncluded: true },
        { id: 'branchesRemovedAndReplaced', label: 'Branches Replaced', value: '0', isIncluded: true },
    ]);
    const [selectedFormId, setSelectedFormId] = React.useState<string | null>(null);
    const [selectedRecordId, setSelectedRecordId] = React.useState<string | null>(null);
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [viewMode, setViewMode] = React.useState<'record' | 'template'>('record');
    const [selectedTemplate, setSelectedTemplate] = React.useState<string | null>(null);
    const digitizedResultRef = React.useRef<HTMLDivElement>(null);
    const previewContainerRef = React.useRef<HTMLDivElement>(null);
    const [editData, setEditData] = React.useState<DigitizedRecordData | null>(null);
    const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved'>('idle');
    const [isConverting, setIsConverting] = React.useState(false);
    const [croppingImgSrc, setCroppingImgSrc] = React.useState<string | null>(null);

    // AUTO-OPEN LOGIC FOR QR SCAN SIGNALS
    React.useEffect(() => {
        if (initialSignal?.startsWith('AUTO_OPEN_DIGITIZER_')) {
            setActiveTab('records');
            setViewMode('record');
            // Programmatically trigger file input click to start OCR process
            const fileInput = document.getElementById('ocr-camera-trigger');
            if (fileInput) fileInput.click();
        }
    }, [initialSignal]);

    const selectedForm = forms.find(f => f.id === selectedFormId);
    const selectedRecord = records.find(r => r.id === selectedRecordId);
    const digitizedReports = React.useMemo(() => records.filter(r => r.digitizedData?.recordType === 'health' || (!r.digitizedData?.recordType && r.digitizedData?.healthReport)), [records]);
    const digitizedTreeReports = React.useMemo(() => records.filter(r => r.digitizedData?.recordType === 'maintenance'), [records]);
    const pendingRecords = React.useMemo(() => records.filter(r => !r.digitizedData || (!r.digitizedData.healthReport && !r.digitizedData.treeMaintenanceReport)), [records]);

    const calculateStatsForPeriod = (start: Date, end: Date): ReportStats => {
        const checkRange = (dateStr: string) => {
            const d = new Date(dateStr);
            return d >= start && d <= end;
        };

        const newBranches = coralBranches.filter(b => checkRange(b.dateAdded)).length;
        const newTrees = (trees || []).filter(t => checkRange(t.dateAdded)).length;
        
        let healthChecks = 0;
        let growthChecks = 0;
        coralBranches.forEach(b => {
            healthChecks += (b.healthReports || []).filter(r => checkRange(r.date)).length;
            growthChecks += (b.growthReports || []).filter(r => checkRange(r.date)).length;
        });
        (rubbleAnchors || []).forEach(ra => {
            healthChecks += (ra.healthReports || []).filter(r => checkRange(r.date)).length;
            growthChecks += (ra.growthReports || []).filter(r => checkRange(r.date)).length;
        });

        const newSpecies = (speciesList || []).filter(s => {
            return coralBranches.some(b => b.genus === s.genus && b.species === s.species && checkRange(b.dateAdded));
        }).length;
        
        const uniqueGeneraAdded = new Set(
            coralBranches
                .filter(b => checkRange(b.dateAdded))
                .map(b => b.genus)
        ).size;

        const archivedCount = activityLog.filter(l => l.type === 'archive' && checkRange(l.timestamp)).length;

        return {
            newBranches, newTrees, newCollectionZones: 0, extraFloatsAdded: 0,
            healthChecksDone: healthChecks, growthChecksDone: growthChecks,
            newSpeciesAdded: newSpecies, newGenusAdded: uniqueGeneraAdded,
            branchesRemovedAndReplaced: archivedCount
        };
    };

    React.useEffect(() => {
        let start: Date;
        let end = new Date();
        
        if (isCustomDate) {
            if (customStart && customEnd) {
                start = new Date(customStart);
                end = new Date(customEnd);
                end.setHours(23, 59, 59, 999);
            } else return;
        } else {
            start = new Date();
            start.setDate(start.getDate() - PERIOD_OPTIONS[selectedPeriod].days);
        }

        const stats = calculateStatsForPeriod(start, end);
        setReportItems(prev => prev.map(i => ({ 
            ...i, 
            value: (stats[i.id as keyof ReportStats] ?? 0).toString() 
        })));
    }, [selectedPeriod, isCustomDate, customStart, customEnd, coralBranches, trees, rubbleAnchors, activityLog, speciesList]);

    React.useEffect(() => { if (selectedRecord?.digitizedData) setEditData(selectedRecord.digitizedData); else setEditData(null); setSaveStatus('idle'); }, [selectedRecord]);

    const handleFormUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && uploadMedia) {
            const file = e.target.files[0];
            setIsProcessing(true);
            try {
                const url = await uploadMedia(file, 'standard_forms');
                onAddForm({ id: Math.random().toString(), name: file.name, dateUploaded: new Date().toISOString().split('T')[0], url });
                setSelectedFormId(null);
            } catch (err) { alert("Failed to upload form."); }
            finally { setIsProcessing(false); }
        }
    };

    const handleRecordUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            let file = e.target.files[0];
            if (file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic') {
                setIsConverting(true);
                try {
                    const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 });
                    const blob = Array.isArray(result) ? result[0] : result;
                    file = new File([blob], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' });
                } catch (err) { alert("Could not convert HEIC."); setIsConverting(false); return; }
                setIsConverting(false);
            }
            const reader = new FileReader(); reader.onload = (ev) => { if (ev.target?.result) setCroppingImgSrc(ev.target.result as string); }; reader.readAsDataURL(file);
        }
        e.target.value = '';
    }
    
    const onCropConfirm = async (croppedBlob: Blob) => {
        if (!uploadMedia) return;
        setCroppingImgSrc(null);
        setIsProcessing(true);
        try {
            const url = await uploadMedia(croppedBlob, 'ocr_records');
            const newId = Math.random().toString();
            onAddRecord({ id: newId, name: `Record - ${new Date().toLocaleString()}`, dateUploaded: new Date().toISOString().split('T')[0], url });
            setSelectedRecordId(newId);
        } catch (err) { alert("Cloud upload failed."); }
        finally { setIsProcessing(false); }
    };

    const handleExtractData = async () => {
        if (!selectedRecord || !process.env.API_KEY) return;
        setIsProcessing(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: {
                    parts: [
                        { inlineData: { mimeType: 'image/jpeg', data: (await (await fetch(selectedRecord.url)).blob().then(b => new Promise<string>((res) => { const r = new FileReader(); r.onloadend = () => res((r.result as string).split(',')[1]); r.readAsDataURL(b); }))) } },
                        { text: `Extract: recordType ('health'|'maintenance'), Date, Site, Surveyor, ID, notes, and specific report fields.` }
                    ]
                },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: { type: Type.OBJECT, properties: { recordType: { type: Type.STRING }, date: { type: Type.STRING }, site: { type: Type.STRING }, surveyor: { type: Type.STRING }, branchId: { type: Type.STRING }, notes: { type: Type.STRING }, healthReport: { type: Type.OBJECT, properties: { healthScore: { type: Type.NUMBER }, bleaching: { type: Type.STRING }, diseases: { type: Type.ARRAY, items: { type: Type.STRING } }, predators: { type: Type.ARRAY, items: { type: Type.STRING } } } }, treeMaintenanceReport: { type: Type.OBJECT, properties: { cleaned: { type: Type.BOOLEAN }, floatsScrubbed: { type: Type.BOOLEAN }, ropeCondition: { type: Type.STRING }, brokenBranchesReplaced: { type: Type.NUMBER } } } } }
                }
            });
            onUpdateRecord({ ...selectedRecord, digitizedData: JSON.parse(response.text) });
        } catch (error) { alert("AI Extraction Failed."); } finally { setIsProcessing(false); }
    };

    const handlePrint = () => window.print();
    const handleEditChange = (field: keyof DigitizedRecordData, value: any) => { if (editData) setEditData({ ...editData, [field]: value }); };
    const handleRecordTypeChange = (type: DigitizedRecordType) => { if (!editData) return; const n = { ...editData, recordType: type }; if (type === 'health' && !n.healthReport) n.healthReport = { healthScore: 100, bleaching: 'None', diseases: [], predators: [] }; if (type === 'maintenance' && !n.treeMaintenanceReport) n.treeMaintenanceReport = { cleaned: false, floatsScrubbed: false, ropeCondition: 'Good', brokenBranchesReplaced: 0 }; setEditData(n); };
    const handleSaveChanges = () => { if (selectedRecord && editData) { setSaveStatus('saving'); setTimeout(() => { onUpdateRecord({ ...selectedRecord, digitizedData: editData }); setSaveStatus('saved'); setTimeout(() => setSaveStatus('idle'), 2000); }, 600); } };
    const handleDownloadForm = (form: FormItem) => { if (!form.url) return; const l = document.createElement('a'); l.href = form.url; l.download = form.name; document.body.appendChild(l); l.click(); document.body.removeChild(l); };
    const reportTitle = isCustomDate ? (customStart && customEnd ? `${new Date(customStart).toLocaleDateString()} - ${new Date(customEnd).toLocaleDateString()}` : 'Custom Range') : PERIOD_OPTIONS[selectedPeriod].title;

    return (
        <>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4 print:hidden"><h2 className="text-2xl font-bold text-coral-dark mb-2 sm:mb-0">Reports & Forms</h2><button onClick={onNavigateBack} className="bg-gray-200 hover:bg-gray-300 text-coral-dark font-bold py-2 px-4 rounded-lg transition-colors duration-200 self-start sm:self-center">&larr; Back</button></div>
            <div className="flex border-b print:hidden overflow-x-auto"><button className={`flex-1 py-3 px-4 text-center font-medium whitespace-nowrap ${activeTab === 'reports' ? 'text-coral-blue border-b-2 border-coral-blue' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('reports')}>Reports Generator</button><button className={`flex-1 py-3 px-4 text-center font-medium whitespace-nowrap ${activeTab === 'forms' ? 'text-coral-blue border-b-2 border-coral-blue' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('forms')}>Forms</button><button className={`flex-1 py-3 px-4 text-center font-medium whitespace-nowrap ${activeTab === 'records' ? 'text-coral-blue border-b-2 border-coral-blue' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('records')}>Records</button></div>

            {activeTab === 'reports' && (<div className="block"><div className="flex flex-col md:flex-row gap-6"><div className="w-full md:w-1/3 space-y-6 print:hidden"><div className="p-4 border-2 border-coral-blue rounded-lg bg-gray-50"><h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><CalendarDaysIcon className="w-5 h-5 text-coral-blue"/>Select Time Period</h3><div className="space-y-2">{PERIOD_OPTIONS.map((d, i) => (<button key={i} onClick={() => { setSelectedPeriod(i); setIsCustomDate(false); }} className={`w-full text-left px-4 py-2 rounded-md transition-colors ${!isCustomDate && selectedPeriod === i ? 'bg-coral-blue text-white font-bold' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>{d.title}</button>))}<button onClick={() => setIsCustomDate(true)} className={`w-full text-left px-4 py-2 rounded-md transition-colors ${isCustomDate ? 'bg-coral-blue text-white font-bold' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>Custom Date Range</button>{isCustomDate && (<div className="pt-2 pl-2 pr-2 pb-2 space-y-3 bg-white rounded-md border border-gray-200 mt-2 shadow-inner"><div><label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label><input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="w-full text-sm border-gray-300 rounded-md shadow-sm p-2 border bg-white text-gray-900"/></div><div><label className="block text-xs font-medium text-gray-700 mb-1">End Date</label><input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="w-full text-sm border-gray-300 rounded-md shadow-sm p-2 border bg-white text-gray-900"/></div></div>)}</div></div><div className="p-4 border-2 border-coral-blue rounded-lg bg-gray-50"><div className="flex justify-between items-center mb-3"><h3 className="font-semibold text-gray-700 flex items-center gap-2"><ChartBarIcon className="w-5 h-5 text-coral-blue"/>Customize Report</h3><button onClick={() => setIsCustomizing(!isCustomizing)} className="text-xs text-blue-600 hover:underline">{isCustomizing ? 'Done' : 'Edit'}</button></div>{isCustomizing ? (<div className="space-y-2 max-h-60 overflow-y-auto">{reportItems.map(item => (<label key={item.id} className="flex items-center gap-2 p-2 bg-white rounded shadow-sm cursor-pointer group"><div className="relative flex items-center justify-center"><input type="checkbox" checked={item.isIncluded} onChange={() => setReportItems(prev => prev.map(i => i.id === item.id ? { ...i, isIncluded: !i.isIncluded } : i))} className="peer h-5 w-5 appearance-none rounded border border-gray-300 bg-white checked:bg-coral-blue transition-all"/><svg className="pointer-events-none absolute left-1 top-1 h-3 w-3 text-white opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></div><span className={`text-sm ${item.isIncluded ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>{item.label}</span></label>))}</div>) : (<p className="text-sm text-gray-600">{reportItems.filter(i => i.isIncluded).length} items included.</p>)}<button onClick={handlePrint} className="w-full mt-4 bg-coral-green hover:bg-opacity-90 text-coral-dark font-bold py-2 px-4 rounded-lg transition-colors">Print Report</button></div></div><div className="w-full md:w-2/3"><div className="border-2 border-gray-200 p-8 rounded-lg bg-white min-h-[600px] shadow-sm"><ReportContent title={reportTitle} items={reportItems} /></div></div></div></div>)}

            {activeTab === 'forms' && (<div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-250px)] min-h-[500px]"><div className="w-full lg:w-1/3 flex flex-col gap-4"><div className="p-4 border-2 border-coral-blue rounded-lg bg-gray-50 flex-grow flex flex-col"><h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><UploadIcon className="w-5 h-5 text-coral-blue"/>Forms Management</h3><div className="mb-4"><label className="block w-full cursor-pointer bg-white border border-gray-300 hover:border-coral-blue text-gray-700 py-2 px-4 rounded-lg text-center shadow-sm transition-colors text-sm font-medium"><span className="flex items-center justify-center gap-2"><UploadIcon className="w-4 h-4"/> {isProcessing ? 'Syncing...' : 'Upload New Form'}</span><input type="file" className="hidden" accept=".pdf" onChange={handleFormUpload} disabled={isProcessing}/></label></div><div className="space-y-2 overflow-y-auto flex-grow">{forms.map(f => (<div key={f.id} onClick={() => setSelectedFormId(f.id)} className={`flex justify-between items-center p-3 rounded shadow-sm border cursor-pointer transition-all ${selectedFormId === f.id ? 'bg-blue-50 border-coral-blue ring-1 ring-coral-blue' : 'bg-white border-gray-200 hover:border-coral-blue/50'}`}><div className="truncate pr-2 overflow-hidden"><p className="text-sm font-medium text-gray-800 truncate">{f.name}</p><p className="text-xs text-gray-500">{f.dateUploaded}</p></div></div>))}</div></div></div><div className="w-full lg:w-2/3 border-2 border-gray-200 rounded-lg bg-gray-100 flex flex-col overflow-hidden shadow-inner">{selectedForm ? (<div className="flex flex-col h-full"><div className="bg-white border-b p-3 flex justify-between items-center shadow-sm"><h4 className="font-bold text-gray-700 truncate">{selectedForm.name}</h4><div className="flex gap-2"><button onClick={() => window.print()} className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-gray-700">Print</button><button onClick={() => handleDownloadForm(selectedForm)} className="text-xs bg-coral-blue text-white px-3 py-1 rounded">Download</button></div></div><div className="flex-grow bg-gray-500 p-4 overflow-y-auto flex items-start justify-center"><ScaledPreview><div className="w-full h-full p-10 flex flex-col gap-6"><div className="flex justify-between items-center border-b-2 border-black pb-4 mb-4"><h1 className="text-3xl font-bold uppercase">{selectedForm.name.replace('.pdf', '')}</h1></div><div className="space-y-8 opacity-60"><div className="h-4 bg-gray-200 w-3/4 rounded"></div><div className="h-4 bg-gray-200 w-full rounded"></div></div></div></ScaledPreview></div></div>) : (<div className="h-full flex flex-col items-center justify-center text-gray-400 p-8"><BookOpenIcon className="w-16 h-16 mb-4 opacity-50"/><p className="text-lg font-medium">Select a form to preview</p></div>)}</div></div>)}

            {activeTab === 'records' && (<div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-250px)] min-h-[600px]"><div className="w-full lg:w-1/3 flex flex-col gap-4"><div className="p-4 border-2 border-coral-blue rounded-lg bg-gray-50 flex-grow flex flex-col overflow-hidden"><div className="border-b-2 border-gray-200 mb-4 pb-2 shrink-0"><h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><ClipboardListIcon className="w-5 h-5 text-coral-blue"/>Template Library</h3><div className="space-y-2"><button onClick={() => { setSelectedTemplate('detailed-health'); setViewMode('template'); setSelectedRecordId(null); }} className={`w-full text-left p-3 rounded shadow-sm border transition-all flex items-center justify-between ${viewMode === 'template' && selectedTemplate === 'detailed-health' ? 'bg-blue-50 border-coral-blue ring-1 ring-coral-blue' : 'bg-white border-gray-200 hover:border-coral-blue/50'}`}><span className="text-sm font-medium text-gray-800">Detailed Health Report</span><ArrowDownIcon className="w-4 h-4 text-gray-400 transform -rotate-90"/></button><button onClick={() => { setSelectedTemplate('tree-maintenance'); setViewMode('template'); setSelectedRecordId(null); }} className={`w-full text-left p-3 rounded shadow-sm border transition-all flex items-center justify-between ${viewMode === 'template' && selectedTemplate === 'tree-maintenance' ? 'bg-blue-50 border-coral-blue ring-1 ring-coral-blue' : 'bg-white border-gray-200 hover:border-coral-blue/50'}`}><span className="text-sm font-medium text-gray-800">Tree Maintenance Log</span><ArrowDownIcon className="w-4 h-4 text-gray-400 transform -rotate-90"/></button><button onClick={() => { setSelectedTemplate('bulk-health'); setViewMode('template'); setSelectedRecordId(null); }} className={`w-full text-left p-3 rounded shadow-sm border transition-all flex items-center justify-between ${viewMode === 'template' && selectedTemplate === 'bulk-health' ? 'bg-blue-50 border-coral-blue ring-1 ring-coral-blue' : 'bg-white border-gray-200 hover:border-coral-blue/50'}`}><span className="text-sm font-medium text-gray-800">Bulk Health Assessment</span><ArrowDownIcon className="w-4 h-4 text-gray-400 transform -rotate-90"/></button></div></div><h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><CameraIcon className="w-5 h-5 text-coral-blue"/>Manage Records</h3><div className="mb-4 grid grid-cols-2 gap-2"><label className="cursor-pointer bg-white border border-gray-300 hover:border-coral-blue text-gray-700 py-2 px-4 rounded-lg text-center shadow-sm text-sm font-medium flex items-center justify-center gap-2"><UploadIcon className="w-4 h-4"/> {isProcessing ? 'Syncing...' : 'Upload'}<input type="file" className="hidden" accept="image/*" onChange={handleRecordUpload} disabled={isProcessing}/></label><label className="cursor-pointer bg-coral-blue hover:bg-opacity-90 text-white py-2 px-4 rounded-lg text-center shadow-sm text-sm font-medium flex items-center justify-center gap-2"><CameraIcon className="w-4 h-4"/> {isProcessing ? 'Syncing...' : 'Photo'}<input id="ocr-camera-trigger" type="file" className="hidden" accept="image/*" capture="environment" onChange={handleRecordUpload} disabled={isProcessing}/></label></div><div className="overflow-y-auto flex-grow pr-2">{digitizedReports.length > 0 && (<div className="mb-4"><h4 className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2 border-b border-green-200 pb-1">Detailed Health Reports</h4><div className="space-y-2">{digitizedReports.map(r => (<div key={r.id} onClick={() => { setSelectedRecordId(r.id); setViewMode('record'); }} className={`flex justify-between items-center p-3 rounded shadow-sm border cursor-pointer transition-all ${selectedRecordId === r.id && viewMode === 'record' ? 'bg-green-50 border-green-500 ring-1 ring-green-500' : 'bg-white border-gray-200 hover:border-green-300'}`}><div className="truncate pr-2 overflow-hidden flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-green-600 flex-shrink-0" /><div><p className="text-sm font-medium text-gray-800 truncate">{r.name}</p><p className="text-xs text-gray-500">{r.dateUploaded}</p></div></div></div>))}</div></div>)}{digitizedTreeReports.length > 0 && (<div className="mb-4"><h4 className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-2 border-b border-amber-200 pb-1">Tree Maintenance Reports</h4><div className="space-y-2">{digitizedTreeReports.map(r => (<div key={r.id} onClick={() => { setSelectedRecordId(r.id); setViewMode('record'); }} className={`flex justify-between items-center p-3 rounded shadow-sm border cursor-pointer transition-all ${selectedRecordId === r.id && viewMode === 'record' ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-500' : 'bg-white border-gray-200 hover:border-amber-300'}`}><div className="truncate pr-2 overflow-hidden flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-amber-600 flex-shrink-0" /><div><p className="text-sm font-medium text-gray-800 truncate">{r.name}</p><p className="text-xs text-gray-500">{r.dateUploaded}</p></div></div></div>))}</div></div>)}<div><h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 border-b border-gray-200 pb-1">Uploads & Drafts</h4><div className="space-y-2">{pendingRecords.map(r => (<div key={r.id} onClick={() => { setSelectedRecordId(r.id); setViewMode('record'); }} className={`flex justify-between items-center p-3 rounded shadow-sm border cursor-pointer transition-all ${selectedRecordId === r.id && viewMode === 'record' ? 'bg-blue-50 border-coral-blue ring-1 ring-coral-blue' : 'bg-white border-gray-200 hover:border-coral-blue/50'}`}><div className="truncate pr-2 overflow-hidden"><p className="text-sm font-medium text-gray-800 truncate">{r.name}</p><p className="text-xs text-gray-500">{r.dateUploaded}</p></div></div>))}</div></div></div></div></div><div ref={previewContainerRef} className="w-full lg:w-2/3 border-2 border-gray-200 rounded-lg bg-gray-100 flex flex-col overflow-hidden shadow-inner relative">{viewMode === 'template' ? (<div className="flex flex-col h-full"><div className="bg-white border-b p-3 flex justify-between items-center shadow-sm z-10 print:hidden"><h4 className="font-bold text-gray-700">Template Preview</h4><button onClick={() => window.print()} className="text-sm bg-coral-blue text-white font-bold px-4 py-2 rounded">Print Blank Form</button></div><div className="flex-grow bg-gray-500 p-4 overflow-y-auto flex items-start justify-center"><ScaledPreview>{selectedTemplate === 'detailed-health' && <BlankHealthForm />}{selectedTemplate === 'tree-maintenance' && <BlankTreeMaintenanceForm />}{selectedTemplate === 'bulk-health' && <BlankBulkHealthForm />}</ScaledPreview></div></div>) : selectedRecord ? (<div className="flex flex-col h-full relative"><div className="bg-white border-b p-3 flex justify-between items-center shadow-sm z-10"><h4 className="font-bold text-gray-700 truncate">{selectedRecord.name}</h4><button onClick={handleExtractData} disabled={isProcessing} className={`text-xs px-3 py-1 rounded flex items-center gap-2 transition-colors ${isProcessing ? 'bg-gray-400' : 'bg-coral-blue text-white'}`}>{isProcessing ? 'Processing...' : 'Digitize'}</button></div><div className="flex-grow bg-black/90 p-4 flex flex-col items-center overflow-auto relative scroll-smooth">{isProcessing && (<div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white"><div className="w-10 h-10 border-4 border-coral-blue border-t-transparent rounded-full animate-spin mb-3"></div><p className="font-semibold">Syncing with AI...</p></div>)}<img src={selectedRecord.url} alt="Record" className="max-w-full max-h-[50vh] object-contain shadow-lg mb-4" />{editData && (<div ref={digitizedResultRef} className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-6 mt-4 animate-fade-in text-left"><div className="flex justify-between items-center mb-4 border-b pb-2"><h3 className="text-lg font-bold text-coral-dark flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-coral-blue" />Digital Copy</h3><span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full flex items-center gap-1"><CheckCircleIcon className="w-3 h-3"/> AI Extracted</span></div><div className="mb-4"><label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Report Type</label><select value={editData.recordType || 'health'} onChange={(e) => handleRecordTypeChange(e.target.value as DigitizedRecordType)} className="w-full border-gray-300 rounded text-sm p-2 bg-white text-gray-900"><option value="health">Detailed Health Report</option><option value="maintenance">Tree Maintenance Log</option></select></div><div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4"><div><label className="block text-xs font-semibold text-gray-500 uppercase">Date</label><input type="text" value={editData.date || ''} onChange={(e) => handleEditChange('date', e.target.value)} className="w-full border-gray-300 rounded text-sm p-2 bg-white text-gray-900" /></div><div><label className="block text-xs font-semibold text-gray-500 uppercase">Site</label><input type="text" value={editData.site || ''} onChange={(e) => handleEditChange('site', e.target.value)} className="w-full border-gray-300 rounded text-sm p-2 bg-white text-gray-900" /></div><div><label className="block text-xs font-semibold text-gray-500 uppercase">ID</label><input type="text" value={editData.branchId || ''} onChange={(e) => handleEditChange('branchId', e.target.value)} className="w-full border-gray-300 rounded text-sm p-2 bg-white text-gray-900" /></div><div><label className="block text-xs font-semibold text-gray-500 uppercase">Surveyor</label><input type="text" value={editData.surveyor || ''} onChange={(e) => handleEditChange('surveyor', e.target.value)} className="w-full border-gray-300 rounded text-sm p-2 bg-white text-gray-900" /></div></div>{editData.recordType === 'health' && editData.healthReport && (<div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100"><h4 className="font-bold text-blue-800 text-sm uppercase mb-3">Extracted Health Data</h4><div className="grid grid-cols-2 gap-4 mb-3"><div><span className="block text-xs text-blue-600 font-semibold uppercase">Health Score (%)</span><input type="number" value={editData.healthReport.healthScore || 0} onChange={(e) => setEditData({...editData, healthReport: { ...editData.healthReport!, healthScore: parseInt(e.target.value)||0 }})} className="text-xl font-bold text-blue-900 border-gray-300 rounded p-1 w-full bg-white text-gray-900" /></div><div><span className="block text-xs text-blue-600 font-semibold uppercase">Bleaching</span><input type="text" value={editData.healthReport.bleaching || ''} onChange={(e) => setEditData({...editData, healthReport: { ...editData.healthReport!, bleaching: e.target.value }})} className="text-xl font-bold text-blue-900 border-gray-300 rounded p-1 w-full bg-white text-gray-900" /></div></div></div>)}{editData.recordType === 'maintenance' && editData.treeMaintenanceReport && (<div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-100"><h4 className="font-bold text-amber-800 text-sm uppercase mb-3">Maintenance Data</h4><div className="grid grid-cols-2 gap-4 mb-3"><label className="flex items-center gap-2 group cursor-pointer"><div className="relative flex items-center justify-center"><input type="checkbox" checked={editData.treeMaintenanceReport.cleaned || false} onChange={(e) => setEditData({...editData, treeMaintenanceReport: { ...editData.treeMaintenanceReport!, cleaned: e.target.checked }})} className="peer h-5 w-5 appearance-none rounded border border-gray-300 bg-white checked:bg-amber-600 transition-all"/><svg className="pointer-events-none absolute left-1 top-1 h-3 w-3 text-white opacity-0 peer-checked:opacity-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg></div><span className="text-sm font-medium text-gray-900">Structure Cleaned</span></label></div></div>)}<div className="mb-6"><label className="block text-xs font-semibold text-gray-500 uppercase">Notes</label><textarea value={editData.notes || ''} onChange={(e) => handleEditChange('notes', e.target.value)} rows={3} className="w-full border-gray-300 rounded text-sm p-2 bg-white text-gray-900"></textarea></div><div className="flex justify-end"><button onClick={handleSaveChanges} disabled={saveStatus === 'saving'} className={`font-bold py-2 px-6 rounded-lg shadow-md transition-all ${saveStatus === 'saved' ? 'bg-green-500' : 'bg-coral-blue'} text-white`}>{saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save'}</button></div></div>)}</div></div>) : (<div className="h-full flex flex-col items-center justify-center text-gray-400 p-8"><CameraIcon className="w-16 h-16 mb-4 opacity-50"/><p className="text-lg font-medium">Select a record to view</p></div>)}</div></div>)}

            <div className="printable-content-wrapper hidden">{activeTab === 'reports' && (<ReportContent title={reportTitle} items={reportItems} />)}{activeTab === 'records' && viewMode === 'template' && selectedTemplate === 'detailed-health' && (<BlankHealthForm />)}{activeTab === 'records' && viewMode === 'template' && selectedTemplate === 'tree-maintenance' && (<BlankTreeMaintenanceForm />)}{activeTab === 'records' && viewMode === 'template' && selectedTemplate === 'bulk-health' && (<BlankBulkHealthForm />)}</div>
        </div>
        
        {croppingImgSrc && (<ImageCropper src={croppingImgSrc} onCancel={() => setCroppingImgSrc(null)} onConfirm={onCropConfirm}/>)}
        {isConverting && (<div className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white"><div className="w-12 h-12 border-4 border-coral-blue border-t-transparent rounded-full animate-spin mb-4"></div><p className="font-bold text-lg">Converting Image...</p></div>)}
        </>
    );
};

export default ReportsPage;