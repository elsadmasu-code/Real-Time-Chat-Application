# Socket.IO Client Service

This directory contains the Socket.IO client integration for real-time communication in the chat application.

## Files

- **socket.js** - Main Socket.IO client service with connection management and event handlers
- **README.md** - This documentation file with usage examples

## Features

### Connection Management
- ✅ Automatic connection with JWT authentication
- ✅ Automatic reconnection with exponential backoff
- ✅ Connection state tracking
- ✅ Graceful disconnection handling

### Event Listeners
- ✅ Message events (received, updated, deleted, status-updated)
- ✅ Reaction events (added, removed)
- ✅ Typing indicator events (user-typing, user-stopped-typing)
- ✅ User status events (user-status-changed)
- ✅ Call events (incoming-call, call-accepted, call-declined, call-ended)
- ✅ WebRTC signaling events (offer, answer, ice-candidate)
- ✅ Story events (story-added, story-viewed)

### Redux Integration
- ✅ Automatic dispatch of Redux actions for all events
- ✅ Seamless integration with message slice
- ✅ Seamless integration with reactions slice
- 🔄 Ready for status, calls, and stories slices (commented out)

### Helper Functions
- `setupSocket(token)` - Initialize socket connection with authentication
- `getSocket()` - Get current socket instance
- `isSocketConnected()` - Check connection status
- `disconnectSocket()` - Disconnect and cleanup
- `emitTyping(chatId, userId)` - Emit typing event
- `emitStopTyping(chatId, userId)` - Emit stop typing event
- `emitMessageDelivered(messageId, userId)` - Mark message as delivered
- `emitMessageRead(messageId, userId)` - Mark message as read
- `joinChat(chatId)` - Join a chat room
- `leaveChat(chatId)` - Leave a chat room

## Quick Start

### 1. Initialize Socket on Login

```javascript
import { setupSocket } from './services/socket';

// After successful login
const token = user.token;
setupSocket(token);
```

### 2. Disconnect on Logout

```javascript
import { disconnectSocket } from './services/socket';

// On logout
disconnectSocket();
```

### 3. Use Redux Selectors to Access Data

```javascript
import { useSelector } from 'react-redux';

function MessageList({ chatId }) {
  const messages = useSelector((state) => state.message.messages[chatId]?.items || []);
  
  return (
    <div>
      {messages.map((msg) => (
        <div key={msg._id}>{msg.content}</div>
      ))}
    </div>
  );
}
```

## Configuration

### Environment Variables

Set the backend URL in your `.env` file:

```env
VITE_SOCKET_URL=http://localhost:5000
```

If not set, defaults to `http://localhost:5000`.

### Reconnection Settings

The socket is configured with:
- **Max reconnection attempts**: 10
- **Base reconnection delay**: 1 second
- **Max reconnection delay**: 60 seconds
- **Exponential backoff**: Delay doubles with each attempt (1s, 2s, 4s, 8s, 16s, 32s, 60s)

## Architecture

### Event Flow

```
Backend Socket.IO Server
         ↓
    Socket Event
         ↓
  Socket Listener (socket.js)
         ↓
   Redux Action Dispatch
         ↓
    Redux Store Update
         ↓
  React Component Re-render
```

### Connection Lifecycle

```
1. User logs in → Get JWT token
2. setupSocket(token) → Create socket connection with auth
3. Socket connects → Update connection state
4. Socket listens → Dispatch Redux actions on events
5. User logs out → disconnectSocket() → Cleanup
```

## Event Handlers

### Message Events

| Event | Payload | Action |
|-------|---------|--------|
| `message-received` | `{ message }` | Add message to Redux store |
| `message-updated` | `{ message }` | Update message in Redux store |
| `message-deleted` | `{ messageId, chatId, deletedForEveryone }` | Delete/mark message in Redux store |
| `message-status-updated` | `{ messageId, chatId, status, readBy }` | Update message status in Redux store |

### Reaction Events

| Event | Payload | Action |
|-------|---------|--------|
| `reaction-added` | `{ messageId, reaction }` | Add reaction to Redux store |
| `reaction-removed` | `{ messageId, emoji, userId }` | Remove reaction from Redux store |

### Typing Events

| Event | Payload | Action |
|-------|---------|--------|
| `user-typing` | `{ chatId, user }` | Add user to typing list (future) |
| `user-stopped-typing` | `{ chatId, userId }` | Remove user from typing list (future) |

### Status Events

| Event | Payload | Action |
|-------|---------|--------|
| `user-status-changed` | `{ userId, status, lastSeen }` | Update user status (future) |

### Call Events

