/**
 * Image helper for cafe receipt slips
 * Compresses images client-side for fast storage, offline support, and Firestore sync
 */

export interface ProcessedImage {
  dataUrl: string;
  thumbnailUrl: string;
  sizeKb: number;
  fileName: string;
}

export async function compressAndProcessImage(file: File, maxWidth = 1200, quality = 0.75): Promise<ProcessedImage> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        // Create main compressed canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        // Draw image smoothly
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export main compressed image
        const dataUrl = canvas.toDataURL('image/jpeg', quality);

        // Create small thumbnail (200px max)
        const thumbCanvas = document.createElement('canvas');
        const thumbMax = 200;
        let tWidth = width;
        let tHeight = height;
        if (tWidth > tHeight) {
          if (tWidth > thumbMax) {
            tHeight = Math.round((tHeight * thumbMax) / tWidth);
            tWidth = thumbMax;
          }
        } else {
          if (tHeight > thumbMax) {
            tWidth = Math.round((tWidth * thumbMax) / tHeight);
            tHeight = thumbMax;
          }
        }
        thumbCanvas.width = tWidth;
        thumbCanvas.height = tHeight;
        const tCtx = thumbCanvas.getContext('2d');
        if (tCtx) {
          tCtx.imageSmoothingEnabled = true;
          tCtx.drawImage(img, 0, 0, tWidth, tHeight);
        }
        const thumbnailUrl = thumbCanvas.toDataURL('image/jpeg', 0.6);

        const approxSizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

        resolve({
          dataUrl,
          thumbnailUrl,
          sizeKb: approxSizeKb,
          fileName: file.name,
        });
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export async function compressImage(file: File, maxWidth = 800, quality = 0.8): Promise<string> {
  const result = await compressAndProcessImage(file, maxWidth, quality);
  return result.dataUrl;
}

/**
 * Generate shareable/scannable URL for receipt verification
 */
export function getReceiptQrUrl(transactionId: string): string {
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
  return `${origin}${pathname}#receipt=${encodeURIComponent(transactionId)}`;
}
