import type { SubmitEvent } from 'react';
import { useState } from 'react';

export interface ProfileNameFormProps {
  readonly onSubmit: (name: string) => void;
}

export function ProfileNameForm({ onSubmit }: ProfileNameFormProps) {
  const [name, setName] = useState('');

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim() === '') return;
    onSubmit(name);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-3">
      <label htmlFor="profile-name" className="text-sm text-muted-foreground">
        ¿Cómo te llamas?
      </label>
      <input
        id="profile-name"
        name="profile-name"
        type="text"
        autoComplete="name"
        value={name}
        onChange={(event) => {
          setName(event.target.value);
        }}
        className="rounded-md border border-border bg-card px-3 py-2 text-foreground"
      />
      <button
        type="submit"
        disabled={name.trim() === ''}
        className="rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50"
      >
        Continuar
      </button>
    </form>
  );
}