| Event | Payload | Action |
|-------|---------|--------|
| `incoming-call` | `{ callId, caller, callType }` | Show incoming call modal (future) |
| `call-accepted` | `{ callId }` | Update call status (future) |
| `call-declined` | `{ callId }` | Update call status (future) |
| `call-ended` | `{ callId, duration }` | End call and show duration (future) |

### WebRTC Signaling Events

| Event | Payload | Action |
|-------|---------|--------|
| `webrtc-offer` | `{ callId, offer }` | Handle in call manager (future) |
| `webrtc-answer` | `{ callId, answer }` | Handle in call manager (future) |
| `webrtc-ice-candidate` | `{ callId, candidate }` | Handle in call manager (future) |

### Story Events

| Event | Payload | Action |
|-------|---------|--------|
| `story-added` | `{ story }` | Add story to Redux store (future) |
| `story-viewed` | `{ storyId, viewerId }` | Update story viewers (future) |

## Error Handling

The socket service handles various error scenarios:

- **Connection errors**: Logged to console, automatic reconnection attempted
- **Reconnection failures**: Exponential backoff with max attempts
- **Server disconnection**: Automatic reconnection initiated
- **Authentication errors**: Logged to console (user should re-login)

## Best Practices

1. **Initialize once**: Call `setupSocket()` only once after login
2. **Cleanup on logout**: Always call `disconnectSocket()` on logout
3. **Use Redux selectors**: Don't manually listen to socket events in components
4. **Join/leave rooms**: Use `joinChat()` and `leaveChat()` when entering/leaving chats
5. **Typing indicators**: Implement 3-second timeout for stop-typing events
6. **Read receipts**: Use Intersection Observer to detect message visibility

## Troubleshooting

### Socket not connecting
- Check if backend server is running
- Verify `VITE_SOCKET_URL` is correct
- Check if JWT token is valid
- Check browser console for connection errors

### Events not received
- Verify socket is connected: `isSocketConnected()`
- Check if you've joined the chat room: `joinChat(chatId)`
- Verify backend is emitting events correctly
- Check Redux DevTools to see if actions are dispatched

### Reconnection issues
- Check network connectivity
- Verify backend server is running
- Check if max reconnection attempts reached (refresh page)
- Review browser console for reconnection logs

## Future Enhancements

The following features are prepared but commented out pending implementation of additional Redux slices:

- ✅ Typing indicators (needs status slice)
- ✅ User status tracking (needs status slice)
- ✅ Voice/video calls (needs calls slice)
- ✅ WebRTC signaling (needs call manager)
- ✅ Stories (needs stories slice)

To enable these features:
1. Implement the corresponding Redux slice
2. Uncomment the dispatch calls in `socket.js`
3. Import and use the actions in the event handlers

## Testing

To test the socket service:

1. Start the backend server
2. Login to get a JWT token
3. Open browser DevTools console
4. Check for "Socket.IO connected" message
5. Send a message from another client
6. Verify the message appears in real-time
7. Check Redux DevTools for dispatched actions

## Support

For issues or questions:
- Check the example file: `socket.example.js`
- Review the backend socket implementation: `backend/socket/socketManager.js`
- Check the Redux slices: `frontend/src/store/slices/`

## License

Part of the Advanced Messaging Features implementation.


---

## Usage Examples

### Example 1: Initialize Socket Connection on Login

```javascript
import { setupSocket, disconnectSocket } from './services/socket';

// In your Login component or authentication flow:
const handleLogin = async (credentials) => {
  try {
    // Login and get token
    const response = await loginAPI(credentials);
    const { token } = response.data;
    
    // Store token in localStorage
    localStorage.setItem('userInfo', JSON.stringify(response.data));
    
    // Initialize socket connection with authentication token
    setupSocket(token);
    
    // Navigate to dashboard
    navigate('/dashboard');
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

### Example 2: Initialize Socket in App Component

```javascript
import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { setupSocket, disconnectSocket } from './services/socket';

function App() {
  const user = useSelector((state) => state.auth.user);
  
  useEffect(() => {
    // Setup socket when user is authenticated
    if (user && user.token) {
      setupSocket(user.token);
      
      // Cleanup on unmount or logout
      return () => {
        disconnectSocket();
      };
    }
  }, [user]);
  
  return (
    <div className="App">
      {/* Your app content */}
    </div>
  );
}
```

### Example 3: Typing Indicators in Message Input

```javascript
import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { emitTyping, emitStopTyping } from '../services/socket';

