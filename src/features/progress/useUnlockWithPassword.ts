import { useMutation } from '@tanstack/react-query';
import { unlockWithPassword } from '../../shared/lib/callables';

export interface PasswordUnlock {
  readonly isPending: boolean;
  readonly errorMessage: string | null;
  readonly unlock: (password: string) => void;
}

export function useUnlockWithPassword(huntId: string, stationId: string): PasswordUnlock {
  const { mutate, data, error, isPending } = useMutation({
    mutationFn: async (password: string) =>
      (
        await unlockWithPassword({
          huntId,
          stationId,
          password,
          clientRequestId: crypto.randomUUID(),
        })
      ).data,
  });

  let errorMessage: string | null = null;
  if (error) {
    errorMessage = 'No se ha podido comprobar la palabra clave. Inténtalo de nuevo.';
  } else if (data?.ok === false) {
    errorMessage = 'Palabra clave incorrecta. Inténtalo de nuevo.';
  }

  return { isPending, errorMessage, unlock: mutate };
}
