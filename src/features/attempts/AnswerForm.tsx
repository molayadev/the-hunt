import type { SubmitEvent } from 'react';
import { useState } from 'react';
import { normalizeAnswer } from '../../domain/answer/normalize';
import type { AnswerInput } from '../../domain/callables';
import type { Challenge, ChallengeOption } from '../../shared/types/card';

export interface AnswerFormProps {
  readonly challenge: Challenge;
  readonly disabled?: boolean;
  readonly errorMessage?: string | null;
  readonly onSubmit: (answer: AnswerInput) => void;
}

function OptionButton({
  option,
  role,
  checked,
  disabled,
  onToggle,
}: {
  readonly option: ChallengeOption;
  readonly role: 'radio' | 'checkbox';
  readonly checked: boolean;
  readonly disabled: boolean;
  readonly onToggle: () => void;
}) {
  const stateClasses = checked
    ? 'border-primary bg-primary/10 text-primary'
    : 'border-border text-foreground';

  if (option.kind === 'image') {
    return (
      <button
        type="button"
        role={role}
        aria-checked={checked}
        disabled={disabled}
        onClick={onToggle}
        className={`overflow-hidden rounded-full border-2 ${checked ? 'border-primary' : 'border-transparent'}`}
      >
        <img src={option.imageUrl} alt={option.alt} className="h-16 w-16 object-cover" />
      </button>
    );
  }

  return (
    <button
      type="button"
      role={role}
      aria-checked={checked}
      disabled={disabled}
      onClick={onToggle}
      className={`rounded-md border px-3 py-2 text-left text-sm ${stateClasses}`}
    >
      {option.text}
    </button>
  );
}

function ErrorMessage({ message }: { readonly message: string | null | undefined }) {
  if (!message) return null;
  return (
    <p role="alert" aria-live="polite" className="text-sm text-destructive">
      {message}
    </p>
  );
}

function TextAnswerForm({ disabled, errorMessage, onSubmit }: AnswerFormProps) {
  const [value, setValue] = useState('');

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (value.trim() === '') return;
    onSubmit({ kind: 'text', value });
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
      <ErrorMessage message={errorMessage} />
      <button
        type="submit"
        disabled={(disabled ?? false) || value.trim() === ''}
        className="self-start rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50"
      >
        Comprobar
      </button>
    </form>
  );
}

function SingleOptionAnswerForm({
  challenge,
  disabled,
  errorMessage,
  onSubmit,
}: AnswerFormProps & { readonly challenge: Extract<Challenge, { type: 'single_option' }> }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedId) return;
    onSubmit({ kind: 'single_option', optionId: selectedId });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">{challenge.question}</p>
      <div role="radiogroup" aria-label={challenge.question} className="flex flex-wrap gap-2">
        {challenge.options.map((option) => (
          <OptionButton
            key={option.id}
            option={option}
            role="radio"
            checked={selectedId === option.id}
            disabled={disabled ?? false}
            onToggle={() => {
              setSelectedId(option.id);
            }}
          />
        ))}
      </div>
      <ErrorMessage message={errorMessage} />
      <button
        type="submit"
        disabled={(disabled ?? false) || !selectedId}
        className="self-start rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50"
      >
        Comprobar
      </button>
    </form>
  );
}

function MultipleOptionAnswerForm({
  challenge,
  disabled,
  errorMessage,
  onSubmit,
}: AnswerFormProps & { readonly challenge: Extract<Challenge, { type: 'multiple_option' }> }) {
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([]);

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (selectedIds.length === 0) return;
    onSubmit({ kind: 'multiple_option', optionIds: selectedIds });
  }

  function toggle(optionId: string) {
    setSelectedIds((current) =>
      current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId],
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <p className="text-sm text-muted-foreground">{challenge.question}</p>
      <div role="group" aria-label={challenge.question} className="flex flex-wrap gap-2">
        {challenge.options.map((option) => (
          <OptionButton
            key={option.id}
            option={option}
            role="checkbox"
            checked={selectedIds.includes(option.id)}
            disabled={disabled ?? false}
            onToggle={() => {
              toggle(option.id);
            }}
          />
        ))}
      </div>
      <ErrorMessage message={errorMessage} />
      <button
        type="submit"
        disabled={(disabled ?? false) || selectedIds.length === 0}
        className="self-start rounded-md bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50"
      >
        Comprobar
      </button>
    </form>
  );
}

export function AnswerForm(props: AnswerFormProps) {
  const { challenge } = props;
  if (challenge.type === 'qr_only') return null;
  if (challenge.type === 'single_option') {
    return <SingleOptionAnswerForm {...props} challenge={challenge} />;
  }
  if (challenge.type === 'multiple_option') {
    return <MultipleOptionAnswerForm {...props} challenge={challenge} />;
  }
  return <TextAnswerForm {...props} />;
}
