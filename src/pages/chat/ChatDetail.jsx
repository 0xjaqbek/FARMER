// src/pages/chat/ChatDetail.jsx - FIXED version
import { useEffect, useState, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  getConversationById,
  subscribeToMessages,
  sendMessage,
  markConversationAsRead
} from '@/firebase/chat';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import ChatMessage from '@/components/chat/ChatMessage';
import ChatInput from '@/components/chat/ChatInput';
import { ArrowLeft, User, MessagesSquare } from 'lucide-react';

const ChatDetail = () => {
  // ✅ FIXED: Only extract 'id' once and rename it clearly
  const { id: conversationId } = useParams();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  
  // 🔍 DEBUG: Add debugging information
  console.log('ChatDetail mounted with:', {
    conversationId,
    rawParams: useParams(),
    currentUser: !!currentUser,
    userProfile: !!userProfile,
    pathname: window.location.pathname,
    search: window.location.search
  });
  
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  
  const messagesEndRef = useRef(null);
  
  const otherParticipant = conversation?.participantsInfo?.find(
    p => p.uid !== currentUser?.uid
  );
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Load conversation and subscribe to messages
  useEffect(() => {
    console.log('useEffect triggered with:', {
      currentUser: !!currentUser,
      conversationId,
      conversationIdType: typeof conversationId,
      conversationIdLength: conversationId?.length
    });
    
    if (!currentUser) {
      console.log('❌ No current user, skipping conversation load');
      setError('User not authenticated');
      setLoading(false);
      return;
    }
    
    if (!conversationId) {
      console.log('❌ No conversationId provided');
      setError('No conversation ID provided in URL');
      setLoading(false);
      return;
    }
    
    if (conversationId.trim() === '') {
      console.log('❌ Empty conversationId');
      setError('Invalid conversation ID');
      setLoading(false);
      return;
    }
    
    console.log('✅ All requirements met, loading conversation:', conversationId);
    
    let messagesUnsubscribe;
    
    const loadConversation = async () => {
      try {
        setLoading(true);
        setIsLoadingConversation(true);
        setError('');
        
        console.log('Fetching conversation with ID:', conversationId);
        
        // ✅ FIXED: Use conversationId consistently
        const conversationData = await getConversationById(conversationId);
        
        if (!conversationData) {
          throw new Error('Conversation not found');
        }
        
        console.log('Conversation loaded:', conversationData);
        setConversation(conversationData);
        
        // ✅ FIXED: Only mark as read after conversation is loaded
        try {
          await markConversationAsRead(conversationData.id, currentUser.uid);
          console.log('Conversation marked as read');
        } catch (markReadError) {
          console.warn('Failed to mark conversation as read:', markReadError);
          // Don't fail the whole load for this
        }
        
      } catch (error) {
        console.error('Error loading conversation:', error);
        setError(`Failed to load conversation: ${error.message}`);
      } finally {
        setIsLoadingConversation(false);
        setLoading(false);
      }
    };
    
    // ✅ FIXED: Subscribe to messages separately and only once
    const subscribeToMessagesOnce = () => {
      console.log('Subscribing to messages for conversation:', conversationId);
      
      messagesUnsubscribe = subscribeToMessages(conversationId, (messageData) => {
        console.log('Messages updated:', messageData.length, 'messages');
        setMessages(messageData);
        
        // ✅ FIXED: Only mark as read if there are messages and the last message isn't from current user
        if (messageData.length > 0) {
          const lastMessage = messageData[messageData.length - 1];
          if (lastMessage.senderId !== currentUser.uid) {
            markConversationAsRead(conversationId, currentUser.uid).catch(err => {
              console.warn('Error marking conversation as read:', err);
            });
          }
        }
      });
    };
    
    // Load conversation first, then subscribe to messages
    loadConversation().then(() => {
      // Only subscribe to messages if conversation loaded successfully
      if (!error) {
        subscribeToMessagesOnce();
      }
    });
    
    // ✅ FIXED: Proper cleanup
    return () => {
      console.log('Cleaning up chat subscriptions');
      if (messagesUnsubscribe) {
        messagesUnsubscribe();
      }
    };
  }, [currentUser?.uid, conversationId]); // ✅ FIXED: Only depend on essential values
  
  // Handle sending message
  const handleSendMessage = async (text) => {
    if (!currentUser || !conversation || !text.trim()) {
      console.warn('Cannot send message:', { 
        hasUser: !!currentUser, 
        hasConversation: !!conversation, 
        hasText: !!text.trim() 
      });
      return;
    }
    
    try {
      console.log('Sending message:', text);
      
      const messageData = {
        text: text.trim(),
        senderId: currentUser.uid,
        senderName: `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() || 'Unknown User',
        recipientId: otherParticipant?.uid
      };
      
      // ✅ FIXED: Use conversation.id consistently
      await sendMessage(conversation.id, messageData);
      console.log('Message sent successfully');
      
    } catch (error) {
      console.error('Error sending message:', error);
      setError(`Failed to send message: ${error.message}`);
    }
  };
  
  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p>Loading conversation...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button asChild>
          <Link to="/chat">Back to Messages</Link>
        </Button>
      </div>
    );
  }
  
  if (!conversation) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">Conversation not found.</p>
        <Button asChild>
          <Link to="/chat">Back to Messages</Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div>
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/chat')}
          className="mr-2"
        >
          <ArrowLeft size={18} />
        </Button>
        <h1 className="text-2xl font-bold">Chat</h1>
      </div>
      
      <Card className="h-[70vh] flex flex-col">
        <CardHeader className="px-4 py-3 border-b flex flex-row items-center">
          <Avatar className="h-8 w-8 mr-2">
            <AvatarFallback>
              {otherParticipant ? getInitials(otherParticipant.name) : 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-medium">
              {otherParticipant ? otherParticipant.name : 'Unknown User'}
            </h2>
            <p className="text-xs text-gray-500">
              {otherParticipant?.role === 'rolnik' ? 'Farmer' : 'Customer'}
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-4 flex flex-col">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500">
              <MessagesSquare className="h-16 w-16 text-gray-300 mb-4" />
              <p className="mb-2">No messages yet</p>
              <p className="text-sm">Send a message to start the conversation</p>
            </div>
          ) : (
            <>
              {messages.map(message => (
                <ChatMessage 
                  key={message.id} 
                  message={message} 
                  currentUserId={currentUser.uid}
                />
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </CardContent>
        
        <div className="p-3 border-t">
          <ChatInput 
            onSendMessage={handleSendMessage} 
            disabled={isLoadingConversation}
          />
        </div>
      </Card>
    </div>
  );
};

export default ChatDetail;