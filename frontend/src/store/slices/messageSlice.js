import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/messages/';

export const fetchMessages = createAsyncThunk('message/fetchMessages', async (chatId, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user.token;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.get(`${API_URL}${chatId}`, config);
    return { chatId, messages: response.data };
  } catch (error) {
    const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const sendMessage = createAsyncThunk('message/sendMessage', async (messageData, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user.token;
    const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } };
    const response = await axios.post(API_URL, messageData, config);
    return response.data;
  } catch (error) {
    const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const loadMoreMessages = createAsyncThunk('message/loadMoreMessages', async ({ chatId, page }, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user.token;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.get(`${API_URL}${chatId}?page=${page}`, config);
    return { chatId, messages: response.data };
  } catch (error) {
    const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

const initialState = {
  // Messages indexed by chat ID
  messages: {},
  // Upload progress for media uploads (indexed by upload ID)
  uploadProgress: {},
  // Selected message for reply/forward context
  selectedMessage: null,
  // Reply-to message context
  replyTo: null,
  // Legacy support
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

export const messageSlice = createSlice({
  name: 'message',
  initialState,
  reducers: {
    // Add a new message to a chat
    addMessage: (state, action) => {
      const { chatId, message } = action.payload;
      if (!state.messages[chatId]) {
        state.messages[chatId] = {
          items: [],
          hasMore: true,
          loading: false,
        };
      }
      state.messages[chatId].items.push(message);
    },
    
    // Update an existing message (for edits, status changes, etc.)
    updateMessage: (state, action) => {
      const { chatId, messageId, updates } = action.payload;
      if (state.messages[chatId]) {
        const messageIndex = state.messages[chatId].items.findIndex(
          (msg) => msg._id === messageId
        );
        if (messageIndex !== -1) {
          state.messages[chatId].items[messageIndex] = {
            ...state.messages[chatId].items[messageIndex],
            ...updates,
          };
        }
      }
    },
    
    // Delete a message (mark as deleted or remove from UI)
    deleteMessage: (state, action) => {
      const { chatId, messageId, deletedForEveryone } = action.payload;
      if (state.messages[chatId]) {
        const messageIndex = state.messages[chatId].items.findIndex(
          (msg) => msg._id === messageId
        );
        if (messageIndex !== -1) {
          if (deletedForEveryone) {
            // Mark as deleted for everyone
            state.messages[chatId].items[messageIndex].deletedForEveryone = true;
            state.messages[chatId].items[messageIndex].content = '';
          } else {
            // Remove from UI (deleted for me)
            state.messages[chatId].items.splice(messageIndex, 1);
          }
        }
      }
    },
    
    // Set messages for a chat (replaces existing messages)
    setMessages: (state, action) => {
      const { chatId, messages, hasMore = true } = action.payload;
      state.messages[chatId] = {
        items: messages,
        hasMore,
        loading: false,
      };
    },
    
    // Set upload progress for a media upload
    setUploadProgress: (state, action) => {
      const { uploadId, progress } = action.payload;
      state.uploadProgress[uploadId] = progress;
    },
    
    // Clear upload progress after completion
    clearUploadProgress: (state, action) => {
      const { uploadId } = action.payload;
      delete state.uploadProgress[uploadId];
    },
    
    // Set selected message for reply/forward
    setSelectedMessage: (state, action) => {
      state.selectedMessage = action.payload;
    },
    
    // Set reply-to message context
    setReplyTo: (state, action) => {
      state.replyTo = action.payload;
    },
    
    // Clear reply-to context
    clearReplyTo: (state) => {
      state.replyTo = null;
    },
    
    // Clear all messages (legacy support)
    clearMessages: (state) => {
      state.messages = {};
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch messages
      .addCase(fetchMessages.pending, (state, action) => {
        state.isLoading = true;
        const chatId = action.meta.arg;
        if (!state.messages[chatId]) {
          state.messages[chatId] = {
            items: [],
            hasMore: true,
            loading: true,
          };
        } else {
          state.messages[chatId].loading = true;
        }
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        const { chatId, messages } = action.payload;
        state.messages[chatId] = {
          items: messages,
          hasMore: messages.length >= 50, // Assume more if we got a full page
          loading: false,
        };
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      
      // Send message
      .addCase(sendMessage.fulfilled, (state, action) => {
        const message = action.payload;
        const chatId = message.chat._id || message.chat;
        if (!state.messages[chatId]) {
          state.messages[chatId] = {
            items: [],
            hasMore: true,
            loading: false,
          };
        }
        state.messages[chatId].items.push(message);
      })
      
      // Load more messages (pagination)
      .addCase(loadMoreMessages.pending, (state, action) => {
        const { chatId } = action.meta.arg;
        if (state.messages[chatId]) {
          state.messages[chatId].loading = true;
        }
      })
      .addCase(loadMoreMessages.fulfilled, (state, action) => {
        const { chatId, messages } = action.payload;
        if (state.messages[chatId]) {
          // Prepend older messages
          state.messages[chatId].items = [...messages, ...state.messages[chatId].items];
          state.messages[chatId].hasMore = messages.length >= 50;
          state.messages[chatId].loading = false;
        }
      })
      .addCase(loadMoreMessages.rejected, (state, action) => {
        const { chatId } = action.meta.arg;
        if (state.messages[chatId]) {
          state.messages[chatId].loading = false;
        }
      });
  },
});

export const {
  addMessage,
  updateMessage,
  deleteMessage,
  setMessages,
  setUploadProgress,
  clearUploadProgress,
  setSelectedMessage,
  setReplyTo,
  clearReplyTo,
  clearMessages,
} = messageSlice.actions;

export default messageSlice.reducer;
