// Presentation state only. History queries and completion mutations stay in App.
export function useCalendarNavigation(trackerPeriod) {
  const { useState, useEffect } = React;
  const [weekCardIndex, setWeekCardIndex] = useState(() => {
    try {
      const stored = Number(window.localStorage.getItem("plushlist-calendar-view"));
      return Number.isInteger(stored) && stored >= 0 && stored <= 2 ? stored : 1;
    } catch (_error) { return 1; }
  });
  useEffect(() => {
    try { window.localStorage.setItem("plushlist-calendar-view", String(weekCardIndex)); } catch (_error) {}
  }, [weekCardIndex]);
  const [upcomingPreviewDate, setUpcomingPreviewDate] = useState(null);
  const [calendarWeekOffset, setCalendarWeekOffset] = useState(0);
  const [calendarWeekPreviewDate, setCalendarWeekPreviewDate] = useState(null);
  const [dayViewDate, setDayViewDate] = useState(() => trackerPeriod().date);
  const [dayViewExpanded, setDayViewExpanded] = useState(false);
  return { weekCardIndex, setWeekCardIndex, upcomingPreviewDate, setUpcomingPreviewDate,
    calendarWeekOffset, setCalendarWeekOffset, calendarWeekPreviewDate, setCalendarWeekPreviewDate,
    dayViewDate, setDayViewDate, dayViewExpanded, setDayViewExpanded };
}
