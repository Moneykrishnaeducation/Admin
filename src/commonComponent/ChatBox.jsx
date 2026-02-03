import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { MessageCircle, Send, X, ImagePlus, Smile, Menu, AlertCircle, Check, Trash2 } from 'lucide-react';

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

const ChatBot = () => {
  const { isDarkMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [selectedId, setSelectedId] = useState(null); // Can be client_id or manager_id
  const [clients, setClients] = useState([]);
  const [managers, setManagers] = useState([]);
  const [messages, setMessages] = useState({}); // Keys: client_id or manager_${id}
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState({}); // Unified unread counts
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [adminProfiles, setAdminProfiles] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [chatMode, setChatMode] = useState('clients'); // 'clients' or 'managers'
  
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const clientsAbortControllerRef = useRef(null);
  const messagesAbortControllerRef = useRef(null);
  const originalTitleRef = useRef('');
  const audioCtxRef = useRef(null);
  const bcRef = useRef(null);
  const tabIdRef = useRef(Math.random().toString(36).slice(2));
  const notifiedIdsRef = useRef(new Set());

  // Initialize audio context on first interaction
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const onFirstInteract = (e) => {
      try {
        if (!audioCtxRef.current) {
          audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (audioCtxRef.current?.state === 'suspended') {
          audioCtxRef.current.resume();
        }
      } catch (err) {
        console.warn('Failed to initialize AudioContext:', err);
      }
    };

    const events = ['pointerdown', 'click', 'touchstart', 'keydown'];
    events.forEach((ev) => window.addEventListener(ev, onFirstInteract, { once: true }));
    return () => events.forEach((ev) => window.removeEventListener(ev, onFirstInteract));
  }, []);

  // Get user role
  useEffect(() => {
    const getUserRole = () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          const role = payload.role || 'unknown';
          setUserRole(role.toLowerCase());
          if (role.toLowerCase() === 'manager') {
            setIsOpen(false);
          }
        }
      } catch (err) {
        console.warn('Failed to get user role:', err);
      }
    };
    
    getUserRole();
  }, []);

  // Load clients/managers based on mode (only those with messages)
  useEffect(() => {
    if (userRole === 'manager') return;
    
    const loadContactsList = async () => {
      try {
        if (clientsAbortControllerRef.current) {
          clientsAbortControllerRef.current.abort();
        }
        
        clientsAbortControllerRef.current = new AbortController();
        const token = localStorage.getItem('accessToken');
        
        // Fetch all messages from unified endpoint
        const response = await fetch('/api/chat/admin/messages/?limit=1000', {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: clientsAbortControllerRef.current.signal
        });
        
        if (response.ok) {
          const data = await response.json();
          const msgs = data.messages || [];
          
          // Extract unique contacts from messages and calculate unread counts
          const clientContacts = {};
          const managerContacts = {};
          const unreadMap = {};
          
          msgs.forEach(msg => {
            // Process clients
            if (msg.sender_type === 'client') {
              const clientId = msg.sender;
              if (!clientContacts[clientId]) {
                clientContacts[clientId] = {
                  id: msg.sender,
                  name: msg.sender_name || 'Client',
                  email: msg.sender_email || 'unknown'
                };
              }
              // Count unread from clients
              if (!msg.is_read) {
                unreadMap[clientId] = (unreadMap[clientId] || 0) + 1;
              }
            } else if (msg.sender_type === 'admin' && msg.recipient) {
              // Admin message to client - add client to contacts
              const clientId = msg.recipient;
              if (!clientContacts[clientId]) {
                clientContacts[clientId] = {
                  id: msg.recipient,
                  name: 'Client',
                  email: msg.recipient_email || 'unknown'
                };
              }
            }
            
            // Process managers
            if (msg.sender_type === 'manager') {
              const managerId = msg.sender;
              if (!managerContacts[managerId]) {
                managerContacts[managerId] = {
                  id: msg.sender,
                  name: msg.sender_name || 'Manager',
                  email: msg.sender_email || 'unknown'
                };
              }
              // Count unread from managers
              if (!msg.is_read) {
                unreadMap[managerId] = (unreadMap[managerId] || 0) + 1;
              }
            } else if (msg.sender_type === 'admin' && msg.recipient) {
              // Admin message to manager - add manager to contacts
              const managerId = msg.recipient;
              if (!managerContacts[managerId]) {
                managerContacts[managerId] = {
                  id: msg.recipient,
                  name: 'Manager',
                  email: msg.recipient_email || 'unknown'
                };
              }
            }
          });
          
          // Set contacts based on current mode
          if (chatMode === 'clients') {
            setClients(Object.values(clientContacts));
          } else {
            setManagers(Object.values(managerContacts));
          }
          
          // Always update BOTH lists for unread counting (even if not visible)
          if (chatMode === 'clients') {
            // We just set clients, also set managers
            setManagers(Object.values(managerContacts));
          } else {
            // We just set managers, also set clients
            setClients(Object.values(clientContacts));
          }
          
          // Update unread counts (always get total across all contacts)
          setUnreadCounts(unreadMap);
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Error loading contacts:', err);
        }
      }
    };

    loadContactsList();
    const interval = setInterval(loadContactsList, 3000);
    return () => clearInterval(interval);
  }, [userRole, chatMode]);

  // Load messages for selected contact
  useEffect(() => {
    if (!selectedId || userRole === 'manager') return;
    
    const loadMessages = async () => {
      try {
        if (messagesAbortControllerRef.current) {
          messagesAbortControllerRef.current.abort();
        }
        
        messagesAbortControllerRef.current = new AbortController();
        const token = localStorage.getItem('accessToken');
        
        // Use unified endpoint - accepts user_id (client) or manager_id (manager)
        const param = chatMode === 'clients' ? `user_id=${selectedId}` : `manager_id=${selectedId}`;
        const endpoint = `/api/chat/admin/messages/?${param}`;
        
        const response = await fetch(endpoint, {
          headers: { 'Authorization': `Bearer ${token}` },
          signal: messagesAbortControllerRef.current.signal
        });
        
        if (response.ok) {
          const data = await response.json();
          const msgKey = chatMode === 'clients' ? selectedId : `manager_${selectedId}`;
          setMessages(prev => ({
            ...prev,
            [msgKey]: data.messages || []
          }));
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Error loading messages:', err);
        }
      }
    };

    loadMessages();
    const interval = setInterval(loadMessages, 5000);
    return () => clearInterval(interval);
  }, [selectedId, userRole, chatMode]);

  // Mark messages as read when viewing
  useEffect(() => {
    if (!selectedId || !isOpen) return;
    
    const markAsRead = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        const endpoint = chatMode === 'clients'
          ? '/api/chat/admin/mark_client_as_read/'
          : '/api/chat/admin/mark_manager_as_read/';
        
        const body = chatMode === 'clients'
          ? { client_id: selectedId }
          : { manager_id: selectedId };
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(body)
        });
        
        if (response.ok) {
          // Update unread count
          setUnreadCounts(prev => ({
            ...prev,
            [selectedId]: 0
          }));
          
          // Update messages locally to mark them as read
          const msgKey = chatMode === 'clients' ? selectedId : `manager_${selectedId}`;
          setMessages(prev => ({
            ...prev,
            [msgKey]: (prev[msgKey] || []).map(msg => ({
              ...msg,
              is_read: true
            }))
          }));
        }
      } catch (err) {
        console.warn('Error marking as read:', err);
      }
    };

    const timeout = setTimeout(markAsRead, 500);
    return () => clearTimeout(timeout);
  }, [selectedId, isOpen, chatMode]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isScrolledToBottom && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isScrolledToBottom]);

  // Handle scroll detection
  const handleScroll = (e) => {
    const container = e.target;
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
    setIsScrolledToBottom(isAtBottom);
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    setInput(input + emoji);
    setShowEmojiPicker(false);
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setError('Please select a valid image file');
    }
  };

  // Clear image
  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  // Handle paste
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(file);
        break;
      }
    }
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  // Handle drag leave
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer?.files;
    if (!files) return;
    
    for (let file of files) {
      if (file.type.startsWith('image/')) {
        setSelectedImage(file);
        const reader = new FileReader();
        reader.onload = (e) => setImagePreview(e.target.result);
        reader.readAsDataURL(file);
        break;
      }
    }
  };

  // Send message
  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || loading || !selectedId) return;

    const messageText = input;
    setInput("");
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('accessToken');
      const formData = new FormData();
      formData.append('message', messageText);
      if (selectedImage) {
        formData.append('image', selectedImage);
      }
      
      const endpoint = chatMode === 'clients'
        ? '/api/chat/admin/send/'
        : '/api/chat/admin/send_to_manager/';
      
      const params = chatMode === 'clients'
        ? `?recipient_id=${selectedId}`
        : `?manager_id=${selectedId}`;

      const response = await fetch(endpoint + params, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        clearImage();
        // Reload messages
        const msgKey = chatMode === 'clients' ? selectedId : `manager_${selectedId}`;
        const param = chatMode === 'clients' ? `user_id=${selectedId}` : `manager_id=${selectedId}`;
        const msgResponse = await fetch(
          `/api/chat/admin/messages/?${param}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        if (msgResponse.ok) {
          const data = await msgResponse.json();
          setMessages(prev => ({
            ...prev,
            [msgKey]: data.messages || []
          }));
        }
      } else {
        setError('Failed to send message');
      }
    } catch (err) {
      setError('Error sending message: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`/api/chat/delete/${messageId}/`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const msgKey = chatMode === 'clients' ? selectedId : `manager_${selectedId}`;
        setMessages(prev => ({
          ...prev,
          [msgKey]: (prev[msgKey] || []).filter(m => m.id !== messageId)
        }));
      }
    } catch (err) {
      setError('Error deleting message: ' + err.message);
    }
  };

  // Get initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // Hide for managers
  if (userRole === "manager") return null;

  // Get current contact list and selected contact
  const contactList = chatMode === 'clients' ? clients : managers;
  const selectedContact = contactList.find(c => c.id === selectedId);
  const msgKey = chatMode === 'clients' ? selectedId : (selectedId ? `manager_${selectedId}` : null);
  const currentMessages = msgKey ? (messages[msgKey] || []) : [];
  
  // Calculate unread counts for each category
  const clientUnreadCount = clients.reduce((sum, client) => {
    return sum + (unreadCounts[client.id] || 0);
  }, 0);
  
  const managerUnreadCount = managers.reduce((sum, manager) => {
    return sum + (unreadCounts[manager.id] || 0);
  }, 0);
  
  // Calculate total unread
  const totalUnread = clientUnreadCount + managerUnreadCount;

  return (
    <>
      <style>
        {`
          @keyframes flip { 0%, 80% { transform: rotateY(360deg); } }
          @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
          @keyframes slideInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes slideInLeft { from { opacity: 0; transform: translateX(-20px); } to { opacity: 1; transform: translateX(0); } }
          @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes chatBoxSlide { from { transform: translateY(400px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }

          .message-slide { animation: slideInUp 0.4s ease-out; }
          .admin-message-slide { animation: slideInLeft 0.4s ease-out; }
          .user-message-slide { animation: slideInRight 0.4s ease-out; }
          .avatar-fade { animation: fadeIn 0.5s ease-out; }
          .chatbox-enter { animation: chatBoxSlide 0.5s cubic-bezier(0.34, 1.56, 0.64, 1); }
          .header-fade { animation: fadeIn 0.6s ease-out; }
          .error-shake { animation: shake 0.5s ease-in-out; }
        `}
      </style>

      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end px-2 sm:px-0 gap-2">
        {/* Chat button */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className={`relative ${
              isDarkMode ? "bg-black hover:bg-gray-800" : "bg-white hover:bg-gray-50"
            } p-3 rounded-full shadow-md hover:shadow-xl transition-all hover:scale-110 active:scale-95`}
            title="Open chat"
          >
            <MessageCircle className="w-7 h-7 text-yellow-400" />
            {totalUnread > 0 && (
              <div className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full shadow-lg animate-bounce">
                {totalUnread > 99 ? "99+" : totalUnread}
              </div>
            )}
          </button>
        )}

        {/* Chat window */}
        {isOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div
              className={`chatbox-enter mt-3 w-full sm:w-[900px] h-[600px] max-w-sm sm:max-w-none ${
                isDarkMode ? "bg-black border-gray-700" : "bg-white border-gray-300"
              } border rounded-xl shadow-lg flex flex-col overflow-hidden relative z-50`}
            >
              {/* Header */}
              <div
                className={`header-fade ${
                  isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
                } px-4 py-3 font-bold flex justify-between items-center`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="sm:hidden p-1.5 hover:bg-gray-400/20 rounded-lg transition-all"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                  <span>{selectedContact ? selectedContact.name : "Chat Messages"}</span>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-red-500 hover:text-white rounded-lg p-1.5 transition-all"
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

              {/* Main content */}
              <div className="flex flex-1 overflow-hidden gap-2 p-2 relative">
                {/* Sidebar with tabs and contacts */}
                <div
                  className={`absolute sm:relative w-48 h-full sm:h-auto ${
                    isDarkMode ? "bg-gradient-to-b from-gray-800 to-gray-900" : "bg-white"
                  } rounded-lg border ${isDarkMode ? "border-yellow-400" : "border-yellow-400"} overflow-hidden flex flex-col shadow-lg transition-all duration-300 z-40 ${
                    isSidebarOpen ? "left-0 sm:left-auto" : "-left-full sm:left-auto"
                  }`}
                >
                  {/* Tab buttons */}
                  <div className="flex gap-1 p-2 border-b border-gray-700">
                    <button
                      onClick={() => {
                        setChatMode('clients');
                        setSelectedId(null);
                      }}
                      className={`flex-1 px-2 py-1.5 rounded text-xs font-semibold transition-all relative ${
                        chatMode === 'clients'
                          ? isDarkMode ? "bg-yellow-600 text-yellow-100" : "bg-yellow-500 text-white"
                          : isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      Clients
                      {clientUnreadCount > 0 && (
                        <span className="ml-1 inline-block bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                          {clientUnreadCount}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setChatMode('managers');
                        setSelectedId(null);
                      }}
                      className={`flex-1 px-2 py-1.5 rounded text-xs font-semibold transition-all relative ${
                        chatMode === 'managers'
                          ? isDarkMode ? "bg-purple-600 text-purple-100" : "bg-purple-500 text-white"
                          : isDarkMode ? "bg-gray-700 text-gray-300" : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      Managers
                      {managerUnreadCount > 0 && (
                        <span className="ml-1 inline-block bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full font-bold">
                          {managerUnreadCount}
                        </span>
                      )}
                    </button>
                  </div>

                  {/* Contact list header */}
                  <div className={`px-3 py-3 font-bold text-sm border-b ${
                    chatMode === 'clients'
                      ? isDarkMode ? "bg-yellow-600 text-yellow-100 border-yellow-500" : "bg-yellow-500 text-white border-yellow-400"
                      : isDarkMode ? "bg-purple-600 text-purple-100 border-purple-500" : "bg-purple-500 text-white border-purple-400"
                  }`}>
                    {chatMode === 'clients' ? `Clients (${clients.length})` : `Managers (${managers.length})`}
                  </div>

                  {/* Contact list */}
                  <div className="flex-1 overflow-y-auto">
                    {contactList.length === 0 ? (
                      <div className={`text-xs ${isDarkMode ? "text-gray-500" : "text-gray-600"} p-2 text-center`}>
                        No {chatMode} yet
                      </div>
                    ) : (
                      contactList.map((contact) => (
                        <button
                          key={contact.id}
                          onClick={() => {
                            setSelectedId(contact.id);
                            setIsSidebarOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 text-xs border-b transition-all flex items-center justify-between ${
                            isDarkMode ? "border-gray-700" : chatMode === 'clients' ? "border-yellow-200" : "border-purple-200"
                          } ${
                            selectedId === contact.id
                              ? `${
                                  chatMode === 'clients'
                                    ? isDarkMode ? "bg-yellow-500 text-white" : "bg-yellow-400 text-gray-900"
                                    : isDarkMode ? "bg-purple-500 text-white" : "bg-purple-400 text-white"
                                } font-semibold shadow-md`
                              : `${
                                  isDarkMode
                                    ? "bg-gray-700/50 text-gray-200 hover:bg-gray-600/70"
                                    : "bg-white/60 text-gray-700 hover:bg-gray-100"
                                }`
                          }`}
                        >
                          <div className="truncate font-medium">{contact.name}</div>
                          {unreadCounts[contact.id] > 0 && (
                            <span className={`ml-2 px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                              isDarkMode ? "bg-red-600 text-white" : "bg-red-500 text-white"
                            }`}>
                              {unreadCounts[contact.id] > 99 ? "99+" : unreadCounts[contact.id]}
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                </div>

                {/* Overlay for mobile */}
                {isSidebarOpen && (
                  <div
                    className="sm:hidden absolute inset-0 bg-black/50 z-30 rounded-lg"
                    onClick={() => setIsSidebarOpen(false)}
                  />
                )}

                {/* Message area */}
                <div className="flex-1 flex flex-col border rounded-lg border-gray-700 overflow-hidden">
                  {selectedId ? (
                    <>
                      {/* Contact header */}
                      <div
                        className={`px-3 py-2 border-b ${
                          isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
                        } text-sm font-medium`}
                      >
                        <div className="flex flex-col">
                          <span className={`${chatMode === 'clients' ? isDarkMode ? "text-yellow-300" : "text-yellow-500" : isDarkMode ? "text-purple-300" : "text-purple-500"}`}>
                            {selectedContact?.name}
                          </span>
                          <span className={`text-xs ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>
                            {selectedContact?.email}
                          </span>
                        </div>
                      </div>

                      {/* Messages */}
                      <div
                        ref={messagesContainerRef}
                        onScroll={handleScroll}
                        className="flex-1 px-3 py-2 overflow-y-auto space-y-2"
                      >
                        {currentMessages.length === 0 ? (
                          <div className={`${isDarkMode ? "text-gray-500" : "text-gray-400"} text-sm text-center py-8`}>
                            No messages yet
                          </div>
                        ) : (
                          currentMessages.map((msg) => {
                            const isAdminMsg = msg.sender_type === 'admin';
                            const bgColor = isAdminMsg 
                              ? "bg-yellow-400 text-black"
                              : chatMode === 'clients'
                              ? isDarkMode ? "bg-gray-800 text-white" : "bg-gray-200 text-black"
                              : isDarkMode ? "bg-purple-900 text-white" : "bg-purple-100 text-black";
                            
                            return (
                              <div key={msg.id} className={`flex ${isAdminMsg ? "justify-end" : "justify-start"} group message-slide`}>
                                <div className="flex items-end gap-2 max-w-xs">
                                  {/* Sender avatar */}
                                  {!isAdminMsg && (
                                    msg.sender_profile_pic ? (
                                      <img
                                        src={`/media/${msg.sender_profile_pic}`}
                                        alt="Sender"
                                        className="avatar-fade w-6 h-6 rounded-full flex-shrink-0 object-cover"
                                      />
                                    ) : (
                                      <div className={`avatar-fade w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                                        chatMode === 'clients' ? (isDarkMode ? "bg-yellow-500" : "bg-yellow-400") : (isDarkMode ? "bg-purple-600" : "bg-purple-400")
                                      }`}>
                                        {getInitials(msg.sender_name)}
                                      </div>
                                    )
                                  )}

                                  {/* Message content */}
                                  <div className="flex flex-col gap-1">
                                    {msg.admin_sender_name && (
                                      <div className={`text-xs font-semibold ${chatMode === 'clients' ? isDarkMode ? "text-yellow-400" : "text-yellow-600" : isDarkMode ? "text-blue-400" : "text-blue-600"} px-1`}>
                                        {msg.admin_sender_name}
                                      </div>
                                    )}
                                    
                                    {msg.image_url && (
                                      <img
                                        src={msg.image_url}
                                        alt="Attachment"
                                        className="max-w-sm max-h-40 rounded-lg mb-2 cursor-pointer hover:opacity-80"
                                      />
                                    )}
                                    
                                    <div className={`px-3 py-2 rounded-lg text-xs break-words relative group/message transition-all ${bgColor} ${isAdminMsg ? "rounded-br-none" : "rounded-bl-none"}`}>
                                      {msg.message}
                                      <button
                                        onClick={() => handleDeleteMessage(msg.id)}
                                        className="absolute -top-8 right-0 opacity-0 group-hover/message:opacity-100 transition-opacity p-1 hover:bg-red-500 hover:text-white rounded"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                    
                                    <div className="flex items-center gap-1">
                                      <span className={`text-[10px] ${isDarkMode ? "text-gray-500" : "text-gray-500"} px-1`}>
                                        {msg.timestamp && new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                      {isAdminMsg && (
                                        <div className={`flex -space-x-1 ml-1 ${msg.is_read ? "text-blue-500" : "text-gray-400"}`}>
                                          <Check className="w-3 h-3" />
                                          {msg.is_read && <Check className="w-3 h-3" />}
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Admin avatar */}
                                  {isAdminMsg && (
                                    adminProfiles[msg.sender_id] ? (
                                      <img
                                        src={`/media/${adminProfiles[msg.sender_id]}`}
                                        alt="Admin"
                                        className="avatar-fade w-8 h-8 rounded-full flex-shrink-0 object-cover"
                                      />
                                    ) : (
                                      <div className={`avatar-fade w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${isDarkMode ? "bg-yellow-500" : "bg-yellow-400"}`}>
                                        {getInitials(msg.admin_sender_name || "AD")}
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Input area */}
                      <div
                        className={`p-4 border-t ${isDarkMode ? "border-gray-700 bg-gray-900/50" : "border-gray-300 bg-gray-50"} space-y-2`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        {isDragging && (
                          <div className={`absolute inset-0 rounded-lg pointer-events-none transition-all ${isDarkMode ? "bg-yellow-500/10 border-2 border-yellow-400" : "bg-yellow-400/10 border-2 border-yellow-500"}`} />
                        )}
                        
                        {imagePreview && (
                          <div className="relative inline-block">
                            <img src={imagePreview} alt="Preview" className="max-h-32 rounded-lg" />
                            <button
                              onClick={clearImage}
                              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}

                        <div className="flex items-end gap-2">
                          <input
                            type="file"
                            id="image-upload"
                            accept="image/*"
                            onChange={handleImageSelect}
                            className="hidden"
                          />
                          
                          <button
                            onClick={() => document.getElementById('image-upload')?.click()}
                            disabled={loading}
                            className={`p-3 rounded-2xl transition-all ${isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-200 hover:bg-gray-300 text-gray-700"} disabled:opacity-50`}
                          >
                            <ImagePlus className="w-5 h-5" />
                          </button>

                          <div className="relative">
                            <button
                              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                              disabled={loading}
                              className={`p-3 rounded-2xl transition-all ${isDarkMode ? "bg-gray-700 hover:bg-gray-600 text-gray-300" : "bg-gray-200 hover:bg-gray-300 text-gray-700"} disabled:opacity-50`}
                            >
                              <Smile className="w-5 h-5" />
                            </button>
                            
                            {showEmojiPicker && (
                              <div className="absolute bottom-14 left-0 z-50">
                                <EmojiPicker onEmojiSelect={handleEmojiSelect} isDarkMode={isDarkMode} onClose={() => setShowEmojiPicker(false)} />
                              </div>
                            )}
                          </div>

                          <div className="flex-1">
                            <input
                              type="text"
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && handleSend()}
                              onPaste={handlePaste}
                              placeholder="Type a message..."
                              disabled={loading}
                              className={`w-full px-4 py-3 rounded-2xl text-sm transition-all ${
                                isDarkMode ? "bg-gray-800 text-white border-gray-700 focus:border-yellow-400" : "bg-white text-black border-gray-200 focus:border-yellow-400"
                              } border-2 focus:outline-none disabled:opacity-50`}
                            />
                          </div>
                          
                          <button
                            onClick={handleSend}
                            disabled={(!input.trim() && !selectedImage) || loading}
                            className={`p-3 rounded-2xl font-semibold transition-all ${
                              (input.trim() || selectedImage) && !loading
                                ? `${isDarkMode ? "bg-yellow-500 hover:bg-yellow-600" : "bg-yellow-400 hover:bg-yellow-500"} text-black`
                                : isDarkMode ? "bg-gray-700 text-gray-400" : "bg-gray-200 text-gray-400"
                            } disabled:opacity-50`}
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className={`flex-1 flex items-center justify-center ${isDarkMode ? "text-gray-500" : "text-gray-400"}`}>
                      Select a {chatMode === 'clients' ? 'client' : 'manager'} to chat
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default ChatBot;
