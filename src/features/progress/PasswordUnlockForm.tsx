import type { SubmitEvent } from 'react';
import { useState } from 'react';

export interface PasswordUnlockFormProps {
  readonly disabled?: boolean;
  readonly errorMessage?: string | null;
  readonly onSubmit: (password: string) => void;
}

export function PasswordUnlockForm({ disabled, errorMessage, onSubmit }: PasswordUnlockFormProps) {
  const [value, setValue] = useState('');

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = value.trim();
    if (trimmed === '') return;
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor="unlock-password" className="text-sm text-muted-foreground">
        Palabra clave
      </label>
      <input
        id="unlock-password"
        name="unlock-password"
        type="text"
        autoComplete="off"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
        }}
        className="rounded-md border border-border bg-card px-3 py-2 text-foreground"
      />
      {errorMessage && (
        <p role="alert" aria-live="polite" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}
      <button
        type="submit"
        disabled={(disabled ?? false) || value.trim() === ''}
        className="self-start rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50"
      >
        Desbloquear
      </button>
    </form>
  );
}
