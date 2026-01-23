import { useState, useEffect, useRef } from "react";
import { X, MessageCircle, Send, AlertCircle, RefreshCw, Trash2, Menu, ImagePlus, Smile } from "lucide-react";
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
  const [adminProfiles, setAdminProfiles] = useState({}); // Store admin profile pictures
  const [selectedImage, setSelectedImage] = useState(null); // Store selected image file
  const [imagePreview, setImagePreview] = useState(null); // Preview URL for selected image
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // Toggle emoji picker visibility
  const [isDragging, setIsDragging] = useState(false); // Track drag and drop state
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const previousMessageCountRef = useRef(0);
  const isInitialLoadRef = useRef(true);
  const messageCountWhenOpenedRef = useRef(0);
  const clientsAbortControllerRef = useRef(null);
  const messagesAbortControllerRef = useRef(null);
  const lastClientsCountRef = useRef(0);
  const lastMessagesHashRef = useRef({});
  const originalTitleRef = useRef('');
  const originalFaviconRef = useRef(null);
  const prevMessagesRef = useRef({});
  const audioCtxRef = useRef(null);

  // Ensure an AudioContext is created/resumed on first user interaction (browsers block autoplay)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onFirstInteract = () => {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        if (!audioCtxRef.current) {
          audioCtxRef.current = new AudioContext();
        }
        if (audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume().catch(() => {});
        }
      } catch (e) {
        // ignore
      }
      window.removeEventListener('pointerdown', onFirstInteract);
    };

    window.addEventListener('pointerdown', onFirstInteract, { once: true });
    return () => window.removeEventListener('pointerdown', onFirstInteract);
  }, []);

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
          } catch  {
            //console.debug("Could not parse user cookie");
          }
        }
        
        // Try to get user role from a separate role cookie
        const role = getCookie("userRole") || getCookie("user_role");
        if (role) {
          setUserRole(role);
        }
      } catch (err) {
        //console.error("Error getting user role:", err);
      }
    };
    
    getUserRole();
  }, []);

  // Update badge count from clientUnreadCounts (works in background)
  useEffect(() => {
    if (!isOpen) {
      // Chat is closed - calculate total unread from all clients
      const totalUnread = Object.values(clientUnreadCounts).reduce((sum, count) => sum + count, 0);
      if (totalUnread > 0) {
        setUnreadCount(totalUnread);
        setHasUnreadMessages(true);
      } else {
        setUnreadCount(0);
        setHasUnreadMessages(false);
      }
    } else {
      // Chat is open - clear badge
      setUnreadCount(0);
    }
  }, [clientUnreadCounts, isOpen]);

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
          //console.error("Error marking messages as read:", err);
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

  // Load clients list ALWAYS in background (polling independent of chat being open)
  useEffect(() => {
    // Only poll if user is admin, not manager
    if (userRole && userRole.toLowerCase() === 'manager') {
      return; // Skip polling for managers
    }
    
    // Start polling immediately
    loadClients();
    // Poll clients every 30 seconds continuously for background unread count updates
    const interval = setInterval(loadClients, 3000);
    return () => clearInterval(interval);
  }, [userRole]);

  // Load messages for selected client - reduced to 15s polling for background
  useEffect(() => {
    if (selectedClientId && userRole && userRole.toLowerCase() !== 'manager') {
      loadMessagesForClient(selectedClientId);
      // Poll messages every 15 seconds for smooth updates with less network usage
      const interval = setInterval(() => loadMessagesForClient(selectedClientId), 15000);
      return () => clearInterval(interval);
    }
  }, [selectedClientId, userRole]);

  // Cleanup: Abort all pending requests on component unmount
  useEffect(() => {
    return () => {
      if (clientsAbortControllerRef.current) {
        clientsAbortControllerRef.current.abort();
      }
      if (messagesAbortControllerRef.current) {
        messagesAbortControllerRef.current.abort();
      }
    };
  }, []);

  // Helper: Simple hash to detect changes
  const getDataHash = (data) => {
    return JSON.stringify(data).length + Object.keys(data || {}).length;
  };

  const loadClients = async () => {
    try {
      // Cancel previous request if still pending
      if (clientsAbortControllerRef.current) {
        clientsAbortControllerRef.current.abort();
      }
      
      // Create new abort controller with 10 second timeout
      clientsAbortControllerRef.current = new AbortController();
      const timeoutId = setTimeout(() => clientsAbortControllerRef.current.abort(), 10000);
      
      const response = await fetch("/api/chat/admin/messages/", {
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
        },
        signal: clientsAbortControllerRef.current.signal,
      });

      clearTimeout(timeoutId);
      
      // Handle 401/403 - Stop polling if unauthorized
      if (response.status === 401 || response.status === 403) {
        setError("Unauthorized - Session expired. Please refresh.");
        return; // Stop polling on auth error
      }
      
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

      // Always update unread counts (even if client list didn't change)
      setClientUnreadCounts((prev) => {
        const updated = { ...prev, ...unreadCounts };
        // Don't update count for currently selected client (it's being actively viewed)
        if (selectedClientId) {
          updated[selectedClientId] = 0;
        }
        return updated;
      });

      // Check if client list changed to avoid unnecessary re-renders
      const clientListHash = getDataHash(uniqueClients);
      if (clientListHash === lastClientsCountRef.current) {
        // No changes in client list, skip further updates
        setError(null);
        return;
      }
      lastClientsCountRef.current = clientListHash;

      setClients(Object.values(uniqueClients));
      
      // Load admin profiles from the messages (only if clients changed)
      const adminIds = new Set();
      data.messages.forEach((msg) => {
        if (msg.sender_type === "admin") {
          adminIds.add(msg.sender);
        }
      });
      
      // Fetch admin profile pictures in background (non-blocking)
      if (adminIds.size > 0) {
        try {
          const adminResponse = await fetch("/api/chat/admin/profiles/?ids=" + Array.from(adminIds).join(","), {
            headers: {
              "X-CSRFToken": getCookie("csrftoken"),
            },
          });
          if (adminResponse.ok) {
            const adminData = await adminResponse.json();
            const profiles = {};
            adminData.profiles.forEach((admin) => {
              profiles[admin.id] = admin.profile_pic || null;
            });
            setAdminProfiles(profiles);
          }
        } catch (err) {
          // Silently fail for profile loading - doesn't block chat
          console.debug("Admin profiles failed to load, will retry");
        }
      }
      
      setError(null);
    } catch (err) {
      // Silently fail - don't show errors for background polling
      if (err.name !== "AbortError") {
        console.debug("Background polling: clients load failed, will retry");
      }
    }
  };

  const loadMessagesForClient = async (clientId) => {
    try {
      // Cancel previous request if still pending
      if (messagesAbortControllerRef.current) {
        messagesAbortControllerRef.current.abort();
      }
      
      // Create new abort controller with 10 second timeout
      messagesAbortControllerRef.current = new AbortController();
      const timeoutId = setTimeout(() => messagesAbortControllerRef.current.abort(), 10000);
      
      const response = await fetch(`/api/chat/admin/messages/?user_id=${clientId}`, {
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
        },
        signal: messagesAbortControllerRef.current.signal,
      });

      clearTimeout(timeoutId);
      
      // Handle 401/403 - Stop polling if unauthorized
      if (response.status === 401 || response.status === 403) {
        console.debug(`Messages poll: Unauthorized for client ${clientId}, stopping polling`);
        setError("Unauthorized - Session expired. Please refresh.");
        return; // Stop polling on auth error
      }
      
      if (!response.ok) {
        console.debug(`Messages poll: Failed for client ${clientId}`);
        throw new Error("Failed to load messages");
      }

      const data = await response.json();
      
      const newMessages = data.messages.map((msg) => ({
        id: msg.id,
        message: msg.message,
        sender: msg.sender_type === "admin" ? "admin" : "user",
        sender_name: msg.sender_name || "User",
        sender_id: msg.sender,
        sender_profile_pic: msg.sender_profile_pic || null,
        image_url: msg.image_url || null,
        admin_sender_name: msg.admin_sender_name || null,
        timestamp: msg.timestamp,
        is_read: msg.is_read,
      }));
      
      // Check if messages changed to avoid unnecessary re-renders
      const messagesHash = getDataHash(newMessages);
      if (messagesHash === (lastMessagesHashRef.current[clientId] || 0)) {
        // No changes in messages, skip update
        return;
      }
      lastMessagesHashRef.current[clientId] = messagesHash;
      
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
      // Silently fail for background polling - will retry on next interval
      if (err.name !== "AbortError") {
        console.debug(`Background polling: Messages failed for client ${clientId}, will retry`);
      }
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji) => {
    setInput(input + emoji);
    setShowEmojiPicker(false);
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedImage) || loading || !selectedClientId) return;

    const messageText = input;
    setInput("");
    setLoading(true);
    setError(null);

    try {
      // Use FormData to support file upload
      const formData = new FormData();
      formData.append("message", messageText);
      formData.append("recipient_id", selectedClientId);
      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      const response = await fetch("/api/chat/admin/send/", {
        method: "POST",
        headers: {
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to send message");

      // Clear image after sending
      setSelectedImage(null);
      setImagePreview(null);

      // Reload messages
      await loadMessagesForClient(selectedClientId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle image selection
  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result);
      };
      reader.readAsDataURL(file);
    } else {
      setError('Please select a valid image file');
    }
  };

  // Clear selected image
  const clearImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };

  // Handle image paste from clipboard
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          setSelectedImage(file);
          const reader = new FileReader();
          reader.onload = (event) => {
            setImagePreview(event.target?.result);
          };
          reader.readAsDataURL(file);
          setError(null);
        }
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
        reader.onload = (event) => {
          setImagePreview(event.target?.result);
        };
        reader.readAsDataURL(file);
        setError(null);
        break;
      }
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

  // Update browser tab title with unread count when chat is closed
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!originalTitleRef.current) originalTitleRef.current = document.title || '';
    const original = originalTitleRef.current;

    // Use the `unreadCount` state which reflects badge count when chat is closed
    if (!isOpen && unreadCount > 0) {
      const display = unreadCount > 99 ? '99+' : unreadCount;
      document.title = `(${display}) ${original}`;
    } else {
      document.title = original;
    }

    return () => {
      document.title = original;
    };
  }, [unreadCount, isOpen]);

  // Update favicon with unread badge when chat is closed, restore original otherwise
  useEffect(() => {
    if (typeof document === 'undefined') return;

    // Ensure we store the original favicon href once
    if (originalFaviconRef.current === null) {
      const link = document.querySelector('link[rel~="icon"]') || document.querySelector('link[rel="shortcut icon"]');
      originalFaviconRef.current = link ? link.href : '';
    }

    const setFaviconHref = (href) => {
      let link = document.querySelector('link[rel~="icon"]') || document.querySelector('link[rel="shortcut icon"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = href || '';
    };

    const restoreOriginal = () => setFaviconHref(originalFaviconRef.current);

    // Show badge only when chat is closed and there are unread messages
    if (!isOpen && unreadCount > 0) {
      const count = unreadCount > 99 ? '99+' : String(unreadCount);
      const size = 64; // canvas size (draw larger for better resolution)
      const ratio = window.devicePixelRatio || 1;
      const canvas = document.createElement('canvas');
      canvas.width = size * ratio;
      canvas.height = size * ratio;
      const ctx = canvas.getContext('2d');
      ctx.scale(ratio, ratio);

      const drawBadge = (baseDrawn = false) => {
        if (!baseDrawn) {
          // clear area in case
          ctx.clearRect(0, 0, size, size);
          // draw transparent background
          ctx.fillStyle = '#ffffff00';
          ctx.fillRect(0, 0, size, size);
        }

        // Draw red badge circle
        const r = 12;
        const cx = size - r - 4;
        const cy = r + 4;
        ctx.beginPath();
        ctx.fillStyle = '#ff3b30';
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.fill();

        // Draw count text
        ctx.font = 'bold 14px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(count, cx, cy + 1);

        // Update favicon
        try {
          const dataUrl = canvas.toDataURL('image/png');
          setFaviconHref(dataUrl);
        } catch (e) {
          // fallback: restore original
          restoreOriginal();
        }
      };

      // Try to draw the existing favicon as base
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          // draw image scaled to canvas size
          ctx.clearRect(0, 0, size, size);
          ctx.drawImage(img, 0, 0, size, size);
        } catch (e) {
          ctx.clearRect(0, 0, size, size);
        }
        drawBadge(true);
      };
      img.onerror = () => {
        // If original couldn't be used, just draw badge on transparent background
        drawBadge(false);
      };

      // Start loading original favicon (or fallback to /favicon.ico)
      img.src = originalFaviconRef.current || '/favicon.ico';

      // cleanup: restore original on unmount
      return () => {
        restoreOriginal();
      };
    }

    // If there are no unread messages or chat open, restore original favicon
    restoreOriginal();

    return () => {
      restoreOriginal();
    };
  }, [unreadCount, isOpen]);

  // Play a short notification tone for every new incoming user message
  const playNotificationTone = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = audioCtxRef.current || new AudioContext();
      audioCtxRef.current = ctx;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const duration = 0.14; // seconds
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
      // cleanup oscillator after stop
      osc.onended = () => {
        try { osc.disconnect(); gain.disconnect(); } catch (e) {}
      };
    } catch (e) {
      // ignore audio errors
    }
  };

  useEffect(() => {
    // Skip during server-side rendering
    if (typeof window === 'undefined') return;

    // Avoid playing sounds on initial load
    if (isInitialLoadRef.current) {
      prevMessagesRef.current = { ...messages };
      return;
    }

    // For each client, detect newly appended messages
    Object.keys(messages).forEach((clientId) => {
      const prevList = prevMessagesRef.current[clientId] || [];
      const currList = messages[clientId] || [];
      if (currList.length > prevList.length) {
        const newMsgs = currList.slice(prevList.length);
        newMsgs.forEach((m) => {
          // Play tone only for incoming user messages
          if (m.sender === 'user') {
            playNotificationTone();
          }
        });
      }
    });

    // Update prevMessagesRef for next comparison
    prevMessagesRef.current = Object.keys(messages).reduce((acc, k) => {
      acc[k] = (messages[k] || []).slice();
      return acc;
    }, {});
  }, [messages]);

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
          <>
            {/* Backdrop overlay - click to close */}
            <div
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div
              className={`chatbox-enter mt-3 w-full sm:w-[900px] h-[600px] max-w-sm sm:max-w-none ${
                isDarkMode ? "bg-black border-gray-700" : "bg-white border-gray-300"
              } border rounded-xl shadow-lg flex flex-col overflow-hidden relative z-50`}
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
                  isDarkMode ? "bg-gradient-to-b from-gray-800 to-gray-900" : "bg-white"
                } rounded-lg border ${isDarkMode ? "border-yellow-400" : "border-yellow-400"} overflow-hidden flex flex-col shadow-lg transition-all duration-300 z-40 ${
                  isSidebarOpen ? "left-0 sm:left-auto" : "-left-full sm:left-auto"
                }`}
              >
                <div className={`px-3 py-3 font-bold text-sm border-b ${
                  isDarkMode ? "bg-yellow-600 text-yellow-100 border-yellow-500" : "bg-yellow-500 text-white border-yellow-400"
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
                          isDarkMode ? "border-gray-700" : "border-yellow-200"
                        } ${
                          selectedClientId === client.id
                            ? `${
                                isDarkMode
                                  ? "bg-yellow-500 text-white font-semibold shadow-md"
                                  : "bg-yellow-400 text-gray-900 font-semibold shadow-md"
                              }`
                            : `${
                                isDarkMode
                                  ? "bg-gray-700/50 text-gray-200 hover:bg-yellow-500/60 hover:text-white hover:shadow-md"
                                  : "bg-white/60 text-gray-700 hover:bg-yellow-200 hover:text-gray-900 hover:shadow-md"
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
                        isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"
                      } text-sm font-medium`}
                    >
                      <div className="flex flex-col">
                        <span className={`${isDarkMode ? "text-yellow-300" : "text-yellow-500"}`}>{clients.find((c) => c.id === selectedClientId)?.name}</span>
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
                                msg.sender_profile_pic ? (
                                  <img
                                    src={`/media/${msg.sender_profile_pic}`}
                                    alt={msg.sender_name || "User"}
                                    className="avatar-fade w-6 h-6 rounded-full flex-shrink-0 object-cover"
                                    title={msg.sender_name || "User"}
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                      const fallback = e.target.nextElementSibling;
                                      if (fallback) fallback.style.display = "flex";
                                    }}
                                  />
                                ) : null
                              )}

                              {/* Fallback Avatar for User Messages with Initials */}
                              {msg.sender === "user" && !msg.sender_profile_pic && (
                                <div
                                  className={`avatar-fade w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                                    isDarkMode ? "bg-yellow-500" : "bg-yellow-400"
                                  }`}
                                >
                                  {getInitials(msg.sender_name)}
                                </div>
                              )}

                              {/* Message Bubble with Admin Name */}
                              <div className="flex flex-col gap-1">
                                {/* Admin sender name - only show for admin messages when admin_sender_name exists */}
                                {msg.sender === "admin" && msg.admin_sender_name && (
                                  <div className={`text-xs font-semibold ${
                                    isDarkMode ? "text-yellow-400" : "text-yellow-600"
                                  } px-1`}>
                                    {msg.admin_sender_name}
                                  </div>
                                )}
                                
                                {/* Image Display if present */}
                                {msg.image_url && (
                                  <img
                                    src={msg.image_url}
                                    alt="Chat attachment"
                                    className="max-w-sm max-h-40 rounded-lg mb-2 cursor-pointer hover:opacity-80 transition-opacity"
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
                              </div>

                              {/* Profile Avatar for Admin Messages */}
                              {msg.sender === "admin" && (
                                adminProfiles[msg.sender_id] ? (
                                  <img
                                    src={`/media/${adminProfiles[msg.sender_id]}`}
                                    alt={msg.admin_sender_name || "Admin"}
                                    className="avatar-fade w-8 h-8 rounded-full flex-shrink-0 object-cover"
                                    title={msg.admin_sender_name || "Admin"}
                                    onError={(e) => {
                                      e.target.style.display = "none";
                                      const fallback = e.target.nextElementSibling;
                                      if (fallback) fallback.style.display = "flex";
                                    }}
                                  />
                                ) : null
                              )}
                              
                              {/* Fallback Avatar with Initials */}
                              {msg.sender === "admin" && !adminProfiles[msg.sender_id] && (
                                <div
                                  className={`avatar-fade w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${
                                    isDarkMode ? "bg-yellow-500" : "bg-yellow-400"
                                  }`}
                                  title={msg.admin_sender_name || "Admin"}
                                >
                                  {msg.admin_sender_name ? getInitials(msg.admin_sender_name) : "AD"}
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
                          id="image-upload"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                        
                        <button
                          onClick={() => document.getElementById('image-upload')?.click()}
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
                          {/* Focus indicator */}
                          <div className={`absolute inset-0 rounded-2xl pointer-events-none transition-all duration-300 ${
                            input ? (isDarkMode ? "shadow-[0_0_12px_rgba(250,204,21,0.2)]" : "shadow-[0_0_12px_rgba(250,204,21,0.15)]") : ""
                          }`} />
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
          </>
        )}
      </div>
    </>
  );
};

export default ChatBot;