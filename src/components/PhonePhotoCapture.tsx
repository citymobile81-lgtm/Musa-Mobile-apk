import React, { useState, useRef } from 'react';
import { PhonePhoto } from '../types';
import {
  Camera,
  Image as ImageIcon,
  Trash2,
  Eye,
  X,
  Upload,
  Check,
  Plus,
} from 'lucide-react';

interface PhonePhotoCaptureProps {
  photos: PhonePhoto[];
  onChange: (photos: PhonePhoto[]) => void;
  readOnly?: boolean;
  title?: string;
}

export const PhonePhotoCapture: React.FC<PhonePhotoCaptureProps> = ({
  photos,
  onChange,
  readOnly = false,
  title,
}) => {
  const [selectedTag, setSelectedTag] = useState<string>('Front Screen (سامنے / اسکرین)');
  const [previewPhoto, setPreviewPhoto] = useState<PhonePhoto | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const tags = [
    'Front Screen (سامنے / اسکرین)',
    'Back Cover (پچھلا رخ / بیک)',
    'Left / Right Sides (سائیڈز)',
    'Broken / Damage Part (ٹوٹا ہوا حصہ)',
    'Motherboard / Internal (اندرونی بورڈ)',
    'Other Check (دیگر معائنہ)',
  ];

  // Compress image to ensure IndexedDB performs fast and does not exceed memory
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;

          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(img.src);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          // Compress to JPEG at 0.78 quality
          const dataUrl = canvas.toDataURL('image/jpeg', 0.78);
          resolve(dataUrl);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setIsProcessing(true);
    const newPhotos: PhonePhoto[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      try {
        const compressedDataUrl = await compressImage(file);
        newPhotos.push({
          id: `photo_${Date.now()}_${i}`,
          title: selectedTag,
          dataUrl: compressedDataUrl,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });
      } catch (err) {
        console.error('Error compressing image:', err);
      }
    }

    onChange([...photos, ...newPhotos]);
    setIsProcessing(false);
    e.target.value = '';
  };

  const handleDeletePhoto = (id: string) => {
    if (confirm('کیا آپ واقعی یہ تصویر حذف کرنا چاہتے ہیں؟ (Delete photo?)')) {
      onChange(photos.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="glass-panel p-5 rounded-2xl border border-slate-700/80 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0353a4]/40 border border-[#d4af37]/50 flex items-center justify-center text-[#d4af37]">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <span>{title || 'Mobile Inspection Photos'}</span>
              <span className="font-serif text-[#d4af37] text-sm">فون کی معائنہ تصاویر</span>
            </h3>
            <p className="text-[11px] text-slate-400">
              موبائل وصول کرتے وقت فرنٹ، بیک اور ٹوٹے ہوئے حصوں کی تصاویر محفوظ کریں ({photos.length} موجود ہیں)
            </p>
          </div>
        </div>

        {/* Capture Buttons */}
        {!readOnly && (
          <div className="flex flex-wrap items-center gap-2">
            {/* Direct Camera Capture */}
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#0353a4] to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
            >
              <Camera className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>کیمرے سے لیں (Camera)</span>
            </button>
            <input
              type="file"
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              onChange={handleFilesSelected}
              className="hidden"
            />

            {/* Gallery Upload */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-1.5 border border-slate-700"
            >
              <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
              <span>گیلری سے منتخب کریں (Gallery)</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              onChange={handleFilesSelected}
              className="hidden"
            />
          </div>
        )}
      </div>

      {/* Tag selector for next upload */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] text-slate-400 font-medium">اگلی تصویر کا ٹیگ منتخب کریں:</span>
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => setSelectedTag(tag)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                selectedTag === tag
                  ? 'bg-[#d4af37] text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Loading state */}
      {isProcessing && (
        <div className="p-3 rounded-xl bg-[#030b1e] text-xs text-[#d4af37] flex items-center gap-2 animate-pulse">
          <span>تصاویر پراسیس ہو رہی ہیں... (Processing high-resolution images...)</span>
        </div>
      )}

      {/* Photos Thumbnail Grid */}
      {photos.length === 0 ? (
        <div className="py-6 px-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
          <ImageIcon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p>ابھی تک کوئی تصویر محفوظ نہیں کی گئی۔ کیمرے یا گیلری سے تصاویر شامل کریں۔</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="group relative rounded-xl overflow-hidden bg-[#020713] border border-slate-800 shadow aspect-video flex flex-col justify-between"
            >
              {/* Image Thumbnail */}
              <img
                src={photo.dataUrl}
                alt={photo.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />

              {/* Overlay Tag */}
              <div className="absolute top-0 left-0 right-0 p-1.5 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between text-[10px]">
                <span className="font-bold text-[#d4af37] truncate drop-shadow max-w-[80%]">
                  {photo.title}
                </span>
                <span className="text-slate-300 font-mono text-[9px]">
                  {photo.timestamp}
                </span>
              </div>

              {/* Action Buttons on hover */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewPhoto(photo)}
                  className="p-2 rounded-xl bg-[#0466c8] text-white hover:bg-blue-600 transition shadow"
                  title="بڑا کر کے دیکھیں (View Full Size)"
                >
                  <Eye className="w-4 h-4" />
                </button>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="p-2 rounded-xl bg-rose-600 text-white hover:bg-rose-700 transition shadow"
                    title="تصویر حذف کریں (Delete)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal for Full View */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
            <div className="w-full flex items-center justify-between pb-3 text-white">
              <div>
                <h4 className="font-bold text-sm text-[#d4af37]">{previewPhoto.title}</h4>
                <p className="text-[11px] text-slate-400 font-mono">Recorded: {previewPhoto.timestamp}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewPhoto(null)}
                className="p-2 rounded-full bg-slate-800 text-slate-200 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={previewPhoto.dataUrl}
              alt={previewPhoto.title}
              className="max-h-[75vh] w-auto max-w-full rounded-2xl object-contain border border-[#d4af37]/40 shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
