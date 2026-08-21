import type { Card } from '../../shared/types/card';
import type { HuntSummary } from '../../shared/types/hunt';

export interface StationDetailModalProps {
  readonly card: Card;
  readonly huntId: string;
  readonly hunt: HuntSummary | null;
  readonly onClose: () => void;
}

export function StationDetailModal(props: StationDetailModalProps) {
  void props;
  return null;
}
