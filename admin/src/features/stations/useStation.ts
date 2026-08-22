'use client';

import { useEffect, useState } from 'react';
import type { StationAnswerDoc, StationDoc } from '@rastro/schema';
import { db, doc, getDoc } from '@/lib/firebase';
import type { StationFormValues, StationOptionValue } from './saveStation';

export interface UseStationResult {
  readonly values: StationFormValues | null;
  readonly isLoading: boolean;
}

export const EMPTY_STATION_VALUES: StationFormValues = {
  order: 1,
  title: '',
  clue: '',
  coverUrl: '',
  unlock: 'qr',
  acceptedPasswords: '',
  mapsUrl: '',
  locationHint: '',
  challengeType: 'text',
  question: '',
  placeholder: '',
  hint: '',
  acceptedAnswers: '',
  options: [],
  prizeKind: 'digital',
  prizeTitle: '',
  prizePayload: '',
  prizeRedeemInstructions: '',
};

function toFormValues(
  station: StationDoc,
  secret: StationAnswerDoc | undefined,
): StationFormValues {
  const options: StationOptionValue[] =
    station.challenge.type === 'single_option' || station.challenge.type === 'multiple_option'
      ? station.challenge.options.map((option) => ({
          id: option.id,
          kind: option.kind,
          text: option.kind === 'text' ? option.text : '',
          imageUrl: option.kind === 'image' ? option.imageUrl : '',
          alt: option.kind === 'image' ? option.alt : '',
          correct:
            station.challenge.type === 'single_option'
              ? secret?.correctOptionId === option.id
              : (secret?.correctOptionIds ?? []).includes(option.id),
        }))
      : [];

  return {
    order: station.order,
    title: station.title,
    clue: station.clue,
    coverUrl: station.coverUrl ?? '',
    unlock: station.unlock ?? 'qr',
    acceptedPasswords: (secret?.acceptedPasswords ?? []).join('\n'),
    mapsUrl: station.location?.mapsUrl ?? '',
    locationHint: station.location?.hint ?? '',
    challengeType: station.challenge.type,
    question: station.challenge.type === 'qr_only' ? '' : station.challenge.question,
    placeholder: station.challenge.type === 'text' ? (station.challenge.placeholder ?? '') : '',
    hint: station.challenge.type === 'text' ? (station.challenge.hint ?? '') : '',
    acceptedAnswers: (secret?.acceptedAnswers ?? []).join('\n'),
    options,
    prizeKind: station.prize.kind,
    prizeTitle: station.prize.title,
    prizePayload: station.prize.payload ?? '',
    prizeRedeemInstructions: station.prize.redeemInstructions ?? '',
  };
}

export function useStation(huntId: string | null, stationId: string | null): UseStationResult {
  const [values, setValues] = useState<StationFormValues | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!huntId || !stationId) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    setIsLoading(true);
    Promise.all([
      getDoc(doc(db, `hunts/${huntId}/stations/${stationId}`)),
      getDoc(doc(db, `hunts/${huntId}/stations/${stationId}/secret/answer`)),
    ])
      .then(([stationSnap, secretSnap]) => {
        if (!stationSnap.exists()) {
          setValues(null);
          return;
        }
        setValues(
          toFormValues(
            stationSnap.data() as StationDoc,
            secretSnap.exists() ? (secretSnap.data() as StationAnswerDoc) : undefined,
          ),
        );
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [huntId, stationId]);

  return {
    values: stationId ? values : EMPTY_STATION_VALUES,
    isLoading: stationId ? isLoading : false,
  };
}
