import { useEffect } from 'react';
import { AnswerForm } from '../attempts/AnswerForm';
import { AttemptHearts } from '../attempts/AttemptHearts';
import { useStationSolver } from '../attempts/useStationSolver';
import type { Card } from '../../shared/types/card';
import type { HuntSummary } from '../../shared/types/hunt';

export interface StationDetailModalProps {
  readonly card: Card;
  readonly huntId: string;
  readonly hunt: HuntSummary | null;
  readonly onClose: () => void;
}

export function StationDetailModal({ card, huntId, hunt, onClose }: StationDetailModalProps) {
  const solver = useStationSolver(huntId, card.id, card, hunt);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const solvedJustNow = card.state === 'unlocked' && solver.result?.ok === true;
  const showSolved = card.state === 'solved' || solvedJustNow;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <button
        type="button"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="station-detail-title"
        className="relative flex w-full max-w-sm flex-col gap-3 rounded-md border border-border bg-card p-5"
      >
        <header className="flex items-start justify-between gap-2">
          <h2
            id="station-detail-title"
            className="font-display text-xl font-semibold text-foreground"
          >
            {card.title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-muted-foreground"
          >
            ✕
          </button>
        </header>

        <p className="text-sm text-muted-foreground">{card.clue}</p>

        {card.state === 'revealed' && (
          <p className="text-sm text-muted-foreground">
            Aún bloqueada — escanea su código QR para desbloquearla.
          </p>
        )}

        {showSolved && (
          <p className="flex items-center gap-2 font-display text-lg font-semibold text-primary">
            <span aria-hidden="true">★</span>
            {card.state === 'solved' ? card.prize.title : '¡Resuelta!'}
          </p>
        )}

        {card.state === 'unlocked' && !solvedJustNow && (
          <>
            <AttemptHearts
              attemptsLeft={solver.attemptStatus.attemptsLeft}
              maxAttempts={solver.policy.maxAttempts}
            />
            <AnswerForm
              challenge={card.challenge}
              disabled={solver.attemptStatus.attemptsLeft === 0 || solver.isPending}
              errorMessage={solver.errorMessage}
              onSubmit={solver.submit}
            />
          </>
        )}
      </div>
    </div>
  );
}
