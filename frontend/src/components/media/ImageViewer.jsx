import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

const ImageViewer = ({ imageUrl, thumbnailUrl, onClose, images = [], currentIndex = 0 }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(currentIndex);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const hasMultipleImages = images && images.length > 1;
  const currentImage = hasMultipleImages ? images[currentImageIndex] : imageUrl;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      } else if (e.key === 'ArrowLeft' && hasMultipleImages) {
        handlePrevious();
      } else if (e.key === 'ArrowRight' && hasMultipleImages) {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentImageIndex, hasMultipleImages]);

  const handleClose = () => {
    setIsFullScreen(false);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    if (onClose) onClose();
  };

  const handlePrevious = () => {
    if (hasMultipleImages && currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
      resetZoomAndPosition();
    }
  };

  const handleNext = () => {
    if (hasMultipleImages && currentImageIndex < images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
      resetZoomAndPosition();
    }
  };

  const resetZoomAndPosition = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.5, 0.5));
  };

  const handleMouseDown = (e) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e) => {
    if (zoom > 1 && e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    }
  };

  const handleTouchMove = (e) => {
    if (isDragging && zoom > 1 && e.touches.length === 1) {
      setPosition({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Thumbnail view (inline in message)
  if (!isFullScreen) {
    return (
      <div
        className="relative cursor-pointer rounded-lg overflow-hidden max-w-xs"
        onClick={() => setIsFullScreen(true)}
      >
        <img
          src={thumbnailUrl || imageUrl}
          alt="Message attachment"
          className="w-full h-auto object-cover hover:opacity-90 transition-opacity"
        />
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all flex items-center justify-center">
          <Maximize2 className="text-white opacity-0 hover:opacity-100 transition-opacity" size={32} />
        </div>
      </div>
    );
  }

  // Full-screen gallery view
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header with controls */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black to-transparent z-10">
        <div className="flex items-center gap-2">
          {hasMultipleImages && (
            <span className="text-white text-sm">
              {currentImageIndex + 1} / {images.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white transition-all"
            disabled={zoom <= 0.5}
          >
            <ZoomOut size={20} />
          </button>
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white transition-all"
            disabled={zoom >= 3}
          >
            <ZoomIn size={20} />
          </button>
          <button
            onClick={handleClose}
            className="p-2 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white transition-all"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Navigation buttons */}
      {hasMultipleImages && (
        <>
          {currentImageIndex > 0 && (
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white transition-all z-10"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          {currentImageIndex < images.length - 1 && (
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white transition-all z-10"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </>
      )}

      {/* Image */}
      <div className="relative w-full h-full flex items-center justify-center p-16">
        <img
          src={currentImage}
          alt="Full size"
          className={`max-w-full max-h-full object-contain transition-transform ${
            zoom > 1 ? 'cursor-move' : 'cursor-default'
          }`}
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          draggable={false}
        />
      </div>
    </div>
  );
};

export default ImageViewer;
