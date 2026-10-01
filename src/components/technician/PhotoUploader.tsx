import React, { useRef, useState } from 'react';
import {
  Camera,
  Upload,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Trash2,
  Image as ImageIcon,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { JobPhoto, PhotoType } from '../../types';

interface PhotoUploaderProps {
  photos: JobPhoto[];
  onAddPhoto: (photo: Omit<JobPhoto, 'id' | 'uploadedAt' | 'uploadedBy'>) => void;
  onDeletePhoto?: (photoId: string) => void;
  onToggleVisibility?: (photoId: string) => void;
  targetType: PhotoType;
  label: string;
  minRequired?: number;
  maxAllowed?: number;
  readOnly?: boolean;
}

export const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  photos,
  onAddPhoto,
  onDeletePhoto,
  onToggleVisibility,
  targetType,
  label,
  minRequired = 0,
  maxAllowed = 10,
  readOnly = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [caption, setCaption] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const filteredPhotos = photos.filter((p) => p.type === targetType);
  const meetsRequirement = filteredPhotos.length >= minRequired;

  // Process file, auto-orient, compress client-side to max 1600px
  const processImageFile = (file: File) => {
    setErrorMessage(null);

    // Reject non-image or > 12MB
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image format (JPEG, PNG, WebP).');
      return;
    }
    if (file.size > 12 * 1024 * 1024) {
      setErrorMessage('File size exceeds the 12MB maximum limit.');
      return;
    }

    setIsProcessing(true);
    setUploadProgress(20);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setUploadProgress(60);

        // Canvas compression
        const canvas = document.createElement('canvas');
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

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
        }

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setUploadProgress(100);

        setTimeout(() => {
          onAddPhoto({
            type: targetType,
            url: compressedDataUrl,
            thumbnailUrl: compressedDataUrl,
            caption: caption.trim() || `${label} - Photo #${filteredPhotos.length + 1}`,
            isCustomerVisible: true,
          });

          setIsProcessing(false);
          setUploadProgress(null);
          setCaption('');
        }, 300);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      setIsProcessing(false);
      setUploadProgress(null);
      setErrorMessage('Failed to read image file. Please retry.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
    // reset input
    e.target.value = '';
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
      {/* Title & Requirement Badge */}
      <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-[#0E9AA7]" />
          <h4 className="text-xs font-bold text-slate-800">{label}</h4>
          {minRequired > 0 && (
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                meetsRequirement
                  ? 'bg-emerald-100 text-emerald-700 flex items-center gap-1'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {meetsRequirement && <CheckCircle className="w-3 h-3" />}
              {filteredPhotos.length} / {minRequired} Mandatory
            </span>
          )}
        </div>

        <span className="text-[11px] text-slate-500">
          Max {maxAllowed} photos (Max 12MB each)
        </span>
      </div>

      {errorMessage && (
        <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Upload Inputs and Progress Bar */}
      {!readOnly && filteredPhotos.length < maxAllowed && (
        <div className="mb-3 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Optional photo caption (e.g. Front left angle, Odometer reading...)"
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0E9AA7]"
              disabled={isProcessing}
            />

            {/* Camera Button (Environment/Rear on mobile) */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0B3A6E] hover:bg-[#082b52] rounded-lg shadow-xs cursor-pointer transition-colors disabled:opacity-50"
            >
              <Camera className="w-3.5 h-3.5 text-teal-300" />
              <span>Camera</span>
            </button>

            {/* Gallery / File Picker */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg shadow-xs cursor-pointer transition-colors disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5 text-[#0E9AA7]" />
              <span>Upload</span>
            </button>
          </div>

          {/* Progress bar during compression */}
          {isProcessing && uploadProgress !== null && (
            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-teal-500 h-full transition-all duration-200"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Photos Grid */}
      {filteredPhotos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
          {filteredPhotos.map((photo, index) => (
            <div
              key={photo.id}
              className="group relative bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs"
            >
              <div className="aspect-4/3 w-full bg-slate-100 relative overflow-hidden">
                <img
                  src={photo.url}
                  alt={photo.caption}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                  loading="lazy"
                />
                <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-slate-900/70 text-white">
                  #{index + 1}
                </span>

                {/* Customer visible tag */}
                <span
                  className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[9px] font-semibold flex items-center gap-0.5 ${
                    photo.isCustomerVisible
                      ? 'bg-emerald-600/90 text-white'
                      : 'bg-slate-800/80 text-slate-300'
                  }`}
                >
                  {photo.isCustomerVisible ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                  {photo.isCustomerVisible ? 'Customer' : 'Internal'}
                </span>
              </div>

              <div className="p-2">
                <p className="text-[11px] font-medium text-slate-700 truncate" title={photo.caption}>
                  {photo.caption}
                </p>

                {/* Actions */}
                {!readOnly && (
                  <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-slate-100">
                    {onToggleVisibility && (
                      <button
                        type="button"
                        onClick={() => onToggleVisibility(photo.id)}
                        className="text-[10px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                        title="Toggle customer visibility"
                      >
                        {photo.isCustomerVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        {photo.isCustomerVisible ? 'Hide' : 'Show'}
                      </button>
                    )}

                    {onDeletePhoto && (
                      <button
                        type="button"
                        onClick={() => onDeletePhoto(photo.id)}
                        className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer ml-auto"
                        title="Delete photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center text-xs text-slate-400 bg-white rounded-lg border border-dashed border-slate-200">
          No photos captured yet for {label}.
          {minRequired > 0 && (
            <p className="text-amber-600 font-medium text-[11px] mt-1">
              Minimum {minRequired} photos required before completion.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
