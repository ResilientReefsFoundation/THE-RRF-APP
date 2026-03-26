import * as React from 'react';
import type { MouseEvent } from 'react';
import type { HealthReport } from '../types';

interface HealthChartProps {
  reports: HealthReport[];
}

interface Point {
  x: number;
  y: number;
  report: HealthReport;
}

const getHealthColor = (percentage: number): string => {
    if (percentage > 87.5) return 'text-green-500';
    if (percentage > 62.5) return 'text-yellow-400';
    if (percentage > 37.5) return 'text-orange-400';
    if (percentage > 12.5) return 'text-orange-600';
    if (percentage >= 0) return 'text-red-500';
    return 'text-red-700';
}

const HealthChart: React.FC<HealthChartProps> = ({ reports }) => {
  const [tooltip, setTooltip] = React.useState<{ x: number, y: number, report: HealthReport } | null>(null);

  const sortedReports = React.useMemo(() => 
    [...reports].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [reports]
  );
  
  if (sortedReports.length < 2) {
    return <div className="text-center text-sm text-gray-500 py-8">Not enough data to display a chart.</div>;
  }
  
  const width = 500;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 40, left: 40 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const firstDate = new Date(sortedReports[0].date).getTime();
  const lastDate = new Date(sortedReports[sortedReports.length - 1].date).getTime();
  const dateRange = lastDate - firstDate || 1; // Avoid division by zero

  const getX = (date: string) => {
    return ((new Date(date).getTime() - firstDate) / dateRange) * chartWidth + padding.left;
  };

  const getY = (percentage: number) => {
    return height - padding.bottom - (percentage / 100) * chartHeight;
  };

  const points: Point[] = sortedReports.map(report => ({
    x: getX(report.date),
    y: getY(report.healthPercentage),
    report,
  }));

  const pathD = points.map((p, i) => i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`).join(' ');

  const areaPathD = `${pathD} V ${height - padding.bottom} H ${padding.left} Z`;

  const handleMouseOver = (e: MouseEvent<SVGCircleElement>, point: Point) => {
    setTooltip({
        x: point.x,
        y: point.y,
        report: point.report
    });
  };

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" aria-labelledby="chart-title" role="img">
        <title id="chart-title">Coral Health History Chart</title>
        
        {/* Y-axis grid lines */}
        {[0, 25, 50, 75, 100].map(val => (
            <g key={val}>
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
                >{val}%</text>
            </g>
        ))}

        {/* X-axis labels */}
        <g>
            <text x={padding.left} y={height - padding.bottom + 15} textAnchor="start" className="text-[10px] fill-gray-500">
                {new Date(sortedReports[0].date).toLocaleDateString()}
            </text>
             <text x={width - padding.right} y={height - padding.bottom + 15} textAnchor="end" className="text-[10px] fill-gray-500">
                {new Date(sortedReports[sortedReports.length - 1].date).toLocaleDateString()}
            </text>
        </g>
        
        {/* Gradient for area */}
        <defs>
          <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4A90E2" stopOpacity={0.2}/>
            <stop offset="100%" stopColor="#4A90E2" stopOpacity={0}/>
          </linearGradient>
        </defs>

        <path d={areaPathD} fill="url(#areaGradient)" />

        <path d={pathD} fill="none" stroke="#4A90E2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r="4"
            fill="white"
            stroke="#4A90E2"
            strokeWidth="2"
            onMouseOver={(e) => handleMouseOver(e, point)}
            onMouseOut={() => setTooltip(null)}
            className="cursor-pointer"
          />
        ))}
      </svg>
      {tooltip && (
        <div 
            className="absolute p-2 text-xs bg-coral-dark text-white rounded-md shadow-lg pointer-events-none transition-opacity transform -translate-x-1/2 -translate-y-[calc(100%+10px)]"
            style={{ left: `${(tooltip.x / width) * 100}%`, top: `${(tooltip.y / height) * 100}%` }}
        >
            <div className={`font-bold ${getHealthColor(tooltip.report.healthPercentage)}`}>{tooltip.report.healthPercentage}% Health</div>
            <div className="text-gray-300">{new Date(tooltip.report.date).toLocaleDateString()}</div>
        </div>
      )}
    </div>
  );
};

export default HealthChart;