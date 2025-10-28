import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { toast } from '@/components/ui/use-toast';

const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children, mockValue }) => {
  if (mockValue) {
    return (
      <ChatContext.Provider value={mockValue}>{children}</ChatContext.Provider>
    );
  }
  const { user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isTyping, setIsTyping] = useState({});
  const [videoCall, setVideoCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [callHistory, setCallHistory] = useState([]);

  const socketRef = useRef();
  const typingTimeoutRef = useRef({});

  // Initialize socket connection
  useEffect(() => {
    if (user) {
      const chatServerUrl = import.meta.env.VITE_CHAT_SERVER_URL || 'http://localhost:3001';

      // Only initialize socket if chat server is enabled
      const chatEnabled = import.meta.env.VITE_CHAT_ENABLED !== 'false';
      if (!chatEnabled) {
        console.warn('Chat server is disabled');
        return;
      }

      const newSocket = io(chatServerUrl, {
        auth: {
          userId: user.id,
          userType: user.userType,
          name: user.full_name || user.name,
        },
        reconnection: true,
        reconnectionDelay: 5000,
        reconnectionAttempts: 3,
        timeout: 10000,
      });

      socketRef.current = newSocket;
      setSocket(newSocket);

      // Socket event listeners
      newSocket.on('connect', () => {
        console.warn('Connected to chat server');
      });

      newSocket.on('disconnect', () => {
        console.warn('Disconnected from chat server');
      });

      newSocket.on('connect_error', (error) => {
        console.warn('Chat server connection error (chat features disabled):', error.message);
        // Don't retry indefinitely if server is not available
        if (newSocket.io.engine.transport.name === 'polling') {
          setTimeout(() => {
            newSocket.io.opts.reconnection = false;
          }, 15000); // Stop reconnecting after 15 seconds
        }
      });

      newSocket.on('message', (message) => {
        handleNewMessage(message);
      });

      newSocket.on('typing', ({ userId, conversationId, isTyping: typing }) => {
        setIsTyping((prev) => ({
          ...prev,
          [conversationId]: typing
            ? [
                ...(prev[conversationId] || []).filter((id) => id !== userId),
                userId,
              ]
            : (prev[conversationId] || []).filter((id) => id !== userId),
        }));
      });

      newSocket.on('userOnline', (userId) => {
        setOnlineUsers((prev) => [...new Set([...prev, userId])]);
      });

      newSocket.on('userOffline', (userId) => {
        setOnlineUsers((prev) => prev.filter((id) => id !== userId));
      });

      newSocket.on('incomingCall', (callData) => {
        setIncomingCall(callData);
        toast({
          title: 'Incoming Call',
          description: `${callData.callerName} is calling you`,
          action: (
            <div className='flex gap-2'>
              <button
                onClick={() => acceptCall(callData)}
                className='bg-green-500 text-white px-3 py-1 rounded'
              >
                Accept
              </button>
              <button
                onClick={() => rejectCall(callData.callId)}
                className='bg-red-500 text-white px-3 py-1 rounded'
              >
                Decline
              </button>
            </div>
          ),
        });
      });

      newSocket.on('callAccepted', (callData) => {
        setVideoCall(callData);
        setIncomingCall(null);
      });

      newSocket.on('callRejected', (_callData) => {
        setVideoCall(null);
        setIncomingCall(null);
        toast({
          title: 'Call Rejected',
          description: 'The call was rejected',
          variant: 'destructive',
        });
      });

      newSocket.on('callEnded', (callData) => {
        setVideoCall(null);
        setIncomingCall(null);
        addCallToHistory(callData);
      });

      return () => {
        // Clear all timeouts
        Object.values(typingTimeoutRef.current).forEach(timeout => {
          if (timeout) clearTimeout(timeout);
        });
        typingTimeoutRef.current = {};

        // Disconnect socket
        newSocket.disconnect();
        // Don't call setSocket(null) during cleanup to avoid state update loop

        // Clear state
        setMessages({});
        setOnlineUsers([]);
        setIsTyping({});
        setVideoCall(null);
        setIncomingCall(null);
      };
    }
  }, [user]);

  const handleNewMessage = useCallback((message) => {
    setMessages((prev) => ({
      ...prev,
      [message.conversationId]: [
        ...(prev[message.conversationId] || []),
        message,
      ],
    }));

    // Update unread count if conversation is not active
    if (activeConversation?.id !== message.conversationId) {
      setUnreadCounts((prev) => ({
        ...prev,
        [message.conversationId]: (prev[message.conversationId] || 0) + 1,
      }));
    }

    // Show notification if app is not focused
    if (!document.hasFocus()) {
      toast({
        title: `New message from ${message.senderName}`,
        description:
          message.content.substring(0, 50) +
          (message.content.length > 50 ? '...' : ''),
      });
    }
  }, [activeConversation?.id]);

  const sendMessage = useCallback(async (
    conversationId,
    content,
    type = 'text',
    file = null
  ) => {
    if (!socket || !content.trim()) return;

    const messageData = {
      conversationId,
      content,
      type,
      senderId: user.id,
      senderName: user.full_name || user.name,
      timestamp: new Date().toISOString(),
      file: file
        ? {
            name: file.name,
            size: file.size,
            type: file.type,
            url: await uploadFile(file),
          }
        : null,
    };

    socket.emit('sendMessage', messageData);

    // Optimistically add message to UI
    setMessages((prev) => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), messageData],
    }));
  }, [socket, user]);

  const uploadFile = useCallback(async (file) => {
    // Mock file upload - replace with actual upload logic
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }, []);

  const startTyping = useCallback((conversationId) => {
    if (!socket) return;

    socket.emit('typing', { conversationId, isTyping: true });

    // Clear existing timeout
    if (typingTimeoutRef.current[conversationId]) {
      clearTimeout(typingTimeoutRef.current[conversationId]);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current[conversationId] = setTimeout(() => {
      socket.emit('typing', { conversationId, isTyping: false });
    }, 3000);
  }, [socket]);

  const stopTyping = useCallback((conversationId) => {
    if (!socket) return;

    socket.emit('typing', { conversationId, isTyping: false });

    if (typingTimeoutRef.current[conversationId]) {
      clearTimeout(typingTimeoutRef.current[conversationId]);
    }
  }, [socket]);

  const createConversation = useCallback(async (
    participantId,
    participantName,
    participantType
  ) => {
    if (!socket) return;

    const conversationData = {
      participants: [user.id, participantId],
      participantNames: [user.full_name || user.name, participantName],
      participantTypes: [user.userType, participantType],
      createdAt: new Date().toISOString(),
    };

    socket.emit('createConversation', conversationData);
  }, [socket, user]);

  const markAsRead = useCallback((conversationId) => {
    if (!socket) return;

    socket.emit('markAsRead', { conversationId });
    setUnreadCounts((prev) => ({ ...prev, [conversationId]: 0 }));
  }, [socket]);

  const initiateCall = useCallback((participantId, participantName) => {
    if (!socket) return;

    const callData = {
      callId: Date.now().toString(),
      callerId: user.id,
      callerName: user.full_name || user.name,
      participantId,
      participantName,
      type: 'video',
      timestamp: new Date().toISOString(),
    };

    socket.emit('initiateCall', callData);
  }, [socket, user]);

  const acceptCall = useCallback((callData) => {
    if (!socket) return;

    socket.emit('acceptCall', callData);
    setVideoCall(callData);
    setIncomingCall(null);
  }, [socket]);

  const rejectCall = useCallback((callId) => {
    if (!socket) return;

    socket.emit('rejectCall', { callId });
    setIncomingCall(null);
  }, [socket]);

  const endCall = useCallback(() => {
    if (!socket || !videoCall) return;

    socket.emit('endCall', videoCall);
    setVideoCall(null);
  }, [socket, videoCall]);

  const addCallToHistory = (callData) => {
    setCallHistory((prev) => [callData, ...prev]);
  };

  const loadConversations = async () => {
    // Mock data - replace with actual API call
    const mockConversations = [
      {
        id: '1',
        participants: [user.id, 'user2'],
        participantNames: [user.name, 'Maria Santos'],
        participantTypes: [user.userType, 'maid'],
        lastMessage: 'Hello, I am interested in your profile',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 2,
      },
      {
        id: '2',
        participants: [user.id, 'user3'],
        participantNames: [user.name, 'Al-Rashid Family'],
        participantTypes: [user.userType, 'sponsor'],
        lastMessage: 'Thank you for your application',
        lastMessageTime: new Date(Date.now() - 3600000).toISOString(),
        unreadCount: 0,
      },
    ];

    setConversations(mockConversations);
    setUnreadCounts(
      mockConversations.reduce(
        (acc, conv) => ({
          ...acc,
          [conv.id]: conv.unreadCount,
        }),
        {}
      )
    );
  };

  const loadMessages = async (conversationId) => {
    // Mock data - replace with actual API call
    const mockMessages = [
      {
        id: '1',
        conversationId,
        content: 'Hello, I am interested in your profile',
        senderId: 'user2',
        senderName: 'Maria Santos',
        timestamp: new Date(Date.now() - 7200000).toISOString(),
        type: 'text',
      },
      {
        id: '2',
        conversationId,
        content:
          'Thank you for your interest. Can you tell me more about your experience?',
        senderId: user.id,
        senderName: user.name,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        type: 'text',
      },
      {
        id: '3',
        conversationId,
        content: 'I have 5 years of experience in childcare and housekeeping',
        senderId: 'user2',
        senderName: 'Maria Santos',
        timestamp: new Date(Date.now() - 1800000).toISOString(),
        type: 'text',
      },
    ];

    setMessages((prev) => ({
      ...prev,
      [conversationId]: mockMessages,
    }));
  };

  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user]);

  const value = useMemo(() => ({
    socket,
    conversations,
    activeConversation,
    messages,
    onlineUsers,
    unreadCounts,
    isTyping,
    videoCall,
    incomingCall,
    callHistory,
    sendMessage,
    startTyping,
    stopTyping,
    createConversation,
    setActiveConversation,
    markAsRead,
    loadMessages,
    initiateCall,
    acceptCall,
    rejectCall,
    endCall,
  }), [socket, conversations, activeConversation, messages, onlineUsers, unreadCounts, isTyping, videoCall, incomingCall, callHistory, sendMessage, startTyping, stopTyping, createConversation, markAsRead, loadMessages, initiateCall, acceptCall, rejectCall, endCall]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
