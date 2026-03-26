import * as React from 'react';
import type { ChangeEvent } from 'react';
import type { RecordFile, DigitizedRecordData, DigitizedRecordType } from '../types';
import { ChartBarIcon, CalendarDaysIcon, UploadIcon, ArrowDownIcon, BookOpenIcon, CameraIcon, SparklesIcon, ClipboardListIcon, CheckCircleIcon, ArrowPathIcon, PencilIcon, TrashIcon, CloseIcon } from './Icons';
import { GoogleGenAI, Type } from "@google/genai";
import QRCode from 'qrcode';
import heic2any from 'heic2any';

interface FacilityDailyTasksPageProps {
  onNavigateBack: () => void;
  records: RecordFile[];
  onAddRecord: (record: RecordFile) => void;
  onUpdateRecord: (record: RecordFile) => void;
  initialSignal?: string;
}

interface CustomReportItem {
    id: string;
    label: string;
    value: string;
    isIncluded: boolean;
}

interface FormItem {
    id: string;
    name: string;
    dateUploaded: string;
    url?: string;
}

type PeriodKey = '7d' | '30d' | '90d' | 'all';

interface PeriodOption {
    key: PeriodKey;
    label: string;
    days: number;
}

const PERIOD_OPTIONS: PeriodOption[] = [
    { key: '7d', label: 'Last 7 Days', days: 7 },
    { key: '30d', label: 'Last Month', days: 30 },
    { key: '90d', label: 'Last 3 Months', days: 90 },
    { key: 'all', label: 'All Time', days: 9999 }
];

// --- Perspective Crop Helpers ---
interface Point { x: number; y: number; }
function getPerspectiveTransform(src: Point[], dst: Point[]) {
    const a: number[][] = [];
    const b: number[] = [];
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
        for (let k = i + 1; k < n; k++) { const factor = A[k][i] / A[i][i]; for (let j = i; j < n; j++) A[k][j] -= factor * A[i][j]; B[k] -= factor * B[i]; }
    }
    const X = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) { let sum = 0; for (let j = i + 1; j < n; j++) sum += A[i][j] * X[j]; X[i] = (B[i] - sum) / A[i][i]; }
    return X;
}

const ImageCropper: React.FC<{ src: string; onConfirm: (croppedUrl: string) => void; onCancel: () => void }> = ({ src, onConfirm, onCancel }) => {
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
            let clientX, clientY; if ('touches' in e) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; } else { clientX = (e as MouseEvent).clientX; clientY = (e as MouseEvent).clientY; }
            const rect = containerRef.current.getBoundingClientRect(); const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)); const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
            setCorners(prev => { const n = [...prev]; n[activeCornerIndex] = { x, y }; return n; });
        };
        const handleUp = () => setActiveCornerIndex(null);
        if (activeCornerIndex !== null) { window.addEventListener('mousemove', handleMove, { passive: false }); window.addEventListener('mouseup', handleUp); window.addEventListener('touchmove', handleMove, { passive: false }); window.addEventListener('touchend', handleUp); }
        return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); window.removeEventListener('touchmove', handleMove); window.removeEventListener('touchend', handleUp); };
    }, [activeCornerIndex]);
    const handleRotate = () => { setIsProcessing(true); const img = new Image(); img.onload = () => { const canvas = document.createElement('canvas'); canvas.width = img.height; canvas.height = img.width; const ctx = canvas.getContext('2d'); if (ctx) { ctx.translate(canvas.width / 2, canvas.height / 2); ctx.rotate(90 * Math.PI / 180); ctx.drawImage(img, -img.width / 2, -img.height / 2); setDisplaySrc(canvas.toDataURL('image/jpeg', 0.95)); } setIsProcessing(false); }; img.src = displaySrc; };
    const performPerspectiveWarp = async () => {
        if (!imgRef.current) return; setIsProcessing(true); await new Promise(r => setTimeout(r, 50));
        const img = imgRef.current; const width = img.naturalWidth; const height = img.naturalHeight; const srcPoints = corners.map(c => ({ x: (c.x / 100) * width, y: (c.y / 100) * height }));
        const tw = Math.sqrt(Math.pow(srcPoints[1].x - srcPoints[0].x, 2) + Math.pow(srcPoints[1].y - srcPoints[0].y, 2)); const bw = Math.sqrt(Math.pow(srcPoints[2].x - srcPoints[3].x, 2) + Math.pow(srcPoints[2].y - srcPoints[3].y, 2));
        const lh = Math.sqrt(Math.pow(srcPoints[3].x - srcPoints[0].x, 2) + Math.pow(srcPoints[3].y - srcPoints[0].y, 2)); const rh = Math.sqrt(Math.pow(srcPoints[2].x - srcPoints[1].x, 2) + Math.pow(srcPoints[2].y - srcPoints[1].y, 2));
        let dw = Math.max(tw, bw); let dh = Math.max(lh, rh); const MAX = 2048; if (dw > MAX || dh > MAX) { const r = Math.min(MAX / dw, MAX / dh); dw *= r; dh *= r; }
        dw = Math.round(dw); dh = Math.round(dh); const dstPoints = [{ x: 0, y: 0 }, { x: dw, y: 0 }, { x: dw, y: dh }, { x: 0, y: dh }]; const H = getPerspectiveTransform(dstPoints, srcPoints);
        const canvas = document.createElement('canvas'); canvas.width = dw; canvas.height = dh; const ctx = canvas.getContext('2d'); if (!ctx) return;
        const srcCanvas = document.createElement('canvas'); srcCanvas.width = width; srcCanvas.height = height; const srcCtx = srcCanvas.getContext('2d'); if (!srcCtx) return;
        srcCtx.drawImage(img, 0, 0); const srcData = srcCtx.getImageData(0, 0, width, height); const dstData = ctx.createImageData(dw, dh); const srcPixels = srcData.data; const dstPixels = dstData.data;
        for (let y = 0; y < dh; y++) { for (let x = 0; x < dw; x++) { const denom = H[6] * x + H[7] * y + 1; const srcX = (H[0] * x + H[1] * y + H[2]) / denom; const srcY = (H[3] * x + H[4] * y + H[5]) / denom; if (srcX >= 0 && srcX < width - 1 && srcY >= 0 && srcY < height - 1) { const x0 = Math.floor(srcX); const y0 = Math.floor(srcY); const dx = srcX - x0; const dy = srcY - y0; const i00 = (y0 * width + x0) * 4; const i10 = (y0 * width + (x0 + 1)) * 4; const i01 = ((y0 + 1) * width + x0) * 4; const i11 = ((y0 + 1) * width + (x0 + 1)) * 4; const dstIdx = (y * dw + x) * 4; for (let k = 0; k < 4; k++) dstPixels[dstIdx + k] = srcPixels[i00 + k] * (1 - dx) * (1 - dy) + srcPixels[i10 + k] * dx * (1 - dy) + srcPixels[i01 + k] * (1 - dx) * dy + srcPixels[i11 + k] * dx * dy; } } }
        ctx.putImageData(dstData, 0, 0); onConfirm(canvas.toDataURL('image/jpeg', 0.95)); setIsProcessing(false);
    };
    const p = corners.map(c => `${c.x},${c.y}`).join(' '); const maskPath = `M 0,0 L 100,0 L 100,100 L 0,100 Z M ${p} Z`;
    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col h-full w-full touch-none">
            <div className="flex justify-between items-center p-4 bg-gray-900 text-white shrink-0 z-10 border-b border-gray-800"><button onClick={onCancel} className="text-gray-300 px-3 py-1 hover:text-white">Cancel</button><div className="flex items-center gap-4"><h3 className="font-bold text-lg hidden sm:block">Adjust Corners</h3><button onClick={handleRotate} disabled={isProcessing} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition-colors"><ArrowPathIcon className="w-5 h-5 text-white" /></button></div><button onClick={performPerspectiveWarp} disabled={isProcessing} className={`text-coral-blue font-bold px-3 py-1 hover:text-blue-400 ${isProcessing ? 'opacity-50' : ''}`}>{isProcessing ? 'Processing...' : 'Done'}</button></div>
            <div className="flex-grow relative flex items-center justify-center bg-black overflow-hidden p-4"><div ref={containerRef} className="relative inline-block max-w-full max-h-full"><img ref={imgRef} src={displaySrc} alt="Crop target" className="max-w-full max-h-[80vh] object-contain block pointer-events-none select-none"/><svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none"><path d={maskPath} fill="rgba(0,0,0,0.6)" fillRule="evenodd" /><polygon points={p} fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="1,1" /></svg>{corners.map((corner, i) => (<div key={i} className="absolute w-8 h-8 -ml-4 -mt-4 z-20 flex items-center justify-center cursor-move" style={{ left: `${corner.x}%`, top: `${corner.y}%`, touchAction: 'none' }} onMouseDown={(e) => handlePointerDown(e, i)} onTouchStart={(e) => handlePointerDown(e, i)}><div className="w-4 h-4 bg-white rounded-full border-2 border-coral-blue shadow-md"></div></div>))}</div></div>
            <div className="p-4 bg-gray-900 text-center text-gray-400 text-sm">Drag corners to align with document edges.</div>
        </div>
    );
};

