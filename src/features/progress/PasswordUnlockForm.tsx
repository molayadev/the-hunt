export interface PasswordUnlockFormProps {
  readonly disabled?: boolean;
  readonly errorMessage?: string | null;
  readonly onSubmit: (password: string) => void;
}

export function PasswordUnlockForm(props: PasswordUnlockFormProps) {
  void props;
  return null;
}
