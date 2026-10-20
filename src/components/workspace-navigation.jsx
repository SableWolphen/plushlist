// One section selector per workspace. Native buttons keep keyboard use familiar.
export function WorkspaceNavigation({ label, items, value, onChange }) {
  return <div role="group" aria-label={label} className="pl-workspace-navigation">
    {items.map(([id, text]) => <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange(id)}>{text}</button>)}
  </div>;
}
