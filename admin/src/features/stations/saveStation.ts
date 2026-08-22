import type {
  ChallengeDoc,
  QrTokenDoc,
  StationAnswerDoc,
  StationDoc,
  UnlockMethod,
} from '@rastro/schema';
import { collection, db, doc, getDoc, getDocs, setDoc, updateDoc } from '@/lib/firebase';

export interface StationOptionValue {
  readonly id: string;
  readonly kind: 'text' | 'image';
  readonly text: string;
  readonly imageUrl: string;
  readonly alt: string;
  readonly correct: boolean;
}

export interface StationFormValues {
  readonly order: number;
  readonly title: string;
  readonly clue: string;
  readonly coverUrl: string;
  readonly unlock: UnlockMethod;
  readonly acceptedPasswords: string;
  readonly mapsUrl: string;
  readonly locationHint: string;
  readonly challengeType: ChallengeDoc['type'];
  readonly question: string;
  readonly placeholder: string;
  readonly hint: string;
  readonly acceptedAnswers: string;
  readonly options: readonly StationOptionValue[];
  readonly prizeKind: 'digital' | 'physical';
  readonly prizeTitle: string;
  readonly prizePayload: string;
  readonly prizeRedeemInstructions: string;
}

function linesOf(value: string): readonly string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '');
}

function buildChallenge(values: StationFormValues): ChallengeDoc {
  if (values.challengeType === 'qr_only') return { type: 'qr_only' };
  if (values.challengeType === 'text') {
    return {
      type: 'text',
      question: values.question,
      ...(values.placeholder.trim() !== '' ? { placeholder: values.placeholder.trim() } : {}),
      ...(values.hint.trim() !== '' ? { hint: values.hint.trim() } : {}),
    };
  }
  const options = values.options.map((option) =>
    option.kind === 'image'
      ? { id: option.id, kind: 'image' as const, imageUrl: option.imageUrl, alt: option.alt }
      : { id: option.id, kind: 'text' as const, text: option.text },
  );
  return { type: values.challengeType, question: values.question, options };
}

function buildSecret(values: StationFormValues): StationAnswerDoc {
  const secret: {
    acceptedAnswers?: readonly string[];
    correctOptionId?: string;
    correctOptionIds?: readonly string[];
    acceptedPasswords?: readonly string[];
  } = {};

  if (values.challengeType === 'text') {
    const answers = linesOf(values.acceptedAnswers);
    if (answers.length > 0) secret.acceptedAnswers = answers;
  }
  if (values.challengeType === 'single_option') {
    const correct = values.options.find((option) => option.correct);
    if (correct) secret.correctOptionId = correct.id;
  }
  if (values.challengeType === 'multiple_option') {
    const correct = values.options.filter((option) => option.correct).map((option) => option.id);
    if (correct.length > 0) secret.correctOptionIds = correct;
  }
  if (values.unlock === 'password') {
    const passwords = linesOf(values.acceptedPasswords);
    if (passwords.length > 0) secret.acceptedPasswords = passwords;
  }
  return secret;
}

export async function syncStationCount(huntId: string): Promise<void> {
  const snapshot = await getDocs(collection(db, `hunts/${huntId}/stations`));
  await updateDoc(doc(db, `hunts/${huntId}`), { stationCount: snapshot.size });
}

export async function saveStation(
  huntId: string,
  stationId: string | null,
  values: StationFormValues,
): Promise<string> {
  const ref = stationId
    ? doc(db, `hunts/${huntId}/stations/${stationId}`)
    : doc(collection(db, `hunts/${huntId}/stations`));
  const id = ref.id;

  const data: StationDoc = {
    order: values.order,
    title: values.title,
    clue: values.clue,
    ...(values.coverUrl.trim() !== '' ? { coverUrl: values.coverUrl.trim() } : {}),
    challenge: buildChallenge(values),
    prize: {
      kind: values.prizeKind,
      title: values.prizeTitle,
      ...(values.prizePayload.trim() !== '' ? { payload: values.prizePayload.trim() } : {}),
      ...(values.prizeRedeemInstructions.trim() !== ''
        ? { redeemInstructions: values.prizeRedeemInstructions.trim() }
        : {}),
    },
    unlock: values.unlock,
    ...(values.mapsUrl.trim() !== ''
      ? { location: { mapsUrl: values.mapsUrl.trim(), hint: values.locationHint.trim() } }
      : {}),
  };

  await setDoc(ref, data);
  await setDoc(doc(db, `hunts/${huntId}/stations/${id}/secret/answer`), buildSecret(values));

  if (values.unlock === 'qr') {
    const tokenRef = doc(db, `qrTokens/${huntId}-${id}`);
    const tokenSnap = await getDoc(tokenRef);
    const base: Omit<QrTokenDoc, 'redeemCount'> = {
      huntId,
      stationId: id,
      active: true,
      channel: 'physical',
    };
    await setDoc(tokenRef, tokenSnap.exists() ? base : { ...base, redeemCount: 0 }, {
      merge: true,
    });
  }

  await syncStationCount(huntId);
  return id;
}
