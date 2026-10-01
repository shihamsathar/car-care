import { PhotoSlotType, PhotoType } from '../types';

export interface ProcessedPhotoResult {
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  sizeBytes: number;
  timestamp: string;
}

export class ImageService {
  /**
   * Process a captured or uploaded photo:
   * - Validates type and size
   * - Resizes to max 1600px (client compression)
   * - Burns official Qatar evidence watermark stamp in bottom corner
   * - Generates 400px thumbnail
   */
  static async processAndStampPhoto(
    file: File | Blob,
    jobNo: string,
    plate: string,
    stage: 'BEFORE' | 'AFTER' | 'PROGRESS' | 'EVIDENCE',
    slotLabel?: string
  ): Promise<ProcessedPhotoResult> {
    // 1. Validation
    if (file.type && !file.type.startsWith('image/')) {
      throw new Error('Only valid image files (JPEG, PNG, WebP) are accepted.');
    }
    if (file.size > 12 * 1024 * 1024) {
      throw new Error('File size exceeds the 12MB maximum limit.');
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error('Failed to decode image data.'));
        img.onload = () => {
          try {
            const maxDimension = 1600;
            let width = img.width;
            let height = img.height;

            if (width > height && width > maxDimension) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else if (height > maxDimension) {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }

            // Create high-res canvas
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              throw new Error('Could not initialize canvas context.');
            }

            // Draw base image
            ctx.drawImage(img, 0, 0, width, height);

            // Burn Qatar Evidence Watermark Stamp
            const now = new Date();
            const qatarTimeStr = new Intl.DateTimeFormat('en-GB', {
              timeZone: 'Asia/Qatar',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            }).format(now);

            const stampTitle = `CarCare Pro Qatar • Job: ${jobNo} • Plate: ${plate}`;
            const stampSubtitle = `${qatarTimeStr} AST • [${stage} EVIDENCE]${slotLabel ? ` • ${slotLabel}` : ''}`;

            // Scale badge dimensions based on image size
            const baseFontSize = Math.max(12, Math.round(width * 0.016));
            ctx.font = `bold ${baseFontSize}px 'Inter', sans-serif`;
            const textMetrics1 = ctx.measureText(stampTitle);
            const textMetrics2 = ctx.measureText(stampSubtitle);
            const textWidth = Math.max(textMetrics1.width, textMetrics2.width);

            const paddingX = Math.round(baseFontSize * 1.2);
            const paddingY = Math.round(baseFontSize * 0.8);
            const badgeWidth = textWidth + paddingX * 2;
            const badgeHeight = baseFontSize * 2.8 + paddingY * 2;

            const badgeX = width - badgeWidth - Math.round(baseFontSize * 1.5);
            const badgeY = height - badgeHeight - Math.round(baseFontSize * 1.5);

            // Draw badge shadow and background
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            ctx.shadowBlur = 10;
            ctx.fillStyle = 'rgba(11, 58, 110, 0.88)'; // Qatar deep navy with opacity
            ctx.beginPath();
            const radius = Math.round(baseFontSize * 0.6);
            ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, radius);
            ctx.fill();

            // Accent border
            ctx.lineWidth = Math.max(1.5, Math.round(baseFontSize * 0.12));
            ctx.strokeStyle = stage === 'BEFORE' ? '#F59E0B' : stage === 'AFTER' ? '#10B981' : '#0E9AA7';
            ctx.stroke();
            ctx.restore();

            // Draw line 1: Job & Plate
            ctx.fillStyle = '#FFFFFF';
            ctx.font = `bold ${baseFontSize}px 'Inter', sans-serif`;
            ctx.fillText(stampTitle, badgeX + paddingX, badgeY + paddingY + baseFontSize);

            // Draw line 2: Time & Stage badge
            ctx.fillStyle = stage === 'BEFORE' ? '#FDE68A' : stage === 'AFTER' ? '#A7F3D0' : '#67E8F9';
            ctx.font = `600 ${Math.round(baseFontSize * 0.85)}px 'Inter', sans-serif`;
            ctx.fillText(stampSubtitle, badgeX + paddingX, badgeY + paddingY + baseFontSize * 2.2);

            // Export high-res stamped photo
            const fullUrl = canvas.toDataURL('image/jpeg', 0.82);

            // Create 400px thumbnail
            const thumbCanvas = document.createElement('canvas');
            const thumbMax = 400;
            let thumbW = width;
            let thumbH = height;
            if (thumbW > thumbH && thumbW > thumbMax) {
              thumbH = Math.round((thumbH * thumbMax) / thumbW);
              thumbW = thumbMax;
            } else if (thumbH > thumbMax) {
              thumbW = Math.round((thumbW * thumbMax) / thumbH);
              thumbH = thumbMax;
            }
            thumbCanvas.width = thumbW;
            thumbCanvas.height = thumbH;
            const thumbCtx = thumbCanvas.getContext('2d');
            if (thumbCtx) {
              thumbCtx.drawImage(canvas, 0, 0, thumbW, thumbH);
            }
            const thumbUrl = thumbCanvas.toDataURL('image/jpeg', 0.75);

            resolve({
              url: fullUrl,
              thumbnailUrl: thumbUrl,
              width,
              height,
              sizeBytes: Math.round((fullUrl.length * 3) / 4),
              timestamp: now.toISOString(),
            });
          } catch (err) {
            reject(err);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  }
}
