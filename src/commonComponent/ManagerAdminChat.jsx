import { useState, useEffect, useRef } from "react";
import { X, MessageCircle, Send, AlertCircle, ImagePlus, Smile } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { getCookie } from "../utils/api";

// Emoji picker component
const EmojiPicker = ({ onEmojiSelect, isDarkMode, onClose }) => {
  const emojiCategories = {
    "Smileys": ["😀", "😂", "😍", "🥰", "😘", "😁", "🤣", "😊", "😄", "😆", "😅", "🤗", "😌", "🥳", "😎", "🤓"],
    "Gestures": ["👍", "👎", "👏", "🙏", "🤝", "💪", "👊", "✊", "👋", "🙌", "🤲", "💃"],
    "Hearts": ["❤️", "💔", "💕", "💖", "💗", "💘", "💝", "💟"],
    "Celebrate": ["🎉", "🎊", "🎈", "🎁", "🎀", "🎂", "🍰", "🎃"],
    "Symbols": ["✨", "⭐", "🌟", "💫", "⚡", "🔥", "💯", "🚀"],
  };

  return (
    <div className={`rounded-xl shadow-2xl border ${isDarkMode ? "bg-gray-900 border-gray-700" : "bg-white border-gray-300"} p-5 w-80 overflow-y-auto scrollbar-thin ${isDarkMode ? "scrollbar-thumb-gray-700 scrollbar-track-gray-800" : "scrollbar-thumb-gray-300 scrollbar-track-gray-100"}`} style={{ maxHeight: '450px' }}>
      {/* Close Button */}
      <div className="flex justify-end mb-3">
        <button
          onClick={onClose}
          className={`p-1 rounded-lg transition-all ${isDarkMode ? "hover:bg-gray-800 text-gray-400 hover:text-red-400" : "hover:bg-gray-200 text-gray-600 hover:text-red-600"}`}
          title="Close emoji picker"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {Object.entries(emojiCategories).map(([category, emojis]) => (
        <div key={category} className="mb-5">
          <div className={`text-xs font-bold mb-3 px-3 py-1.5 rounded-md uppercase tracking-wider ${isDarkMode ? "text-yellow-400 bg-gray-800" : "text-yellow-700 bg-yellow-50"}`}>
            {category}
          </div>
          <div className="grid grid-cols-8 gap-2">
            {emojis.map((emoji, index) => (
              <button
                key={`${category}-${index}`}
                onClick={() => onEmojiSelect(emoji)}
                className={`text-2xl p-3 rounded-lg transition-all duration-150 hover:scale-110 hover:shadow-lg hover:z-10 ${isDarkMode ? "hover:bg-gray-800" : "hover:bg-gray-200"} active:scale-95`}
                title={emoji}
                aria-label={emoji}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

const ManagerAdminChat = () => {
  const { isDarkMode } = useTheme();
  const text = "Chat with Admin";
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null); // Track current user ID
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Load messages
  const loadMessages = async () => {
    try {
      console.log("[Manager Chat API] Loading manager messages");
      
      const response = await fetch("/api/chat/manager/messages/", {
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
        },
      });

      console.log(`[Manager Chat API] Response status: ${response.status}`);

      if (response.status === 401 || response.status === 403) {
        console.warn("[Manager Chat API] Unauthorized - Session expired");
        setError("Unauthorized - Session expired. Please refresh.");
        return;
      }

      if (response.ok) {
        const data = await response.json();
        console.log(`[Manager Chat API] Received ${data.messages ? data.messages.length : 0} messages`);
        console.log("[Manager Chat API] Response data:", data);
        console.log("[Manager Chat API] Messages details:", data.messages?.map(m => ({
          id: m.id,
          sender_type: m.sender_type,
          is_read: m.is_read,
          message: m.message?.substring(0, 50)
        })));
        setMessages(Array.isArray(data.messages) ? data.messages : []);
        setError(null);
      } else {
        console.error(`[Manager Chat API] Failed to load messages: ${response.status}`);
        const errorText = await response.text();
        console.error("[Manager Chat API] Error response:", errorText);
        setError(`Failed to load messages: ${response.status}`);
      }
    } catch (err) {
      console.error("[Manager Chat API] Error loading messages:", err);
      setError(`Error loading messages: ${err.message}`);
    }
  };

  // Send message
  const handleSend = async () => {
    if ((!input.trim() && !selectedImage)) return;

    const messageText = input;
    setLoading(true);
    try {
      // Check for greeting/trigger messages
      const messageLower = messageText.toLowerCase().trim();
      const greetingWords = [
        "hi", "hii", "hello", "helo", 
        "good morning", "good evening"
      ];
      const thankYouWords = ["thank you", "thankyou", "ok", "okay", "fine"];
      
      // Match exact words only (not partial matches)
      const isGreeting = greetingWords.includes(messageLower);
      const isThankYou = thankYouWords.includes(messageLower);

      const formData = new FormData();
      formData.append("message", messageText);
      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      console.log("[Manager Chat API] Sending message");

      const response = await fetch("/api/chat/manager/send_message/", {
        method: "POST",
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: formData,
      });

      console.log(`[Manager Chat API] Send response status: ${response.status}`);

      if (response.ok) {
        console.log("[Manager Chat API] Message sent successfully");
        setInput("");
        clearImage();
        setError(null);
        await loadMessages();

        // Auto-reply for greeting messages - add directly to state AFTER loading messages
        if (isGreeting || isThankYou) {
          const autoReplyId = `auto-reply-${Date.now()}`;
          
          // Different message based on trigger type
          let replyMessage = "";
          if (isGreeting) {
            replyMessage = "Thank you for contacting us! Our support team will be with you shortly to assist you with your inquiry.";
          } else if (isThankYou) {
            replyMessage = "Thank you for contacting us!";
          }
          
          const autoReplyMsg = {
            id: autoReplyId,
            message: replyMessage,
            sender: "admin",
            sender_type: "admin",
            sender_name: "Support",
            timestamp: new Date().toISOString(),
            is_read: false,
            image_url: null,
          };
          
          // Add auto-reply to messages
          setMessages((prevMessages) => [...prevMessages, autoReplyMsg]);
          
          // Scroll after the DOM updates
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
          }, 100);
          
          // Remove auto-reply after 10 seconds
          setTimeout(() => {
            setMessages((msgs) => msgs.filter((msg) => msg.id !== autoReplyId));
          }, 10000);
        }
      } else {
        const errorText = await response.text();
        console.error(`[Manager Chat API] Failed to send message: ${response.status}`, errorText);
        setError("Failed to send message");
      }
    } catch (err) {
      console.error("[Manager Chat API] Error sending message:", err);
      setError("Error sending message");
    } finally {
      setLoading(false);
    }
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Clear image
  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  // Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file?.type.startsWith("image/")) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle paste
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let item of items) {
        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onload = (event) => {
              setImagePreview(event.target?.result);
            };
            reader.readAsDataURL(file);
          }
          break;
        }
      }
    }
  };

  // Handle emoji select
  const handleEmojiSelect = (emoji) => {
    setInput((prev) => prev + emoji);
    setShowEmojiPicker(false);
  };

  // Scroll handler
  const handleScroll = (e) => {
    const container = e.target;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
    setIsScrolledToBottom(isAtBottom);
    if (isAtBottom) {
      setUnreadCount(0);
    }
  };

  // Auto-scroll to bottom - only if user is already at the bottom or chat just opened
  useEffect(() => {
    if (messagesEndRef.current && isOpen && isScrolledToBottom) {
      // Add a small delay to ensure DOM has updated with new messages
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [messages, isOpen, isScrolledToBottom]);

  // Update badge count
  useEffect(() => {
    if (!isOpen) {
      const unread = messages.filter((msg) => msg.sender_type === "admin" && !msg.is_read).length;
      console.log("[Manager Chat Badge] Chat closed, calculating unread count");
      console.log("[Manager Chat Badge] Total messages:", messages.length);
      console.log("[Manager Chat Badge] Unread admin messages:", unread);
      console.log("[Manager Chat Badge] All messages:", messages);
      if (unread > 0) {
        setUnreadCount(unread);
      } else {
        setUnreadCount(0);
      }
    } else {
      console.log("[Manager Chat Badge] Chat is open, clearing badge");
      setUnreadCount(0);
    }
  }, [messages, isOpen]);

  // Load messages on mount
  useEffect(() => {
    console.log("[Manager Chat] Component mounted, loading messages");
    
    // Get current user ID from session or API
    const getUserId = async () => {
      try {
        const response = await fetch("/api/user/profile/", {
          headers: {
            "X-CSRFToken": getCookie("csrftoken"),
          },
        });
        if (response.ok) {
          const data = await response.json();
          setCurrentUserId(data.id);
          console.log("[Manager Chat] Current user ID:", data.id);
        }
      } catch (err) {
        console.error("[Manager Chat] Error getting current user:", err);
      }
    };
    
    getUserId();
    
    // Load messages immediately
    loadMessages();
    
    // Set up polling interval - start after initial load
    const interval = setInterval(() => {
      console.log("[Manager Chat] Polling for new messages");
      loadMessages();
    }, 5000);
    
    return () => {
      console.log("[Manager Chat] Component unmounting, clearing interval");
      clearInterval(interval);
    };
  }, []);

  // Mark as read when chat opens
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      
      // Call API to mark messages as read on the server
      const markAsRead = async () => {
        try {
          console.log("[Manager Chat] Chat opened, marking messages as read on server");
          const response = await fetch("/api/chat/manager/mark_as_read/", {
            method: "POST",
            headers: {
              "X-CSRFToken": getCookie("csrftoken"),
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log("[Manager Chat] Marked as read response:", data);
          } else {
            console.error("[Manager Chat] Failed to mark as read:", response.status);
          }
        } catch (err) {
          console.error("[Manager Chat] Error marking as read:", err);
        }
      };
      
      markAsRead();
    }
  }, [isOpen]);

  const toggleChat = () => setIsOpen(!isOpen);

  return (
    <>
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slide-in-up { from { transform: translateY(10px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes flip { 0%, 80% { transform: rotateY(360deg); } }
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        .chatbox-enter { animation: slide-in-up 0.3s ease-out; }
        .header-fade { animation: fade-in 0.3s ease-out; }
        .message-slide { animation: slide-in-up 0.2s ease-out; }
        @keyframes typing { 0%, 60%, 100% { opacity: 0.3; } 30% { opacity: 1; } }
        .typing-dot { animation: typing 1.4s infinite; display: inline-block; width: 4px; height: 4px; border-radius: 50%; background-color: currentColor; }
        .flip-letter { display: inline-block; animation: flip 2s infinite; }
        .bounce-icon { animation: bounce 2s infinite; }
      `}
      </style>

      <div className="fixed bottom-15 right-5 z-50 flex flex-col items-end px-2 sm:px-0 gap-2">
        {/* Chat button with animated label */}
        {!isOpen && (
          <div className="flex items-center gap-2">
            {/* Animated Chat with Us label */}
            <span
              className={`bounce-icon hidden md:inline-flex ${
                isDarkMode ? "bg-black text-white" : "bg-white text-black"
              } px-3 py-2 rounded-lg shadow-md text-sm font-bold space-x-0.5`}
            >
              {text.split("").map((char, index) => (
                <span
                  key={index}
                  className="flip-letter"
                  style={{ animationDelay: `${index * 0.15}s` }}
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}
            </span>
            
            {/* Chat Open Button */}
            <button
              onClick={toggleChat}
              className={`relative ${
                isDarkMode ? "bg-black hover:bg-gray-800" : "bg-white hover:bg-gray-50"
              } p-3 rounded-full shadow-md hover:shadow-xl transition-all hover:scale-110 active:scale-95`}
              title="Open admin chat"
            >
              <MessageCircle className="w-7 h-7 text-yellow-400" />
              {/* Notification Badge */}
              {unreadCount > 0 && (
                <div className="absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg animate-bounce">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </div>
              )}
            </button>
          </div>
        )}

        {/* Chat box */}
        {isOpen && (
          <>
            {/* Backdrop overlay - click to close */}
            <div
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div
              className={`chatbox-enter mt-3 w-full sm:w-[500px] h-[600px] max-w-sm sm:max-w-none ${
                isDarkMode ? "bg-black border-gray-700" : "bg-white border-gray-300"
              } border rounded-xl shadow-lg flex flex-col overflow-hidden relative z-50`}
            >
              {/* Header */}
              <div
                className={`header-fade ${
                  isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
                } px-4 py-3 font-bold flex justify-between items-center`}
              >
                <span>Admin Support</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-red-500 hover:text-white rounded-lg p-1.5 transition-all duration-200"
                  title="Close chat"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Error message */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded flex items-center space-x-2 text-sm mx-2 mt-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Messages */}
              <div 
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 px-4 py-4 overflow-y-auto space-y-3"
              >
                {messages.length === 0 ? (
                  <div
                    className={`${
                      isDarkMode ? "text-gray-500" : "text-gray-400"
                    } text-sm text-center py-8`}
                  >
                    No messages yet
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${
                        msg.sender === currentUserId ? "justify-end" : "justify-start"
                      } message-slide`}
                    >
                      <div className={`max-w-xs px-4 py-2 rounded-lg ${
                        msg.sender === currentUserId
                          ? "bg-yellow-500 text-white rounded-br-none"
                          : `${isDarkMode ? "bg-gray-700 text-white" : "bg-gray-200 text-black"} rounded-bl-none`
                      }`}>
                        {/* Image Display if present */}
                        {msg.image_url && (
                          <img
                            src={msg.image_url}
                            alt="Chat attachment"
                            className="max-w-full max-h-40 rounded mb-2 cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => {
                              const modal = document.createElement("div");
                              modal.className = `fixed inset-0 z-50 flex items-center justify-center ${isDarkMode ? "bg-black/90" : "bg-black/70"}`;
                              modal.innerHTML = `
                                <div class="relative max-w-2xl max-h-screen flex flex-col items-center justify-center">
                                  <img src="${msg.image_url}" alt="Full size" class="max-w-full max-h-[80vh] rounded-lg"/>
                                  <button class="absolute top-4 right-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors" id="closeBtn">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                  </button>
                                </div>
                              `;
                              document.body.appendChild(modal);
                              const closeBtn = modal.querySelector("#closeBtn");
                              closeBtn.addEventListener("click", () => modal.remove());
                              modal.addEventListener("click", (e) => {
                                if (e.target === modal) modal.remove();
                              });
                            }}
                          />
                        )}
                        
                        <div className="text-sm break-words">{msg.message}</div>
                        
                        {msg.timestamp && (
                          <div className={`text-xs mt-1 ${
                            msg.sender === currentUserId
                              ? "text-yellow-100/60" 
                              : isDarkMode ? "text-gray-400" : "text-gray-500"
                          }`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className={`p-4 border-t ${isDarkMode ? "border-gray-700 bg-gray-900/50" : "border-gray-300 bg-gray-50"} backdrop-blur-sm space-y-2`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {/* Drag overlay */}
                {isDragging && (
                  <div className={`absolute inset-0 rounded-lg pointer-events-none transition-all ${isDarkMode ? "bg-yellow-500/10 border-2 border-yellow-400" : "bg-yellow-400/10 border-2 border-yellow-500"}`} />
                )}
                
                {/* Image Preview */}
                {imagePreview && (
                  <div className="relative inline-block">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-32 rounded-lg"
                    />
                    <button
                      onClick={clearImage}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div className="flex items-end gap-2">
                  {/* Image Upload Input */}
                  <input
                    type="file"
                    id="image-upload-manager"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />
                  
                  <button
                    onClick={() => document.getElementById('image-upload-manager')?.click()}
                    disabled={loading}
                    className={`p-3 rounded-2xl transition-all duration-300 ${
                      isDarkMode
                        ? "bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-yellow-400"
                        : "bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-yellow-600"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title="Attach image"
                  >
                    <ImagePlus className="w-5 h-5" />
                  </button>

                  {/* Emoji Picker Button */}
                  <div className="relative">
                    <button
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      disabled={loading}
                      className={`p-3 rounded-2xl transition-all duration-300 ${
                        isDarkMode
                          ? "bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-yellow-400"
                          : "bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-yellow-600"
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      title="Add emoji"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                    
                    {/* Emoji Picker Popup */}
                    {showEmojiPicker && (
                      <div className="absolute bottom-14 left-0 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                        <EmojiPicker onEmojiSelect={handleEmojiSelect} isDarkMode={isDarkMode} onClose={() => setShowEmojiPicker(false)} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 relative group">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSend()}
                      onPaste={handlePaste}
                      placeholder="Type a message or paste an image..."
                      disabled={loading}
                      className={`w-full px-4 py-3 rounded-2xl text-sm transition-all duration-300 ${
                        isDarkMode 
                          ? "bg-gray-800 text-white placeholder-gray-500 focus:bg-gray-700/80" 
                          : "bg-white text-black placeholder-gray-400 focus:bg-gray-50"
                      } border-2 ${
                        input ? (isDarkMode ? "border-yellow-500/50" : "border-yellow-400/30") : (isDarkMode ? "border-gray-700" : "border-gray-200")
                      } focus:border-yellow-400 focus:outline-none shadow-md hover:shadow-lg focus:shadow-lg focus:shadow-yellow-400/20 disabled:opacity-50 disabled:cursor-not-allowed`}
                    />
                    {/* Character counter */}
                    {input && (
                      <span className={`absolute right-3 bottom-3.5 text-xs font-medium ${
                        isDarkMode ? "text-gray-400" : "text-gray-500"
                      }`}>
                        {input.length}/500
                      </span>
                    )}
                  </div>
                  
                  <button
                    onClick={handleSend}
                    disabled={(!input.trim() && !selectedImage) || loading}
                    className={`group flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold transition-all duration-300 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 ${
                      (input.trim() || selectedImage) && !loading
                        ? `${isDarkMode 
                            ? "bg-gradient-to-br from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 shadow-lg hover:shadow-xl hover:shadow-yellow-500/50 hover:scale-105 active:scale-95" 
                            : "bg-gradient-to-br from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 shadow-lg hover:shadow-xl hover:shadow-yellow-400/50 hover:scale-105 active:scale-95"
                          } text-black`
                        : `${isDarkMode ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-400"}`
                    }`}
                    title={!input.trim() && !selectedImage ? "Type a message or select an image" : "Send message (Enter)"}
                  >
                    <Send className="w-4 h-4" />
                    {loading && (
                      <span className="typing-indicator">
                        <span className="typing-dot" style={{ animationDelay: "0s" }}></span>
                        <span className="typing-dot" style={{ animationDelay: "0.2s" }}></span>
                        <span className="typing-dot" style={{ animationDelay: "0.4s" }}></span>
                      </span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ManagerAdminChat;
