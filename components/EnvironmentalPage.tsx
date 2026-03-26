
import * as React from 'react';
import { SunIcon, GlobeAltIcon, ArrowUpIcon, ArrowDownIcon, MoonIcon, ThermometerIcon } from './Icons';

interface EnvironmentalPageProps {
  onNavigateBack: () => void;
}

interface TideData {
    currentHeight: number;
    trend: 'rising' | 'falling';
    nextHigh: { time: string; height: number };
    nextLow: { time: string; height: number };
}

interface UvData {
    currentIndex: number;
    maxIndex: number;
}

interface MoonData {
    phaseName: string;
    nextFullDates: Date[];
}

const getUvInfo = (index: number): { level: string; color: string; textColor: string; } => {
    if (index <= 2) return { level: 'Low', color: 'bg-green-500', textColor: 'text-green-600' };
    if (index <= 5) return { level: 'Moderate', color: 'bg-yellow-500', textColor: 'text-yellow-600' };
    if (index <= 7) return { level: 'High', color: 'bg-orange-500', textColor: 'text-orange-600' };
    if (index <= 10) return { level: 'Very High', color: 'bg-red-500', textColor: 'text-red-600' };
    return { level: 'Extreme', color: 'bg-purple-600', textColor: 'text-purple-700' };
};

const LiveDataCardSkeleton: React.FC = () => (
    <div className="p-4 border-2 border-coral-blue rounded-lg bg-gray-50 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-10 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
    </div>
);

const calculateMoonData = (): MoonData => {
    const date = new Date();
    const synodic = 29.53058867;
    const msPerDay = 86400000;
    // Known new moon: Jan 6 2000 18:14 UTC
    const baseDate = new Date('2000-01-06T18:14:00Z');
    
    const diffTime = date.getTime() - baseDate.getTime();
    const totalDays = diffTime / msPerDay;
    const cycleAge = totalDays % synodic; // Age in days
    
    let phaseName = '';
    if (cycleAge < 1.84566) phaseName = 'New Moon';
    else if (cycleAge < 5.53699) phaseName = 'Waxing Crescent';
    else if (cycleAge < 9.22831) phaseName = 'First Quarter';
    else if (cycleAge < 12.91963) phaseName = 'Waxing Gibbous';
    else if (cycleAge < 16.61096) phaseName = 'Full Moon';
    else if (cycleAge < 20.30228) phaseName = 'Waning Gibbous';
    else if (cycleAge < 23.99361) phaseName = 'Last Quarter';
    else if (cycleAge < 27.68493) phaseName = 'Waning Crescent';
    else phaseName = 'New Moon';

    // Calculate next 3 full moons
    // Full moon happens at cycle age ~14.7653
    // Time until next full moon = (targetAge - currentAge + period) % period
    const daysUntilNextFull = (14.7653 - cycleAge + synodic) % synodic;
    
    const nextFullDates = [];
    for(let i=0; i<3; i++) {
        const d = new Date(date.getTime() + (daysUntilNextFull + (i * synodic)) * msPerDay);
        nextFullDates.push(d);
    }
    
    return { phaseName, nextFullDates };
}


