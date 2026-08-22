'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';

export interface LoginFormProps {
  readonly isPending: boolean;
  readonly errorMessage: string | null;
  readonly onSubmit: (email: string, password: string) => void;
}

export function LoginForm({ isPending, errorMessage, onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (email.trim() === '' || password === '') return;
    onSubmit(email.trim(), password);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-xs flex-col gap-3">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm text-neutral-600">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
          }}
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm text-neutral-600">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => {
            setPassword(event.target.value);
          }}
          className="rounded-md border border-neutral-300 px-3 py-2"
        />
      </div>
      {errorMessage && (
        <p role="alert" aria-live="polite" className="text-sm text-red-600">
          {errorMessage}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending || email.trim() === '' || password === ''}
        className="rounded-md bg-neutral-900 px-4 py-2 font-semibold text-white disabled:opacity-50"
      >
        {isPending ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  );
}
