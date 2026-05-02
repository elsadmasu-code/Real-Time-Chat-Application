import Call from '../models/Call.js';
import Chat from '../models/Chat.js';
import Message from '../models/Message.js';

// Initiate a call
export const initiateCall = async (req, res) => {
  try {
    const { receiverId, callType, chatId } = req.body;

    // Validate inputs
    if (!receiverId || !callType || !chatId) {
      return res.status(400).json({ message: 'receiverId, callType, and chatId are required' });
    }

    if (!['voice', 'video'].includes(callType)) {
      return res.status(400).json({ message: 'callType must be "voice" or "video"' });
    }

    // Verify chat exists and user is part of it
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.users.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to call in this chat' });
    }

    if (!chat.users.includes(receiverId)) {
      return res.status(400).json({ message: 'Receiver is not part of this chat' });
    }

    // Create Call document with status "ringing"
    const call = await Call.create({
      caller: req.user._id,
      receiver: receiverId,
      chat: chatId,
      callType,
      status: 'ringing'
    });

    // Populate call details
    const populatedCall = await Call.findById(call._id)
      .populate('caller', 'name pic')
      .populate('receiver', 'name pic')
      .populate('chat');

    res.json(populatedCall);
  } catch (error) {
    console.error('Error initiating call:', error);
    res.status(500).json({ message: error.message });
  }
};

// Accept a call
export const acceptCall = async (req, res) => {
  try {
    const { callId } = req.params;

    // Find the call
    const call = await Call.findById(callId);
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    // Verify requesting user is the receiver
    if (call.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to accept this call' });
    }

    // Update call status to "accepted" and set startedAt timestamp
    call.status = 'accepted';
    call.startedAt = new Date();
    await call.save();

    // Populate and return updated call
    const updatedCall = await Call.findById(callId)
      .populate('caller', 'name pic')
      .populate('receiver', 'name pic')
      .populate('chat');

    res.json(updatedCall);
  } catch (error) {
    console.error('Error accepting call:', error);
    res.status(500).json({ message: error.message });
  }
};

// Decline a call
export const declineCall = async (req, res) => {
  try {
    const { callId } = req.params;

    // Find the call
    const call = await Call.findById(callId);
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    // Verify requesting user is the receiver
    if (call.receiver.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to decline this call' });
    }

    // Update call status to "declined"
    call.status = 'declined';
    await call.save();

    // Populate and return updated call
    const updatedCall = await Call.findById(callId)
      .populate('caller', 'name pic')
      .populate('receiver', 'name pic')
      .populate('chat');

    res.json(updatedCall);
  } catch (error) {
    console.error('Error declining call:', error);
    res.status(500).json({ message: error.message });
  }
};

// End a call
export const endCall = async (req, res) => {
  try {
    const { callId } = req.params;

    // Find the call
    const call = await Call.findById(callId);
    if (!call) {
      return res.status(404).json({ message: 'Call not found' });
    }

    // Verify requesting user is either caller or receiver
    if (
      call.caller.toString() !== req.user._id.toString() &&
      call.receiver.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to end this call' });
    }

    // Update call status to "ended" and set endedAt timestamp
    call.status = 'ended';
    call.endedAt = new Date();

    // Calculate duration in seconds if call was accepted
    if (call.startedAt) {
      call.duration = Math.floor((call.endedAt - call.startedAt) / 1000);
    } else {
      call.duration = 0;
    }

    await call.save();

    // Create message in chat with call type, duration, and timestamp
    const callMessage = await Message.create({
      sender: call.caller,
      content: `${call.callType === 'voice' ? 'Voice' : 'Video'} call ${
        call.duration > 0 ? `(${formatDuration(call.duration)})` : '(missed)'
      }`,
      chat: call.chat,
      status: 'sent'
    });

    // Update chat's latest message
    await Chat.findByIdAndUpdate(call.chat, { latestMessage: callMessage });

    // Populate and return updated call
    const updatedCall = await Call.findById(callId)
      .populate('caller', 'name pic')
      .populate('receiver', 'name pic')
      .populate('chat');

    res.json(updatedCall);
  } catch (error) {
    console.error('Error ending call:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get call history for a chat
export const getCallHistory = async (req, res) => {
  try {
    const { chatId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Verify chat exists and user is part of it
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.users.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to access this chat' });
    }

    // Query Call documents for the chat, sorted by createdAt descending
    const calls = await Call.find({ chat: chatId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('caller', 'name pic')
      .populate('receiver', 'name pic');

    // Get total count for pagination
    const total = await Call.countDocuments({ chat: chatId });
    const hasMore = skip + calls.length < total;

    res.json({
      calls,
      page,
      limit,
      total,
      hasMore
    });
  } catch (error) {
    console.error('Error getting call history:', error);
    res.status(500).json({ message: error.message });
  }
};

// Helper function to format duration
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}
