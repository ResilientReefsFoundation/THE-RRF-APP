import * as React from 'react';
import type { HealthReport } from '../types';

interface HealthReportsPageProps {
  reports: HealthReport[];
  onNavigateBack: () => void;
}

const getHealthStatus = (percentage: number): { color: string; textColor: string } => {
    // Exact values from monitoring page
    if (percentage === 100) return { color: 'bg-green-500', textColor: 'text-green-600' };
    if (percentage === 75) return { color: 'bg-yellow-400', textColor: 'text-yellow-500' };
    if (percentage === 50) return { color: 'bg-orange-400', textColor: 'text-orange-500' };
    if (percentage === 25) return { color: 'bg-orange-600', textColor: 'text-orange-700' };
    if (percentage === 0) return { color: 'bg-red-500', textColor: 'text-red-600' };
    
    // Fallback for other values
    if (percentage > 87.5) return { color: 'bg-green-500', textColor: 'text-green-600' };
    if (percentage > 62.5) return { color: 'bg-yellow-400', textColor: 'text-yellow-500' };
    if (percentage > 37.5) return { color: 'bg-orange-400', textColor: 'text-orange-500' };
    if (percentage > 0) return { color: 'bg-orange-600', textColor: 'text-orange-700' };
    return { color: 'bg-red-500', textColor: 'text-red-600' };
}

const HealthReportsPage: React.FC<HealthReportsPageProps> = ({ reports, onNavigateBack }) => {
    const sortedReports = [...reports].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4">
                <h2 className="text-2xl font-bold text-coral-dark mb-2 sm:mb-0">All Health Reports</h2>
                <button
                    onClick={onNavigateBack}
                    className="bg-gray-200 hover:bg-gray-300 text-coral-dark font-bold py-2 px-4 rounded-lg transition-colors duration-200 self-start sm:self-center"
                >
                    &larr; Back to Details
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 md:table">
                    <thead className="hidden md:table-header-group bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                             <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bleaching</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200 md:divide-y-0">
                        {sortedReports.length > 0 ? sortedReports.map(report => {
                            const status = getHealthStatus(report.healthPercentage);
                            return (
                                <tr key={report.id} className="block md:table-row mb-4 md:mb-0 shadow md:shadow-none rounded-lg md:rounded-none">
                                    <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap text-sm text-gray-500 block md:table-cell text-right md:text-left border-b md:border-b-0">
                                        <span className="font-semibold md:hidden float-left">Date</span>
                                        {new Date(report.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap text-sm block md:table-cell text-right md:text-left border-b md:border-b-0">
                                       <span className="font-semibold md:hidden float-left">Status</span>
                                       <div className="flex justify-end md:justify-start">
                                            <span className={`font-medium flex items-center gap-2 ${status.textColor}`}>
                                                <span className={`w-3 h-3 rounded-full ${status.color}`}></span>
                                                {report.healthPercentage === 0 ? '0%' : `${report.healthPercentage}%`}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 md:px-6 md:py-4 whitespace-nowrap text-sm text-gray-500 block md:table-cell text-right md:text-left border-b md:border-b-0">
                                        <span className="font-semibold md:hidden float-left">Bleaching</span>
                                        {report.bleaching}
                                    </td>
                                    <td className="px-4 py-3 md:px-6 md:py-4 whitespace-normal text-sm text-gray-700 block md:table-cell text-right md:text-left">
                                      <span className="font-semibold md:hidden float-left">Notes</span>
                                      {report.notes}
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr className="block md:table-row">
                                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 block md:table-cell">No health reports found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default HealthReportsPage;