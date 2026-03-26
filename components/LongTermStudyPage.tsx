import * as React from 'react';
import type { FormEvent } from 'react';
import type { LongTermStudy } from '../types';

interface LongTermStudyPageProps {
  title: string;
  experiment: LongTermStudy | null;
  onStart: () => void;
  onAddReport: (notes: string) => void;
  onEnd: () => void;
  onNavigateBack: () => void;
}

const LongTermStudyPage: React.FC<LongTermStudyPageProps> = ({
  title,
  experiment,
  onStart,
  onAddReport,
  onEnd,
  onNavigateBack
}) => {
  const [reportNotes, setReportNotes] = React.useState('');

  const handleAddReport = (e: FormEvent) => {
    e.preventDefault();
    if (!reportNotes.trim()) {
      alert('Please enter some notes for the report.');
      return;
    }
    onAddReport(reportNotes.trim());
    setReportNotes('');
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4">
        <h2 className="text-2xl font-bold text-coral-dark mb-2 sm:mb-0">Experiment: {title}</h2>
        <button
          onClick={onNavigateBack}
          className="bg-gray-200 hover:bg-gray-300 text-coral-dark font-bold py-2 px-4 rounded-lg transition-colors duration-200 self-start sm:self-center"
        >
          &larr; Back to Experiments
        </button>
      </div>

      {(!experiment || !experiment.isActive) && (
        <div className="p-4 border rounded-lg space-y-6 bg-gray-50 text-center">
          <h3 className="font-semibold text-gray-700 text-lg">Start New Long-Term Study</h3>
          <p className="text-sm text-gray-600">
            This will begin a new study, logging the current date as the start date. You will then be able to add dated observations.
          </p>
          <div className="flex justify-center pt-2">
            <button
              onClick={onStart}
              className="bg-coral-green hover:bg-opacity-90 text-coral-dark font-bold py-2 px-6 rounded-lg transition-colors duration-200"
            >
              Start Study
            </button>
          </div>
        </div>
      )}

      {experiment && experiment.isActive && (
        <div className="space-y-8">
          {/* Experiment Details */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-700 text-lg">Study in Progress</h3>
                <p className="text-sm text-gray-600">Started on {new Date(experiment.startDate).toLocaleDateString()}</p>
              </div>
              <button onClick={onEnd} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">End Study</button>
            </div>
          </div>

          {/* Log New Report */}
          <form onSubmit={handleAddReport} className="p-4 border rounded-lg space-y-4 bg-gray-50">
            <h3 className="font-semibold text-gray-700 text-lg">Log New Observation</h3>
            <div>
              <label htmlFor="reportNotes" className="block text-sm font-medium text-gray-700">Observations / Notes</label>
              <textarea
                id="reportNotes"
                rows={4}
                value={reportNotes}
                onChange={e => setReportNotes(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900"
                placeholder="e.g., Noticed minor algae growth on the north-facing side. Corals appear healthy with good polyp extension."
              />
            </div>
            <div className="flex justify-end">
              <button type="submit" className="bg-coral-blue hover:bg-opacity-90 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                Log Observation
              </button>
            </div>
          </form>

          {/* Results Table */}
          <div>
            <h3 className="font-semibold text-gray-700 text-lg mb-4">Observation History</h3>
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {experiment.reports.length > 0 ? (
                    [...experiment.reports].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(report => (
                    <tr key={report.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(report.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 whitespace-normal text-sm text-gray-700">{report.notes}</td>
                    </tr>
                  ))) : (
                    <tr><td colSpan={2} className="text-center py-8 text-gray-500">No observations logged for this study yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LongTermStudyPage;
