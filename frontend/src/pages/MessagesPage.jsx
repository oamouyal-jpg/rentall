import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { messagesAPI } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { ScrollArea } from '../components/ui/scroll-area';
import { formatRelativeTime, getInitials } from '../lib/utils';
import { Loader2, Send, MessageSquare, ArrowLeft } from 'lucide-react';

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;

    const fetchConversations = async () => {
      try {
        const res = await messagesAPI.getConversations();
        setConversations(res.data);
      } catch (error) {
        console.error('Error fetching conversations:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchConversations();
  }, [user]);

  useEffect(() => {
    if (!selectedUser) return;

    const fetchMessages = async () => {
      try {
        const res = await messagesAPI.getWithUser(selectedUser.user_id);
        setMessages(res.data);
        // Update conversation unread count
        setConversations((prev) =>
          prev.map((c) =>
            c.user_id === selectedUser.user_id ? { ...c, unread_count: 0 } : c
          )
        );
      } catch (error) {
        console.error('Error fetching messages:', error);
      }
    };
    fetchMessages();

    // Poll for new messages
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [selectedUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;

    setSending(true);
    try {
      const res = await messagesAPI.send({
        recipient_id: selectedUser.user_id,
        content: newMessage.trim(),
        listing_id: selectedUser.listing_id,
      });
      setMessages((prev) => [...prev, res.data]);
      setNewMessage('');

      // Update conversation list
      setConversations((prev) =>
        prev.map((c) =>
          c.user_id === selectedUser.user_id
            ? { ...c, last_message: newMessage, last_message_time: new Date().toISOString() }
            : c
        )
      );
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#E05D44]" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="page-enter h-[calc(100vh-64px)]" data-testid="messages-page">
      <div className="max-w-6xl mx-auto h-full">
        <div className="grid grid-cols-1 md:grid-cols-3 h-full">
          {/* Conversations List */}
          <div
            className={`md:col-span-1 border-r border-stone-200 bg-white ${
              selectedUser ? 'hidden md:block' : ''
            }`}
          >
            <div className="p-4 border-b border-stone-200">
              <h1 className="text-xl font-bold text-stone-900 font-heading">Messages</h1>
            </div>

            {conversations.length > 0 ? (
              <ScrollArea className="h-[calc(100%-65px)]">
                {conversations.map((conv) => (
                  <button
                    key={conv.user_id}
                    onClick={() => setSelectedUser(conv)}
                    className={`w-full p-4 flex items-start gap-3 hover:bg-stone-50 transition-colors text-left ${
                      selectedUser?.user_id === conv.user_id ? 'bg-stone-50' : ''
                    }`}
                    data-testid={`conversation-${conv.user_id}`}
                  >
                    <Avatar className="h-12 w-12 shrink-0">
                      <AvatarImage src={conv.user_avatar} />
                      <AvatarFallback className="bg-stone-200 text-stone-600">
                        {getInitials(conv.user_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-medium text-stone-900 truncate">
                          {conv.user_name}
                        </span>
                        <span className="text-xs text-stone-400 shrink-0">
                          {formatRelativeTime(conv.last_message_time)}
                        </span>
                      </div>
                      {conv.listing_title && (
                        <p className="text-xs text-[#E05D44] mb-1 truncate">
                          Re: {conv.listing_title}
                        </p>
                      )}
                      <p className="text-sm text-stone-500 truncate">{conv.last_message}</p>
                    </div>
                    {conv.unread_count > 0 && (
                      <span className="w-5 h-5 bg-[#E05D44] text-white text-xs rounded-full flex items-center justify-center shrink-0">
                        {conv.unread_count}
                      </span>
                    )}
                  </button>
                ))}
              </ScrollArea>
            ) : (
              <div className="flex flex-col items-center justify-center h-[calc(100%-65px)] px-4 text-center">
                <MessageSquare className="h-12 w-12 text-stone-300 mb-4" />
                <h3 className="font-semibold text-stone-900 mb-2 font-heading">No messages yet</h3>
                <p className="text-sm text-stone-500">
                  Start a conversation by messaging an item owner
                </p>
              </div>
            )}
          </div>

          {/* Messages */}
          <div
            className={`md:col-span-2 flex flex-col bg-stone-50 ${
              selectedUser ? '' : 'hidden md:flex'
            }`}
          >
            {selectedUser ? (
              <>
                {/* Header */}
                <div className="p-4 bg-white border-b border-stone-200 flex items-center gap-3">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="md:hidden p-2 -ml-2 hover:bg-stone-100 rounded-full"
                    data-testid="back-to-conversations"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </button>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={selectedUser.user_avatar} />
                    <AvatarFallback className="bg-stone-200 text-stone-600">
                      {getInitials(selectedUser.user_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="font-semibold text-stone-900">{selectedUser.user_name}</h2>
                    {selectedUser.listing_title && (
                      <p className="text-xs text-stone-500">
                        Re: {selectedUser.listing_title}
                      </p>
                    )}
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((msg) => {
                      const isOwn = msg.sender_id === user.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`message-bubble max-w-[70%] px-4 py-3 rounded-2xl ${
                              isOwn
                                ? 'bg-[#E05D44] text-white rounded-br-md'
                                : 'bg-white text-stone-900 rounded-bl-md border border-stone-100'
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p
                              className={`text-xs mt-1 ${
                                isOwn ? 'text-white/70' : 'text-stone-400'
                              }`}
                            >
                              {formatRelativeTime(msg.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Input */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-4 bg-white border-t border-stone-200"
                >
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="h-12 rounded-full"
                      data-testid="message-input"
                    />
                    <Button
                      type="submit"
                      disabled={!newMessage.trim() || sending}
                      className="h-12 w-12 rounded-full bg-[#E05D44] hover:bg-[#C54E36] shrink-0"
                      data-testid="send-message-btn"
                    >
                      {sending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center px-4">
                <MessageSquare className="h-16 w-16 text-stone-300 mb-4" />
                <h3 className="font-semibold text-stone-900 mb-2 font-heading">
                  Select a conversation
                </h3>
                <p className="text-stone-500">
                  Choose a conversation from the list to start messaging
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
