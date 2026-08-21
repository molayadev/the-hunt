import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { OfflineQueueBanner } from './OfflineQueueBanner';

describe('OfflineQueueBanner', () => {
  it('renders nothing when the queue is empty', () => {
    const { container } = render(<OfflineQueueBanner queuedCount={0} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows queued feedback, announced as a status region', () => {
    render(<OfflineQueueBanner queuedCount={2} />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('En cola');
    expect(status).toHaveTextContent('2');
  });
});
