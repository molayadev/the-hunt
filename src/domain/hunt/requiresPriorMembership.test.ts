import { describe, expect, it } from 'vitest';
import { requiresPriorMembership } from './requiresPriorMembership';

describe('requiresPriorMembership', () => {
  it('a code-only hunt requires having joined before', () => {
    expect(requiresPriorMembership('code')).toBe(true);
  });

  it('a public hunt can be discovered via any of its station QRs', () => {
    expect(requiresPriorMembership('public')).toBe(false);
  });
});
