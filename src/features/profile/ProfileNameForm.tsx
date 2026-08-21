export interface ProfileNameFormProps {
  readonly onSubmit: (name: string) => void;
}

export function ProfileNameForm({ onSubmit }: ProfileNameFormProps) {
  return (
    <button
      onClick={() => {
        onSubmit('');
      }}
    >
      stub
    </button>
  );
}
