import React from 'react';
import { X, Download } from 'lucide-react';

export const ImageLightboxModal = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;
  const fullUrl = imageUrl;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="absolute top-4 right-4 flex items-center gap-3">
        <a
          href={fullUrl}
          download
          onClick={(e) => e.stopPropagation()}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          title="Download Image"
        >
          <Download className="w-5 h-5" />
        </a>
        <button
          onClick={onClose}
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <img
        src={fullUrl}
        alt="Enlarged chat attachment"
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
      />
    </div>
  );
};
