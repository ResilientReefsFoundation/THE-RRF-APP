
import * as React from 'react';
import type { ChangeEvent } from 'react';

const ModelViewer = 'model-viewer' as any;

const CustomFileInput: React.FC<{ 
    label: string; 
    fileName: string | null;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void; 
    colorClass: string;
    textColorClass: string;
}> = ({ label, fileName, onChange, colorClass, textColorClass }) => (
    <div className="flex flex-col w-full">
        <span className="text-sm font-medium text-gray-700 mb-1.5">{label}</span>
        <label className={`relative flex flex-col items-center justify-center px-4 py-3 rounded-xl border border-transparent shadow-sm cursor-pointer transition-all active:scale-95 hover:shadow-md ${colorClass}`}>
            <span className={`text-sm font-bold truncate w-full text-center ${textColorClass}`}>{fileName || "Choose File"}</span>
            <span className={`text-xs font-normal opacity-70 mt-0.5 ${textColorClass}`}>Tap to load model</span>
            <input type="file" className="hidden" accept=".glb,.gltf" onChange={onChange} />
        </label>
    </div>
);

const ModelViewerPlaceholder: React.FC<{ onFileChange: (file: File) => void; modelLabel: string; }> = ({ onFileChange, modelLabel }) => (
    <div className="w-full h-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col justify-center items-center text-center p-4 bg-gray-50">
        <h3 className="text-lg font-semibold text-gray-700">Model {modelLabel}</h3>
        <p className="text-sm text-gray-500 mt-2 mb-4">Load a .glb or .gltf file.</p>
        <label className="bg-coral-blue hover:bg-opacity-90 text-white font-bold py-2 px-6 rounded-full transition-colors duration-200 cursor-pointer shadow-md">
            <span>Select File</span>
            <input
                type="file"
                className="hidden"
                accept=".glb,.gltf"
                onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                        onFileChange(e.target.files[0]);
                    }
                }}
            />
        </label>
    </div>
);

