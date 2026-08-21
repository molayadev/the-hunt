export interface TorchToggleProps {
  readonly isSupported: boolean;
  readonly isOn: boolean;
  readonly onToggle: () => void;
}

export function TorchToggle({ isSupported, isOn, onToggle }: TorchToggleProps) {
  if (!isSupported) return null;

  return (
    <button
      type="button"
      aria-pressed={isOn}
      aria-label="Linterna"
      onClick={onToggle}
      className="rounded-full bg-card p-3 text-foreground"
    >
      {isOn ? 'Apagar' : 'Linterna'}
    </button>
  );
}
