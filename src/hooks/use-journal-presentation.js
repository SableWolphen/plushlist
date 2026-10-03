// Viewer state only; fetching and saving journal entries remain with their owner.
export function useJournalPresentation(trackerPeriod) {
  const { useState } = React;
  const [journalHistoryExpanded, setJournalHistoryExpanded] = useState(false);
  const [reflectionCalendarMonth, setReflectionCalendarMonth] = useState(() => trackerPeriod().date.slice(0, 7));
  const [reflectionViewerDate, setReflectionViewerDate] = useState(null);
  const [checkInViewerDate, setCheckInViewerDate] = useState(null);
  const [reflectionViewerNote, setReflectionViewerNote] = useState("");
  const [reflectionViewerPrompt, setReflectionViewerPrompt] = useState("");
  const [reflectionViewerLoading, setReflectionViewerLoading] = useState(false);
  return { journalHistoryExpanded, setJournalHistoryExpanded, reflectionCalendarMonth, setReflectionCalendarMonth,
    reflectionViewerDate, setReflectionViewerDate, checkInViewerDate, setCheckInViewerDate,
    reflectionViewerNote, setReflectionViewerNote, reflectionViewerPrompt, setReflectionViewerPrompt,
    reflectionViewerLoading, setReflectionViewerLoading };
}
