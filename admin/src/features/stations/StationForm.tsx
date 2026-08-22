'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import type { StationFormValues, StationOptionValue } from './saveStation';

export interface StationFormProps {
  readonly initialValues: StationFormValues;
  readonly isPending: boolean;
  readonly onSubmit: (values: StationFormValues) => void;
}

const inputClass = 'rounded-md border border-neutral-300 px-3 py-2';
const labelClass = 'text-sm text-neutral-600';
const fieldClass = 'flex flex-col gap-1';
const textareaClass = `${inputClass} min-h-16`;

function newOption(): StationOptionValue {
  return { id: crypto.randomUUID(), kind: 'text', text: '', imageUrl: '', alt: '', correct: false };
}

function OptionsEditor({
  challengeType,
  options,
  onChange,
}: {
  readonly challengeType: StationFormValues['challengeType'];
  readonly options: readonly StationOptionValue[];
  readonly onChange: (options: readonly StationOptionValue[]) => void;
}) {
  function update(id: string, patch: Partial<StationOptionValue>) {
    onChange(options.map((option) => (option.id === id ? { ...option, ...patch } : option)));
  }

  function markCorrect(id: string) {
    if (challengeType === 'single_option') {
      onChange(options.map((option) => ({ ...option, correct: option.id === id })));
    } else {
      update(id, { correct: !options.find((option) => option.id === id)?.correct });
    }
  }

  function remove(id: string) {
    onChange(options.filter((option) => option.id !== id));
  }

  return (
    <div className="flex flex-col gap-3">
      {options.map((option) => (
        <div
          key={option.id}
          className="flex flex-col gap-2 rounded-md border border-neutral-200 p-3"
        >
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1 text-sm">
              <input
                type={challengeType === 'single_option' ? 'radio' : 'checkbox'}
                name="correct-option"
                checked={option.correct}
                onChange={() => {
                  markCorrect(option.id);
                }}
              />
              Correcta
            </label>
            <select
              value={option.kind}
              onChange={(e) => {
                update(option.id, { kind: e.target.value as StationOptionValue['kind'] });
              }}
              className={`${inputClass} py-1`}
            >
              <option value="text">Texto</option>
              <option value="image">Imagen</option>
            </select>
            <button
              type="button"
              onClick={() => {
                remove(option.id);
              }}
              className="ml-auto text-xs text-red-600 underline"
            >
              Quitar
            </button>
          </div>
          {option.kind === 'text' ? (
            <input
              value={option.text}
              onChange={(e) => {
                update(option.id, { text: e.target.value });
              }}
              placeholder="Texto de la opción"
              className={inputClass}
            />
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <input
                value={option.imageUrl}
                onChange={(e) => {
                  update(option.id, { imageUrl: e.target.value });
                }}
                placeholder="URL de la imagen"
                className={inputClass}
              />
              <input
                value={option.alt}
                onChange={(e) => {
                  update(option.id, { alt: e.target.value });
                }}
                placeholder="Texto alternativo"
                className={inputClass}
              />
            </div>
          )}
        </div>
      ))}
      <button
        type="button"
        onClick={() => {
          onChange([...options, newOption()]);
        }}
        className="self-start rounded-md border border-neutral-300 px-3 py-1.5 text-sm font-semibold"
      >
        + Añadir opción
      </button>
    </div>
  );
}

