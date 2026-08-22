import QRCode from 'qrcode';

// 22% of the QR's width — well under the ~30% tile tolerance that
// errorCorrectionLevel 'H' guarantees, so a centered logo this size never
// makes the code unreadable. Confirmed by decoding a generated QR (with a
// logo drawn) through jsQR, the same library the player app's scanner uses.
const LOGO_RATIO = 0.22;

function isUrl(value: string): boolean {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

async function drawLogo(canvas: HTMLCanvasElement, icon: string | undefined): Promise<void> {
  const ctx = canvas.getContext('2d');
  if (!ctx || !icon) return;

  const logoSize = canvas.width * LOGO_RATIO;
  const x = (canvas.width - logoSize) / 2;
  const y = (canvas.height - logoSize) / 2;

  // White backing so the logo reads cleanly against the QR modules under it.
  const pad = logoSize * 0.12;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x - pad, y - pad, logoSize + pad * 2, logoSize + pad * 2);

  if (isUrl(icon)) {
    await new Promise<void>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, x, y, logoSize, logoSize);
        resolve();
      };
      // A logo that fails to load (e.g. no CORS headers) just leaves the
      // white square — the QR itself still scans fine either way.
      img.onerror = () => {
        resolve();
      };
      img.src = icon;
    });
  } else {
    ctx.font = `${String(logoSize * 0.85)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(icon, canvas.width / 2, canvas.height / 2 + logoSize * 0.05);
  }
}

export async function renderQrToCanvas(
  canvas: HTMLCanvasElement,
  token: string,
  icon: string | undefined,
  size: number,
): Promise<void> {
  await QRCode.toCanvas(canvas, token, {
    width: size,
    margin: 2,
    errorCorrectionLevel: 'H',
    color: { dark: '#000000', light: '#ffffff' },
  });
  await drawLogo(canvas, icon);
}
