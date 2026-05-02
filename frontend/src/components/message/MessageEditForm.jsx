import { useState, useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';
import PropTypes from 'prop-types';

/**
 * MessageEditForm Component
 * Provides inline editing interface for messages
 * Shows "edited" indicator after successful edit
 */
const MessageEditForm = ({ message, onSave, onCancel, isOwnMessage }) => {
  const [editedContent, setEditedContent] = useState(message.content || '');
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    // Focus input on mount
    if (inputRef.current) {
      inputRef.current.focus();
      // Move cursor to end
      inputRef.current.setSelectionRange(editedContent.length, editedContent.length);
    }
  }, [editedContent.length]);

  const handleSave = async () => {
    if (!editedContent.trim()) {
      return;
    }

    if (editedContent.trim() === message.content) {
      // No changes made
      onCancel();
      return;
    }

    setIsSaving(true);
    try {
      await onSave(editedContent.trim());
    } catch (error) {
      console.error('Failed to save edit:', error);
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className={`flex flex-col ${isOwnMessage ? 'items-end' : 'items-start'} w-full max-w-md`}>
      <div className={`w-full rounded-2xl p-3 border-2 ${
        isOwnMessage 
          ? 'bg-bubblePrimary border-accent' 
          : 'bg-bubbleSecondary border-blue-500'
      }`}>
        <textarea
          ref={inputRef}
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSaving}
          className="w-full bg-transparent text-sm text-white placeholder-gray-400 outline-none resize-none"
          rows={Math.min(Math.max(editedContent.split('\n').length, 1), 5)}
          placeholder="Edit message..."
        />
        
        <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-white/10">
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="p-1.5 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white disabled:opacity-50"
            aria-label="Cancel edit"
          >
            <X size={16} />
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !editedContent.trim()}
            className="p-1.5 rounded-full bg-accent hover:bg-accent/80 transition-colors text-white disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Save edit"
          >
            <Check size={16} />
          </button>
        </div>
      </div>
      
      <span className="text-[10px] text-gray-500 mt-1 px-2">
        Press Enter to save, Esc to cancel
      </span>
    </div>
  );
};

MessageEditForm.propTypes = {
  message: PropTypes.object.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  isOwnMessage: PropTypes.bool.isRequired,
};

export default MessageEditForm;
