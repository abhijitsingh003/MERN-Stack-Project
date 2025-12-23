import { format, isSameDay } from 'date-fns';

export const formatTimestamp = (input) => {
  const dt = new Date(input);
  const now = new Date();
  if (isSameDay(dt, now)) {
    return format(dt, 'h:mm a');
  }
  return format(dt, "MMMM d, yyyy 'at' h:mm a");
};

