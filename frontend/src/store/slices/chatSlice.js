import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/chats/';

export const fetchChats = createAsyncThunk('chat/fetchChats', async (_, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user.token;
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.get(API_URL, config);
    return response.data;
  } catch (error) {
    const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const accessChat = createAsyncThunk('chat/accessChat', async (userId, thunkAPI) => {
  try {
    const token = thunkAPI.getState().auth.user.token;
    const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } };
    const response = await axios.post(API_URL, { userId }, config);
    return response.data;
  } catch (error) {
    const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

const initialState = {
  chats: [],
  selectedChat: null,
  isError: false,
  isSuccess: false,
  isLoading: false,
  message: '',
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setSelectedChat: (state, action) => {
      state.selectedChat = action.payload;
    },
    resetChatState: (state) => {
      state.isError = false;
      state.isSuccess = false;
      state.isLoading = false;
      state.message = '';
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChats.pending, (state) => { state.isLoading = true; })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.chats = action.payload;
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      })
      .addCase(accessChat.pending, (state) => { state.isLoading = true; })
      .addCase(accessChat.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isSuccess = true;
        state.selectedChat = action.payload;
        if (!state.chats.find((c) => c._id === action.payload._id)) {
          state.chats = [action.payload, ...state.chats];
        }
      })
      .addCase(accessChat.rejected, (state, action) => {
        state.isLoading = false;
        state.isError = true;
        state.message = action.payload;
      });
  },
});

export const { setSelectedChat, resetChatState } = chatSlice.actions;
export default chatSlice.reducer;
