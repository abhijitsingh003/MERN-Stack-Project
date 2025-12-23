import { format, eachMonthOfInterval, startOfYear, endOfYear, isSameMonth } from 'date-fns';

const YearView = ({ currentDate, onMonthClick }) => {
  const start = startOfYear(currentDate);
  const end = endOfYear(currentDate);
  const months = eachMonthOfInterval({ start, end });

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {months.map((month) => (
          <div 
            key={month.toString()} 
            className={`border rounded-lg p-4 hover:shadow-md cursor-pointer transition-shadow ${
                isSameMonth(month, new Date()) ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => onMonthClick(month)}
          >
            <div className="text-center font-bold text-gray-900 mb-2">
              {format(month, 'MMMM')}
            </div>
            {/* Mini Calendar Grid for Visual */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px]">
                {['S','M','T','W','T','F','S'].map(d => <div key={d} className="text-gray-400">{d}</div>)}
                {/* Placeholder for days - keeping it simple for now */}
                {/* In a real app, we'd generate the days for this month */}
                <div className="col-span-7 text-gray-300 py-2">
                    {/* Visual placeholder */}
                    <div className="h-16 bg-gray-50 rounded"></div>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default YearView;
