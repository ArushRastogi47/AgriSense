import React, { useRef, useState } from 'react';
import { Camera, Upload, X, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';

interface ImageUploadProps {
  onImageUpload: (imageData: string, fileName: string) => void;
  isUploading: boolean;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ onImageUpload, isUploading }) => {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [showCameraError, setShowCameraError] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processImage(file);
    }
  };

  const processImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      onImageUpload(imageData, file.name);
    };
    reader.readAsDataURL(file);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const triggerCameraCapture = async () => {
    setShowCameraError(false);
    
    // For mobile devices, the capture attribute should work even without getUserMedia
    // Just trigger the file input with capture attribute
    cameraInputRef.current?.click();
    
    // Optional: Show helpful message on desktop
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (!isMobile) {
      // On desktop, inform user that camera access depends on browser and security context
      console.log('Camera capture requested on desktop - behavior depends on browser and security context');
    }
  };

  return (
    <div className="relative flex items-center gap-2">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
        multiple={false}
      />

      {/* Camera Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={triggerCameraCapture}
        disabled={isUploading}
        className="p-2 text-gray-500 hover:text-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={`${t('chat.take_photo')} (${/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ? 'Camera' : 'File from Camera'})`}
      >
        <Camera className="w-5 h-5" />
      </motion.button>

      {/* Upload Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={triggerFileUpload}
        disabled={isUploading}
        className="p-2 text-gray-500 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title={t('chat.upload_image')}
      >
        <Upload className="w-5 h-5" />
      </motion.button>

      {isUploading && (
        <div className="flex items-center gap-1 text-xs text-blue-600">
          <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span>{t('chat.analyzing_image')}</span>
        </div>
      )}
      
      {showCameraError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 mt-2 p-2 bg-red-100 border border-red-300 rounded-lg text-xs text-red-700 flex items-center gap-1 whitespace-nowrap z-10"
        >
          <AlertCircle className="w-3 h-3" />
          <span>{t('chat.camera_error')}</span>
        </motion.div>
      )}
    </div>
  );
};