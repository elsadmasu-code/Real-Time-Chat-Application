import axios from 'axios';

const API_URL = 'http://localhost:5000/api/messages';

/**
 * Message Service
 * Handles API calls for message actions: edit, delete, react, forward, copy
 */

/**
 * Edit a message
 * @param {string} messageId - The ID of the message to edit
 * @param {string} content - The new content
 * @param {string} token - Auth token
 * @returns {Promise} Updated message
 */
export const editMessage = async (messageId, content, token) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.put(`${API_URL}/${messageId}`, { content }, config);
  return response.data;
};

/**
 * Delete a message
 * @param {string} messageId - The ID of the message to delete
 * @param {string} deleteType - 'for-me' or 'for-everyone'
 * @param {string} token - Auth token
 * @returns {Promise} Deletion result
 */
export const deleteMessage = async (messageId, deleteType, token) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    data: { deleteType },
  };

  const response = await axios.delete(`${API_URL}/${messageId}`, config);
  return response.data;
};

/**
 * Add or remove a reaction to a message
 * @param {string} messageId - The ID of the message
 * @param {string} emoji - The emoji to react with
 * @param {string} token - Auth token
 * @returns {Promise} Updated message with reactions
 */
export const reactToMessage = async (messageId, emoji, token) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.post(`${API_URL}/${messageId}/react`, { emoji }, config);
  return response.data;
};

/**
 * Forward a message to other chats
 * @param {string} messageId - The ID of the message to forward
 * @param {Array<string>} chatIds - Array of chat IDs to forward to
 * @param {string} token - Auth token
 * @returns {Promise} Array of forwarded messages
 */
export const forwardMessage = async (messageId, chatIds, token) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };

  const response = await axios.post(`${API_URL}/${messageId}/forward`, { chatIds }, config);
  return response.data;
};

/**
 * Copy message content to clipboard
 * @param {string} content - The message content to copy
 * @returns {Promise<boolean>} Success status
 */
export const copyMessageContent = async (content) => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(content);
      return true;
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = content;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('Failed to copy message:', error);
    return false;
  }
};

const messageService = {
  editMessage,
  deleteMessage,
  reactToMessage,
  forwardMessage,
  copyMessageContent,
};

export default messageService;
