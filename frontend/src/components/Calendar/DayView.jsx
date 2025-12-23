import { format, isSameDay } from 'date-fns';

const DayView = ({ currentDate, onDayClick, events }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const totalMinutesInDay = 24 * 60;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b text-center">
        <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
          {format(currentDate, 'EEEE')}
        </div>
        <div className="text-2xl font-bold text-gray-900">
          {format(currentDate, 'MMMM d, yyyy')}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="relative">
          {hours.map((hour) => (
            <div key={hour} className="flex h-20 border-b group hover:bg-gray-50">
              <div className="w-20 p-2 border-r text-right text-xs text-gray-500">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
              
              <div 
                className="flex-1 relative p-1 cursor-pointer"
                onClick={() => {
                    const clickedTime = new Date(currentDate);
                    clickedTime.setHours(hour);
                    onDayClick(clickedTime);
                }}
              />
            </div>
          ))}
          {events.filter(event => {
            const start = new Date(event.start);
            return isSameDay(start, currentDate);
          }).map(event => {
            const start = new Date(event.start);
            const end = new Date(event.end || event.start);
            const startMinutes = start.getHours() * 60 + start.getMinutes();
            const endMinutesRaw = end.getHours() * 60 + end.getMinutes();
            const endMinutes = Math.max(endMinutesRaw, startMinutes + 15);
            const top = (startMinutes / totalMinutesInDay) * 100;
            const height = ((endMinutes - startMinutes) / totalMinutesInDay) * 100;
            return (
              <div
                key={event._id}
                className="absolute left-20 right-2 rounded border border-black/5 shadow-sm overflow-hidden text-xs flex flex-col justify-between"
                style={{
                  top: `${top}%`,
                  height: `${height}%`,
                  backgroundColor: event.color || '#e5edff',
                }}
              >
                <div className="px-2 py-1 flex items-center justify-between">
                  <span className="font-semibold text-[11px] text-gray-900 truncate">
                    {format(start, 'h:mm a')} – {format(end, 'h:mm a')}
                  </span>
                </div>
                <div className="px-2 pb-1 text-[11px] text-gray-800 truncate">
                  {event.title}
                </div>
                <div className="px-2 pb-2 text-[10px] text-gray-600 truncate">
                  {event.calendarName && <span>{event.calendarName}</span>}
                  {event.calendarName && event.creatorName && <span> • </span>}
                  {event.creatorName && <span>{event.creatorName}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DayView;
