import { 
  startOfToday, 
  endOfToday, 
  startOfYesterday, 
  endOfYesterday,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfQuarter,
  endOfQuarter,
  subWeeks,
  subMonths,
  subQuarters,
  addWeeks
} from "date-fns";

export interface DateRangePreset {
  from: Date;
  to: Date;
  label: string;
}

export const dateRangePresets = {
  today: (): DateRangePreset => ({ 
    from: startOfToday(), 
    to: endOfToday(), 
    label: "Today" 
  }),
  
  yesterday: (): DateRangePreset => ({ 
    from: startOfYesterday(), 
    to: endOfYesterday(), 
    label: "Yesterday" 
  }),
  
  thisWeek: (): DateRangePreset => ({ 
    from: startOfWeek(new Date()), 
    to: endOfWeek(new Date()), 
    label: "This Week" 
  }),
  
  lastWeek: (): DateRangePreset => {
    const last = subWeeks(new Date(), 1);
    return { 
      from: startOfWeek(last), 
      to: endOfWeek(last), 
      label: "Last Week" 
    };
  },
  
  nextWeek: (): DateRangePreset => {
    const next = addWeeks(new Date(), 1);
    return { 
      from: startOfWeek(next), 
      to: endOfWeek(next), 
      label: "Next Week" 
    };
  },
  
  thisMonth: (): DateRangePreset => ({ 
    from: startOfMonth(new Date()), 
    to: endOfMonth(new Date()), 
    label: "This Month" 
  }),
  
  lastMonth: (): DateRangePreset => {
    const last = subMonths(new Date(), 1);
    return { 
      from: startOfMonth(last), 
      to: endOfMonth(last), 
      label: "Last Month" 
    };
  },
  
  thisQuarter: (): DateRangePreset => ({ 
    from: startOfQuarter(new Date()), 
    to: endOfQuarter(new Date()), 
    label: "This Quarter" 
  }),
  
  lastQuarter: (): DateRangePreset => {
    const last = subQuarters(new Date(), 1);
    return { 
      from: startOfQuarter(last), 
      to: endOfQuarter(last), 
      label: "Last Quarter" 
    };
  },
};
