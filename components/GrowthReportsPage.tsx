import * as React from 'react';
import type { GrowthReport } from '../types';

interface GrowthReportsPageProps {
  reports: GrowthReport[];
  onNavigateBack: () => void;
}

const GrowthReportsPage: React.FC<GrowthReportsPageProps> = ({ reports, onNavigateBack }) => {
    const sortedReports = [...reports].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg space-y-6">
            <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-2xl font-bold text-coral-dark">All Growth Reports</h2>
                <button
                    onClick={onNavigateBack}
                    className="bg-gray-200 hover:bg-gray-300 text-coral-dark font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                >
                    &larr; Back to Details
                </button>
            </div>
            <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Surface Area (m²)</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volume (m³)</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {sortedReports.length > 0 ? sortedReports.map(report => (
                            <tr key={report.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(report.date).toLocaleDateString()}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{report.surfaceAreaM2}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{report.volumeM3}</td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">No growth reports found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default GrowthReportsPage;