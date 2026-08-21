export interface AnswerFormProps {
  readonly disabled?: boolean;
  readonly errorMessage?: string | null;
  readonly onSubmit: (value: string) => void;
}

export function AnswerForm(props: AnswerFormProps) {
  return <div>{props.disabled ? 'y' : 'n'}</div>;
}
