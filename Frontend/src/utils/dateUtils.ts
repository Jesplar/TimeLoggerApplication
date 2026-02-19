import { startOfWeek, addDays, format, parseISO } from 'date-fns';

export const getWeekStart = (date: Date): Date => {
  return startOfWeek(date, { weekStartsOn: 1 }); // 1 = Monday
};

export const getWeekDays = (weekStart: Date): Date[] => {
  return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
};

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd');
};

export const formatDisplayDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'EEE, MMM d');
};

export const formatTime = (timeString: string | undefined): string => {
  if (!timeString) return '';
  const [hours, minutes] = timeString.split(':');
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
};

export const parseTimeString = (timeString: string): string | undefined => {
  if (!timeString) return undefined;
  const cleaned = timeString.replace(/[^0-9:]/g, '');
  const parts = cleaned.split(':');
  
  if (parts.length === 2) {
    const hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    
    if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
    }
  }
  
  return undefined;
};

export const todayDate = (): Date => new Date();
export const yesterdayDate = (): Date => addDays(new Date(), -1);
