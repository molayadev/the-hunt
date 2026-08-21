export interface TorchToggleProps {
  readonly isSupported: boolean;
  readonly isOn: boolean;
  readonly onToggle: () => void;
}

export function TorchToggle(props: TorchToggleProps) {
  return <div>{props.isOn ? 'on' : 'off'}</div>;
}
