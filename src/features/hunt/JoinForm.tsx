import type { SubmitEvent } from 'react';
import { useState } from 'react';

export interface JoinFormProps {
  readonly isPending: boolean;
  readonly errorMessage: string | null;
  readonly onSubmit: (code: string) => void;
}

export function JoinForm({ isPending, errorMessage, onSubmit }: JoinFormProps) {
  const [code, setCode] = useState('');

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (code.trim() === '') return;
    onSubmit(code);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-3">
      <label htmlFor="join-code" className="text-sm text-muted-foreground">
        Código de la ruta
      </label>
      <input
        id="join-code"
        name="join-code"
        type="text"
        autoComplete="off"
        autoCapitalize="characters"
        value={code}
        onChange={(event) => {
          setCode(event.target.value);
        }}
        className="rounded-md border border-border bg-card px-3 py-2 font-mono text-lg tracking-widest text-foreground"
      />
      {errorMessage && (
        <p role="alert" aria-live="polite" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending || code.trim() === ''}
        className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50"
      >
        {isPending ? 'Buscando…' : 'Unirse'}
      </button>
    </form>
  );
}
