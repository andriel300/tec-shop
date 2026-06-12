'use client';

import { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CroppedArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

async function getCroppedBlob(imageSrc: string, croppedArea: CroppedArea): Promise<Blob> {
  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new window.Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', reject);
    img.src = imageSrc;
  });
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  canvas.width = croppedArea.width;
  canvas.height = croppedArea.height;
  ctx.drawImage(image, croppedArea.x, croppedArea.y, croppedArea.width, croppedArea.height, 0, 0, croppedArea.width, croppedArea.height);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => { if (blob) resolve(blob); else reject(new Error('Canvas toBlob failed')); },
      'image/jpeg',
      0.9
    );
  });
}

interface CropModalProps {
  imageSrc: string;
  onClose: () => void;
  onConfirm: (blob: Blob) => void;
}

export default function CropModal({ imageSrc, onClose, onConfirm }: CropModalProps) {
  const t = useTranslations('Profile');
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedArea | null>(null);

  const onCropComplete = useCallback((_: unknown, pixels: CroppedArea) => {
    setCroppedAreaPixels(pixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
    onConfirm(blob);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-semibold text-gray-800">{t('cropPhoto')}</h3>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        <div className="relative w-full" style={{ height: 300, background: '#111' }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="px-5 py-3 border-t border-gray-100">
          <label className="text-xs text-gray-500 mb-1 block">{t('zoom')}</label>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-brand-primary"
          />
        </div>

        <div className="flex gap-2 px-5 pb-5">
          <button onClick={onClose} className="flex-1 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            {t('cancel')}
          </button>
          <button onClick={handleConfirm} className="flex-1 py-2 rounded-xl bg-brand-primary text-white text-sm font-semibold hover:bg-brand-primary-800 transition-colors">
            {t('apply')}
          </button>
        </div>
      </div>
    </div>
  );
}
