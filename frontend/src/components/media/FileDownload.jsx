import { Download, FileText, File as FileIcon } from 'lucide-react';

const FileDownload = ({ fileUrl, fileName, fileSize, fileType }) => {
  const handleDownload = () => {
    // Open file in new tab or trigger download
    window.open(fileUrl, '_blank');
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'Unknown size';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getFileIcon = () => {
    if (!fileType) return <FileIcon size={24} />;
    
    const type = fileType.toLowerCase();
    if (type.includes('pdf') || type.includes('doc') || type.includes('txt')) {
      return <FileText size={24} />;
    }
    return <FileIcon size={24} />;
  };

  const getFileExtension = () => {
    if (fileName) {
      const parts = fileName.split('.');
      if (parts.length > 1) {
        return parts[parts.length - 1].toUpperCase();
      }
    }
    if (fileType) {
      const parts = fileType.split('/');
      if (parts.length > 1) {
        return parts[1].toUpperCase();
      }
    }
    return 'FILE';
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-lg max-w-sm hover:bg-white/10 transition-all">
      {/* File icon */}
      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
        {getFileIcon()}
      </div>

      {/* File info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate">
          {fileName || 'Document'}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-gray-400">
            {getFileExtension()}
          </span>
          <span className="text-xs text-gray-500">•</span>
          <span className="text-xs text-gray-400">
            {formatFileSize(fileSize)}
          </span>
        </div>
      </div>

      {/* Download button */}
      <button
        onClick={handleDownload}
        className="flex-shrink-0 w-10 h-10 rounded-full bg-accent hover:bg-accent/80 flex items-center justify-center text-white transition-all"
        title="Download file"
      >
        <Download size={18} />
      </button>
    </div>
  );
};

export default FileDownload;
