import type { SubmitEvent } from 'react';
import { useState } from 'react';
import { normalizeAnswer } from '../../domain/answer/normalize';

export interface AnswerFormProps {
  readonly disabled?: boolean;
  readonly errorMessage?: string | null;
  readonly onSubmit: (value: string) => void;
}

export function AnswerForm({ disabled = false, errorMessage = null, onSubmit }: AnswerFormProps) {
  const [value, setValue] = useState('');

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (value.trim() === '') return;
    onSubmit(value);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <label htmlFor="answer" className="text-sm text-muted-foreground">
        Tu respuesta
      </label>
      <input
        id="answer"
        name="answer"
        type="text"
        autoComplete="off"
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
        }}
        className="rounded-md border border-border bg-card px-3 py-2 text-foreground"
      />
      {value.trim() !== '' && (
        <p className="text-xs text-muted-foreground">Se comprobará: {normalizeAnswer(value)}</p>
      )}
      {errorMessage && (
        <p role="alert" aria-live="polite" className="text-sm text-destructive">
          {errorMessage}
        </p>
      )}
      <button
        type="submit"
        disabled={disabled || value.trim() === ''}
        className="self-start rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50"
      >
        Comprobar
      </button>
    </form>
  );
}
