import { useState, useEffect, useRef } from "react";
import { listConversations, getMessages, sendMessage, startConversation } from "../../api/chat";
import { getMe } from "../../api/user";
import styles from "./SupportChat.module.css";

interface Conversation {
  id: number;
  customer_id: number;
  salon_id: number | null;
  support_user_id: number | null;
  last_message_at: string;
  created_at: string;
  target_name?: string;
  target_avatar?: string;
  customer_name?: string;
  customer_avatar?: string;
  conversation_type?: "salon" | "support";
}

interface Message {
  id: number;
  conversation_id: number;
  sender_id: number;
  message_text: string;
  created_at: string;
  sender_name: string;
  sender_avatar?: string;
}

export default function SupportChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load user info
  useEffect(() => {
    getMe()
      .then(user => setCurrentUser(user))
      .catch(() => {});
  }, []);

  // Load conversations on mount and check localStorage for selected conversation
  useEffect(() => {
    loadConversations();
    
    // Check if we have a selected conversation ID from SalonDetail redirect
    const selectedId = localStorage.getItem('selectedConversationId');
    if (selectedId) {
      localStorage.removeItem('selectedConversationId'); // Clear it
      // Will be set after conversations load
    }
  }, []);

  // Setup polling for conversations and messages
  useEffect(() => {
    const conversationPoll = setInterval(loadConversations, 3000); // Poll every 3 seconds
    return () => clearInterval(conversationPoll);
  }, []);

  // Load messages when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      loadMessages();
      // Poll messages every 2 seconds for real-time feel
      const messagePoll = setInterval(loadMessages, 2000);
      return () => clearInterval(messagePoll);
    }
  }, [selectedConversation]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversations = async () => {
    try {
      const response = await listConversations();
      const convs = response.conversations || [];
      setConversations(convs);
      setLoading(false);
      
      // Check if we should select a conversation from localStorage
      const selectedId = localStorage.getItem('selectedConversationId');
      if (selectedId && convs.length > 0) {
        const conv = convs.find((c: Conversation) => c.id === parseInt(selectedId));
        if (conv) {
          setSelectedConversation(conv);
        }
        localStorage.removeItem('selectedConversationId');
      }
    } catch (error) {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!selectedConversation) return;

    try {
      const response = await getMessages(selectedConversation.id);
      setMessages(response.messages || []);
    } catch (error) {
      // silently fail
    }
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || sending) return;

    setSending(true);
    try {
      const response = await sendMessage(selectedConversation.id, messageInput.trim());
      setMessages([...messages, response.message]);
      setMessageInput("");
      
      // Refresh conversations to update last_message_at
      await loadConversations();
    } catch (error) {
      alert("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Hôm qua";
    } else {
      return date.toLocaleDateString("vi-VN");
    }
  };

  const handleStartChat = async (salonId?: number) => {
    try {
      const response = await startConversation(salonId || 0);
      const conversation = response.conversation;
      if (!conversation) {
        const errorMsg = response.error || "Không thể tạo conversation";
        alert(errorMsg);
        return;
      }
      setSelectedConversation(conversation);
      // Reload conversations
      await loadConversations();
    } catch (error: any) {
      const errorMsg = error?.response?.data?.error || "Không thể bắt đầu cuộc hội thoại. Vui lòng thử lại.";
      alert(errorMsg);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Đang tải...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.conversationList}>
        <h2>💬 Hỗ trợ khách hàng</h2>
        <div className={styles.conversations}>
          {conversations.length === 0 ? (
            <div className={styles.noConversations}>
              <p>Chưa có cuộc hội thoại nào</p>
              {currentUser?.role === "customer" && (
                <button
                  className={styles.startChatBtn}
                  onClick={() => handleStartChat()}
                >
                  Bắt đầu chat với Support
                </button>
              )}
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.id}
                className={`${styles.conversationItem} ${
                  selectedConversation?.id === conv.id ? styles.active : ""
                }`}
                onClick={() => setSelectedConversation(conv)}
              >
                <div className={styles.conversationHeader}>
                  <img
                    src={
                      conv.target_avatar || 
                      conv.customer_avatar ||
                      "https://ui-avatars.com/api/?name=User"
                    }
                    alt="Avatar"
                    className={styles.avatar}
                    onError={(e) => {
                      e.currentTarget.src = "https://ui-avatars.com/api/?name=User";
                    }}
                  />
                  <div className={styles.conversationInfo}>
                    <h4>
                      {conv.target_name || conv.customer_name || "Chat"}
                    </h4>
                    {conv.conversation_type === "support" && (
                      <span className={styles.supportBadge}>🎧 Support</span>
                    )}
                    <p className={styles.timestamp}>
                      {formatTime(conv.last_message_at || conv.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={styles.chatArea}>
        {selectedConversation ? (
          <>
            <div className={styles.chatHeader}>
              <img
                src={
                  selectedConversation.target_avatar ||
                  selectedConversation.customer_avatar ||
                  "https://ui-avatars.com/api/?name=User"
                }
                alt="Avatar"
                className={styles.headerAvatar}
                onError={(e) => {
                  e.currentTarget.src = "https://ui-avatars.com/api/?name=User";
                }}
              />
              <div className={styles.headerInfo}>
                <h3>
                  {selectedConversation.target_name || selectedConversation.customer_name || "Chat"}
                </h3>
                {selectedConversation.conversation_type === "support" && (
                  <p className={styles.supportLabel}>🎧 Support Team</p>
                )}
              </div>
            </div>

            <div className={styles.messagesContainer}>
              {messages.length === 0 ? (
                <div className={styles.noMessages}>
                  Không có tin nhắn nào. Hãy bắt đầu cuộc hội thoại!
                </div>
              ) : (
                messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`${styles.message} ${
                      msg.sender_id === currentUser?.id
                        ? styles.sent
                        : styles.received
                    }`}
                  >
                    <img
                      src={
                        msg.sender_avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(msg.sender_name)
                      }
                      alt={msg.sender_name}
                      className={styles.messageAvatar}
                      onError={(e) => {
                        e.currentTarget.src = "https://ui-avatars.com/api/?name=U";
                      }}
                    />
                    <div className={styles.messageContent}>
                      <p className={styles.sender}>{msg.sender_name}</p>
                      <div className={styles.messageBubble}>
                        {msg.message_text}
                      </div>
                      <p className={styles.messageTime}>
                        {new Date(msg.created_at).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className={styles.inputArea}>
              <textarea
                value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Nhập tin nhắn..."
                disabled={sending}
                className={styles.messageInput}
              />
              <button
                onClick={handleSendMessage}
                disabled={sending || !messageInput.trim()}
                className={styles.sendButton}
              >
                {sending ? "Đang gửi..." : "Gửi"}
              </button>
            </div>
          </>
        ) : (
          <div className={styles.noChatSelected}>
            <p>Chọn một cuộc hội thoại để bắt đầu</p>
            {currentUser?.role === "customer" && (
              <button
                className={styles.startChatBtn}
                onClick={() => handleStartChat()}
              >
                Hoặc bắt đầu chat với Support
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
