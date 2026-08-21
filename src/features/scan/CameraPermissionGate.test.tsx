import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CameraPermissionGate } from './CameraPermissionGate';

describe('CameraPermissionGate', () => {
  it('idle: shows a permission CTA, not a cryptic error, and no camera content', () => {
    render(
      <CameraPermissionGate status="idle" onRequestAccess={vi.fn()}>
        <p>cámara en vivo</p>
      </CameraPermissionGate>,
    );
    expect(screen.getByRole('button', { name: /activar cámara/i })).toBeInTheDocument();
    expect(screen.queryByText('cámara en vivo')).not.toBeInTheDocument();
  });

  it('idle: the CTA button calls onRequestAccess', async () => {
    const user = userEvent.setup();
    const onRequestAccess = vi.fn();
    render(
      <CameraPermissionGate status="idle" onRequestAccess={onRequestAccess}>
        <p>cámara en vivo</p>
      </CameraPermissionGate>,
    );
    await user.click(screen.getByRole('button', { name: /activar cámara/i }));
    expect(onRequestAccess).toHaveBeenCalledOnce();
  });

  it('denied: shows a permission CTA, not a cryptic error', () => {
    render(
      <CameraPermissionGate status="denied" onRequestAccess={vi.fn()}>
        <p>cámara en vivo</p>
      </CameraPermissionGate>,
    );
    expect(screen.getByRole('button', { name: /activar cámara/i })).toBeInTheDocument();
    expect(screen.queryByText(/error/i)).not.toBeInTheDocument();
  });

  it('unsupported: explains the camera is not available on this device', () => {
    render(
      <CameraPermissionGate status="unsupported" onRequestAccess={vi.fn()}>
        <p>cámara en vivo</p>
      </CameraPermissionGate>,
    );
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(screen.getByText(/no.*disponible|no.*compatible/i)).toBeInTheDocument();
  });

  it('granted: renders the camera content', () => {
    render(
      <CameraPermissionGate status="granted" onRequestAccess={vi.fn()}>
        <p>cámara en vivo</p>
      </CameraPermissionGate>,
    );
    expect(screen.getByText('cámara en vivo')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
