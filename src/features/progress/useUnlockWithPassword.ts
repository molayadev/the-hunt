import { useMutation } from '@tanstack/react-query';
import { unlockWithPassword } from '../../shared/lib/callables';
import type { UnlockWithPasswordInput } from '../../domain/callables';

export function useUnlockWithPassword() {
  return useMutation({
    mutationFn: async (input: UnlockWithPasswordInput) => (await unlockWithPassword(input)).data,
  });
}
