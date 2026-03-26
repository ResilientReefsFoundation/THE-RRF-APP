import * as React from 'react';
import type { FormEvent } from 'react';
/* Import MaintenanceLog */
import type { TreeShadeExperiment, Tree, CoralBranch, MaintenanceLog } from '../types';

interface TreeShadeExperimentPageProps {
  experiment: TreeShadeExperiment | null;
  trees: Tree[];
  branches: CoralBranch[];
  onStart: (controlTreeId: string, shadedTreeId: string, shadeLevel: 30 | 50) => void;
  onAddReport: (notes: string) => void;
  /* Added onAddLog to props */
  onAddLog: (log: Omit<MaintenanceLog, 'id' | 'timestamp'>) => void;
  onEnd: () => void;
  onNavigateBack: () => void;
}

const TreeShadeExperimentPage: React.FC<TreeShadeExperimentPageProps> = ({
  experiment,
  trees,
  branches,
  onStart,
  onAddReport,
  onAddLog,
  onEnd,
  onNavigateBack
}) => {
  // State for setup form
  const [controlTreeId, setControlTreeId] = React.useState('');
  const [shadedTreeId, setShadedTreeId] = React.useState('');
  const [shadeLevel, setShadeLevel] = React.useState<30 | 50>(30);

  // State for report form
  const [reportNotes, setReportNotes] = React.useState('');
  
  const controlTree = experiment ? trees.find(t => t.id === experiment.controlTreeId) : null;
  const shadedTree = experiment ? trees.find(t => t.id === experiment.shadedTreeId) : null;

  const handleStartExperiment = (e: FormEvent) => {
    e.preventDefault();
    if (!controlTreeId || !shadedTreeId) {
      alert('Please select both a control and a shaded tree.');
      return;
    }
    if (controlTreeId === shadedTreeId) {
      alert('Control tree and shaded tree cannot be the same.');
      return;
    }
    onStart(controlTreeId, shadedTreeId, shadeLevel);
  };

  const handleAddReport = (e: FormEvent) => {
    e.preventDefault();
    if (!reportNotes.trim()) {
      alert('Please enter some notes for the report.');
      return;
    }
    onAddReport(reportNotes.trim());
    setReportNotes('');
  };

  const controlTreeDepth = trees.find(t => t.id === controlTreeId)?.currentDepth;
  const availableShadedTrees = trees.filter(t => t.currentDepth === controlTreeDepth && t.id !== controlTreeId);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg space-y-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4">
            <h2 className="text-2xl font-bold text-coral-dark mb-2 sm:mb-0">Experiment: Tree Shade</h2>
            <button
                onClick={onNavigateBack}
                className="bg-gray-200 hover:bg-gray-300 text-coral-dark font-bold py-2 px-4 rounded-lg transition-colors duration-200 self-start sm:self-center"
            >
                &larr; Back to Experiments
            </button>
        </div>

        {(!experiment || !experiment.isActive) && (
            <form onSubmit={handleStartExperiment} className="p-4 border rounded-lg space-y-6 bg-gray-50">
                <h3 className="font-semibold text-gray-700 text-lg">Experiment Setup</h3>
                <p className="text-sm text-gray-600">
                  Select two trees at the same depth. One will be the control (unshaded), and the other will have a shade cloth installed over it.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="controlTree" className="block text-sm font-medium text-gray-700">Control Tree (Unshaded)</label>
                        <select id="controlTree" value={controlTreeId} onChange={e => { setControlTreeId(e.target.value); setShadedTreeId(''); }} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900">
                            <option value="">-- Choose a tree --</option>
                            {trees.map(t => <option key={t.id} value={t.id}>T{t.number} (Depth: {t.currentDepth}m)</option>)}
                        </select>
                    </div>
                     <div>
                        <label htmlFor="shadedTree" className="block text-sm font-medium text-gray-700">Shaded Tree</label>
                        <select id="shadedTree" value={shadedTreeId} onChange={e => setShadedTreeId(e.target.value)} required disabled={!controlTreeId} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white disabled:bg-gray-100 text-gray-900">
                            <option value="">-- Choose a tree --</option>
                            {availableShadedTrees.map(t => <option key={t.id} value={t.id}>T{t.number} (Depth: {t.currentDepth}m)</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Shade Level</label>
                    <div className="mt-2 flex gap-4">
                        <label className="flex items-center gap-2">
                            <input type="radio" name="shadeLevel" value={30} checked={shadeLevel === 30} onChange={() => setShadeLevel(30)} className="h-4 w-4 text-coral-blue focus:ring-coral-blue"/>
                            30% Shade
                        </label>
                        <label className="flex items-center gap-2">
                            <input type="radio" name="shadeLevel" value={50} checked={shadeLevel === 50} onChange={() => setShadeLevel(50)} className="h-4 w-4 text-coral-blue focus:ring-coral-blue"/>
                            50% Shade
                        </label>
                    </div>
                </div>
                <div className="flex justify-end pt-2">
                    <button type="submit" className="bg-coral-green hover:bg-opacity-90 text-coral-dark font-bold py-2 px-6 rounded-lg transition-colors duration-200">
                      Start Experiment
                    </button>
                </div>
            </form>
        )}

        {experiment && experiment.isActive && (
            <div className="space-y-8">
                {/* Experiment Details */}
                <div className="p-4 border rounded-lg bg-gray-50">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-semibold text-gray-700 text-lg">Experiment in Progress</h3>
                            <p className="text-sm text-gray-600">Started on {new Date(experiment.startDate).toLocaleDateString()}</p>
                        </div>
                        <button onClick={onEnd} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">End Experiment</button>
                    </div>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                        <div><p className="text-sm text-gray-500">Control Tree</p><p className="font-bold text-lg">T{controlTree?.number}</p></div>
                        <div><p className="text-sm text-gray-500">Shaded Tree</p><p className="font-bold text-lg">T{shadedTree?.number}</p></div>
                        <div><p className="text-sm text-gray-500">Shade Level</p><p className="font-bold text-lg">{experiment.shadeLevel}%</p></div>
                    </div>
                </div>

                {/* Log New Report */}
                 <form onSubmit={handleAddReport} className="p-4 border rounded-lg space-y-4 bg-gray-50">
                    <h3 className="font-semibold text-gray-700 text-lg">Log New Report</h3>
                    <div>
                        <label htmlFor="reportNotes" className="block text-sm font-medium text-gray-700">Observations / Notes</label>
                        <textarea 
                            id="reportNotes"
                            rows={3}
                            value={reportNotes}
                            onChange={e => setReportNotes(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white text-gray-900"
                            placeholder="e.g., Water visibility is low today. No new signs of stress on either tree."
                        />
                    </div>
                    <div className="flex justify-end">
                        <button type="submit" className="bg-coral-blue hover:bg-opacity-90 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                            Log Report
                        </button>
                    </div>
                </form>

                {/* Results Table */}
                <div>
                  <h3 className="font-semibold text-gray-700 text-lg mb-4">Results</h3>
                  <div className="overflow-x-auto border rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Health (Control)</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Health (Shaded)</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bleaching (Control)</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bleaching (Shaded)</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                           {experiment.reports.length > 0 ? experiment.reports.map(report => (
                               <tr key={report.id}>
                                   <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(report.date).toLocaleDateString()}</td>
                                   <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{report.controlTreeHealth.toFixed(1)}%</td>
                                   <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{report.shadedTreeHealth.toFixed(1)}%</td>
                                   <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{report.controlTreeBleachingCount} branches</td>
                                   <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{report.shadedTreeBleachingCount} branches</td>
                                   <td className="px-4 py-4 whitespace-normal text-sm text-gray-600">{report.notes}</td>
                               </tr>
                           )) : (
                               <tr><td colSpan={6} className="text-center py-8 text-gray-500">No reports logged for this experiment yet.</td></tr>
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

export default TreeShadeExperimentPage;