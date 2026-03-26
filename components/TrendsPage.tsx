import * as React from 'react';
import type { CoralBranch, MaintenanceLog, Site, Tree, Anchor, SpongeLevel } from '../types';
import { GoogleGenAI } from "@google/genai";
import { SparklesIcon, ArrowPathIcon } from './Icons';

interface TrendsPageProps {
  coralBranches: CoralBranch[];
  maintenanceLogs: MaintenanceLog[];
  sites: Site[];
  trees: Tree[];
  anchors: Anchor[];
  onNavigateBack: () => void;
}

type ChartDataPoint = {
  label: string;
  value: number;
};

const DualLineChart: React.FC<{
    labels: string[];
    data1: number[];
    data2: number[];
    label1: string;
    label2: string;
    color1: string;
    color2: string;
}> = ({ labels, data1, data2, label1, label2, color1, color2 }) => {
  if (labels.length < 2) {
    return <div className="text-center text-sm text-gray-500 py-8 h-64 flex items-center justify-center">Not enough data to display a chart.</div>;
  }
  
  const width = 500;
  const height = 250;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const yMax = Math.max(...data1, ...data2, 0);

  const getX = (index: number) => (index / (labels.length - 1)) * chartWidth + padding.left;
  const getY = (value: number) => height - padding.bottom - (value / (yMax || 1)) * chartHeight;

  const pathD1 = data1.map((p, i) => i === 0 ? `M ${getX(i)} ${getY(p)}` : `L ${getX(i)} ${getY(p)}`).join(' ');
  const pathD2 = data2.map((p, i) => i === 0 ? `M ${getX(i)} ${getY(p)}` : `L ${getX(i)} ${getY(p)}`).join(' ');

  const numTicks = 5;
  const yTicks = Array.from({ length: numTicks + 1 }, (_, i) => (Math.ceil(yMax / numTicks) * i));

  return (
     <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img">
        {yTicks.map(val => (
            <g key={`y-tick-${val}`}>
                <line x1={padding.left} x2={width - padding.right} y1={getY(val)} y2={getY(val)} stroke="rgba(0,0,0,0.05)"/>
                <text x={padding.left - 8} y={getY(val)} dy="0.32em" textAnchor="end" className="text-[10px] fill-gray-500">{val}</text>
            </g>
        ))}
        <g>
            <text x={padding.left} y={height - padding.bottom + 15} textAnchor="start" className="text-[10px] fill-gray-500">{labels[0]}</text>
            <text x={width - padding.right} y={height - padding.bottom + 15} textAnchor="end" className="text-[10px] fill-gray-500">{labels[labels.length - 1]}</text>
        </g>
        
        <path d={pathD1} fill="none" stroke={color1} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d={pathD2} fill="none" stroke={color2} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="flex justify-center items-center gap-4 mt-2 text-xs text-gray-600">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{backgroundColor: color1}}></div><span>{label1}</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full" style={{backgroundColor: color2}}></div><span>{label2}</span></div>
      </div>
    </div>
  );
};


