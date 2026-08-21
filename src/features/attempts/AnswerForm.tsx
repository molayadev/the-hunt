import type { AnswerInput } from '../../domain/callables';
import type { Challenge } from '../../shared/types/card';

export interface AnswerFormProps {
  readonly challenge: Challenge;
  readonly disabled?: boolean;
  readonly errorMessage?: string | null;
  readonly onSubmit: (answer: AnswerInput) => void;
}

export function AnswerForm(props: AnswerFormProps) {
  void props;
  return null;
}
