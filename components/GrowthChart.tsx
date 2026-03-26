import * as React from 'react';
import type { GrowthReport } from '../types';

interface GrowthChartProps {
  reports: GrowthReport[];
}

interface Point {
  x: number;
  y1: number; // for surface area
  y2: number; // for volume
  report: GrowthReport;
}

const GrowthChart: React.FC<GrowthChartProps> = ({ reports }) => {
  const [tooltip, setTooltip] = React.useState<{ x: number, y: number, report: GrowthReport } | null>(null);

  const sortedReports = React.useMemo(() => 
    [...reports].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [reports]
  );
  
  if (sortedReports.length < 2) {
    return <div className="text-center text-sm text-gray-500 py-8">Not enough data to display a chart.</div>;
  }
  
  const width = 500;
  const height = 200;
  const padding = { top: 20, right: 50, bottom: 40, left: 50 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const firstDate = new Date(sortedReports[0].date).getTime();
  const lastDate = new Date(sortedReports[sortedReports.length - 1].date).getTime();
  const dateRange = lastDate - firstDate || 1; // Avoid division by zero

  const maxArea = Math.max(...sortedReports.map(r => r.surfaceAreaM2), 0);
  const maxVolume = Math.max(...sortedReports.map(r => r.volumeM3), 0);

  const getX = (date: string) => {
    return ((new Date(date).getTime() - firstDate) / dateRange) * chartWidth + padding.left;
  };

  const getYArea = (area: number) => {
    return height - padding.bottom - (area / (maxArea || 1)) * chartHeight;
  };

  const getYVolume = (volume: number) => {
    return height - padding.bottom - (volume / (maxVolume || 1)) * chartHeight;
  };

  const points: Point[] = sortedReports.map(report => ({
    x: getX(report.date),
    y1: getYArea(report.surfaceAreaM2),
    y2: getYVolume(report.volumeM3),
    report,
  }));

  const pathAreaD = points.map((p, i) => i === 0 ? `M ${p.x} ${p.y1}` : `L ${p.x} ${p.y1}`).join(' ');
  const pathVolumeD = points.map((p, i) => i === 0 ? `M ${p.x} ${p.y2}` : `L ${p.x} ${p.y2}`).join(' ');

  const handleMouseOver = (point: Point, type: 'area' | 'volume') => {
    setTooltip({
        x: point.x,
        y: type === 'area' ? point.y1 : point.y2,
        report: point.report,
    });
  };
  
  const handleMouseOut = () => {
      setTooltip(null);
  }

  // Create ticks for dual axes
  const numTicks = 4;
  const areaTicks = Array.from({ length: numTicks + 1 }, (_, i) => (maxArea / numTicks) * i);
  const volumeTicks = Array.from({ length: numTicks + 1 }, (_, i) => (maxVolume / numTicks) * i);

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" aria-labelledby="chart-title-growth" role="img">
        <title id="chart-title-growth">Coral Growth History Chart</title>
        
        {/* Y-axis grid lines and labels for Area (Left) */}
        {areaTicks.map(val => (
            <g key={`area-tick-${val}`}>
                <line 
                    x1={padding.left} 
                    x2={width - padding.right} 
                    y1={getYArea(val)} 
                    y2={getYArea(val)} 
                    stroke="rgba(0,0,0,0.05)"
                />
                <text
                    x={padding.left - 8}
                    y={getYArea(val)}
                    dy="0.32em"
                    textAnchor="end"
                    className="text-[10px] fill-gray-500"
                >{val.toFixed(3)}</text>
            </g>
        ))}
        <text x={padding.left - 40} y={padding.top + chartHeight/2} className="text-[10px] fill-gray-600 font-medium" transform={`rotate(-90, ${padding.left - 40}, ${padding.top + chartHeight/2})`}>Area (m²)</text>


        {/* Y-axis labels for Volume (Right) */}
        {volumeTicks.map(val => (
             <g key={`vol-tick-${val}`}>
                <text
                    x={width - padding.right + 8}
                    y={getYVolume(val)}
                    dy="0.32em"
                    textAnchor="start"
                    className="text-[10px] fill-gray-500"
                >{val.toFixed(5)}</text>
             </g>
        ))}
         <text x={width - padding.right + 40} y={padding.top + chartHeight/2} className="text-[10px] fill-coral-green/80 font-medium" transform={`rotate(90, ${width - padding.right + 40}, ${padding.top + chartHeight/2})`}>Volume (m³)</text>


        {/* X-axis labels */}
        <g>
            <text x={padding.left} y={height - padding.bottom + 15} textAnchor="start" className="text-[10px] fill-gray-500">
                {new Date(sortedReports[0].date).toLocaleDateString()}
            </text>
             <text x={width - padding.right} y={height - padding.bottom + 15} textAnchor="end" className="text-[10px] fill-gray-500">
                {new Date(sortedReports[sortedReports.length - 1].date).toLocaleDateString()}
            </text>
        </g>
        
        {/* Paths */}
        <path d={pathAreaD} fill="none" stroke="#4A90E2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d={pathVolumeD} fill="none" stroke="#50E3C2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Circles for hover */}
        {points.map((point, i) => (
          <g key={i}>
            <circle
              cx={point.x}
              cy={point.y1}
              r="4"
              fill="white"
              stroke="#4A90E2"
              strokeWidth="2"
              onMouseOver={() => handleMouseOver(point, 'area')}
              onMouseOut={handleMouseOut}
              className="cursor-pointer"
            />
            <circle
              cx={point.x}
              cy={point.y2}
              r="4"
              fill="white"
              stroke="#50E3C2"
              strokeWidth="2"
              onMouseOver={() => handleMouseOver(point, 'volume')}
              onMouseOut={handleMouseOut}
              className="cursor-pointer"
            />
          </g>
        ))}
      </svg>
      {tooltip && (
        <div 
            className="absolute p-2 text-xs bg-coral-dark text-white rounded-md shadow-lg pointer-events-none transition-opacity transform -translate-x-1/2 -translate-y-[calc(100%+10px)]"
            style={{ left: `${(tooltip.x / width) * 100}%`, top: `${(tooltip.y / height) * 100}%` }}
        >
            <div className="font-bold text-gray-300">{new Date(tooltip.report.date).toLocaleDateString()}</div>
            <div className="text-blue-300">Area: {tooltip.report.surfaceAreaM2} m²</div>
            <div className="text-green-300">Volume: {tooltip.report.volumeM3} m³</div>
        </div>
      )}
      <div className="flex justify-center items-center gap-4 mt-2 text-xs text-gray-600">
          <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#4A90E2]"></div>
              <span>Surface Area</span>
          </div>
          <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#50E3C2]"></div>
              <span>Volume</span>
          </div>
      </div>
    </div>
  );
};

export default GrowthChart;