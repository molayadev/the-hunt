import { useState } from 'react';
import type { SubmitEvent } from 'react';

export interface ManualTokenEntryProps {
  readonly onSubmit: (token: string) => void;
}

export function ManualTokenEntry({ onSubmit }: ManualTokenEntryProps) {
  const [token, setToken] = useState('');

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = token.trim();
    if (trimmed === '') return;
    onSubmit(trimmed);
    setToken('');
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-xs items-end gap-2">
      <div className="flex flex-1 flex-col gap-1">
        <label htmlFor="manual-token" className="text-xs text-muted-foreground">
          Código de la estación
        </label>
        <input
          id="manual-token"
          name="manual-token"
          type="text"
          value={token}
          onChange={(event) => {
            setToken(event.target.value);
          }}
          className="rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground"
        />
      </div>
      <button
        type="submit"
        className="rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
      >
        Desbloquear
      </button>
    </form>
  );
}