const FormHeaderQRCode: React.FC<{ text: string }> = ({ text }) => {
    const [src, setSrc] = React.useState(''); React.useEffect(() => { QRCode.toDataURL(text, { margin: 0, width: 80 }).then(setSrc).catch(err => console.error(err)); }, [text]);
    if (!src) return <div className="w-20 h-20 bg-gray-100 animate-pulse"></div>; return <img src={src} alt="Form QR" className="w-20 h-20" />;
}

const BlankEquipmentForm: React.FC = () => (
    <div className="bg-white p-8 w-full border-2 border-black text-black font-sans box-border relative">
        <div className="absolute top-4 right-4"><FormHeaderQRCode text="ACTION:DIGITIZE_EQUIPMENT" /></div>
        <div className="text-center border-b-2 border-black pb-4 mb-6 pt-4"><h1 className="text-3xl font-bold uppercase text-black">Daily Facility Inspection</h1><p className="text-sm text-gray-900 mt-1">Equipment & Life Support Systems</p></div>
        <div className="grid grid-cols-2 gap-6 mb-6"><div className="border-b border-black pb-1"><span className="text-sm font-bold uppercase mr-2 text-black">Date:</span><span className="inline-block w-32"></span></div><div className="border-b border-black pb-1"><span className="text-sm font-bold uppercase mr-2 text-black">Technician:</span><span className="inline-block w-full"></span></div></div>
        <div className="mb-6 p-4 border border-black rounded-lg"><h3 className="font-bold text-lg mb-4 uppercase text-black">1. Water Parameters</h3><div className="grid grid-cols-2 gap-4"><div className="flex justify-between items-center border-b border-gray-400 pb-2"><span>Temperature (°C)</span><div className="w-20 border-b border-black h-6"></div></div><div className="flex justify-between items-center border-b border-gray-400 pb-2"><span>Salinity (ppt)</span><div className="w-20 border-b border-black h-6"></div></div><div className="flex justify-between items-center border-b border-gray-400 pb-2"><span>pH</span><div className="w-20 border-b border-black h-6"></div></div><div className="flex justify-between items-center border-b border-gray-400 pb-2"><span>Alkalinity (dKH)</span><div className="w-20 border-b border-black h-6"></div></div></div></div>
        <div className="grid grid-cols-2 gap-6 mb-6"><div className="p-4 border border-black rounded-lg"><h3 className="font-bold text-lg mb-4 uppercase text-black">2. Filtration</h3><div className="space-y-3"><div className="flex items-center justify-between"><span>Filter Socks Changed?</span><div className="flex gap-2"><span className="border border-black px-2">Y</span><span className="border border-black px-2">N</span></div></div><div className="flex items-center justify-between"><span>Skimmer Cleaned?</span><div className="flex gap-2"><span className="border border-black px-2">Y</span><span className="border border-black px-2">N</span></div></div><div className="flex items-center justify-between"><span>Carbon Replaced?</span><div className="flex gap-2"><span className="border border-black px-2">Y</span><span className="border border-black px-2">N</span></div></div></div></div><div className="p-4 border border-black rounded-lg"><h3 className="font-bold text-lg mb-4 uppercase text-black">3. Flow & Pumps</h3><div className="space-y-3"><div className="flex items-center justify-between"><span>Main Return Pump</span><span className="border-b border-black w-16 text-center text-xs">OK / Fail</span></div><div className="flex items-center justify-between"><span>Wavemakers</span><span className="border-b border-black w-16 text-center text-xs">OK / Fail</span></div><div className="flex items-center justify-between"><span>Chiller Flow</span><span className="border-b border-black w-16 text-center text-xs">OK / Fail</span></div></div></div></div>
        <div className="p-4 border border-black rounded-lg min-h-[150px]"><h3 className="font-bold text-lg mb-2 uppercase text-black">4. Maintenance Notes & Repairs</h3><div className="space-y-6 mt-6"><div className="border-b border-black border-dashed"></div><div className="border-b border-black border-dashed"></div><div className="border-b border-black border-dashed"></div></div></div>
    </div>
);

