import { useMutation } from '@tanstack/react-query';
import { submitAnswer } from '../../shared/lib/callables';
import type { SubmitAnswerInput } from '../../domain/callables';

export function useSubmitAnswer() {
  return useMutation({
    mutationFn: async (input: SubmitAnswerInput) => (await submitAnswer(input)).data,
  });
}
