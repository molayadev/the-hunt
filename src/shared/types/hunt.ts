export interface HuntSummary {
  readonly id: string;
  readonly title: string;
  readonly tagline?: string;
  readonly coverUrl?: string;
  readonly status: 'draft' | 'live' | 'closed';
  readonly visibility: 'public' | 'code';
  readonly stationCount: number;
  readonly attemptPolicy: {
    readonly maxAttempts: number;
    readonly windowHours: number;
    readonly scope: 'station' | 'hunt';
  };
  readonly language: 'es' | 'en';
}
