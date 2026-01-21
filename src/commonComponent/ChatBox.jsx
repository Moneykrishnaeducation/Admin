import { useState, useEffect, useRef } from "react";
import { X, MessageCircle, Send, AlertCircle, RefreshCw, Trash2, Menu } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import { getCookie } from "../utils/api";

const ChatBot = () => {
  const { isDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [clients, setClients] = useState([]);
  const [messages, setMessages] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [clientUnreadCounts, setClientUnreadCounts] = useState({});
  const [messageCounts, setMessageCounts] = useState({});
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Mobile sidebar state
  const [userRole, setUserRole] = useState(null); // Track user role
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const previousMessageCountRef = useRef(0);
  const isInitialLoadRef = useRef(true);
  const messageCountWhenOpenedRef = useRef(0);

  // Get user role on component mount
  useEffect(() => {
    const getUserRole = () => {
      try {
        // Try to get user from cookie
        const userCookie = getCookie("user");
        if (userCookie) {
          try {
            const userData = JSON.parse(userCookie);
            setUserRole(userData.role || null);
            return;
          } catch (e) {
            console.debug("Could not parse user cookie");
          }
        }
        
        // Try to get user role from a separate role cookie
        const role = getCookie("userRole") || getCookie("user_role");
        if (role) {
          setUserRole(role);
        }
      } catch (err) {
        console.error("Error getting user role:", err);
      }
    };
    
    getUserRole();
  }, []);

  // Smart scroll and unread count tracking
  useEffect(() => {
    // First call or initial load - just set reference
    if (isInitialLoadRef.current) {
      previousMessageCountRef.current = Object.values(messages).flat().length;
      isInitialLoadRef.current = false;
      return;
    }

    const currentMessagesCount = messages[selectedClientId]?.length || 0;

    if (isOpen && selectedClientId) {
      // Chat is open
      setUnreadCount(0);
      
      if (isScrolledToBottom) {
        // Scrolled to bottom - clear all unread indicators
        setHasUnreadMessages(false);
      } else {
        // Scrolled up - show new message indicator ONLY if messages arrived AFTER opening
        if (currentMessagesCount > messageCountWhenOpenedRef.current) {
          setHasUnreadMessages(true);
        }
      }
    } else {
      // Chat is closed - track badge count
      const totalCount = Object.values(messages).flat().length;
      if (totalCount > previousMessageCountRef.current) {
        const newCount = totalCount - previousMessageCountRef.current;
        setUnreadCount((prev) => prev + newCount);
        setHasUnreadMessages(true);
        previousMessageCountRef.current = totalCount;
      }
    }
  }, [messages, isOpen, selectedClientId, isScrolledToBottom]);

  // Reset message count when chat opens
  useEffect(() => {
    if (isOpen && selectedClientId) {
      messageCountWhenOpenedRef.current = messages[selectedClientId]?.length || 0;
      setHasUnreadMessages(false);
      // Reset unread count for this client when viewing it
      setClientUnreadCounts((prev) => ({
        ...prev,
        [selectedClientId]: 0,
      }));
    }
  }, [isOpen, selectedClientId, messages]);

  // Auto-scroll to bottom when scrolled to bottom
  useEffect(() => {
    if (isScrolledToBottom && messagesEndRef.current && isOpen && selectedClientId) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages[selectedClientId], isScrolledToBottom, isOpen, selectedClientId]);

  // Detect scroll position
  const handleScroll = (e) => {
    const container = e.target;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
    setIsScrolledToBottom(isAtBottom);
    if (isAtBottom) {
      setHasUnreadMessages(false);
      setUnreadCount(0);
    }
  };

  // Scroll to bottom handler
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsScrolledToBottom(true);
    setHasUnreadMessages(false);
    setUnreadCount(0);
  };

  // Track unread messages per client
  useEffect(() => {
    // When a client is selected, mark their messages as read
    if (selectedClientId) {
      // Call backend to mark messages as read
      const markAsRead = async () => {
        try {
          await fetch("/api/chat/admin/mark_client_as_read/", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-CSRFToken": getCookie("csrftoken"),
            },
            body: JSON.stringify({ client_id: selectedClientId }),
          });
        } catch (err) {
          console.error("Error marking messages as read:", err);
        }
      };
      
      markAsRead();
      
      // Reset their unread count in UI
      setClientUnreadCounts((prev) => ({
        ...prev,
        [selectedClientId]: 0,
      }));
      
      // Close sidebar on mobile when client is selected
      setIsSidebarOpen(false);
    }
  }, [selectedClientId]);

  // Load clients and messages when chat opens
  useEffect(() => {
    if (isOpen) {
      loadClients();
      const interval = setInterval(loadClients, 5000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Load messages for selected client
  useEffect(() => {
    if (selectedClientId) {
      loadMessagesForClient(selectedClientId);
      const interval = setInterval(() => loadMessagesForClient(selectedClientId), 3000);
      return () => clearInterval(interval);
    }
  }, [selectedClientId]);

  // Load clients and update every 5 seconds (similar to Client)
  useEffect(() => {
    loadClients();
    const interval = setInterval(loadClients, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadClients = async () => {
    try {
      const response = await fetch("/api/chat/admin/messages/", {
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
        },
      });

      if (!response.ok) throw new Error("Failed to load clients");

      const data = await response.json();
      
      // Extract unique clients from messages and track unread counts
      const uniqueClients = {};
      const unreadCounts = {};
      
      data.messages.forEach((msg) => {
        // For clients, get sender info; for admin messages, get recipient info
        const clientId = msg.sender_type === "client" ? msg.sender : msg.recipient;
        const clientEmail = msg.sender_type === "client" ? msg.sender_email : msg.recipient_email;
        const clientName = msg.sender_type === "client" ? msg.sender_name : msg.recipient_name;
        
        if (clientId && !uniqueClients[clientId]) {
          uniqueClients[clientId] = {
            id: clientId,
            email: clientEmail || `User ${clientId}`,
            name: clientName || clientEmail || `User ${clientId}`,
          };
          unreadCounts[clientId] = 0;
        }
        
        // Count unread messages from clients (not admin messages)
        if (msg.sender_type === "client" && !msg.is_read) {
          unreadCounts[clientId] = (unreadCounts[clientId] || 0) + 1;
        }
      });

      setClients(Object.values(uniqueClients));
      
      // Update unread counts for all clients EXCEPT the currently selected one
      setClientUnreadCounts((prev) => {
        const updated = { ...prev, ...unreadCounts };
        // Don't update count for currently selected client (it's being actively viewed)
        if (selectedClientId) {
          updated[selectedClientId] = 0;
        }
        return updated;
      });
      
      setError(null);
    } catch (err) {
      console.error("Error loading clients:", err);
      setError(err.message);
    }
  };

  const loadMessagesForClient = async (clientId) => {
    try {
      const response = await fetch(`/api/chat/admin/messages/?user_id=${clientId}`, {
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
        },
      });

      if (!response.ok) throw new Error("Failed to load messages");

      const data = await response.json();
      const newMessages = data.messages.map((msg) => ({
        id: msg.id,
        message: msg.message,
        sender: msg.sender_type === "admin" ? "admin" : "user",
        sender_name: msg.sender_name || "User",
        timestamp: msg.timestamp,
        is_read: msg.is_read,
      }));
      
      // Count unread messages from the client (not admin messages)
      const unreadCount = newMessages.filter(
        (msg) => msg.sender === "user" && !msg.is_read
      ).length;
      
      setMessages((prev) => {
        return {
          ...prev,
          [clientId]: newMessages,
        };
      });
      
      // Update unread count for this client
      setClientUnreadCounts((prev) => ({
        ...prev,
        [clientId]: unreadCount,
      }));
      
      setMessageCounts((prev) => ({
        ...prev,
        [clientId]: newMessages.length,
      }));
    } catch (err) {
      console.error("Error loading messages:", err);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading || !selectedClientId) return;

    const messageText = input;
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/chat/admin/send/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({
          message: messageText,
          recipient_id: selectedClientId,
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      // Reload messages
      await loadMessagesForClient(selectedClientId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;

    try {
      const response = await fetch(`/api/chat/delete/${messageId}/`, {
        method: "DELETE",
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
        },
      });

      if (!response.ok) throw new Error("Failed to delete message");

      // Remove message from local state
      setMessages((prev) => ({
        ...prev,
        [selectedClientId]: prev[selectedClientId].filter((msg) => msg.id !== messageId),
      }));
    } catch (err) {
      setError(err.message);
    }
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const toggleChat = () => setIsOpen(!isOpen);
  const currentMessages = messages[selectedClientId] || [];
  const selectedClient = clients.find((c) => c.id === selectedClientId);
  
  // Calculate total unread count from all clients
  const totalUnreadCount = Object.values(clientUnreadCounts).reduce((sum, count) => sum + count, 0);

  // Hide chatbot for managers
  if (userRole === "manager") {
    return null;
  }

  return (
    <>
      <style>
        {`
          @keyframes flip { 0%, 80% { transform: rotateY(360deg); } }
          @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
          @keyframes inputFocus { 0% { box-shadow: 0 0 0 2px rgba(250, 204, 21, 0); } 100% { box-shadow: 0 0 0 2px rgba(250, 204, 21, 0.5); } }
          @keyframes typingDot { 0%, 60%, 100% { opacity: 0.4; } 30% { opacity: 1; } }
          @keyframes slideInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes slideInLeft { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
          @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes scaleIn { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
          @keyframes popIn { 0% { opacity: 0; transform: scale(0.7); } 50% { transform: scale(1.05); } 100% { opacity: 1; transform: scale(1); } }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
          @keyframes chatBoxSlide { from { transform: translateY(400px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

          .flip-letter { display: inline-block; animation: flip 2s infinite; }
          .bounce-icon { animation: bounce 2s infinite; }
          .input-focus { animation: inputFocus 0.3s ease-out; }
          .typing-indicator { display: inline-flex; gap: 2px; }
          .typing-dot { width: 4px; height: 4px; border-radius: 50%; background: currentColor; animation: typingDot 1.4s infinite; }
          .message-slide { animation: slideInUp 0.4s ease-out; }
          .admin-message-slide { animation: slideInLeft 0.4s ease-out; }
          .user-message-slide { animation: slideInRight 0.4s ease-out; }
          .avatar-fade { animation: fadeIn 0.5s ease-out; }
          .chatbox-enter { animation: chatBoxSlide 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
          .header-fade { animation: fadeIn 0.6s ease-out; }
          .error-shake { animation: shake 0.5s ease-in-out; }
          @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        `}
      </style>

      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end px-2 sm:px-0 gap-2">
        {/* Chat button */}
        {!isOpen && (
          <button
            onClick={toggleChat}
            className={`relative ${
              isDarkMode ? "bg-black hover:bg-gray-800" : "bg-white hover:bg-gray-50"
            } p-3 rounded-full shadow-md hover:shadow-xl transition-all hover:scale-110 active:scale-95`}
            title="Open chat"
          >
            <MessageCircle className="w-7 h-7 text-yellow-400" />
            {/* Notification Badge */}
            {totalUnreadCount > 0 && (
              <div className="absolute -top-1 -right-1 flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg animate-bounce">
                {totalUnreadCount > 99 ? "99+" : totalUnreadCount}
              </div>
            )}
          </button>
        )}

        {/* Chat box */}
        {isOpen && (
          <div
            className={`chatbox-enter mt-3 w-full sm:w-[900px] h-[600px] max-w-sm sm:max-w-none ${
              isDarkMode ? "bg-black border-gray-700" : "bg-white border-gray-300"
            } border rounded-xl shadow-lg flex flex-col overflow-hidden`}
          >
            {/* Header with mobile menu button */}
            <div
              className={`header-fade ${
                isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
              } px-4 py-3 font-bold flex justify-between items-center`}
            >
              <div className="flex items-center gap-3">
                {/* Mobile menu button - visible only on small screens */}
                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="sm:hidden p-1.5 hover:bg-gray-400/20 rounded-lg transition-all"
                  title={isSidebarOpen ? "Hide clients" : "Show clients"}
                >
                  <Menu className="w-5 h-5" />
                </button>
                <span>{selectedClientId ? "Chat Messages" : "Admin Chat Panel"}</span>
              </div>
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
              <div className="error-shake bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded flex items-center space-x-2 text-sm mx-2 mt-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex flex-1 overflow-hidden gap-2 p-2 relative">
              {/* Clients list - hidden on mobile unless sidebar is open */}
              <div
                className={`absolute sm:relative w-48 h-full sm:h-auto ${
                  isDarkMode ? "bg-gradient-to-b from-gray-800 to-gray-900" : "bg-gradient-to-b from-blue-50 to-blue-100"
                } rounded-lg border ${isDarkMode ? "border-blue-600" : "border-blue-300"} overflow-hidden flex flex-col shadow-lg transition-all duration-300 z-40 ${
                  isSidebarOpen ? "left-0 sm:left-auto" : "-left-full sm:left-auto"
                }`}
              >
                <div className={`px-3 py-3 font-bold text-sm border-b ${
                  isDarkMode ? "bg-blue-900 text-blue-100 border-blue-700" : "bg-blue-500 text-white border-blue-400"
                }`}>
                  Clients ({clients.length})
                </div>
                <div className="flex-1 overflow-y-auto">
                  {clients.length === 0 ? (
                    <div
                      className={`text-xs ${
                        isDarkMode ? "text-gray-500" : "text-gray-600"
                      } p-2 text-center`}
                    >
                      No clients yet
                    </div>
                  ) : (
                    clients.map((client) => (
                      <button
                        key={client.id}
                        onClick={() => setSelectedClientId(client.id)}
                        className={`w-full text-left px-3 py-2.5 text-xs border-b transition-all duration-200 flex items-center justify-between ${
                          isDarkMode ? "border-gray-700" : "border-blue-200"
                        } ${
                          selectedClientId === client.id
                            ? `${
                                isDarkMode
                                  ? "bg-gradient-to-r from-yellow-600 to-yellow-500 text-white font-semibold shadow-md"
                                  : "bg-gradient-to-r from-yellow-400 to-yellow-300 text-gray-900 font-semibold shadow-md"
                              }`
                            : `${
                                isDarkMode
                                  ? "bg-gray-700/50 text-gray-200 hover:bg-gradient-to-r hover:from-blue-700/80 hover:to-blue-600/80 hover:text-white hover:shadow-md"
                                  : "bg-white/60 text-gray-700 hover:bg-gradient-to-r hover:from-blue-200/80 hover:to-blue-100/80 hover:text-gray-900 hover:shadow-md"
                              }`
                        }`}
                      >
                        <div className="truncate font-medium">{client.name}</div>
                        {clientUnreadCounts[client.id] > 0 && (
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                            isDarkMode 
                              ? "bg-red-600 text-white" 
                              : "bg-red-500 text-white"
                          }`}>
                            {clientUnreadCounts[client.id] > 99 ? "99+" : clientUnreadCounts[client.id]}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Mobile overlay when sidebar is open */}
              {isSidebarOpen && (
                <div
                  className="sm:hidden absolute inset-0 bg-black/50 z-30 rounded-lg"
                  onClick={() => setIsSidebarOpen(false)}
                />
              )}

              {/* Messages area */}
              <div className="flex-1 flex flex-col border rounded-lg border-gray-700 overflow-hidden">
                {selectedClientId ? (
                  <>
                    {/* Client header */}
                    <div
                      className={`px-3 py-2 border-b ${
                        isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-100"
                      } text-sm font-medium`}
                    >
                      <div className="flex flex-col">
                        <span className={`${isDarkMode ? "text-blue-400" : "text-blue-600"}`}>{clients.find((c) => c.id === selectedClientId)?.name}</span>
                        <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                          {clients.find((c) => c.id === selectedClientId)?.email}
                        </span>
                      </div>
                    </div>

                    {/* Messages */}
                    <div 
                      ref={messagesContainerRef}
                      onScroll={handleScroll}
                      className="flex-1 px-3 py-2 overflow-y-auto space-y-2"
                    >
                      {(messages[selectedClientId] || []).length === 0 ? (
                        <div
                          className={`${
                            isDarkMode ? "text-gray-500" : "text-gray-400"
                          } text-sm text-center py-8`}
                        >
                          No messages yet
                        </div>
                      ) : (
                        (messages[selectedClientId] || []).map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${
                              msg.sender === "admin" ? "justify-end" : "justify-start"
                            } group message-slide`}
                          >
                            <div className="flex items-end gap-2 max-w-xs">
                              {/* Profile Avatar for User Messages */}
                              {msg.sender === "user" && (
                                <div
                                  className={`avatar-fade w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                                    isDarkMode ? "bg-blue-600" : "bg-blue-500"
                                  }`}
                                >
                                  {getInitials(msg.sender_name)}
                                </div>
                              )}

                              {/* Message Bubble */}
                              <div
                                className={`px-3 py-2 rounded-lg text-xs break-words relative group/message transition-all hover:shadow-md ${
                                  msg.sender === "admin"
                                    ? "bg-yellow-400 text-black rounded-br-none"
                                    : `${
                                        isDarkMode
                                          ? "bg-gray-800 text-white"
                                          : "bg-gray-200 text-black"
                                      } rounded-bl-none`
                                }`}
                              >
                                {msg.message}

                                {/* Delete Button on Hover */}
                                <button
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className="absolute -top-8 right-0 opacity-0 group-hover/message:opacity-100 transition-opacity p-1 hover:bg-red-500 hover:text-white rounded"
                                  title="Delete message"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>

                              {/* Profile Avatar for Admin Messages */}
                              {msg.sender === "admin" && (
                                <div
                                  className={`avatar-fade w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                                    isDarkMode ? "bg-yellow-600" : "bg-yellow-500"
                                  }`}
                                >
                                  AD
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className={`p-4 border-t ${isDarkMode ? "border-gray-700 bg-gray-900/50" : "border-gray-300 bg-gray-50"} backdrop-blur-sm`}>
                      <div className="flex items-end gap-2">
                        <div className="flex-1 relative group">
                          <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSend()}
                            placeholder="Type a message..."
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
                          {/* Focus indicator */}
                          <div className={`absolute inset-0 rounded-2xl pointer-events-none transition-all duration-300 ${
                            input ? (isDarkMode ? "shadow-[0_0_12px_rgba(250,204,21,0.2)]" : "shadow-[0_0_12px_rgba(250,204,21,0.15)]") : ""
                          }`} />
                        </div>
                        
                        <button
                          onClick={handleSend}
                          disabled={!input.trim() || loading}
                          className={`group flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold transition-all duration-300 transform disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100 ${
                            input.trim() && !loading
                              ? `${isDarkMode 
                                  ? "bg-gradient-to-br from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 shadow-lg hover:shadow-xl hover:shadow-yellow-500/50 hover:scale-105 active:scale-95" 
                                  : "bg-gradient-to-br from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 shadow-lg hover:shadow-xl hover:shadow-yellow-400/50 hover:scale-105 active:scale-95"
                                } text-black`
                              : `${isDarkMode ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-400"}`
                          }`}
                          title={!input.trim() ? "Type a message first" : "Send message (Enter)"}
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
                  </>
                ) : (
                  <div
                    className={`flex-1 flex items-center justify-center ${
                      isDarkMode ? "text-gray-500" : "text-gray-400"
                    }`}
                  >
                    Select a client to chat
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ChatBot;