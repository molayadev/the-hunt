// Admin-SDK-only document shapes; firestore.rules blocks all direct client
// access to most of these. The shapes themselves live in @rastro/schema,
// shared with the admin app that authors them.
export type {
  AdminDoc,
  AttemptPolicyDoc,
  CardDoc,
  CardStateDoc,
  ChallengeDoc,
  ChallengeOptionDoc,
  HuntDoc,
  PrizeDoc,
  ProgressDoc,
  QrTokenDoc,
  StationAnswerDoc,
  StationDoc,
  StationLocationDoc,
  UnlockMethod,
} from '@rastro/schema';
