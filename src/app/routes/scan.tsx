import { createFileRoute } from '@tanstack/react-router';
import { vibrateOnDecode } from '../../domain/scan/hapticFeedback';
import { redeemQr } from '../../shared/lib/callables';
import { indexedDbScanQueueStore } from '../../shared/lib/scanQueueStore';
import { CameraPermissionGate } from '../../features/scan/CameraPermissionGate';
import { ManualTokenEntry } from '../../features/scan/ManualTokenEntry';
import { OfflineQueueBanner } from '../../features/scan/OfflineQueueBanner';
import { QrViewfinder } from '../../features/scan/QrViewfinder';
import { TorchToggle } from '../../features/scan/TorchToggle';
import { useCameraPermission } from '../../features/scan/useCameraPermission';
import { useOfflineScanQueue } from '../../features/scan/useOfflineScanQueue';
import { useTorch } from '../../features/scan/useTorch';
import type { TorchTrack } from '../../features/scan/useTorch';

export const Route = createFileRoute('/scan')({
  component: ScanScreen,
});

function ScanScreen() {
  const { status, stream, requestAccess } = useCameraPermission();
  const track = (stream?.getVideoTracks()[0] as TorchTrack | undefined) ?? null;
  const torch = useTorch(track);
  const { queue, enqueueToken } = useOfflineScanQueue({
    store: indexedDbScanQueueStore,
    redeem: async (input) => (await redeemQr(input)).data,
  });

  function handleDecode(token: string) {
    vibrateOnDecode({
      prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      vibrate: (ms) => {
        navigator.vibrate(ms);
      },
    });
    enqueueToken(token);
  }

  return (
    <main className="relative flex min-h-svh flex-col bg-background">
      <CameraPermissionGate status={status} onRequestAccess={requestAccess}>
        {stream && <QrViewfinder stream={stream} onDecode={handleDecode} />}
      </CameraPermissionGate>
      <div className="absolute inset-x-0 bottom-6 flex flex-col items-center gap-3 px-6">
        <OfflineQueueBanner queuedCount={queue.length} />
        <TorchToggle isSupported={torch.isSupported} isOn={torch.isOn} onToggle={torch.toggle} />
        <ManualTokenEntry onSubmit={enqueueToken} />
      </div>
    </main>
  );
}