function MessageInput({ chatId }) {
  const [message, setMessage] = useState('');
  const user = useSelector((state) => state.auth.user);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);
  
  const handleInputChange = (e) => {
    setMessage(e.target.value);
    
    // Emit typing event if not already typing
    if (!isTypingRef.current && e.target.value.length > 0) {
      emitTyping(chatId, user._id);
      isTypingRef.current = true;
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        emitStopTyping(chatId, user._id);
        isTypingRef.current = false;
      }
    }, 3000);
  };
  
  const handleSendMessage = () => {
    // Send message logic...
    
    // Stop typing immediately when message is sent
    if (isTypingRef.current) {
      emitStopTyping(chatId, user._id);
      isTypingRef.current = false;
    }
    
    // Clear timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    setMessage('');
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (isTypingRef.current) {
        emitStopTyping(chatId, user._id);
      }
    };
  }, [chatId, user._id]);
  
  return (
    <div>
      <input
        type="text"
        value={message}
        onChange={handleInputChange}
        placeholder="Type a message..."
      />
      <button onClick={handleSendMessage}>Send</button>
    </div>
  );
}
```

### Example 4: Display Real-time Messages

```javascript
import { useSelector } from 'react-redux';

function MessageList({ chatId }) {
  const messagesData = useSelector((state) => state.message.messages[chatId]);
  const messages = messagesData?.items || [];
  
  return (
    <div className="message-list">
      {messages.map((message) => (
        <div key={message._id} className="message">
          <p>{message.content}</p>
          {message.isEdited && <span className="edited-badge">edited</span>}
          {message.deletedForEveryone && (
            <p className="deleted-message">This message was deleted</p>
          )}
        </div>
      ))}
    </div>
  );
}
```

### Example 5: Display Reactions

```javascript
import { useSelector } from 'react-redux';

function MessageReactions({ messageId }) {
  const reactions = useSelector((state) => state.reactions.reactions[messageId] || []);
  
  return (
    <div className="reactions">
      {reactions.map((reaction) => (
        <div key={reaction.emoji} className="reaction">
          <span>{reaction.emoji}</span>
          <span>{reaction.count}</span>
        </div>
      ))}
    </div>
  );
}
```

### Example 6: Logout and Disconnect Socket

```javascript
import { disconnectSocket } from '../services/socket';

const handleLogout = () => {
  // Disconnect socket
  disconnectSocket();
  
  // Clear user data
  localStorage.removeItem('userInfo');
  
  // Redirect to login
  navigate('/login');
};
```

### Example 7: Join/Leave Chat Rooms

```javascript
import { useEffect } from 'react';
import { joinChat, leaveChat } from '../services/socket';

function ChatWindow({ chatId }) {
  useEffect(() => {
    // Join chat room when component mounts
    joinChat(chatId);
    
    // Leave chat room when component unmounts
    return () => {
      leaveChat(chatId);
    };
  }, [chatId]);
  
  return (
    <div className="chat-window">
      {/* Chat content */}
    </div>
  );
}
```

### Example 8: Check Socket Connection Status

```javascript
import { useState, useEffect } from 'react';
import { isSocketConnected } from '../services/socket';

function ConnectionStatus() {
  const [connected, setConnected] = useState(false);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setConnected(isSocketConnected());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
      {connected ? '🟢 Connected' : '🔴 Disconnected'}
    </div>
  );
}
```

### Example 9: Mark Messages as Read

```javascript
import { useEffect, useRef } from 'react';
import { emitMessageRead } from '../services/socket';

function Message({ message, userId }) {
  const messageRef = useRef(null);
  
  useEffect(() => {
    // Use Intersection Observer to detect when message is in viewport
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && message.sender._id !== userId) {
            // Message is visible and not sent by current user
            emitMessageRead(message._id, userId);
          }
        });
      },
      { threshold: 0.5 } // Trigger when 50% of message is visible
    );
    
    if (messageRef.current) {
      observer.observe(messageRef.current);
    }
    
    return () => {
      if (messageRef.current) {
        observer.unobserve(messageRef.current);
      }
    };
  }, [message._id, message.sender._id, userId]);
  
  return (
    <div ref={messageRef} className="message">
      {message.content}
    </div>
  );
}
```

## Important Notes

1. The socket service automatically handles:
   - Connection/disconnection
   - Automatic reconnection with exponential backoff
   - Dispatching Redux actions for all events

2. You don't need to manually listen to socket events in components.
   Just use Redux selectors to get the data.

3. The socket service includes commented-out dispatches for slices
   that haven't been implemented yet (status, calls, stories).
   Uncomment these when those slices are ready.

4. Always disconnect the socket on logout to prevent memory leaks
   and unauthorized access.

5. The socket automatically includes the JWT token in the auth header,
   so the backend can authenticate the connection.
