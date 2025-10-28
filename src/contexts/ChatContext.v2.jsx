import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { supabase } from '@/lib/databaseClient';
import { useAuth } from './AuthContext';
import { toast } from '@/components/ui/use-toast';
import { createLogger } from '@/utils/logger';

const log = createLogger('ChatContext');
const ChatContext = createContext();

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider = ({ children, mockValue }) => {
  // Allow mock value for testing
  if (mockValue) {
    return (
      <ChatContext.Provider value={mockValue}>{children}</ChatContext.Provider>
    );
  }

  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [isTyping, setIsTyping] = useState({});
  const [onlineUsers, setOnlineUsers] = useState([]);

  const channelRef = useRef(null);
  const typingTimeoutRef = useRef({});

  // ============================================================================
  // LOAD CONVERSATIONS
  // ============================================================================
  const loadConversations = useCallback(async () => {
    if (!user) return;

    try {
      log.debug('Loading conversations for user:', user.id);

      // Get all messages where user is sender or receiver
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          content,
          read,
          created_at,
          sender:profiles!messages_sender_id_fkey(id, name, avatar_url, user_type),
          receiver:profiles!messages_receiver_id_fkey(id, name, avatar_url, user_type)
        `)
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        log.error('Error loading conversations:', error);
        return;
      }

      // Group messages by conversation partner
      const conversationsMap = new Map();

      messagesData.forEach((message) => {
        // Determine conversation partner
        const isUserSender = message.sender_id === user.id;
        const partnerId = isUserSender ? message.receiver_id : message.sender_id;
        const partner = isUserSender ? message.receiver : message.sender;

        if (!conversationsMap.has(partnerId)) {
          conversationsMap.set(partnerId, {
            id: partnerId, // Use partner ID as conversation ID
            partnerId,
            partnerName: partner?.name || 'Unknown User',
            partnerAvatar: partner?.avatar_url,
            partnerType: partner?.user_type,
            lastMessage: message.content,
            lastMessageTime: message.created_at,
            unreadCount: 0,
            messages: [],
          });
        }

        const conv = conversationsMap.get(partnerId);
        conv.messages.push(message);

        // Count unread messages (messages sent by partner that are unread)
        if (!isUserSender && !message.read) {
          conv.unreadCount++;
        }

        // Update last message if this message is more recent
        if (new Date(message.created_at) > new Date(conv.lastMessageTime)) {
          conv.lastMessage = message.content;
          conv.lastMessageTime = message.created_at;
        }
      });

      const conversationsArray = Array.from(conversationsMap.values());

      // Sort by last message time
      conversationsArray.sort((a, b) =>
        new Date(b.lastMessageTime) - new Date(a.lastMessageTime)
      );

      setConversations(conversationsArray);

      // Set unread counts
      const unreadCountsObj = {};
      conversationsArray.forEach((conv) => {
        unreadCountsObj[conv.id] = conv.unreadCount;
      });
      setUnreadCounts(unreadCountsObj);

      log.info(`Loaded ${conversationsArray.length} conversations`);
    } catch (error) {
      log.error('Exception in loadConversations:', error);
    }
  }, [user]);

  // ============================================================================
  // LOAD MESSAGES FOR CONVERSATION
  // ============================================================================
  const loadMessages = useCallback(async (conversationId) => {
    if (!user) return;

    try {
      log.debug('Loading messages for conversation:', conversationId);

      // conversationId is the partner's user ID
      const partnerId = conversationId;

      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          sender_id,
          receiver_id,
          content,
          read,
          created_at,
          message_type,
          sender:profiles!messages_sender_id_fkey(id, name, avatar_url),
          receiver:profiles!messages_receiver_id_fkey(id, name, avatar_url)
        `)
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) {
        log.error('Error loading messages:', error);
        return;
      }

      // Transform messages to match ChatContext format
      const transformedMessages = data.map((msg) => ({
        id: msg.id,
        conversationId,
        content: msg.content,
        senderId: msg.sender_id,
        senderName: msg.sender?.name || 'Unknown',
        timestamp: msg.created_at,
        type: msg.message_type || 'text',
        read: msg.read,
      }));

      setMessages((prev) => ({
        ...prev,
        [conversationId]: transformedMessages,
      }));

      log.info(`Loaded ${transformedMessages.length} messages`);
    } catch (error) {
      log.error('Exception in loadMessages:', error);
    }
  }, [user]);

  // ============================================================================
  // SEND MESSAGE
  // ============================================================================
  const sendMessage = useCallback(async (
    conversationId,
    content,
    type = 'text',
    _file = null
  ) => {
    if (!user || !content.trim()) return;

    try {
      log.debug('Sending message to conversation:', conversationId);

      // conversationId is the partner's user ID
      const receiverId = conversationId;

      const { data, error } = await supabase
        .from('messages')
        .insert([{
          sender_id: user.id,
          receiver_id: receiverId,
          content: content.trim(),
          message_type: type || 'general',
          read: false,
        }])
        .select(`
          id,
          sender_id,
          receiver_id,
          content,
          read,
          created_at,
          message_type
        `)
        .single();

      if (error) {
        log.error('Error sending message:', error);
        toast({
          title: 'Error',
          description: 'Failed to send message. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      // Optimistically add message to UI
      const newMessage = {
        id: data.id,
        conversationId,
        content: data.content,
        senderId: data.sender_id,
        senderName: user.full_name || user.name,
        timestamp: data.created_at,
        type: data.message_type || 'text',
        read: false,
      };

      setMessages((prev) => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), newMessage],
      }));

      log.info('Message sent successfully');
    } catch (error) {
      log.error('Exception in sendMessage:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    }
  }, [user]);

  // ============================================================================
  // MARK AS READ
  // ============================================================================
  const markAsRead = useCallback(async (conversationId) => {
    if (!user) return;

    try {
      log.debug('Marking messages as read for conversation:', conversationId);

      // conversationId is the partner's user ID
      const partnerId = conversationId;

      // Mark all messages from partner as read
      const { error } = await supabase
        .from('messages')
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq('sender_id', partnerId)
        .eq('receiver_id', user.id)
        .eq('read', false);

      if (error) {
        log.error('Error marking messages as read:', error);
        return;
      }

      // Update local state
      setUnreadCounts((prev) => ({ ...prev, [conversationId]: 0 }));

      log.info('Messages marked as read');
    } catch (error) {
      log.error('Exception in markAsRead:', error);
    }
  }, [user]);

  // ============================================================================
  // CREATE CONVERSATION
  // ============================================================================
  const createConversation = useCallback(async (
    participantId,
    participantName,
    _participantType
  ) => {
    if (!user) return null;

    try {
      log.debug('Creating conversation with:', participantId);

      // Check if conversation already exists
      const existingConv = conversations.find((c) => c.partnerId === participantId);
      if (existingConv) {
        setActiveConversation(existingConv);
        return existingConv;
      }

      // Create new conversation object (no database record needed)
      const newConv = {
        id: participantId,
        partnerId: participantId,
        partnerName: participantName,
        partnerAvatar: null,
        partnerType: _participantType,
        lastMessage: '',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        messages: [],
      };

      setConversations((prev) => [newConv, ...prev]);
      setActiveConversation(newConv);

      log.info('Conversation created');
      return newConv;
    } catch (error) {
      log.error('Exception in createConversation:', error);
      return null;
    }
  }, [user, conversations]);

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================================
  useEffect(() => {
    if (!user) return;

    log.debug('Setting up real-time subscriptions');

    // Subscribe to new messages
    const channel = supabase
      .channel(`messages:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          log.info('New message received:', payload.new);

          const newMessage = payload.new;

          // Fetch sender details
          const { data: senderData } = await supabase
            .from('profiles')
            .select('id, name, avatar_url')
            .eq('id', newMessage.sender_id)
            .single();

          const senderId = newMessage.sender_id;
          const conversationId = senderId;

          // Add message to messages list
          const transformedMessage = {
            id: newMessage.id,
            conversationId,
            content: newMessage.content,
            senderId,
            senderName: senderData?.name || 'Unknown',
            timestamp: newMessage.created_at,
            type: newMessage.message_type || 'text',
            read: false,
          };

          setMessages((prev) => ({
            ...prev,
            [conversationId]: [...(prev[conversationId] || []), transformedMessage],
          }));

          // Update conversation or create new one
          setConversations((prev) => {
            const existingIndex = prev.findIndex((c) => c.id === conversationId);

            if (existingIndex >= 0) {
              // Update existing conversation
              const updated = [...prev];
              updated[existingIndex] = {
                ...updated[existingIndex],
                lastMessage: newMessage.content,
                lastMessageTime: newMessage.created_at,
              };

              // Move to top
              const [conv] = updated.splice(existingIndex, 1);
              return [conv, ...updated];
            } else {
              // Create new conversation
              const newConv = {
                id: conversationId,
                partnerId: senderId,
                partnerName: senderData?.name || 'Unknown User',
                partnerAvatar: senderData?.avatar_url,
                lastMessage: newMessage.content,
                lastMessageTime: newMessage.created_at,
                unreadCount: 0,
                messages: [],
              };
              return [newConv, ...prev];
            }
          });

          // Update unread count if conversation is not active
          if (activeConversation?.id !== conversationId) {
            setUnreadCounts((prev) => ({
              ...prev,
              [conversationId]: (prev[conversationId] || 0) + 1,
            }));
          }

          // Show notification if app is not focused
          if (!document.hasFocus()) {
            toast({
              title: `New message from ${senderData?.name || 'Unknown'}`,
              description: newMessage.content.substring(0, 50) +
                (newMessage.content.length > 50 ? '...' : ''),
            });
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      log.debug('Cleaning up real-time subscriptions');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, activeConversation]);

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user, loadConversations]);

  // ============================================================================
  // TYPING INDICATORS (Simplified - no real-time for now)
  // ============================================================================
  const startTyping = useCallback((_conversationId) => {
    // TODO: Implement typing indicators with Supabase presence
    log.debug('Typing started (not implemented yet)');
  }, []);

  const stopTyping = useCallback((_conversationId) => {
    // TODO: Implement typing indicators with Supabase presence
    log.debug('Typing stopped (not implemented yet)');
  }, []);

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================
  const value = useMemo(() => ({
    conversations,
    activeConversation,
    messages,
    onlineUsers,
    unreadCounts,
    isTyping,
    sendMessage,
    startTyping,
    stopTyping,
    createConversation,
    setActiveConversation,
    markAsRead,
    loadMessages,
    loadConversations, // Expose for manual refresh
  }), [
    conversations,
    activeConversation,
    messages,
    onlineUsers,
    unreadCounts,
    isTyping,
    sendMessage,
    startTyping,
    stopTyping,
    createConversation,
    markAsRead,
    loadMessages,
    loadConversations,
  ]);

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
