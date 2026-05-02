import ImageViewer from './ImageViewer';
import VideoPlayer from './VideoPlayer';
import VoicePlayer from './VoicePlayer';
import FileDownload from './FileDownload';

const MediaDisplay = ({ message }) => {
  const {
    mediaType,
    mediaUrl,
    thumbnailUrl,
    fileName,
    fileSize,
    duration,
  } = message;

  // If no media, return null
  if (!mediaType || !mediaUrl) {
    return null;
  }

  // Route to appropriate component based on mediaType
  switch (mediaType) {
    case 'image':
      return (
        <ImageViewer
          imageUrl={mediaUrl}
          thumbnailUrl={thumbnailUrl}
        />
      );

    case 'video':
      return (
        <VideoPlayer
          videoUrl={mediaUrl}
          thumbnailUrl={thumbnailUrl}
        />
      );

    case 'voice':
      return (
        <VoicePlayer
          audioUrl={mediaUrl}
          duration={duration}
        />
      );

    case 'file':
      return (
        <FileDownload
          fileUrl={mediaUrl}
          fileName={fileName}
          fileSize={fileSize}
          fileType={fileName ? fileName.split('.').pop() : null}
        />
      );

    default:
      return null;
  }
};

export default MediaDisplay;
