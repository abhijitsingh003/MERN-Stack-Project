import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, format, isSameMonth, isSameDay, isToday } from 'date-fns';

const MonthView = ({ currentDate, onDayClick, events }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const rows = [];
  let days = [];
  let day = startDate;
  let formattedDate = "";

  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

  // Header
  const header = (
    <div className="grid grid-cols-7 border-b">
      {weekDays.map((d) => (
        <div key={d} className="py-2 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider border-r last:border-r-0">
          {d}
        </div>
      ))}
    </div>
  );

  // Body
  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      formattedDate = format(day, dateFormat);
      const cloneDay = day;
      
      days.push(
        <div
          key={day}
          className={`min-h-[120px] p-2 border-r border-b relative group hover:bg-gray-50 cursor-pointer ${
            !isSameMonth(day, monthStart)
              ? "bg-gray-50 text-gray-400"
              : "bg-white"
          }`}
          onClick={() => onDayClick(cloneDay)}
        >
          <div className="flex justify-center">
             <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm ${
                isToday(day) ? 'bg-black text-white font-bold' : 'text-gray-700'
             }`}>
                {formattedDate}
             </span>
          </div>
          
          {/* Events placeholder */}
          <div className="mt-1 space-y-1">
             {events.filter(event => isSameDay(new Date(event.start), day)).slice(0, 3).map(event => (
                 <div 
                    key={event._id}
                    className="text-xs px-1 py-0.5 rounded truncate text-white"
                    style={{ backgroundColor: event.color || '#3b82f6' }}
                 >
                    {event.title}
                 </div>
             ))}
          </div>
        </div>
      );
      day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1); // addDays(day, 1)
    }
    rows.push(
      <div className="grid grid-cols-7" key={day}>
        {days}
      </div>
    );
    days = [];
  }

  return (
    <div className="flex flex-col h-full">
      {header}
      <div className="flex-1 overflow-y-auto">
        {rows}
      </div>
    </div>
  );
};

export default MonthView;
