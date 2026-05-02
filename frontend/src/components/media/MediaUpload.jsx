import { useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Upload, X, Image, Video, File, AlertCircle } from 'lucide-react';
import { uploadMedia, validateFile, formatFileSize } from '../../services/mediaService';

const MediaUpload = ({ onUpload, onCancel }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [caption, setCaption] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef(null);
  const token = useSelector((state) => state.auth.user?.token);

  // Handle file selection
  const handleFileSelect = (file) => {
    setError(null);
    
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setSelectedFile(file);

    // Generate preview for images and videos
    if (validation.mediaType === 'image') {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview({ type: 'image', url: reader.result });
      };
      reader.readAsDataURL(file);
    } else if (validation.mediaType === 'video') {
      const videoUrl = URL.createObjectURL(file);
      setPreview({ type: 'video', url: videoUrl });
    } else {
      setPreview({ type: validation.mediaType, name: file.name, size: file.size });
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle drag and drop
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const result = await uploadMedia(
        selectedFile,
        (progress) => setUploadProgress(progress),
        token
      );

      // Call parent callback with upload result and caption
      onUpload({
        ...result,
        caption: caption.trim(),
      });

      // Reset state
      setSelectedFile(null);
      setPreview(null);
      setCaption('');
      setUploadProgress(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setSelectedFile(null);
    setPreview(null);
    setCaption('');
    setUploadProgress(0);
    setError(null);
    if (onCancel) {
      onCancel();
    }
  };

  // Handle retry
  const handleRetry = () => {
    setError(null);
    handleUpload();
  };

  // Render file icon based on type
  const renderFileIcon = () => {
    if (!preview) return null;

    if (preview.type === 'image') {
      return <Image className="w-12 h-12 text-blue-500" />;
    } else if (preview.type === 'video') {
      return <Video className="w-12 h-12 text-purple-500" />;
    } else if (preview.type === 'file') {
      return <File className="w-12 h-12 text-gray-500" />;
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">Upload Media</h2>
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-full transition"
            disabled={isUploading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!selectedFile ? (
            // File selection area
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
                isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <Upload className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">
                Drag and drop a file here, or click to select
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Images (JPEG, PNG, GIF, WEBP) • Videos (MP4, MOV, WEBM) •
                Documents (PDF, DOC, DOCX, XLS, XLSX, TXT)
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
              >
                Select File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileInputChange}
                accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime,video/webm,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
              />
            </div>
          ) : (
            // File preview and upload
            <div>
              {/* Preview */}
              <div className="mb-4">
                {preview.type === 'image' && (
                  <img
                    src={preview.url}
                    alt="Preview"
                    className="max-w-full max-h-96 mx-auto rounded-lg"
                  />
                )}
                {preview.type === 'video' && (
                  <video
                    src={preview.url}
                    controls
                    className="max-w-full max-h-96 mx-auto rounded-lg"
                  />
                )}
                {(preview.type === 'file' || preview.type === 'voice') && (
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    {renderFileIcon()}
                    <div className="flex-1">
                      <p className="font-medium">{preview.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(preview.size)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Caption input */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Caption (optional)
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Add a caption..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows="3"
                  disabled={isUploading}
                />
              </div>

              {/* Progress bar */}
              {isUploading && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Uploading...</span>
                    <span className="text-sm text-gray-500">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-red-700">{error}</p>
                    <button
                      onClick={handleRetry}
                      className="text-sm text-red-600 hover:text-red-700 font-medium mt-1"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={handleCancel}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  disabled={isUploading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpload}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isUploading}
                >
                  {isUploading ? 'Uploading...' : 'Send'}
                </button>
              </div>
            </div>
          )}

          {/* Error message for file selection */}
          {error && !selectedFile && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaUpload;
