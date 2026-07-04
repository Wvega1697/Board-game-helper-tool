import { toPng } from 'html-to-image';

/**
 * Capture a DOM element as a PNG and share or download it.
 * @param {HTMLElement} element - The DOM element to capture
 * @param {Object} options - Share options
 * @param {string} options.fileName - File name for download
 * @param {string} options.title - Share title
 * @param {string} options.text - Share text
 */
export async function captureAndShare(element, { fileName = 'score-card.png', title = '', text = '' } = {}) {
  // Wait for fonts to be fully loaded
  if (document.fonts?.ready) {
    await document.fonts.ready;
  }

  // Small delay for rendering to settle
  await new Promise((resolve) => setTimeout(resolve, 100));

  const dataUrl = await toPng(element, {
    quality: 0.95,
    pixelRatio: 2,
    backgroundColor: '#0f0f1a',
  });

  // Convert data URL to blob
  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const file = new File([blob], fileName, { type: 'image/png' });

  // Try Web Share API on mobile
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title,
        text,
        files: [file],
      });
      return { shared: true };
    } catch (err) {
      if (err.name === 'AbortError') {
        return { shared: false, cancelled: true };
      }
      // Fall through to download
    }
  }

  // Fallback: download
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  return { shared: false, downloaded: true };
}