const EnvironmentalPage: React.FC<EnvironmentalPageProps> = ({
  onNavigateBack
}) => {
    const [tideData, setTideData] = React.useState<TideData | null>(null);
    const [uvData, setUvData] = React.useState<UvData | null>(null);
    // Initialize Moon Data immediately as it doesn't require fetching
    const [moonData] = React.useState<MoonData>(() => calculateMoonData());
    const [isLoading, setIsLoading] = React.useState(true);

    // SST Card State
    const [sstData, setSstData] = React.useState<{ temp: number } | null>(null);
    const [sstSource, setSstSource] = React.useState<string>('');
    const [isSstLoading, setIsSstLoading] = React.useState(false);

    const FITZROY_ISLAND_URL = 'https://seatemperature.info/fitzroy-island-water-temperature.html';

    React.useEffect(() => {
        setIsLoading(true);
        // Simulate fetching data for Tide/UV
        const timer = setTimeout(() => {
            setTideData({
                currentHeight: 1.82,
                trend: 'falling',
                nextHigh: { time: '08:45 PM', height: 2.5 },
                nextLow: { time: '02:30 PM', height: 0.9 },
            });
            setUvData({
                currentIndex: 7,
                maxIndex: 12,
            });
            
            setIsLoading(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    const handleFetchExternalSST = async () => {
        setIsSstLoading(true);
        setSstData(null);
        try {
            // Using corsproxy.io as a more reliable CORS proxy
            const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(FITZROY_ISLAND_URL)}`;
            const response = await fetch(proxyUrl);
            
            if (!response.ok) throw new Error(`Network response from proxy was not ok: ${response.statusText}`);
            
            const htmlText = await response.text();
            
            // Regex to find the temperature. 
            // Common patterns on seatemperature.info: <span class="big_temp">28.3</span> or similar.
            // We search for a number followed immediately by &deg;C or inside a specific class.
            const patterns = [
                /class="big_temp">([\d.]+)<\/span>/,
                /id="t" class="w">([\d.]+)<\/span>/,
                /([\d.]+)\s*&deg;C/
            ];

            let temp: number | null = null;

            for (const pattern of patterns) {
                const match = htmlText.match(pattern);
                if (match && match[1]) {
                    temp = parseFloat(match[1]);
                    break;
                }
            }

            if (temp !== null && !isNaN(temp)) {
                setSstData({ temp });
                setSstSource(`Live: seatemperature.info (Fitzroy Island)`);
            } else {
                throw new Error('Could not parse temperature from page content.');
            }

        } catch (error) {
            console.warn("External Fetch Failed (Switching to Simulation):", error);
            // Fallback Simulation
            const baseTemp = 28.0;
            const noise = (Math.random() - 0.5) * 2; 
            setSstData({ temp: baseTemp + noise });
            setSstSource('Simulation (Live Data Unavailable)');
        } finally {
            setIsSstLoading(false);
        }
    };

    // Auto-fetch Fitzroy Island data on mount
    React.useEffect(() => {
        handleFetchExternalSST();
    }, []);

    const uvInfo = uvData ? getUvInfo(uvData.currentIndex) : null;

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg space-y-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4">
                <h2 className="text-2xl font-bold text-coral-dark mb-2 sm:mb-0">Environmental Monitoring</h2>
                <button
                    onClick={onNavigateBack}
                    className="bg-gray-200 hover:bg-gray-300 text-coral-dark font-bold py-2 px-4 rounded-lg transition-colors duration-200 self-start sm:self-center"
                >
                    &larr; Back to Details
                </button>
            </div>
      
            <div>
                <h3 className="text-xl font-bold text-coral-dark mb-4">Live Conditions: Cairns</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Tide Status Card */}
                    {isLoading ? <LiveDataCardSkeleton /> : (
                        <div className="p-3 border-2 border-coral-blue rounded-lg space-y-3 bg-gray-50">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="bg-coral-blue/10 p-2 rounded-full">
                                    <GlobeAltIcon className="w-5 h-5 text-coral-blue"/>
                                </div>
                                <h3 className="font-semibold text-gray-700 text-base">Tide Status</h3>
                            </div>
                            {tideData && (
                                <>
                                    <div className="text-center">
                                        <p className="text-3xl sm:text-4xl font-bold text-coral-dark">{tideData.currentHeight.toFixed(2)}m</p>
                                        <div className={`flex items-center justify-center gap-1 font-semibold ${tideData.trend === 'rising' ? 'text-green-600' : 'text-blue-600'}`}>
                                            {tideData.trend === 'rising' ? <ArrowUpIcon className="w-4 h-4"/> : <ArrowDownIcon className="w-4 h-4"/>}
                                            <span className="text-sm">{tideData.trend === 'rising' ? 'Rising' : 'Falling'}</span>
                                        </div>
                                    </div>
                                    <div className="text-xs sm:text-sm text-gray-600 space-y-1 pt-2">
                                        <div className="flex justify-between flex-wrap"><span>Next Low:</span> <span className="font-medium">{tideData.nextLow.time} ({tideData.nextLow.height}m)</span></div>
                                        <div className="flex justify-between flex-wrap"><span>Next High:</span> <span className="font-medium">{tideData.nextHigh.time} ({tideData.nextHigh.height}m)</span></div>
                                    </div>
                                </>
                            )}
                            <div className="flex justify-end pt-2">
                                <a href="http://www.bom.gov.au/australia/tides/#!/qld-cairns" target="_blank" rel="noopener noreferrer" className="text-xs text-coral-blue hover:underline">View full chart</a>
                            </div>
                        </div>
                    )}

                    {/* UV Index Card */}
                    {isLoading ? <LiveDataCardSkeleton /> : (
                        <div className="p-3 border-2 border-coral-blue rounded-lg space-y-3 bg-gray-50">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="bg-coral-blue/10 p-2 rounded-full">
                                    <SunIcon className="w-5 h-5 text-coral-blue"/>
                                </div>
                                <h3 className="font-semibold text-gray-700 text-base">UV Index</h3>
                            </div>
                            {uvData && uvInfo && (
                                <>
                                    <div className="text-center">
                                        <p className={`text-3xl sm:text-4xl font-bold ${uvInfo.textColor}`}>{uvData.currentIndex}</p>
                                        <p className={`font-bold text-sm sm:text-base px-3 py-0.5 rounded-full inline-block ${uvInfo.color} text-white`}>{uvInfo.level}</p>
                                    </div>
                                    <div className="text-xs sm:text-sm text-gray-600 space-y-1 pt-2">
                                        <div className="flex justify-between"><span>Today's Max:</span> <span className="font-medium">UV {uvData.maxIndex}</span></div>
                                    </div>
                                </>
                            )}
                            <div className="flex justify-end pt-2">
                                <a href="http://www.bom.gov.au/qld/forecasts/cairns.shtml" target="_blank" rel="noopener noreferrer" className="text-xs text-coral-blue hover:underline">View full forecast</a>
                            </div>
                        </div>
                    )}

                    {/* Moon Phase Card */}
                    <div className="p-3 border-2 border-coral-blue rounded-lg space-y-3 bg-gray-50">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="bg-coral-blue/10 p-2 rounded-full">
                                <MoonIcon className="w-5 h-5 text-coral-blue"/>
                            </div>
                            <h3 className="font-semibold text-gray-700 text-base">Moon Phase</h3>
                        </div>
                        {moonData && (
                            <>
                                <div className="text-center">
                                    <p className="text-xl sm:text-2xl font-bold text-coral-dark py-2">{moonData.phaseName}</p>
                                </div>
                                <div className="text-xs sm:text-sm text-gray-600 space-y-1 pt-2 border-t border-gray-200">
                                    <p className="font-semibold text-gray-700">Upcoming Full Moons:</p>
                                    <ul className="list-disc list-inside space-y-0.5">
                                        {moonData.nextFullDates.map(d => (
                                            <li key={d.toISOString()}>{d.toLocaleDateString()}</li>
                                        ))}
                                    </ul>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Sea Surface Temp Card */}
                    <div className="p-3 border-2 border-coral-blue rounded-lg space-y-3 bg-gray-50 flex flex-col relative overflow-hidden">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="bg-coral-blue/10 p-2 rounded-full">
                                <ThermometerIcon className="w-5 h-5 text-coral-blue"/>
                            </div>
                            <h3 className="font-semibold text-gray-700 text-base">Sea Temp (SST)</h3>
                        </div>
                        
                        <div className="flex-grow flex flex-col justify-center items-center space-y-2 min-h-[120px]">
                            {isSstLoading ? (
                                <div className="text-center flex flex-col items-center justify-center gap-2">
                                    <div className="w-6 h-6 border-2 border-coral-blue border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-xs text-gray-500">Fetching Fitzroy Data...</span>
                                </div>
                            ) : sstData ? (
                                <div className="text-center w-full animate-fade-in">
                                    <p className="text-4xl font-bold text-coral-dark mb-1">{sstData.temp.toFixed(1)}°C</p>
                                    <p className="text-[10px] text-gray-500 mb-3 px-2">{sstSource}</p>
                                    
                                    <button 
                                        onClick={handleFetchExternalSST} 
                                        className="text-xs bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium py-1 px-3 rounded shadow-sm transition-colors"
                                    >
                                        Refresh Data
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <p className="text-sm text-gray-500 mb-2">Data Unavailable</p>
                                    <button 
                                        onClick={handleFetchExternalSST} 
                                        className="text-xs bg-coral-blue text-white font-bold py-1 px-3 rounded hover:bg-opacity-90 transition-colors"
                                    >
                                        Retry
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="border-t pt-8">
                <h3 className="text-xl font-bold text-coral-dark mb-4">External Resources</h3>
                <div className="p-4 border-2 border-coral-blue rounded-lg space-y-3 bg-gray-50 flex flex-col justify-between">
                    <div>
                        <h3 className="font-semibold text-gray-700 text-lg">NOAA Sea Surface Temperature</h3>
                        <p className="text-sm text-gray-500 mt-2">
                            Access real-time sea surface temperature data for your region directly from NOAA's satellite monitoring.
                        </p>
                    </div>
                    <div className="flex justify-end mt-4">
                        <a
                            href="https://www.ospo.noaa.gov/Products/ocean/sst/contour/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-coral-green hover:bg-opacity-90 text-coral-dark font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                        >
                            View NOAA Data
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnvironmentalPage;
