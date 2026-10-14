import { buildSmartCareSchedule } from '../smart-care-schedule.mjs';

const time = minute => minute === null ? 'Flexible time' : minute === 1440 ? 'Midnight' : new Date(2000, 0, 1, Math.floor(minute / 60), minute % 60).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export function SmartCareSchedule({ rows, viewDone, entries, dailyCheckIn, restDay, date, timezone, babyMode }) {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const refresh = () => setNow(new Date());
    const timer = setInterval(refresh, 30000);
    window.addEventListener('focus', refresh);
    return () => { clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, []);
  const model = buildSmartCareSchedule({ rows, viewDone, entries, energy: dailyCheckIn?.energy, restDay, date, timezone, now });
  return <section aria-label="Smart Care Schedule" style={{ margin: '16px 0', padding: 'clamp(12px, 4vw, 24px)', borderRadius: 24, background: 'var(--pl-theme-surface)', color: 'var(--pl-theme-ink)', border: '1px solid var(--pl-theme-line)', overflowWrap: 'anywhere' }}>
    <h2 style={{ margin: '0 0 8px', fontSize: '1.15rem' }}>♡ Smart Care Schedule</h2>
    <p>Your plush is leaving room to breathe. Read-only — your schedule stays yours.</p>
    <p><strong>Now · {time(model.clock)}</strong>{restDay ? ' · Rest day: comfort is enough.' : dailyCheckIn?.energy ? ` · ${dailyCheckIn.energy} energy` : ''}</p>
    <p style={{ fontSize: '.85rem' }}>Care ideas are optional. Items without an end time reserve the remaining day. Flexible unfinished tasks pause suggestions until their timing is known.</p>
    <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
      {model.items.map(item => <li key={item.id} style={{ borderLeft: '3px solid var(--pl-theme-accent)', padding: '10px 12px', marginTop: 10, borderRadius: 8, border: '1px solid var(--pl-theme-line)' }}>
        <div style={{ fontSize: '.85rem' }}>{time(item.start)}{item.end !== null ? ` – ${time(item.end)}` : ''} · {item.kind === 'optional' ? 'Optional care idea' : item.done ? 'Completed' : 'On your schedule'}</div>
        <strong>{item.label}</strong>
        {item.kind === 'optional' && <div>{babyMode ? 'Or cuddle a plush or enjoy quiet coloring.' : item.littleLabel + ' (optional)'}</div>}
      </li>)}
    </ol>
    {!model.items.some(item => item.kind === 'optional') && <p>No confirmed open care slots right now. There’s nothing extra to do.</p>}
  </section>;
}
