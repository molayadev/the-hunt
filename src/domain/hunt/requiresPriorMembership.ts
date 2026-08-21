export function requiresPriorMembership(visibility: 'public' | 'code'): boolean {
  return visibility === 'code';
}