const ReportContent: React.FC<{ title: string; items: CustomReportItem[]; notes?: string; }> = ({ title, items, notes }) => (
    <div className="bg-white p-8 w-full border-2 border-gray-200 print:border-none">
        <div className="text-center border-b-2 border-coral-blue pb-6 mb-6 print:pb-2 print:mb-4"><h1 className="text-3xl font-bold text-coral-dark print:text-2xl">Facility Equipment Report</h1><p className="text-gray-500 mt-2 print:text-sm">Period: {title}</p><p className="text-sm text-gray-400 mt-1 print:text-xs">Generated on {new Date().toLocaleDateString()}</p></div>
        <div className="grid grid-cols-1 gap-6 print:gap-3">{items.filter(i => i.isIncluded).map(item => (<div key={item.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg border border-gray-100 print:bg-white print:border-b print:border-gray-200 print:rounded-none print:p-2 print:border-t-0 print:border-x-0"><span className="text-lg font-medium text-gray-700 print:text-base">{item.label}</span><span className="text-2xl font-bold text-coral-blue print:text-lg">{item.value}</span></div>))}</div>
        <div className="mt-12 pt-6 border-t border-gray-200 print:mt-6 print:pt-4"><h4 className="font-bold text-gray-800 mb-2 print:text-sm">Technician Notes</h4><div className="hidden print:block h-32 border border-gray-300 rounded p-4 print:h-24"></div><div className="print:hidden text-gray-500 italic">{notes || "Add optional notes here before printing..."}</div></div>
        <div className="mt-8 text-center text-xs text-gray-400 print:fixed print:bottom-4 print:left-0 print:w-full">Coral Nursery Manager - Equipment Log</div>
    </div>
);

const ScaledPreview: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [scale, setScale] = React.useState(1);
    React.useEffect(() => {
        const calculateScale = () => { if (containerRef.current) { const parent = containerRef.current.parentElement; if (parent) { const availableWidth = parent.clientWidth - 32; const contentWidth = 794; setScale(Math.min(1, availableWidth / contentWidth)); } } };
        calculateScale(); window.addEventListener('resize', calculateScale); const timer = setTimeout(calculateScale, 100);
        return () => { window.removeEventListener('resize', calculateScale); clearTimeout(timer); };
    }, []);
    return (<div ref={containerRef} className="origin-top transition-transform duration-200 ease-out bg-white shadow-lg" style={{ transform: `scale(${scale})`, width: '794px', minHeight: '1123px' }}>{children}</div>);
};

const FacilityDailyTasksPage: React.FC<FacilityDailyTasksPageProps> = ({ onNavigateBack, records, onAddRecord, onUpdateRecord, initialSignal }) => {
    const [activeTab, setActiveTab] = React.useState<'reports' | 'forms' | 'records'>('reports');
    const [selectedPeriod, setSelectedPeriod] = React.useState<PeriodKey>('30d');
    const [isCustomizing, setIsCustomizing] = React.useState(false);
    const [reportItems, setReportItems] = React.useState<CustomReportItem[]>([
        { id: 'totalInspections', label: 'Equipment Logs Recorded', value: '0', isIncluded: true },
        { id: 'tempChecks', label: 'Temperature Logs', value: '0', isIncluded: true },
        { id: 'salinityChecks', label: 'Salinity Measurements', value: '0', isIncluded: true },
        { id: 'pHChecks', label: 'pH Readings Recorded', value: '0', isIncluded: true },
        { id: 'alkChecks', label: 'Alkalinity Readings', value: '0', isIncluded: true },
        { id: 'sockChanges', label: 'Filter Socks Changed', value: '0', isIncluded: true },
        { id: 'skimmerCleans', label: 'Skimmers Cleaned', value: '0', isIncluded: true },
        { id: 'failures', label: 'System Failures Reported', value: '0', isIncluded: true },
        { id: 'notesLogged', label: 'Technician Notes Added', value: '0', isIncluded: true },
    ]);

    const [editingStatItem, setEditingStatItem] = React.useState<CustomReportItem | null>(null);
    const [isAddingStat, setIsAddingStat] = React.useState(false);

    // AUTO-OPEN LOGIC FOR QR SCAN SIGNALS
    React.useEffect(() => {
        if (initialSignal === 'AUTO_OPEN_DIGITIZER') {
            setActiveTab('records');
            setViewMode('record');
            const fileInput = document.getElementById('facility-ocr-trigger');
            if (fileInput) fileInput.click();
        }
    }, [initialSignal]);

    React.useEffect(() => {
        const period = PERIOD_OPTIONS.find(p => p.key === selectedPeriod) || PERIOD_OPTIONS[1];
        const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - period.days);
        const filteredRecords = records.filter(r => {
            if (r.digitizedData?.recordType !== 'equipment') return false;
            const rd = new Date(r.digitizedData.date || r.dateUploaded); return rd >= cutoff;
        });

        const stats = {
            totalInspections: filteredRecords.length,
            tempChecks: filteredRecords.filter(r => r.digitizedData?.equipmentReport?.temperature !== undefined).length,
            salinityChecks: filteredRecords.filter(r => r.digitizedData?.equipmentReport?.salinity !== undefined).length,
            pHChecks: filteredRecords.filter(r => r.digitizedData?.equipmentReport?.pH !== undefined).length,
            alkChecks: filteredRecords.filter(r => r.digitizedData?.equipmentReport?.alkalinity !== undefined).length,
            sockChanges: filteredRecords.filter(r => r.digitizedData?.equipmentReport?.socksChanged).length,
            skimmerCleans: filteredRecords.filter(r => r.digitizedData?.equipmentReport?.skimmerCleaned).length,
            failures: filteredRecords.filter(r => r.digitizedData?.equipmentReport?.failuresDetected).length,
            notesLogged: filteredRecords.filter(r => r.digitizedData?.notes?.trim()).length
        };

        setReportItems(prev => prev.map(item => { const realVal = stats[item.id as keyof typeof stats]; return realVal !== undefined ? { ...item, value: realVal.toString() } : item; }));
    }, [selectedPeriod, records]);

    const [forms, setForms] = React.useState<FormItem[]>([]);
    const [selectedFormId, setSelectedFormId] = React.useState<string | null>(null);
    const [selectedRecordId, setSelectedRecordId] = React.useState<string | null>(null);
    const [isProcessing, setIsProcessing] = React.useState(false);
    const [viewMode, setViewMode] = React.useState<'record' | 'template'>('record');
    const [selectedTemplate, setSelectedTemplate] = React.useState<string | null>(null);
    const [editData, setEditData] = React.useState<DigitizedRecordData | null>(null);
    const previewContainerRef = React.useRef<HTMLDivElement>(null);
    const [saveStatus, setSaveStatus] = React.useState<'idle' | 'saving' | 'saved'>('idle');
    const [isConverting, setIsConverting] = React.useState(false);
    const [croppingImgSrc, setCroppingImgSrc] = React.useState<string | null>(null);

    const selectedForm = forms.find(f => f.id === selectedFormId);
    const selectedRecord = records.find(r => r.id === selectedRecordId);
    const reportTitle = PERIOD_OPTIONS.find(p => p.key === selectedPeriod)?.label || 'Report';
    const digitizedEquipmentReports = React.useMemo(() => records.filter(r => r.digitizedData?.recordType === 'equipment'), [records]);
    const pendingRecords = React.useMemo(() => records.filter(r => !r.digitizedData), [records]);

    React.useEffect(() => { if (selectedRecord?.digitizedData) setEditData(selectedRecord.digitizedData); else setEditData(null); setSaveStatus('idle'); }, [selectedRecord]);

    const toggleInclude = (id: string) => { setReportItems(prev => prev.map(item => item.id === id ? { ...item, isIncluded: !item.isIncluded } : item)); };
    const handleDeleteStat = (id: string, e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); if (confirm('Remove from report?')) setReportItems(prev => prev.filter(item => item.id !== id)); };
    const handleSaveStat = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); const fd = new FormData(e.currentTarget); const label = fd.get('label') as string; const value = fd.get('value') as string;
        if (editingStatItem) { setReportItems(prev => prev.map(item => item.id === editingStatItem.id ? { ...item, label, value } : item)); setEditingStatItem(null); }
        else if (isAddingStat) { setReportItems(prev => [...prev, { id: `custom-${Math.random().toString(36).substring(2, 9)}`, label, value, isIncluded: true }]); setIsAddingStat(false); }
    };
    const handlePrint = () => window.print();
    const handleEditChange = (field: keyof DigitizedRecordData, value: any) => { if (editData) setEditData({ ...editData, [field]: value }); };

    const handleFormUpload = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]; const reader = new FileReader();
            reader.onloadend = () => { const newForm = { id: Math.random().toString(), name: file.name, dateUploaded: new Date().toISOString().split('T')[0], url: reader.result as string }; setForms([...forms, newForm]); setSelectedFormId(newForm.id); };
            reader.readAsDataURL(file);
        }
    };
    const handleRecordUpload = async (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            let file = e.target.files[0]; if (file.name.toLowerCase().endsWith('.heic') || file.type === 'image/heic') {
                setIsConverting(true); try { const result = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.8 }); file = new File([Array.isArray(result) ? result[0] : result], file.name.replace(/\.heic$/i, '.jpg'), { type: 'image/jpeg' }); } catch (err) { alert("Could not convert HEIC."); setIsConverting(false); return; } setIsConverting(false);
            }
            const reader = new FileReader(); reader.onload = (ev) => { if (ev.target?.result) setCroppingImgSrc(ev.target.result as string); }; reader.readAsDataURL(file);
        }
        e.target.value = '';
    }
    const onCropConfirm = async (croppedUrl: string) => { setCroppingImgSrc(null); const newId = Math.random().toString(); const newRecord = { id: newId, name: `Log - ${new Date().toLocaleString()}`, dateUploaded: new Date().toISOString().split('T')[0], url: croppedUrl }; onAddRecord(newRecord); setSelectedRecordId(newId); setViewMode('record'); };
    const handleDownloadForm = (form: FormItem) => { if (!form.url) return; const link = document.createElement('a'); link.href = form.url; link.download = form.name; document.body.appendChild(link); link.click(); document.body.removeChild(link); };

    const handleExtractData = async () => {
        if (!selectedRecord) return; if (!process.env.API_KEY) { alert("API Key missing."); return; }
        setIsProcessing(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: { parts: [{ inlineData: { mimeType: 'image/jpeg', data: (selectedRecord.url.split(',')[1]) } }, { text: `Extract Facility Log Data: Date, Surveyor, and EquipmentReport object. Extract numeric Temperature, Salinity, pH, Alkalinity. Boolean for socksChanged, skimmerCleaned, carbonChanged. Booleans for status of returnPump, wavemakers, chiller, heaters. Boolean failuresDetected if any component is failed or problematic. recordType='equipment'.` }] },
                config: {
                    responseMimeType: "application/json",
                    responseSchema: { type: Type.OBJECT, properties: { recordType: { type: Type.STRING }, date: { type: Type.STRING }, surveyor: { type: Type.STRING }, notes: { type: Type.STRING }, equipmentReport: { type: Type.OBJECT, properties: { temperature: { type: Type.NUMBER }, salinity: { type: Type.NUMBER }, pH: { type: Type.NUMBER }, alkalinity: { type: Type.NUMBER }, socksChanged: { type: Type.BOOLEAN }, skimmerCleaned: { type: Type.BOOLEAN }, carbonChanged: { type: Type.BOOLEAN }, returnPumpOk: { type: Type.BOOLEAN }, wavemakersOk: { type: Type.BOOLEAN }, chillerOk: { type: Type.BOOLEAN }, heatersOk: { type: Type.BOOLEAN }, failuresDetected: { type: Type.BOOLEAN } } } } }
                }
            });
            onUpdateRecord({ ...selectedRecord, digitizedData: JSON.parse(response.text) });
        } catch (error) { alert("AI Extraction Failed."); } finally { setIsProcessing(false); }
    };

    const handleSaveChanges = () => { if (selectedRecord && editData) { setSaveStatus('saving'); setTimeout(() => { onUpdateRecord({ ...selectedRecord, digitizedData: editData }); setSaveStatus('saved'); setTimeout(() => setSaveStatus('idle'), 2000); }, 600); } };

    return (
        <>
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4 print:hidden"><h2 className="text-2xl font-bold text-coral-dark mb-2 sm:mb-0">Facility Daily Tasks</h2><button onClick={onNavigateBack} className="bg-gray-200 hover:bg-gray-300 text-coral-dark font-bold py-2 px-4 rounded-lg transition-colors duration-200 self-start sm:self-center">&larr; Back to Facility</button></div>
            <div className="flex border-b print:hidden overflow-x-auto"><button className={`flex-1 py-3 px-4 text-center font-medium whitespace-nowrap ${activeTab === 'reports' ? 'text-coral-blue border-b-2 border-coral-blue' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('reports')}>Task Reports</button><button className={`flex-1 py-3 px-4 text-center font-medium whitespace-nowrap ${activeTab === 'forms' ? 'text-coral-blue border-b-2 border-coral-blue' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('forms')}>Forms</button><button className={`flex-1 py-3 px-4 text-center font-medium whitespace-nowrap ${activeTab === 'records' ? 'text-coral-blue border-b-2 border-coral-blue' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('records')}>Records</button></div>

            {activeTab === 'reports' && (
                <div className="block">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-full md:w-1/3 space-y-6 print:hidden">
                            <div className="p-4 border-2 border-coral-blue rounded-lg bg-gray-50">
                                <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><CalendarDaysIcon className="w-5 h-5 text-coral-blue"/>Select Time Period</h3>
                                <div className="space-y-2">{PERIOD_OPTIONS.map((opt) => (<button key={opt.key} onClick={() => setSelectedPeriod(opt.key)} className={`w-full text-left px-4 py-2 rounded-md transition-colors ${selectedPeriod === opt.key ? 'bg-coral-blue text-white font-bold' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>{opt.label}</button>))}</div>
                            </div>
                            <div className="p-4 border-2 border-coral-blue rounded-lg bg-gray-50">
                                <div className="flex justify-between items-center mb-3"><h3 className="font-semibold text-gray-700 flex items-center gap-2"><ChartBarIcon className="w-5 h-5 text-coral-blue"/>Customize Stats</h3><button onClick={() => setIsCustomizing(!isCustomizing)} className="text-xs text-blue-600 hover:underline">{isCustomizing ? 'Done' : 'Edit'}</button></div>
                                {isCustomizing ? (<div className="space-y-2 max-h-80 overflow-y-auto">{reportItems.map(item => (<div key={item.id} className="flex items-center gap-2 p-2 bg-white rounded shadow-sm border border-gray-100 group"><label className="flex-grow flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={item.isIncluded} onChange={() => toggleInclude(item.id)} className="h-4 w-4 text-coral-blue rounded border-gray-300 focus:ring-coral-blue"/><div className="flex flex-col"><span className={`text-sm font-medium ${item.isIncluded ? 'text-gray-900' : 'text-gray-400'}`}>{item.label}</span><span className="text-[10px] text-gray-400 font-mono">Value: {item.value}</span></div></label><div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => setEditingStatItem(item)} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><PencilIcon className="w-3.5 h-3.5" /></button><button onClick={(e) => handleDeleteStat(item.id, e)} className="p-1 text-red-500 hover:bg-red-50 rounded"><TrashIcon className="w-3.5 h-3.5" /></button></div></div>))}<button onClick={() => setIsAddingStat(true)} className="w-full mt-2 py-2 border-2 border-dashed border-gray-200 rounded-lg text-xs font-bold text-gray-400 hover:border-coral-blue transition-all">+ Add Custom Stat</button></div>) : (<p className="text-sm text-gray-600">{reportItems.filter(i => i.isIncluded).length} items included.</p>)}
                                <button onClick={handlePrint} className="w-full mt-4 bg-coral-green hover:bg-opacity-90 text-coral-dark font-bold py-2 px-4 rounded-lg transition-colors">Print Report</button>
                            </div>
                        </div>
                        <div className="w-full md:w-2/3"><div className="border-2 border-gray-200 p-8 rounded-lg bg-white min-h-[600px] shadow-sm"><ReportContent title={reportTitle} items={reportItems} /></div></div>
                    </div>
                </div>
            )}

            {activeTab === 'forms' && (
                <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-250px)] min-h-[500px]">
                    <div className="w-full lg:w-1/3 flex flex-col gap-4"><div className="p-4 border-2 border-coral-blue rounded-lg bg-gray-50 flex-grow flex flex-col"><h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><UploadIcon className="w-5 h-5 text-coral-blue"/>Standard Forms</h3><div className="mb-4"><label className="block w-full cursor-pointer bg-white border border-gray-300 hover:border-coral-blue text-gray-700 py-2 px-4 rounded-lg text-center shadow-sm transition-colors text-sm font-medium"><span className="flex items-center justify-center gap-2"><UploadIcon className="w-4 h-4"/> Upload New Form</span><input type="file" className="hidden" accept=".pdf" onChange={handleFormUpload} /></label></div><div className="space-y-2 overflow-y-auto flex-grow">{forms.length > 0 ? forms.map(form => (<div key={form.id} onClick={() => setSelectedFormId(form.id)} className={`flex justify-between items-center p-3 rounded shadow-sm border cursor-pointer transition-all ${selectedFormId === form.id ? 'bg-blue-50 border-coral-blue ring-1 ring-coral-blue' : 'bg-white border-gray-200 hover:border-coral-blue/50'}`}><div className="truncate pr-2 overflow-hidden"><p className="text-sm font-medium text-gray-800 truncate">{form.name}</p><p className="text-xs text-gray-500">{form.dateUploaded}</p></div></div>)) : <p className="text-sm text-gray-500 text-center py-4">No forms uploaded.</p>}</div></div></div>
                    <div className="w-full lg:w-2/3 border-2 border-gray-200 rounded-lg bg-gray-100 flex flex-col overflow-hidden shadow-inner">{selectedForm ? (<div className="flex flex-col h-full"><div className="bg-white border-b p-3 flex justify-between items-center shadow-sm"><h4 className="font-bold text-gray-700 truncate">{selectedForm.name}</h4><div className="flex gap-2"><button onClick={() => window.print()} className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded text-gray-700">Print</button><button onClick={() => handleDownloadForm(selectedForm)} className="text-xs bg-coral-blue text-white hover:bg-opacity-90 px-3 py-1 rounded">Download</button></div></div><div className="flex-grow bg-gray-500 p-4 overflow-y-auto overflow-x-hidden flex items-start justify-center"><ScaledPreview><div className="w-full h-full p-10 flex flex-col gap-6"><div className="flex justify-between items-center border-b-2 border-black pb-4 mb-4"><h1 className="text-3xl font-bold uppercase">{selectedForm.name.replace('.pdf', '')}</h1></div><div className="space-y-8 opacity-60"><div className="h-4 bg-gray-200 w-3/4 rounded"></div><div className="h-4 bg-gray-200 w-full rounded"></div></div></div></ScaledPreview></div></div>) : (<div className="h-full flex flex-col items-center justify-center text-gray-400 p-8"><BookOpenIcon className="w-16 h-16 mb-4 opacity-50"/><p className="text-lg font-medium">Select a form to preview</p></div>)}</div>
                </div>
            )}

            {activeTab === 'records' && (
                <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-250px)] min-h-[600px]">
                    <div className="w-full lg:w-1/3 flex flex-col gap-4">
                        <div className="p-4 border-2 border-coral-blue rounded-lg bg-gray-50 flex-grow flex flex-col overflow-hidden">
                            <div className="border-b-2 border-gray-200 mb-4 pb-2 shrink-0"><h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><ClipboardListIcon className="w-5 h-5 text-coral-blue"/>Template Library</h3><div className="space-y-2"><button onClick={() => { setSelectedTemplate('detailed-health'); setViewMode('template'); setSelectedRecordId(null); }} className={`w-full text-left p-3 rounded shadow-sm border transition-all flex items-center justify-between ${viewMode === 'template' && selectedTemplate === 'detailed-health' ? 'bg-blue-50 border-coral-blue ring-1 ring-coral-blue' : 'bg-white border-gray-200 hover:border-coral-blue/50'}`}><span className="text-sm font-medium text-gray-800">Detailed Health Report</span><ArrowDownIcon className="w-4 h-4 text-gray-400 transform -rotate-90"/></button><button onClick={() => { setSelectedTemplate('tree-maintenance'); setViewMode('template'); setSelectedRecordId(null); }} className={`w-full text-left p-3 rounded shadow-sm border transition-all flex items-center justify-between ${viewMode === 'template' && selectedTemplate === 'tree-maintenance' ? 'bg-blue-50 border-coral-blue ring-1 ring-coral-blue' : 'bg-white border-gray-200 hover:border-coral-blue/50'}`}><span className="text-sm font-medium text-gray-800">Tree Maintenance Log</span><ArrowDownIcon className="w-4 h-4 text-gray-400 transform -rotate-90"/></button></div></div>
                            <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2"><CameraIcon className="w-5 h-5 text-coral-blue"/>Manage Records</h3>
                            <div className="mb-4 grid grid-cols-2 gap-2"><label className="cursor-pointer bg-white border border-gray-300 hover:border-coral-blue text-gray-700 py-2 px-4 rounded-lg text-center shadow-sm text-sm font-medium flex items-center justify-center gap-2"><UploadIcon className="w-4 h-4"/> Upload<input type="file" className="hidden" accept="image/jpeg, image/png, image/webp" onChange={handleRecordUpload} /></label><label className="cursor-pointer bg-coral-blue hover:bg-opacity-90 text-white py-2 px-4 rounded-lg text-center shadow-sm text-sm font-medium flex items-center justify-center gap-2"><CameraIcon className="w-4 h-4"/> Photo<input id="facility-ocr-trigger" type="file" className="hidden" accept="image/jpeg, image/png, image/webp" capture="environment" onChange={handleRecordUpload} /></label></div>
                            <div className="overflow-y-auto flex-grow pr-2">
                                {digitizedEquipmentReports.length > 0 && (<div className="mb-4"><h4 className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2 border-b border-blue-200 pb-1">Equipment Logs</h4><div className="space-y-2">{digitizedEquipmentReports.map(record => (<div key={record.id} onClick={() => { setSelectedRecordId(record.id); setViewMode('record'); }} className={`flex justify-between items-center p-3 rounded shadow-sm border cursor-pointer transition-all ${selectedRecordId === record.id && viewMode === 'record' ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-gray-200 hover:border-blue-300'}`}><div className="truncate pr-2 overflow-hidden flex items-center gap-2"><SparklesIcon className="w-4 h-4 text-blue-600 flex-shrink-0" /><div><p className="text-sm font-medium text-gray-800 truncate">{record.name}</p><p className="text-xs text-gray-500">{record.dateUploaded}</p></div></div></div>))}</div></div>)}
                                <div><h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 border-b border-gray-200 pb-1">Uploads & Drafts</h4><div className="space-y-2">{pendingRecords.length > 0 ? pendingRecords.map(record => (<div key={record.id} onClick={() => { setSelectedRecordId(record.id); setViewMode('record'); }} className={`flex justify-between items-center p-3 rounded shadow-sm border cursor-pointer transition-all ${selectedRecordId === record.id && viewMode === 'record' ? 'bg-blue-50 border-coral-blue ring-1 ring-coral-blue' : 'bg-white border-gray-200 hover:border-coral-blue/50'}`}><div className="truncate pr-2 overflow-hidden"><p className="text-sm font-medium text-gray-800 truncate">{record.name}</p><p className="text-xs text-gray-500">{record.dateUploaded}</p></div></div>)) : <p className="text-xs text-gray-400 italic p-2">No pending uploads.</p>}</div></div>
                            </div>
                        </div>
                    </div>

                    <div ref={previewContainerRef} className="w-full lg:w-2/3 border-2 border-gray-200 rounded-lg bg-gray-100 flex flex-col overflow-hidden shadow-inner relative">
                        {viewMode === 'template' ? (<div className="flex flex-col h-full"><div className="bg-white border-b p-3 flex justify-between items-center shadow-sm z-10 print:hidden"><h4 className="font-bold text-gray-700">Template Preview</h4><button onClick={() => window.print()} className="text-sm bg-coral-blue text-white hover:bg-opacity-90 px-4 py-2 rounded font-bold">Print Blank Form</button></div><div className="flex-grow bg-gray-500 p-4 overflow-y-auto overflow-x-hidden flex items-start justify-center"><ScaledPreview><BlankEquipmentForm /></ScaledPreview></div></div>) : selectedRecord ? (<div className="flex flex-col h-full relative"><div className="bg-white border-b p-3 flex justify-between items-center shadow-sm z-10"><h4 className="font-bold text-gray-700 truncate">{selectedRecord.name}</h4><button onClick={handleExtractData} disabled={isProcessing} className={`text-xs px-3 py-1 rounded flex items-center gap-2 transition-colors ${isProcessing ? 'bg-gray-400' : 'bg-coral-blue text-white'}`}>{isProcessing ? 'Processing...' : 'Digitize'}</button></div><div className="flex-grow bg-black/90 p-4 flex flex-col items-center overflow-auto relative scroll-smooth">{isProcessing && (<div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white"><div className="w-10 h-10 border-4 border-coral-blue border-t-transparent rounded-full animate-spin mb-3"></div><p className="font-semibold">Analyzing...</p></div>)}<img src={selectedRecord.url} alt="Record" className="max-w-full max-h-[50vh] object-contain shadow-lg mb-4" />{editData && (<div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-6 mt-4 animate-fade-in text-left"><div className="flex justify-between items-center mb-4 border-b pb-2"><h3 className="text-lg font-bold text-coral-dark flex items-center gap-2"><SparklesIcon className="w-5 h-5 text-coral-blue" />Digital Copy</h3><span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full flex items-center gap-1"><CheckCircleIcon className="w-3 h-3"/> AI Extracted</span></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div><label className="block text-xs font-semibold text-gray-500 uppercase">Date</label><input type="text" value={editData.date || ''} onChange={(e) => handleEditChange('date', e.target.value)} className="w-full border-gray-300 rounded text-sm p-2 bg-white text-gray-900" /></div>
                                <div><label className="block text-xs font-semibold text-gray-500 uppercase">Technician</label><input type="text" value={editData.surveyor || ''} onChange={(e) => handleEditChange('surveyor', e.target.value)} className="w-full border-gray-300 rounded text-sm p-2 bg-white text-gray-900" /></div>
                            </div>
                            {editData.equipmentReport && (
                                <div className="space-y-6">
                                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-100"><h4 className="font-bold text-blue-800 text-sm uppercase mb-3">Water Quality</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                            <div><span className="block text-[10px] text-blue-600 font-black uppercase">Temp (°C)</span><input type="number" step="0.1" value={editData.equipmentReport.temperature || 0} onChange={(e) => setEditData({ ...editData, equipmentReport: { ...editData.equipmentReport!, temperature: parseFloat(e.target.value) || 0 } })} className="text-sm font-bold border-gray-300 rounded p-1 w-full" /></div>
                                            <div><span className="block text-[10px] text-blue-600 font-black uppercase">Salinity (ppt)</span><input type="number" step="0.1" value={editData.equipmentReport.salinity || 0} onChange={(e) => setEditData({ ...editData, equipmentReport: { ...editData.equipmentReport!, salinity: parseFloat(e.target.value) || 0 } })} className="text-sm font-bold border-gray-300 rounded p-1 w-full" /></div>
                                            <div><span className="block text-[10px] text-blue-600 font-black uppercase">pH</span><input type="number" step="0.01" value={editData.equipmentReport.pH || 0} onChange={(e) => setEditData({ ...editData, equipmentReport: { ...editData.equipmentReport!, pH: parseFloat(e.target.value) || 0 } })} className="text-sm font-bold border-gray-300 rounded p-1 w-full" /></div>
                                            <div><span className="block text-[10px] text-blue-600 font-black uppercase">Alk (dKH)</span><input type="number" step="0.1" value={editData.equipmentReport.alkalinity || 0} onChange={(e) => setEditData({ ...editData, equipmentReport: { ...editData.equipmentReport!, alkalinity: parseFloat(e.target.value) || 0 } })} className="text-sm font-bold border-gray-300 rounded p-1 w-full" /></div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-green-50 rounded-lg border border-green-100"><h4 className="font-bold text-green-800 text-sm uppercase mb-3">Maintenance Tasks</h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <label className="flex items-center gap-2 text-xs font-bold text-green-700 cursor-pointer"><input type="checkbox" checked={editData.equipmentReport.socksChanged || false} onChange={(e) => setEditData({ ...editData, equipmentReport: { ...editData.equipmentReport!, socksChanged: e.target.checked } })} /> Socks Changed</label>
                                            <label className="flex items-center gap-2 text-xs font-bold text-green-700 cursor-pointer"><input type="checkbox" checked={editData.equipmentReport.skimmerCleaned || false} onChange={(e) => setEditData({ ...editData, equipmentReport: { ...editData.equipmentReport!, skimmerCleaned: e.target.checked } })} /> Skimmer Cleaned</label>
                                            <label className="flex items-center gap-2 text-xs font-bold text-green-700 cursor-pointer"><input type="checkbox" checked={editData.equipmentReport.carbonChanged || false} onChange={(e) => setEditData({ ...editData, equipmentReport: { ...editData.equipmentReport!, carbonChanged: e.target.checked } })} /> Carbon Refreshed</label>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-100"><h4 className="font-bold text-orange-800 text-sm uppercase mb-3">System Status</h4>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            <label className="flex items-center gap-2 text-[10px] font-black text-orange-700"><input type="checkbox" checked={editData.equipmentReport.returnPumpOk || false} onChange={(e) => setEditData({ ...editData, equipmentReport: { ...editData.equipmentReport!, returnPumpOk: e.target.checked } })} /> Return Pump OK</label>
                                            <label className="flex items-center gap-2 text-[10px] font-black text-orange-700"><input type="checkbox" checked={editData.equipmentReport.wavemakersOk || false} onChange={(e) => setEditData({ ...editData, equipmentReport: { ...editData.equipmentReport!, wavemakersOk: e.target.checked } })} /> Flow OK</label>
                                            <label className="flex items-center gap-2 text-[10px] font-black text-orange-700"><input type="checkbox" checked={editData.equipmentReport.chillerOk || false} onChange={(e) => setEditData({ ...editData, equipmentReport: { ...editData.equipmentReport!, chillerOk: e.target.checked } })} /> Chiller OK</label>
                                            <label className="flex items-center gap-2 text-[10px] font-black text-orange-700"><input type="checkbox" checked={editData.equipmentReport.heatersOk || false} onChange={(e) => setEditData({ ...editData, equipmentReport: { ...editData.equipmentReport!, heatersOk: e.target.checked } })} /> Heaters OK</label>
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-orange-200">
                                            <label className="flex items-center gap-3 p-2 bg-white rounded border border-orange-300 cursor-pointer">
                                                <input type="checkbox" checked={editData.equipmentReport.failuresDetected || false} onChange={(e) => setEditData({ ...editData, equipmentReport: { ...editData.equipmentReport!, failuresDetected: e.target.checked } })} className="h-5 w-5 text-red-600 rounded" />
                                                <span className="text-xs font-black text-red-600 uppercase">Failures / Issues Detected</span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className="mt-6 mb-6"><label className="block text-xs font-semibold text-gray-500 uppercase">Observations / Tech Notes</label><textarea value={editData.notes || ''} onChange={(e) => handleEditChange('notes', e.target.value)} rows={3} className="w-full border-gray-300 rounded text-sm p-2 bg-white text-gray-900"></textarea></div>
                            <div className="flex justify-end"><button onClick={handleSaveChanges} disabled={saveStatus === 'saving'} className={`font-bold py-2 px-6 rounded-lg shadow-md transition-all ${saveStatus === 'saved' ? 'bg-green-500' : 'bg-coral-blue'} text-white`}>{saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved!' : 'Save'}</button></div>
                        </div>)}</div></div>) : (<div className="h-full flex flex-col items-center justify-center text-gray-400 p-8"><CameraIcon className="w-16 h-16 mb-4 opacity-50"/><p className="text-lg font-medium">Select a log to view</p></div>)}
                    </div>
                </div>
            )}

            <div className="printable-content-wrapper hidden">{activeTab === 'reports' && (<ReportContent title={reportTitle} items={reportItems} />)}{activeTab === 'records' && viewMode === 'template' && (<BlankEquipmentForm />)}</div>
        </div>
        
        {croppingImgSrc && (<ImageCropper src={croppingImgSrc} onCancel={() => setCroppingImgSrc(null)} onConfirm={onCropConfirm}/>)}
        {isConverting && (<div className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white"><div className="w-12 h-12 border-4 border-coral-blue border-t-transparent rounded-full animate-spin mb-4"></div><p className="font-bold text-lg">Converting Image...</p></div>)}
        {(editingStatItem || isAddingStat) && (
            <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 overflow-hidden">
                    <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold text-coral-dark">{editingStatItem ? 'Edit Stat' : 'Add New Stat'}</h3><button onClick={() => { setEditingStatItem(null); setIsAddingStat(false); }} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><CloseIcon className="w-5 h-5 text-gray-600" /></button></div>
                    <form onSubmit={handleSaveStat} className="space-y-4">
                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Stat Label</label><input name="label" defaultValue={editingStatItem?.label || ''} required className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-coral-blue outline-none bg-white text-gray-900" placeholder="e.g. Heaters Checked"/></div>
                        <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Current Value</label><input name="value" defaultValue={editingStatItem?.value || '0'} required className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-coral-blue outline-none bg-white text-gray-900" placeholder="e.g. 1"/></div>
                        <div className="flex gap-2 pt-4"><button type="button" onClick={() => { setEditingStatItem(null); setIsAddingStat(false); }} className="flex-1 py-3 bg-gray-100 font-bold rounded-xl hover:bg-gray-200">Cancel</button><button type="submit" className="flex-1 py-3 bg-coral-blue text-white font-bold rounded-xl hover:bg-opacity-90 shadow-md">Save Stat</button></div>
                    </form>
                </div>
            </div>
        )}
        </>
    );
};

export default FacilityDailyTasksPage;