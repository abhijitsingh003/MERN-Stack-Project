import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay } from 'date-fns';

const WeekView = ({ currentDate, onDayClick, events }) => {
  const startDate = startOfWeek(currentDate);
  const endDate = endOfWeek(currentDate);
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const totalMinutesInDay = 24 * 60;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="grid grid-cols-8 border-b">
        <div className="p-2 border-r text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Time
        </div>
        {days.map((day) => (
          <div 
            key={day.toString()} 
            className={`p-2 border-r last:border-r-0 text-center cursor-pointer hover:bg-gray-50 ${
              isSameDay(day, new Date()) ? 'bg-blue-50' : ''
            }`}
            onClick={() => onDayClick(day)}
          >
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              {format(day, 'EEE')}
            </div>
            <div className={`text-lg ${isSameDay(day, new Date()) ? 'text-blue-600 font-bold' : 'text-gray-900'}`}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-8">
          <div className="border-r">
            {hours.map((hour) => (
              <div key={hour} className="h-12 border-b text-xs text-gray-500 text-center relative -top-2">
                {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
              </div>
            ))}
          </div>

          {days.map((day) => {
            const dayEvents = events.filter(event => {
              const start = new Date(event.start);
              return isSameDay(start, day);
            });
            return (
              <div key={day.toString()} className="border-r last:border-r-0 relative">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="h-12 border-b hover:bg-gray-50"
                    onClick={() => {
                      const clickedTime = new Date(day);
                      clickedTime.setHours(hour);
                      onDayClick(clickedTime);
                    }}
                  />
                ))}
                {dayEvents.map(event => {
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
                      className="absolute inset-x-1 rounded border border-black/5 shadow-sm overflow-hidden text-xs flex flex-col justify-between"
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
                      <div className="px-2 pb-1 text-[10px] text-gray-600 truncate">
                        {event.calendarName && <span>{event.calendarName}</span>}
                        {event.calendarName && event.creatorName && <span> • </span>}
                        {event.creatorName && <span>{event.creatorName}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WeekView;