const LineChart: React.FC<{ data: ChartDataPoint[]; color: string; yAxisLabel: string }> = ({ data, color, yAxisLabel }) => {
  if (data.length < 2) {
    return <div className="text-center text-sm text-gray-500 py-8 h-64 flex items-center justify-center">Not enough data to display a chart.</div>;
  }
  
  const width = 500;
  const height = 250;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  
  const maxValue = Math.max(...data.map(p => p.value), 0);
  const yMax = maxValue === 0 ? 100 : Math.ceil(maxValue / 10) * 10; // Round up to nearest 10

  const getX = (index: number) => (index / (data.length - 1)) * chartWidth + padding.left;
  const getY = (value: number) => height - padding.bottom - (value / (yMax || 1)) * chartHeight;

  const pathD = data.map((p, i) => i === 0 ? `M ${getX(i)} ${getY(p.value)}` : `L ${getX(i)} ${getY(p.value)}`).join(' ');
  const areaPathD = `${pathD} V ${height - padding.bottom} H ${padding.left} Z`;

  // Y-axis ticks
  const numTicks = 5;
  const yTicks = Array.from({ length: numTicks + 1 }, (_, i) => (yMax / numTicks) * i);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img">
        {/* Y-axis grid lines and labels */}
        {yTicks.map(val => (
            <g key={`y-tick-${val}`}>
                <line 
                    x1={padding.left} 
                    x2={width - padding.right} 
                    y1={getY(val)} 
                    y2={getY(val)} 
                    stroke="rgba(0,0,0,0.05)"
                />
                <text
                    x={padding.left - 8}
                    y={getY(val)}
                    dy="0.32em"
                    textAnchor="end"
                    className="text-[10px] fill-gray-500"
                >{val.toFixed(0)}</text>
            </g>
        ))}
        <text x={padding.left - 40} y={padding.top + chartHeight/2} className="text-[10px] fill-gray-600 font-medium" transform={`rotate(-90, ${padding.left - 40}, ${padding.top + chartHeight/2})`}>{yAxisLabel}</text>

        {/* X-axis labels */}
        <g>
            <text x={padding.left} y={height - padding.bottom + 15} textAnchor="start" className="text-[10px] fill-gray-500">
                {data[0].label}
            </text>
             <text x={width - padding.right} y={height - padding.bottom + 15} textAnchor="end" className="text-[10px] fill-gray-500">
                {data[data.length - 1].label}
            </text>
        </g>
        
        <defs>
          <linearGradient id={`areaGradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.2}/>
            <stop offset="100%" stopColor={color} stopOpacity={0}/>
          </linearGradient>
        </defs>

        <path d={areaPathD} fill={`url(#areaGradient-${color.replace('#', '')})`} />
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};


const TrendsPage: React.FC<TrendsPageProps> = ({ coralBranches, maintenanceLogs, sites, trees, anchors, onNavigateBack }) => {
    // --- AI ANALYSIS STATE ---
    const [aiQuery, setAiQuery] = React.useState('');
    const [aiResponse, setAiResponse] = React.useState('');
    const [isAiLoading, setIsAiLoading] = React.useState(false);

    const handleAiAnalysis = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!aiQuery.trim()) return;

        setIsAiLoading(true);
        setAiResponse('');

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // Construct a compact representation of the data to avoid token limits
            const contextData = {
                sites: sites.map(s => ({ id: s.id, name: s.name, isArchived: s.isArchived })),
                trees: trees.map(t => ({ id: t.id, number: t.number, type: t.type || 'Tree', depth: t.currentDepth, isArchived: t.isArchived })),
                inventorySummary: coralBranches.map(b => ({
                    id: b.id,
                    fragmentId: b.fragmentId,
                    genus: b.genus,
                    species: b.species,
                    site: b.site,
                    structure: `${b.treeType || 'Tree'} ${b.tree}`,
                    latestHealth: b.healthReports[0]?.healthPercentage || 'N/A',
                    isArchived: b.isArchived || false
                })),
                maintenanceSummary: maintenanceLogs.slice(0, 50).map(l => ({
                    date: l.timestamp.split('T')[0],
                    target: l.target,
                    tasks: l.tasks.join(', '),
                    notes: l.notes
                }))
            };

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `The following is the data from our Coral Nursery Management App. 
                Please analyze the data and answer the user's question. 
                ONLY use the provided data. Do not provide information outside this scope.
                
                DATA CONTEXT:
                ${JSON.stringify(contextData)}
                
                USER QUESTION:
                ${aiQuery}`,
                config: {
                    systemInstruction: "You are an expert marine biologist and data analyst for a coral nursery. Provide concise, data-driven answers based strictly on the provided nursery inventory and logs. If the answer cannot be determined from the data, explicitly state that.",
                }
            });

            setAiResponse(response.text || "No response received.");
        } catch (error: any) {
            console.error("AI Analysis failed:", error);
            setAiResponse("Analysis failed. Please ensure your API key is configured and try again.");
        } finally {
            setIsAiLoading(false);
        }
    };

    const maintenanceVsGrowthData = React.useMemo<{
        labels: string[];
        maintenance: number[];
        newBranches: number[];
    }>(() => {
        const dataByMonth: { [month: string]: { maintenance: number; newBranches: number } } = {};

        maintenanceLogs.forEach(log => {
            const month = log.timestamp.substring(0, 7); // YYYY-MM
            if (!dataByMonth[month]) dataByMonth[month] = { maintenance: 0, newBranches: 0 };
            dataByMonth[month].maintenance++;
        });

        coralBranches.forEach(branch => {
            const month = branch.dateAdded.substring(0, 7); // YYYY-MM
            if (!dataByMonth[month]) dataByMonth[month] = { maintenance: 0, newBranches: 0 };
            dataByMonth[month].newBranches++;
        });

        const sortedMonths = Object.keys(dataByMonth).sort();
        if (sortedMonths.length < 2) return { labels: [], maintenance: [], newBranches: [] };
        
        return {
            labels: sortedMonths,
            maintenance: sortedMonths.map(m => dataByMonth[m].maintenance),
            newBranches: sortedMonths.map(m => dataByMonth[m].newBranches),
        };
    }, [maintenanceLogs, coralBranches]);

    const cleaningFrequency = React.useMemo(() => {
        const cleaningsPerTree: { [treeId: string]: number } = {};
        maintenanceLogs.forEach(log => {
            if (log.tasks.includes('Cleaned tree')) {
                cleaningsPerTree[log.treeId] = (cleaningsPerTree[log.treeId] || 0) + 1;
            }
        });
        
        // Fix: Only process active (non-archived) sites
        const activeSites = (sites || []).filter(s => !s.isArchived);

        return activeSites.map(site => {
            const siteAnchors = anchors.filter(a => a.siteId === site.id);
            const siteAnchorIds = new Set(siteAnchors.map(a => a.id));
            const siteTrees = trees.filter(tree => siteAnchorIds.has(tree.anchorId));

            const siteTreeCleanings = siteTrees
                .map(tree => ({ tree, count: cleaningsPerTree[tree.id] || 0 }))
                .filter(item => item.count > 0); 

            if (siteTreeCleanings.length === 0) {
                return { site, most: null, least: null };
            }

            const sorted = [...siteTreeCleanings].sort((a, b) => b.count - a.count);

            return {
                site,
                most: sorted[0],
                least: sorted.length > 1 ? sorted[sorted.length - 1] : sorted[0],
            };
        });
    }, [maintenanceLogs, sites, trees, anchors]);

    const monthlyHealthData = React.useMemo<ChartDataPoint[]>(() => {
        const monthlyAverages: { [month: string]: { total: number; count: number } } = {};
        coralBranches.forEach(branch => {
            branch.healthReports.forEach(report => {
                const month = report.date.substring(0, 7); // YYYY-MM
                if (!monthlyAverages[month]) {
                    monthlyAverages[month] = { total: 0, count: 0 };
                }
                monthlyAverages[month].total += report.healthPercentage;
                monthlyAverages[month].count++;
            });
        });
        
        return Object.entries(monthlyAverages)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, data]) => ({ label: month, value: data.total / data.count }));

    }, [coralBranches]);

    const monthlyGrowthData = React.useMemo<ChartDataPoint[]>(() => {
        const monthlyAverages: { [month: string]: { total: number; count: number } } = {};
         coralBranches.forEach(branch => {
            branch.growthReports.forEach(report => {
                const month = report.date.substring(0, 7); // YYYY-MM
                if (!monthlyAverages[month]) {
                    monthlyAverages[month] = { total: 0, count: 0 };
                }
                monthlyAverages[month].total += report.surfaceAreaM2;
                monthlyAverages[month].count++;
            });
        });
        
        return Object.entries(monthlyAverages)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, data]) => ({ label: month, value: data.total / data.count }));
    }, [coralBranches]);
    
    const cumulativeMortalityData = React.useMemo<ChartDataPoint[]>(() => {
        const archivedBranches = coralBranches.filter(b => b.isArchived);
        if (archivedBranches.length === 0) return [];
        
        const monthlyCounts: { [month: string]: number } = {};
        archivedBranches.forEach(branch => {
             // Use dateAdded as a proxy for when mortality occurred
            const month = branch.dateAdded.substring(0, 7);
            monthlyCounts[month] = (monthlyCounts[month] || 0) + 1;
        });

        const sortedMonths = Object.keys(monthlyCounts).sort((a,b) => a.localeCompare(b));
        let cumulativeCount = 0;
        
        return sortedMonths.map(month => {
            cumulativeCount += monthlyCounts[month];
            return { label: month, value: cumulativeCount };
        });

    }, [coralBranches]);
    
    const spongePopulationData = React.useMemo<ChartDataPoint[]>(() => {
        const spongeLevels: { [key in SpongeLevel]: number } = {
            'None': 0,
            'Small': 1,
            'Medium': 2,
            'Large': 3
        };

        const monthlyScores: { [month: string]: { totalScore: number; count: number } } = {};

        maintenanceLogs.forEach(log => {
            if (log.spongeRemoved) {
                const month = log.timestamp.substring(0, 7);
                const score = spongeLevels[log.spongeRemoved];
                
                if (!monthlyScores[month]) {
                    monthlyScores[month] = { totalScore: 0, count: 0 };
                }
                monthlyScores[month].totalScore += score;
                monthlyScores[month].count++;
            }
        });

        return Object.entries(monthlyScores)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([month, data]) => ({ label: month, value: data.totalScore / data.count }));
    }, [maintenanceLogs]);


  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4">
        <h2 className="text-2xl font-bold text-coral-dark mb-2 sm:mb-0">Trends & Data Analysis</h2>
        <button
          onClick={onNavigateBack}
          className="bg-gray-200 hover:bg-gray-300 text-coral-dark font-bold py-2 px-4 rounded-lg transition-colors duration-200 self-start sm:self-center"
        >
          &larr; Back to Dashboard
        </button>
      </div>

      {/* --- AI DATA ANALYST SECTION --- */}
      <div className="bg-coral-blue/5 border-2 border-coral-blue rounded-xl overflow-hidden shadow-sm">
        <header className="bg-coral-blue p-4 text-white flex items-center gap-3">
            <SparklesIcon className="w-6 h-6" />
            <h3 className="text-lg font-bold">Nursery Data Analyst (AI)</h3>
        </header>
        <div className="p-4 space-y-4">
            <p className="text-sm text-gray-600">Ask a question about your nursery inventory, health reports, or maintenance history. The analysis is limited to data currently in the app.</p>
            <form onSubmit={handleAiAnalysis} className="flex flex-col gap-2">
                <div className="relative">
                    <input 
                        type="text" 
                        value={aiQuery}
                        onChange={e => setAiQuery(e.target.value)}
                        placeholder="e.g., Which site has the best average coral health?"
                        className="w-full p-3 pr-12 border-2 border-gray-200 rounded-xl bg-white text-gray-900 focus:border-coral-blue outline-none shadow-inner"
                    />
                    <button 
                        type="submit" 
                        disabled={isAiLoading || !aiQuery.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-coral-blue hover:scale-110 disabled:opacity-30 disabled:scale-100 transition-all"
                    >
                        {isAiLoading ? <ArrowPathIcon className="w-6 h-6 animate-spin"/> : <SparklesIcon className="w-6 h-6"/>}
                    </button>
                </div>
            </form>
            
            {(aiResponse || isAiLoading) && (
                <div className="mt-4 p-4 bg-white rounded-xl border border-coral-blue/20 shadow-sm animate-fade-in">
                    <h4 className="text-[10px] font-black uppercase text-coral-blue mb-2 tracking-widest flex items-center gap-2">
                        Analysis Result
                        {isAiLoading && <div className="w-2 h-2 bg-coral-blue rounded-full animate-ping"></div>}
                    </h4>
                    {isAiLoading ? (
                        <div className="space-y-2">
                            <div className="h-3 bg-gray-100 rounded animate-pulse w-full"></div>
                            <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4"></div>
                            <div className="h-3 bg-gray-100 rounded animate-pulse w-5/6"></div>
                        </div>
                    ) : (
                        <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                            {aiResponse}
                        </div>
                    )}
                </div>
            )}
        </div>
      </div>

      <div className="space-y-8">
        <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Maintenance vs. New Branches Added</h3>
            <div className="p-4 border-2 border-coral-blue rounded-lg bg-gray-50">
                 <DualLineChart 
                    labels={maintenanceVsGrowthData.labels}
                    data1={maintenanceVsGrowthData.maintenance}
                    data2={maintenanceVsGrowthData.newBranches}
                    label1="Maintenance Logs"
                    label2="New Branches"
                    color1="#F59E0B" // amber-500
                    color2="#10B981" // emerald-500
                 />
            </div>
        </div>

        <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Tree Cleaning Frequency</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cleaningFrequency.map(({ site, most, least }) => (
                    <div key={site.id} className="p-4 border-2 border-coral-blue rounded-lg bg-gray-50">
                        <h4 className="font-bold text-coral-dark">{site.name}</h4>
                        <div className="mt-2 text-sm space-y-2">
                            {most ? (
                                <p><strong>Most Cleaned:</strong> Tree #{most.tree.number} ({most.count} times)</p>
                            ) : (
                                <p className="text-gray-500">No cleaning data for this site.</p>
                            )}
                            {least && most && least.tree.id !== most.tree.id ? (
                                <p><strong>Least Cleaned:</strong> Tree #{least.tree.number} ({least.count} times)</p>
                            ) : null}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        <div className="border-t pt-8">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Overall Nursery Health</h3>
            <div className="p-4 border-2 border-coral-blue rounded-lg bg-gray-50">
                 <LineChart data={monthlyHealthData} color="#4A90E2" yAxisLabel="Avg. Health (%)"/>
            </div>
        </div>
        
        <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Average Growth (Surface Area)</h3>
            <div className="p-4 border-2 border-coral-blue rounded-lg bg-gray-50">
                <LineChart data={monthlyGrowthData} color="#50E3C2" yAxisLabel="Avg. Surface Area (m²)"/>
            </div>
        </div>
        
         <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Cumulative Branch Mortality</h3>
            <div className="p-4 border-2 border-coral-blue rounded-lg bg-gray-50">
                <LineChart data={cumulativeMortalityData} color="#E53E3E" yAxisLabel="Total Archived Branches"/>
            </div>
        </div>
        
        <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Sponge Population Trends</h3>
            <div className="p-4 border-2 border-coral-blue rounded-lg bg-gray-50">
                 <LineChart data={spongePopulationData} color="#A855F7" yAxisLabel="Avg. Severity (0-3)"/>
                 <p className="text-xs text-center text-gray-500 mt-2">Scale: 0=None, 1=Small, 2=Medium, 3=Large</p>
            </div>
        </div>

        <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Tree Health Trends</h3>
            <div className="p-4 border-2 border-coral-blue rounded-lg bg-gray-50 text-center text-gray-500 h-64 flex items-center justify-center">
                Coming soon...
            </div>
        </div>

      </div>

    </div>
  );
};

export default TrendsPage;