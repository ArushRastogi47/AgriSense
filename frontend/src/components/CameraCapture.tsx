import React, { useRef, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Camera, Upload, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface CameraCaptureProps {
  isOpen: boolean;
  onClose: () => void;
  onImageCapture: (imageData: string, fileName: string) => void;
  onError: (error: string) => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({
  isOpen,
  onClose,
  onImageCapture,
  onError
}) => {
  const { t } = useLanguage();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const startCamera = async () => {
    setCameraLoading(true);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      setStream(mediaStream);
      setCameraLoading(false);
    } catch (error) {
      console.error('Error starting camera:', error);
      setCameraLoading(false);
      onError('Failed to access camera. Please check permissions.');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Draw video frame to canvas
      context?.drawImage(video, 0, 0);
      
      // Convert canvas to data URL for preview
      const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
      setCapturedImage(imageDataUrl);
      setShowPreview(true);
    }
  };

  const confirmImage = () => {
    if (capturedImage) {
      // Convert data URL to file for processing
      const file = dataURLtoFile(capturedImage, `camera-capture-${Date.now()}.jpg`);
      onImageCapture(capturedImage, file.name);
      closeCamera();
    }
  };

  const retakePhoto = async () => {
    setCapturedImage(null);
    setShowPreview(false);
    setCameraLoading(true);
    
    // Always restart the camera stream for a fresh connection
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      setStream(mediaStream);
      setCameraLoading(false);
    } catch (error) {
      console.error('Error restarting camera:', error);
      setCameraLoading(false);
      onError('Failed to restart camera. Please try again.');
    }
  };

  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setCapturedImage(null);
    setShowPreview(false);
    onClose();
  };

  // Start camera when modal opens
  useEffect(() => {
    if (isOpen) {
      startCamera();
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    // Cleanup on component unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle video stream setup
  useEffect(() => {
    if (isOpen && stream && videoRef.current) {
      const video = videoRef.current;
      video.srcObject = stream;
      
      const playVideo = async () => {
        try {
          await video.play();
          console.log('Video started successfully');
        } catch (error) {
          console.error('Error starting video:', error);
          onError('Failed to start video stream.');
        }
      };
      
      playVideo();
    }
  }, [isOpen, stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  if (!isOpen) return null;

  return createPortal(
    <div 
      className="fixed inset-0 flex items-center justify-center z-[99999] pointer-events-none"
    >
      <div className="bg-white rounded-lg shadow-2xl w-11/12 max-w-lg overflow-hidden pointer-events-auto border-2 border-gray-300">
        <div className="flex justify-between items-center px-5 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-800">
            {showPreview ? t('camera.review_photo') : t('camera.take_photo')}
          </h3>
          <button
            onClick={closeCamera}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        <div className="p-4">
          {showPreview ? (
            // Preview captured image
            <div className="relative bg-black rounded-lg overflow-hidden">
              <img
                src={capturedImage || ''}
                alt="Captured"
                className="w-full h-64 object-cover"
              />
            </div>
          ) : (
            // Camera view
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-64 object-cover"
                autoPlay
                playsInline
                muted
              />
              {(cameraLoading || !stream) && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                  <div className="text-center text-white">
                    <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-sm">{t('camera.starting_camera')}</p>
                  </div>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
            </div>
          )}
        </div>
        
        <div className="flex justify-center gap-4 px-5 py-4 border-t bg-gray-50">
          {showPreview ? (
            // Preview buttons
            <>
              <button
                onClick={retakePhoto}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                {t('camera.retake')}
              </button>
              <button
                onClick={confirmImage}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
              >
                <Upload className="w-4 h-4" />
                {t('camera.use_photo')}
              </button>
            </>
          ) : (
            // Camera buttons
            <>
              <button
                onClick={closeCamera}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
              >
                {t('camera.cancel')}
              </button>
              <button
                onClick={capturePhoto}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
                disabled={!stream || cameraLoading}
              >
                <Camera className="w-4 h-4" />
                {t('camera.capture')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};