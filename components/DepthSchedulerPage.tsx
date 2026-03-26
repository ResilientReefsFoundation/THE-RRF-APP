import * as React from 'react';
import type { Tree, ScheduleItem, StructureType, PrefixSettings } from '../types';

interface DepthSchedulerPageProps {
  trees: Tree[];
  schedule: Map<string, ScheduleItem[]>;
  prefixSettings: PrefixSettings;
  onGenerateSchedule: (targetDate: string) => void;
  onNavigateBack: () => void;
}

const DepthSchedulerPage: React.FC<DepthSchedulerPageProps> = ({
  trees,
  schedule,
  prefixSettings,
  onGenerateSchedule,
  onNavigateBack,
}) => {
  const [targetDate, setTargetDate] = React.useState('');

  const getPrefix = (type?: StructureType) => {
      if (type === 'Reef2') return prefixSettings.reef2;
      if (type === 'Reef3') return prefixSettings.reef3;
      return prefixSettings.tree;
  };

  const handleGenerateClick = () => {
    if (!targetDate) {
      alert('Please select a target restoration date.');
      return;
    }
    onGenerateSchedule(targetDate);
  };

  const sortedSchedule = React.useMemo(() => {
    return Array.from(schedule.entries()).sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime());
  }, [schedule]);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg space-y-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-4">
        <h2 className="text-2xl font-bold text-coral-dark mb-2 sm:mb-0">Raising Schedule Generator</h2>
        <button
          onClick={onNavigateBack}
          className="bg-gray-200 hover:bg-gray-300 text-coral-dark font-bold py-2 px-4 rounded-lg transition-colors duration-200 self-start sm:self-center"
        >
          &larr; Back to Add/Edit/Move
        </button>
      </div>

      {/* Current Status Table */}
      <div>
        <h3 className="font-semibold text-gray-700 text-lg mb-4">Current Structure Depths</h3>
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Depth</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Normal Depth</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {trees.sort((a,b) => {
                  const typeCompare = (a.type || 'Tree').localeCompare(b.type || 'Tree');
                  if(typeCompare !== 0) return typeCompare;
                  return a.number - b.number;
              }).map(tree => {
                const prefix = getPrefix(tree.type);
                return (
                <tr key={tree.id}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{prefix} {tree.number}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tree.type || 'Tree'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{tree.currentDepth}m</td>
                  <td className="px-6 py-4 whitespace-nowrap">{tree.normalDepth}m</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {tree.currentDepth > tree.normalDepth ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        Needs moving up
                      </span>
                    ) : (
                       <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        At normal depth
                      </span>
                    )}
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Generator */}
      <div className="p-4 border-2 border-coral-blue rounded-lg space-y-4 bg-gray-50 print-hidden">
        <h3 className="font-semibold text-gray-700 text-lg">Generate Raising Schedule</h3>
        <p className="text-sm text-gray-600">
          Select a target date to have all items returned to their normal depth. The system will calculate the required moves at 14-day intervals for all structure types.
        </p>
        <div className="flex flex-col sm:flex-row items-end gap-4">
          <div className="flex-grow">
            <label htmlFor="targetDate" className="block text-sm font-medium text-gray-700">Target Restoration Date</label>
            <input
              type="date"
              id="targetDate"
              value={targetDate}
              onChange={e => setTargetDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 bg-white"
            />
          </div>
          <button
            onClick={handleGenerateClick}
            className="w-full sm:w-auto bg-coral-blue hover:bg-opacity-90 text-white font-bold py-2 px-4 rounded-lg transition-colors"
          >
            Generate Schedule
          </button>
        </div>
      </div>

      {/* Schedule Display */}
      <div id="schedule-to-print">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-700 text-lg">Generated Schedule</h3>
            {sortedSchedule.length > 0 && (
                <button
                    onClick={() => window.print()}
                    className="bg-gray-200 hover:bg-gray-300 text-coral-dark font-semibold py-1 px-3 rounded-lg text-sm print:hidden"
                >
                    Print Schedule
                </button>
            )}
        </div>
        {sortedSchedule.length > 0 ? (
          <div className="space-y-6">
            {sortedSchedule.map(([date, scheduleItems]) => (
              <div key={date}>
                <h4 className="font-medium bg-gray-100 p-3 rounded-t-md text-coral-dark text-lg border border-b-0 border-gray-200">
                  {new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h4>
                <div className="border border-gray-200 rounded-b-md">
                   <ul className="divide-y divide-gray-200">
                     {scheduleItems.map(item => {
                       const itemPrefix = getPrefix(item.tree.type);
                       return (
                         <li key={item.tree.id + '-' + item.fromDepth} className="p-3 bg-white text-gray-900">
                           <p>Move <span className="font-bold">{itemPrefix} {item.tree.number}</span> up from {item.fromDepth}m to {item.toDepth}m.</p>
                         </li>
                       );
                     })}
                   </ul>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8 border-2 border-dashed border-gray-200 rounded-lg">No schedule generated yet, or no items require moving.</p>
        )}
      </div>

    </div>
  );
};

export default DepthSchedulerPage;