const ModelComparisonPage: React.FC<{ onNavigateBack: () => void; }> = ({ onNavigateBack }) => {
    // Start with null to avoid confusion with default models
    const [modelA, setModelA] = React.useState<string | null>(null);
    const [modelB, setModelB] = React.useState<string | null>(null);
    
    const [modelAName, setModelAName] = React.useState<string>('');
    const [modelBName, setModelBName] = React.useState<string>('');
    
    // Slider value from 0 to 1
    const [mixValue, setMixValue] = React.useState(0.5);

    // Alignment Offsets for Model B (Overlay) - Now stored as Percentage (-100 to 100)
    const [xOffset, setXOffset] = React.useState(0);
    const [yOffset, setYOffset] = React.useState(0);
    const [zOffset, setZOffset] = React.useState(0);
    const [scale, setScale] = React.useState(1);

    const handleFileChange = (file: File, setModel: React.Dispatch<React.SetStateAction<string | null>>, setName: React.Dispatch<React.SetStateAction<string>>) => {
        // Validate file type
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (extension !== 'glb' && extension !== 'gltf') {
            alert('Unsupported file format. Please upload a .glb or .gltf file.');
            return;
        }

        // Use FileReader to convert to Base64 to avoid Blob URL issues and ensuring potential sync compatibility
        const reader = new FileReader();
        reader.onloadend = () => {
            setModel(reader.result as string);
            setName(file.name);
        };
        reader.readAsDataURL(file);
    };
    
    // Calculate opacities based on slider mix value
    const opacityA = Math.min(1, mixValue * 2);
    const opacityB = Math.min(1, (1 - mixValue) * 2);

    const resetAlignment = () => {
        setXOffset(0);
        setYOffset(0);
        setZOffset(0);
        setScale(1);
    };

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg space-y-6 flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4 gap-2">
                <h2 className="text-2xl font-bold text-coral-dark">3D Model Comparison</h2>
                <button
                    onClick={onNavigateBack}
                    className="bg-gray-200 hover:bg-gray-300 text-coral-dark font-bold py-2 px-4 rounded-lg transition-colors duration-200 self-start sm:self-center"
                >
                    &larr; Back
                </button>
            </div>

            {/* Viewer Section */}
            <div className="relative h-96 w-full bg-gray-100 rounded-2xl overflow-hidden shadow-inner border border-gray-200">
                {modelA ? (
                    <ModelViewer
                        src={modelA}
                        alt="Model A"
                        cameraControls
                        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, opacity: opacityA }}
                    />
                ) : (
                    <div className="absolute inset-0 p-4"><ModelViewerPlaceholder onFileChange={(file) => handleFileChange(file, setModelA, setModelAName)} modelLabel="A (Base)" /></div>
                )}
                
                {modelB ? (
                     <ModelViewer
                        src={modelB}
                        alt="Model B"
                        cameraControls
                        // Apply offsets to camera-target to shift model B relative to view
                        // Mapping -100% to 100% -> -50m to 50m (Increased range by 5x)
                        camera-target={`${xOffset / 2}m ${yOffset / 2}m ${zOffset / 2}m`}
                        scale={`${scale} ${scale} ${scale}`}
                        style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, opacity: opacityB, touchAction: 'none' }}
                    />
                ) : (
                    modelA && <div className="absolute inset-0 p-4 pointer-events-none"><div className="w-full h-full flex items-end justify-center pb-8"><span className="bg-white/80 px-3 py-1 rounded-full text-sm text-gray-600 backdrop-blur-sm">No Overlay Loaded</span></div></div>
                )}
                
                {/* Visual Indicator Labels */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                    {modelA && <span className="bg-coral-blue/90 text-white text-xs px-2 py-1 rounded shadow-sm backdrop-blur-sm" style={{ opacity: Math.max(0.4, opacityA) }}>Base: {modelAName}</span>}
                    {modelB && <span className="bg-coral-green/90 text-coral-dark text-xs px-2 py-1 rounded shadow-sm backdrop-blur-sm" style={{ opacity: Math.max(0.4, opacityB) }}>Overlay: {modelBName}</span>}
                </div>
            </div>
            
            {/* Controls Section */}
            <div className="space-y-6 bg-white rounded-xl">
                <div className="grid grid-cols-2 gap-4">
                    <CustomFileInput 
                        label="Model A (Base)"
                        fileName={modelAName}
                        onChange={(e) => e.target.files && handleFileChange(e.target.files[0], setModelA, setModelAName)}
                        colorClass="bg-blue-50 hover:bg-blue-100 border-blue-200"
                        textColorClass="text-blue-800"
                    />
                    <CustomFileInput 
                        label="Model B (Overlay)"
                        fileName={modelBName}
                        onChange={(e) => e.target.files && handleFileChange(e.target.files[0], setModelB, setModelBName)}
                        colorClass="bg-teal-50 hover:bg-teal-100 border-teal-200"
                        textColorClass="text-teal-800"
                    />
                </div>
                
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                     <div className="flex justify-between items-center mb-2">
                        <label htmlFor="mix-slider" className="text-sm font-bold text-gray-700">
                            View Mix
                        </label>
                        <span className="text-sm font-mono text-gray-600 bg-white px-2 py-0.5 rounded border">
                            {Math.round(mixValue * 100)}%
                        </span>
                     </div>
                     <input
                        id="mix-slider"
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={mixValue}
                        onChange={(e) => setMixValue(parseFloat(e.target.value))}
                        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-coral-blue"
                        disabled={!modelA || !modelB}
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1 px-1 font-medium">
                        <span>Overlay (B) Only</span>
                        <span>Both</span>
                        <span>Base (A) Only</span>
                    </div>
                </div>

                {/* Alignment Controls */}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <div className="flex justify-between items-center mb-3">
                        <h4 className="text-sm font-bold text-gray-700">Overlay Alignment (Move/Scale B)</h4>
                        <button onClick={resetAlignment} disabled={!modelB} className="text-xs text-coral-blue hover:underline disabled:text-gray-400">Reset</button>
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        {/* Position Sliders */}
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-500 w-4">X</span>
                            <input type="range" min="-100" max="100" step="1" value={xOffset} onChange={e => setXOffset(parseInt(e.target.value))} disabled={!modelB} className="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-coral-green" />
                            <span className="text-xs font-mono text-gray-500 w-14 text-right">{xOffset}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-500 w-4">Y</span>
                            <input type="range" min="-100" max="100" step="1" value={yOffset} onChange={e => setYOffset(parseInt(e.target.value))} disabled={!modelB} className="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-coral-green" />
                            <span className="text-xs font-mono text-gray-500 w-14 text-right">{yOffset}%</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-gray-500 w-4">Z</span>
                            <input type="range" min="-100" max="100" step="1" value={zOffset} onChange={e => setZOffset(parseInt(e.target.value))} disabled={!modelB} className="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-coral-green" />
                            <span className="text-xs font-mono text-gray-500 w-14 text-right">{zOffset}%</span>
                        </div>
                        
                        {/* Scale Slider */}
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200">
                            <span className="text-xs font-bold text-gray-500 w-4">Scale</span>
                            <input type="range" min="0.1" max="5" step="0.01" value={scale} onChange={e => setScale(parseFloat(e.target.value))} disabled={!modelB} className="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-500" />
                            <span className="text-xs font-mono text-gray-500 w-14 text-right">{scale.toFixed(2)}x</span>
                        </div>
                    </div>
                </div>
                
                <p className="text-xs text-center text-gray-400">
                    Supports .glb and .gltf formats only. (Please convert .obj files)
                </p>
            </div>
        </div>
    );
};

export default ModelComparisonPage;
