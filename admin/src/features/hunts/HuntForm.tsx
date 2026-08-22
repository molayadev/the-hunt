'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { FormEvent } from 'react';
import type { HuntFormValues } from './saveHunt';

export interface HuntFormProps {
  readonly huntId: string | null;
  readonly initialValues: HuntFormValues;
  readonly isPending: boolean;
  readonly onSubmit: (values: HuntFormValues) => void;
}

const inputClass = 'rounded-md border border-neutral-300 px-3 py-2';
const labelClass = 'text-sm text-neutral-600';
const fieldClass = 'flex flex-col gap-1';

export function HuntForm({ huntId, initialValues, isPending, onSubmit }: HuntFormProps) {
  const [values, setValues] = useState<HuntFormValues>(initialValues);

  function set<K extends keyof HuntFormValues>(key: K, value: HuntFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (values.title.trim() === '') return;
    onSubmit(values);
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-lg flex-col gap-4">
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

      <div className={fieldClass}>
        <label htmlFor="tagline" className={labelClass}>
          Descripción corta
        </label>
        <input
          id="tagline"
          value={values.tagline}
          onChange={(e) => {
            set('tagline', e.target.value);
          }}
          className={inputClass}
        />
      </div>

      <div className={fieldClass}>
        <label htmlFor="icon" className={labelClass}>
          Icono (emoji o URL de imagen)
        </label>
        <input
          id="icon"
          value={values.icon}
          onChange={(e) => {
            set('icon', e.target.value);
          }}
          placeholder="🌳 o https://…"
          className={inputClass}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className={fieldClass}>
          <label htmlFor="language" className={labelClass}>
            Idioma
          </label>
          <select
            id="language"
            value={values.language}
            onChange={(e) => {
              set('language', e.target.value as HuntFormValues['language']);
            }}
            className={inputClass}
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>

        <div className={fieldClass}>
          <label htmlFor="status" className={labelClass}>
            Estado
          </label>
          <select
            id="status"
            value={values.status}
            onChange={(e) => {
              set('status', e.target.value as HuntFormValues['status']);
            }}
            className={inputClass}
          >
            <option value="draft">Borrador</option>
            <option value="live">Publicado</option>
            <option value="closed">Cerrado</option>
          </select>
        </div>

        <div className={fieldClass}>
          <label htmlFor="visibility" className={labelClass}>
            Visibilidad
          </label>
          <select
            id="visibility"
            value={values.visibility}
            onChange={(e) => {
              set('visibility', e.target.value as HuntFormValues['visibility']);
            }}
            className={inputClass}
          >
            <option value="code">Con código</option>
            <option value="public">Pública</option>
          </select>
        </div>

        {values.visibility === 'code' && (
          <div className={fieldClass}>
            <label htmlFor="joinCode" className={labelClass}>
              Código para unirse
            </label>
            <input
              id="joinCode"
              value={values.joinCode}
              onChange={(e) => {
                set('joinCode', e.target.value);
              }}
              className={inputClass}
            />
          </div>
        )}
      </div>

      <div className={fieldClass}>
        <span className={labelClass}>Estaciones</span>
        {huntId ? (
          <Link
            href={`/stations?huntId=${huntId}`}
            className="self-start text-sm font-semibold text-neutral-900 underline"
          >
            {values.stationCount} estaciones — gestionar
          </Link>
        ) : (
          <p className="text-sm text-neutral-400">Guarda la ruta primero para añadir estaciones.</p>
        )}
      </div>

      <fieldset className="flex flex-col gap-3 rounded-md border border-neutral-200 p-3">
        <legend className="px-1 text-sm font-semibold">Política de intentos</legend>
        <div className="grid grid-cols-3 gap-4">
          <div className={fieldClass}>
            <label htmlFor="maxAttempts" className={labelClass}>
              Intentos máx.
            </label>
            <input
              id="maxAttempts"
              type="number"
              min={1}
              value={values.maxAttempts}
              onChange={(e) => {
                set('maxAttempts', Number(e.target.value));
              }}
              className={inputClass}
            />
          </div>
          <div className={fieldClass}>
            <label htmlFor="windowHours" className={labelClass}>
              Ventana (horas)
            </label>
            <input
              id="windowHours"
              type="number"
              min={1}
              value={values.windowHours}
              onChange={(e) => {
                set('windowHours', Number(e.target.value));
              }}
              className={inputClass}
            />
          </div>
          <div className={fieldClass}>
            <label htmlFor="scope" className={labelClass}>
              Alcance
            </label>
            <select
              id="scope"
              value={values.scope}
              onChange={(e) => {
                set('scope', e.target.value as HuntFormValues['scope']);
              }}
              className={inputClass}
            >
              <option value="station">Por estación</option>
              <option value="hunt">Por ruta</option>
            </select>
          </div>
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={isPending || values.title.trim() === ''}
        className="self-start rounded-md bg-neutral-900 px-4 py-2 font-semibold text-white disabled:opacity-50"
      >
        {isPending ? 'Guardando…' : 'Guardar'}
      </button>
    </form>
  );
}