export function StationForm({ initialValues, isPending, onSubmit }: StationFormProps) {
  const [values, setValues] = useState<StationFormValues>(initialValues);

  function set<K extends keyof StationFormValues>(key: K, value: StationFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (values.title.trim() === '' || values.clue.trim() === '') return;
    onSubmit(values);
  }

  const needsOptions =
    values.challengeType === 'single_option' || values.challengeType === 'multiple_option';
  const needsQuestion = values.challengeType !== 'qr_only';

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-lg flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className={fieldClass}>
          <label htmlFor="order" className={labelClass}>
            Orden
          </label>
          <input
            id="order"
            type="number"
            min={1}
            value={values.order}
            onChange={(e) => {
              set('order', Number(e.target.value));
            }}
            className={inputClass}
          />
        </div>
        <div className={fieldClass}>
          <label htmlFor="title" className={labelClass}>
            Título
          </label>
          <input
            id="title"
            value={values.title}
            onChange={(e) => {
              set('title', e.target.value);
            }}
            className={inputClass}
          />
        </div>
      </div>

      <div className={fieldClass}>
        <label htmlFor="clue" className={labelClass}>
          Pista
        </label>
        <textarea
          id="clue"
          value={values.clue}
          onChange={(e) => {
            set('clue', e.target.value);
          }}
          className={textareaClass}
        />
      </div>

      <div className={fieldClass}>
        <label htmlFor="coverUrl" className={labelClass}>
          Imagen de portada (URL, opcional)
        </label>
        <input
          id="coverUrl"
          value={values.coverUrl}
          onChange={(e) => {
            set('coverUrl', e.target.value);
          }}
          className={inputClass}
        />
      </div>

      <fieldset className="flex flex-col gap-3 rounded-md border border-neutral-200 p-3">
        <legend className="px-1 text-sm font-semibold">Desbloqueo</legend>
        <div className={fieldClass}>
          <label htmlFor="unlock" className={labelClass}>
            Método
          </label>
          <select
            id="unlock"
            value={values.unlock}
            onChange={(e) => {
              set('unlock', e.target.value as StationFormValues['unlock']);
            }}
            className={inputClass}
          >
            <option value="qr">Código QR</option>
            <option value="password">Palabra clave</option>
            <option value="none">Sin desbloqueo (se revela ya resoluble)</option>
          </select>
        </div>
        {values.unlock === 'password' && (
          <div className={fieldClass}>
            <label htmlFor="acceptedPasswords" className={labelClass}>
              Palabras clave aceptadas (una por línea)
            </label>
            <textarea
              id="acceptedPasswords"
              value={values.acceptedPasswords}
              onChange={(e) => {
                set('acceptedPasswords', e.target.value);
              }}
              className={textareaClass}
            />
          </div>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-3 rounded-md border border-neutral-200 p-3">
        <legend className="px-1 text-sm font-semibold">Ubicación física (opcional)</legend>
        <div className={fieldClass}>
          <label htmlFor="mapsUrl" className={labelClass}>
            Enlace de Maps
          </label>
          <input
            id="mapsUrl"
            value={values.mapsUrl}
            onChange={(e) => {
              set('mapsUrl', e.target.value);
            }}
            className={inputClass}
          />
        </div>
        {values.mapsUrl.trim() !== '' && (
          <div className={fieldClass}>
            <label htmlFor="locationHint" className={labelClass}>
              Pista de qué buscar allí
            </label>
            <input
              id="locationHint"
              value={values.locationHint}
              onChange={(e) => {
                set('locationHint', e.target.value);
              }}
              className={inputClass}
            />
          </div>
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-3 rounded-md border border-neutral-200 p-3">
        <legend className="px-1 text-sm font-semibold">Acertijo</legend>
        <div className={fieldClass}>
          <label htmlFor="challengeType" className={labelClass}>
            Tipo
          </label>
          <select
            id="challengeType"
            value={values.challengeType}
            onChange={(e) => {
              set('challengeType', e.target.value as StationFormValues['challengeType']);
            }}
            className={inputClass}
          >
            <option value="text">Respuesta de texto</option>
            <option value="single_option">Opción única</option>
            <option value="multiple_option">Opción múltiple</option>
            <option value="qr_only">Solo QR (sin pregunta)</option>
          </select>
        </div>

        {needsQuestion && (
          <div className={fieldClass}>
            <label htmlFor="question" className={labelClass}>
              Pregunta
            </label>
            <input
              id="question"
              value={values.question}
              onChange={(e) => {
                set('question', e.target.value);
              }}
              className={inputClass}
            />
          </div>
        )}

        {values.challengeType === 'text' && (
          <>
            <div className={fieldClass}>
              <label htmlFor="acceptedAnswers" className={labelClass}>
                Respuestas aceptadas (una por línea)
              </label>
              <textarea
                id="acceptedAnswers"
                value={values.acceptedAnswers}
                onChange={(e) => {
                  set('acceptedAnswers', e.target.value);
                }}
                className={textareaClass}
              />
            </div>
            <div className={fieldClass}>
              <label htmlFor="hint" className={labelClass}>
                Pista extra (opcional)
              </label>
              <input
                id="hint"
                value={values.hint}
                onChange={(e) => {
                  set('hint', e.target.value);
                }}
                className={inputClass}
              />
            </div>
          </>
        )}

        {needsOptions && (
          <OptionsEditor
            challengeType={values.challengeType}
            options={values.options}
            onChange={(options) => {
              set('options', options);
            }}
          />
        )}
      </fieldset>

      <fieldset className="flex flex-col gap-3 rounded-md border border-neutral-200 p-3">
        <legend className="px-1 text-sm font-semibold">Premio</legend>
        <div className="grid grid-cols-2 gap-4">
          <div className={fieldClass}>
            <label htmlFor="prizeKind" className={labelClass}>
              Tipo
            </label>
            <select
              id="prizeKind"
              value={values.prizeKind}
              onChange={(e) => {
                set('prizeKind', e.target.value as StationFormValues['prizeKind']);
              }}
              className={inputClass}
            >
              <option value="digital">Digital</option>
              <option value="physical">Físico</option>
            </select>
          </div>
          <div className={fieldClass}>
            <label htmlFor="prizeTitle" className={labelClass}>
              Título
            </label>
            <input
              id="prizeTitle"
              value={values.prizeTitle}
              onChange={(e) => {
                set('prizeTitle', e.target.value);
              }}
              className={inputClass}
            />
          </div>
        </div>
        {values.prizeKind === 'digital' ? (
          <div className={fieldClass}>
            <label htmlFor="prizePayload" className={labelClass}>
              Enlace de la recompensa
            </label>
            <input
              id="prizePayload"
              value={values.prizePayload}
              onChange={(e) => {
                set('prizePayload', e.target.value);
              }}
              className={inputClass}
            />
          </div>
        ) : (
          <div className={fieldClass}>
            <label htmlFor="prizeRedeemInstructions" className={labelClass}>
              Instrucciones para recogerlo (o enlace de Maps)
            </label>
            <input
              id="prizeRedeemInstructions"
              value={values.prizeRedeemInstructions}
              onChange={(e) => {
                set('prizeRedeemInstructions', e.target.value);
              }}
              className={inputClass}
            />
          </div>
        )}
      </fieldset>

      <button
        type="submit"
        disabled={isPending || values.title.trim() === '' || values.clue.trim() === ''}
        className="self-start rounded-md bg-neutral-900 px-4 py-2 font-semibold text-white disabled:opacity-50"
      >
        {isPending ? 'Guardando…' : 'Guardar'}
      </button>
    </form>
  );
}
