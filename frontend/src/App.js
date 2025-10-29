import React, { useState, useEffect } from 'react';
import { authService } from './services/authService';
import { threadService } from './services/threadService';
import { commentService } from './services/commentService';

function App() {
  // Core state
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [view, setView] = useState('home'); // home, thread, communities, profile, settings, community-chat
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  
  // Content state
  const [selectedThread, setSelectedThread] = useState(null);
  const [threads, setThreads] = useState([]);
  const [comments, setComments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  
  // Communities state
  const [communities, setCommunities] = useState([]);
  const [selectedCommunity, setSelectedCommunity] = useState(null);
  const [communityMessages, setCommunityMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  // Modal states
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showNewThread, setShowNewThread] = useState(false);
  const [showNewCommunity, setShowNewCommunity] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  
  // Form states
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '' });
  const [newThreadData, setNewThreadData] = useState({
    title: '',
    content: '',
    category: 'General',
    tags: [],
    anonymous: false,
    image: null
  });
  const [newCommunityData, setNewCommunityData] = useState({
    name: '',
    description: '',
    category: 'General',
    isPrivate: false
  });
  const [profileData, setProfileData] = useState({
    name: '',
    bio: '',
    age: '',
    dob: '',
    location: '',
    interests: '',
    profileImage: null
  });
  const [newComment, setNewComment] = useState('');
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);

  const categories = ['All', 'General', 'Anxiety', 'Depression', 'Stress', 'Relationships', 'Self-Care', 'Students', 'Work', 'Grief', 'Trauma'];

  // LocalStorage helper functions
const saveToLocalStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

const loadFromLocalStorage = (key, defaultValue = []) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
};

  // Theme effect
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Notification helper
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 3000);
  };

  // Check existing session
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      try {
        const userData = JSON.parse(user);
        setCurrentUser(userData);
        setIsLoggedIn(true);
        setProfileData({
          name: userData.name || '',
          bio: userData.bio || '',
          age: userData.age || '',
          dob: userData.dob || '',
          location: userData.location || '',
          interests: userData.interests || '',
          profileImage: userData.profileImage || null
        });
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Load all data from localStorage on app start
useEffect(() => {
  if (view === 'home') {
    loadThreads();
  }
}, []);
// Load threads
const loadThreads = async () => {
  try {
    setLoading(true);
    const params = {};
    
    if (filter !== 'all') {
      const categoryName = filter.charAt(0).toUpperCase() + filter.slice(1);
      params.category = categoryName;
    }
    
    const data = await threadService.getThreads(params);
    setThreads(data.threads || []);
  } catch (error) {
    console.error('Error loading threads:', error);
    showNotification('Failed to load discussions', 'error');
  } finally {
    setLoading(false);
  }
};

// Load communities
const loadCommunities = async () => {
  try {
    // For now, keep mock data until you add community endpoints to backend
    const mockCommunities = loadFromLocalStorage('communities', []);
    setCommunities(mockCommunities);
  } catch (error) {
    console.error('Error loading communities:', error);
    showNotification('Failed to load communities', 'error');
  }
};



  // Authentication handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      showNotification('Please fill in all fields', 'error');
      return;
    }
    
    try {
      setLoading(true);
      const data = await authService.login(loginData.email, loginData.password);
      setCurrentUser(data.user);
      setIsLoggedIn(true);
      setShowLoginModal(false);
      setLoginData({ email: '', password: '' });
      showNotification('Welcome back! 🎉');
      loadThreads();
    } catch (error) {
      showNotification(error.response?.data?.error || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

const handleGoogleLogin = () => {
  // Mock Google login for demo purposes
  const mockGoogleUser = {
    _id: 'google_' + Date.now(),
    name: 'Google User',
    email: 'user@gmail.com',
    profileImage: null
  };
  
  setCurrentUser(mockGoogleUser);
  setIsLoggedIn(true);
  setShowLoginModal(false);
  setShowRegisterModal(false);
  localStorage.setItem('user', JSON.stringify(mockGoogleUser));
  localStorage.setItem('token', 'mock_google_token_' + Date.now());
  showNotification('Signed in with Google! 🎉');
};

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerData.name || !registerData.email || !registerData.password) {
      showNotification('Please fill in all fields', 'error');
      return;
    }
    
    if (registerData.password.length < 6) {
      showNotification('Password must be at least 6 characters', 'error');
      return;
    }
    
    try {
      setLoading(true);
      const data = await authService.register(registerData.name, registerData.email, registerData.password);
      setCurrentUser(data.user);
      setIsLoggedIn(true);
      setShowRegisterModal(false);
      setRegisterData({ name: '', email: '', password: '' });
      showNotification('Welcome to MindSpace! 🌸');
    } catch (error) {
      showNotification(error.response?.data?.error || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setIsLoggedIn(false);
    setView('home');
    showNotification('Logged out successfully! 👋');
  };

  // Image upload handler
const handleImageUpload = (e, type) => {
  const file = e.target.files[0];
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      showNotification('Image must be less than 5MB', 'error');
      return;
    }
    
    if (type === 'thread') {
      // Store both the preview and the actual file
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewThreadData({ 
          ...newThreadData, 
          image: reader.result, // For preview
          imageFile: file // For upload
        });
      };
      reader.readAsDataURL(file);
    } else if (type === 'profile') {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData({ ...profileData, profileImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  }
};

  // Audio recording handlers
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      showNotification('Microphone access denied', 'error');
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Just now';
    
    try {
      const now = new Date();
      const then = new Date(date);
      const diff = now - then;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);
      
      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      return then.toLocaleDateString();
    } catch (error) {
      return 'Recently';
    }
  };
// Thread handlers
const handleCreateThread = async (e) => {
  e.preventDefault();
  if (!newThreadData.title || !newThreadData.content) {
    showNotification('Please fill in all fields', 'error');
    return;
  }
  
  try {
    setLoading(true);
    const threadPayload = {
      title: newThreadData.title,
      content: newThreadData.content,
      category: newThreadData.category,
      tags: newThreadData.tags,
      isAnonymous: newThreadData.anonymous
    };
    
    if (newThreadData.image) {
      threadPayload.image = newThreadData.image;
    }
    
    await threadService.createThread(threadPayload);
    setShowNewThread(false);
    setNewThreadData({ 
      title: '', 
      content: '', 
      category: 'General', 
      tags: [], 
      anonymous: false,
      image: null 
    });
    showNotification('Discussion posted! 💬');
    loadThreads();
  } catch (error) {
    showNotification(error.response?.data?.error || 'Failed to create discussion', 'error');
  } finally {
    setLoading(false);
  }
};

const openThread = async (thread) => {
  setSelectedThread(thread);
  setView('thread');
  
  try {
    setLoading(true);
    const data = await threadService.getThread(thread._id);
    setSelectedThread(data.thread);
    setComments(data.comments || []);
  } catch (error) {
    showNotification('Failed to load thread details', 'error');
  } finally {
    setLoading(false);
  }
};

const handleLikeThread = async (threadId, event) => {
  if (event) event.stopPropagation();
  
  if (!isLoggedIn) {
    showNotification('Please login to like posts', 'error');
    setShowLoginModal(true);
    return;
  }
  
  try {
    await threadService.likeThread(threadId);
    
    // Update local state optimistically
    setThreads(threads.map(t => {
      if (t._id === threadId) {
        const isLiked = t.isLiked;
        return {
          ...t,
          likeCount: isLiked ? (t.likeCount - 1) : (t.likeCount || 0) + 1,
          isLiked: !isLiked
        };
      }
      return t;
    }));
    
    if (view === 'thread' && selectedThread?._id === threadId) {
      const data = await threadService.getThread(threadId);
      setSelectedThread(data.thread);
    }
  } catch (error) {
    showNotification('Failed to like post', 'error');
  }
};
    
    if (view === 'thread' && selectedThread?._id === threadId) {
      const data = await threadService.getThread(threadId);
      setSelectedThread(data.thread);
    }
  } catch (error) {
    showNotification('Failed to like post', 'error');
  }
};
    
    saveToLocalStorage('threads', updatedThreads);
    
    // Update local state
    setThreads(updatedThreads.filter(t => {
      if (filter === 'all') return true;
      const categoryName = filter.charAt(0).toUpperCase() + filter.slice(1);
      return t.category.toLowerCase() === categoryName.toLowerCase();
    }));
    
    // Update selected thread if viewing thread detail
    if (view === 'thread' && selectedThread?._id === threadId) {
      const updatedThread = updatedThreads.find(t => t._id === threadId);
      setSelectedThread(updatedThread);
    }
  } catch (error) {
    console.error('Error liking thread:', error);
    showNotification('Failed to like post', 'error');
  }
};
 const handleComment = async (e) => {
  e.preventDefault();
  if (!newComment.trim()) {
    showNotification('Please write a comment', 'error');
    return;
  }
  
  try {
    setLoading(true);
    await commentService.createComment(selectedThread._id, newComment);
    setNewComment('');
    showNotification('Comment posted! 💬');
    
    const data = await threadService.getThread(selectedThread._id);
    setComments(data.comments || []);
    setSelectedThread(data.thread);
  } catch (error) {
    showNotification(error.response?.data?.error || 'Failed to post comment', 'error');
  } finally {
    setLoading(false);
  }
};
    
    // Save comment
    const threadComments = loadFromLocalStorage(`comments_${selectedThread._id}`, []);
    const updatedComments = [...threadComments, newCommentObj];
    saveToLocalStorage(`comments_${selectedThread._id}`, updatedComments);
    
    // Update thread reply count
    const allThreads = loadFromLocalStorage('threads', []);
    const updatedThreads = allThreads.map(t => 
      t._id === selectedThread._id 
        ? { ...t, replyCount: (t.replyCount || 0) + 1 }
        : t
    );
    saveToLocalStorage('threads', updatedThreads);
    
    setNewComment('');
    setComments(updatedComments);
    setSelectedThread({ ...selectedThread, replyCount: (selectedThread.replyCount || 0) + 1 });
    showNotification('Comment posted! 💬');
  } catch (error) {
    console.error('Error posting comment:', error);
    showNotification('Failed to post comment', 'error');
  } finally {
    setLoading(false);
  }
};

const handleDeleteThread = async (threadId) => {
  if (!window.confirm('Are you sure you want to delete this thread? This action cannot be undone.')) {
    return;
  }
  
  try {
    setLoading(true);
    await threadService.deleteThread(threadId);
    showNotification('Thread deleted successfully! 🗑️');
    setView('home');
    loadThreads();
  } catch (error) {
    console.error('Delete thread error:', error);
    showNotification('Failed to delete thread', 'error');
  } finally {
    setLoading(false);
  }
};

const handleDeleteComment = async (commentId) => {
  if (!window.confirm('Delete this comment?')) {
    return;
  }
  
  try {
    await commentService.deleteComment(commentId);
    showNotification('Comment deleted');
    const data = await threadService.getThread(selectedThread._id);
    setComments(data.comments || []);
    setSelectedThread(data.thread);
  } catch (error) {
    showNotification('Failed to delete comment', 'error');
  }
};
    saveToLocalStorage('threads', updatedThreads);
    
    setComments(updatedComments);
    setSelectedThread({ ...selectedThread, replyCount: Math.max(0, (selectedThread.replyCount || 0) - 1) });
    showNotification('Comment deleted');
  } catch (error) {
    console.error('Error deleting comment:', error);
    showNotification('Failed to delete comment', 'error');
  }
};

// Community handlers
const handleCreateCommunity = (e) => {
  e.preventDefault();
  if (!newCommunityData.name || !newCommunityData.description) {
    showNotification('Please fill in all fields', 'error');
    return;
  }
  
  try {
    const newCommunity = {
      _id: Date.now().toString(),
      name: newCommunityData.name,
      description: newCommunityData.description,
      category: newCommunityData.category,
      isPrivate: newCommunityData.isPrivate,
      members: 1,
      messages: []
    };
    
    const allCommunities = loadFromLocalStorage('communities', []);
    const updatedCommunities = [...allCommunities, newCommunity];
    saveToLocalStorage('communities', updatedCommunities);
    
    setCommunities(updatedCommunities);
    
    showNotification('Community created! 🎉');
    setShowNewCommunity(false);
    setNewCommunityData({ name: '', description: '', category: 'General', isPrivate: false });
  } catch (error) {
    console.error('Error creating community:', error);
    showNotification('Failed to create community', 'error');
  }
};

const openCommunity = (community) => {
  setSelectedCommunity(community);
  setView('community-chat');
  
  // Load messages for this community
  const messages = loadFromLocalStorage(`community_messages_${community._id}`, []);
  setCommunityMessages(messages);
};

const sendCommunityMessage = (e) => {
  e.preventDefault();
  if (!newMessage.trim() && !audioBlob) return;
  
  const message = {
    _id: Date.now().toString(),
    user: currentUser.name,
    userId: currentUser._id,
    message: newMessage,
    audio: audioBlob ? URL.createObjectURL(audioBlob) : null,
    timestamp: new Date().toISOString()
  };
  
  const messages = loadFromLocalStorage(`community_messages_${selectedCommunity._id}`, []);
  const updatedMessages = [...messages, message];
  saveToLocalStorage(`community_messages_${selectedCommunity._id}`, updatedMessages);
  
  setCommunityMessages(updatedMessages);
  setNewMessage('');
  setAudioBlob(null);
};

const handleUpdateProfile = async (e) => {
  e.preventDefault();
  try {
    showNotification('Profile updated! ✨');
    setShowProfileEdit(false);
    
    const updatedUser = { ...currentUser, ...profileData };
    setCurrentUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  } catch (error) {
    showNotification('Failed to update profile', 'error');
  }
};

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50'}`}>
      {/* Header */}
      <header className={`${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <button 
              onClick={() => { setView('home'); loadThreads(); }} 
              className="flex items-center space-x-3 hover:opacity-80 transition"
            >
              <span className="text-3xl">🌸</span>
              <h1 className={`text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent`}>
                MindSpace
              </h1>
            </button>

            {/* Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              <button 
                onClick={() => { setView('home'); loadThreads(); }}
                className={`${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-purple-600'} transition font-medium`}
              >
                🏠 Home
              </button>
              <button 
                onClick={() => { setView('communities'); loadCommunities(); }}
                className={`${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-purple-600'} transition font-medium`}
              >
                👥 Communities
              </button>
              {isLoggedIn && (
                <button 
                  onClick={() => setView('profile')}
                  className={`${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-purple-600'} transition font-medium`}
                >
                  👤 Profile
                </button>
              )}
              <button 
                onClick={() => setView('settings')}
                className={`${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-purple-600'} transition font-medium`}
              >
                ⚙️ Settings
              </button>
            </nav>

            {isLoggedIn ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowNewThread(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full hover:shadow-lg transition font-semibold"
                >
                  ✍️ New Post
                </button>
                <div className="relative group">
                  <button className="flex items-center space-x-2">
                    {profileData.profileImage ? (
                      <img src={profileData.profileImage} alt="Profile" className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold">
                        {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                  </button>
                  <div className={`absolute right-0 mt-2 w-48 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl py-2 hidden group-hover:block`}>
                    <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'} truncate`}>{currentUser?.name}</p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} truncate`}>{currentUser?.email}</p>
                    </div>
                    <button 
                      onClick={() => setView('profile')}
                      className={`w-full text-left px-4 py-2 ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100'}`}
                    >
                      View Profile
                    </button>
                    <button 
                      onClick={handleLogout} 
                      className={`w-full text-left px-4 py-2 ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} text-red-600`}
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700 transition font-semibold"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* HOME VIEW */}
        {view === 'home' && (
          <>
            {!isLoggedIn && (
              <div className={`bg-gradient-to-r ${isDark ? 'from-purple-900 to-pink-900' : 'from-purple-100 to-pink-100'} rounded-2xl p-8 text-center mb-8`}>
                <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-2`}>You Are Not Alone 🤗</h2>
                <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mb-4`}>A safe space to share, connect, and heal</p>
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="bg-purple-600 text-white px-8 py-3 rounded-full hover:bg-purple-700 transition shadow-lg font-semibold"
                >
                  Join Community
                </button>
              </div>
            )}

            {/* Category Filter */}
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-4 mb-6 shadow-sm overflow-x-auto`}>
              <div className="flex space-x-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilter(cat.toLowerCase())}
                    className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
                      filter === cat.toLowerCase()
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : isDark 
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
                <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading discussions...</p>
              </div>
            )}
{!loading && (
              <div className="space-y-4">
                {threads.length === 0 ? (
                  <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-12 text-center shadow-sm`}>
                    <span className="text-6xl mb-4 block">💬</span>
                    <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-lg`}>
                      {filter === 'all' 
                        ? 'No discussions yet. Be the first to start one!' 
                        : `No discussions in ${filter} category yet.`}
                    </p>
                  </div>
                ) : (
                  threads.map(thread => (
                    <div
                      key={thread._id}
                      onClick={() => openThread(thread)}
                      className={`${isDark ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:shadow-md'} rounded-2xl p-6 shadow-sm transition cursor-pointer`}
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {thread.author?.name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2 flex-wrap">
                            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                              {thread.author?.name || 'Anonymous'}
                            </span>
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              • {formatDate(thread.createdAt)}
                            </span>
                            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                              {thread.category}
                            </span>
                          </div>
                          <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-2`}>{thread.title}</h3>
                          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2 mb-3`}>{thread.content}</p>
                          {thread.image && (
                            <img src={thread.image} alt="Thread" className="w-full h-48 object-cover rounded-lg mb-3" />
                          )}
                          <div className={`flex items-center space-x-6 ${isDark ? 'text-gray-400' : 'text-gray-500'} border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} pt-4`}>
                            <button
                              onClick={(e) => handleLikeThread(thread._id, e)}
                              className="flex items-center space-x-1 hover:text-red-500 transition"
                            >
                              <span>{thread.likeCount || 0}</span>
                              <span>❤️</span>
                            </button>
                            <div className="flex items-center space-x-1">
                              <span>{thread.replyCount || 0}</span>
                              <span>💬</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span>{thread.views || 0}</span>
                              <span>👁️</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}

        {/* THREAD DETAIL VIEW */}
        {view === 'thread' && selectedThread && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <button
              onClick={() => { setView('home'); loadThreads(); }}
              className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-semibold"
            >
              <span>←</span>
              <span>Back to discussions</span>
            </button>

            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 shadow-sm`}>
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {selectedThread.author?.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {selectedThread.author?.name || 'Anonymous'}
                      </span>
                      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                        • {formatDate(selectedThread.createdAt)}
                      </span>
                    </div>
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                      {selectedThread.category}
                    </span>
                  </div>
                </div>

                {/* Delete Button - Only show to thread author */}
                {isLoggedIn && currentUser && selectedThread.author?._id === currentUser._id && (
                  <button
                    onClick={() => handleDeleteThread(selectedThread._id)}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition font-semibold">
                    <span>🗑️</span>
                    <span>Delete</span>
                  </button>
                )}
              </div>

              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-4`}>
                {selectedThread.title}
              </h1>
              <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} text-lg whitespace-pre-wrap mb-6`}>
                {selectedThread.content}
              </p>
              {selectedThread.image && (
                <img src={selectedThread.image} alt="Thread" className="w-full max-h-96 object-cover rounded-lg mb-6" />
              )}

              <div className={`flex items-center space-x-6 ${isDark ? 'text-gray-400' : 'text-gray-600'} border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} pt-4`}>
                <button
                  onClick={() => handleLikeThread(selectedThread._id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                    selectedThread.isLiked 
                      ? 'bg-red-50 text-red-600' 
                      : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{selectedThread.isLiked ? '❤️' : '🤍'}</span>
                  <span className="font-semibold">{selectedThread.likeCount || 0}</span>
                </button>
                <div className="flex items-center space-x-2">
                  <span className="text-xl">💬</span>
                  <span className="font-semibold">{comments.length}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xl">👁️</span>
                  <span className="font-semibold">{selectedThread.views || 0}</span>
                </div>
                
                {/* Share Button */}
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    showNotification('Link copied to clipboard! 📋');
                  }}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                    isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">🔗</span>
                  <span className="font-semibold">Share</span>
                </button>
              </div>
            </div>

            {/* Comment Form */}
            {isLoggedIn ? (
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-sm`}>
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-4`}>Add a comment</h3>
                <form onSubmit={handleComment} className="space-y-4">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts..."
                    className={`w-full px-4 py-3 border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none`}
                    rows="3"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition font-semibold disabled:opacity-50"
                  >
                    {loading ? 'Posting...' : 'Post Comment'}
                  </button>
                </form>
              </div>
            ) : (
              <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-sm text-center`}>
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>Please login to comment</p>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="bg-purple-600 text-white px-6 py-2 rounded-full hover:bg-purple-700 transition font-semibold"
                >
                  Sign In
                </button>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'} text-xl`}>
                Comments ({comments.length})
              </h3>
              {comments.length === 0 ? (
                <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 text-center shadow-sm`}>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>No comments yet. Be the first to comment!</p>
                </div>
              ) : (
                comments.map(comment => (
                  <div key={comment._id} className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-sm`}>
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold">
                        {comment.author?.name?.charAt(0).toUpperCase() || 'A'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                              {comment.author?.name || 'Anonymous'}
                            </span>
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              • {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          
                          {/* Delete Comment Button - Only for comment author */}
                          {isLoggedIn && currentUser && comment.author?._id === currentUser._id && (
                            <button
                              onClick={() => handleDeleteComment(comment._id)}
                              className="text-red-500 hover:text-red-700 text-sm">🗑️
                            </button>
                          )}
                        </div>
                        <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* COMMUNITIES VIEW */}
        {view === 'communities' && (
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Communities</h2>
              {isLoggedIn && (
                <button
                  onClick={() => setShowNewCommunity(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full hover:shadow-lg transition font-semibold"
                >
                  ➕ Create Community
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communities.map(community => (
                <div
                  key={community._id}
                  onClick={() => isLoggedIn ? openCommunity(community) : setShowLoginModal(true)}
                  className={`${isDark ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:shadow-lg'} rounded-2xl p-6 shadow-sm transition cursor-pointer`}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-xl">
                      👥
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{community.name}</h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {community.members} members
                      </p>
                    </div>
                  </div>
                  <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} text-sm`}>{community.description}</p>
                  <button className="mt-4 w-full bg-purple-100 text-purple-700 py-2 rounded-lg font-semibold hover:bg-purple-200 transition">
                    Join Community
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
{/* COMMUNITY CHAT VIEW */}
        {view === 'community-chat' && selectedCommunity && (
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => setView('communities')}
              className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-semibold mb-4"
            >
              <span>←</span>
              <span>Back to communities</span>
            </button>

            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-lg overflow-hidden`}>
              <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    👥
                  </div>
                  <div>
                    <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {selectedCommunity.name}
                    </h2>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {selectedCommunity.members} members
                    </p>
                  </div>
                </div>
              </div>

              <div className={`p-6 h-96 overflow-y-auto ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                {communityMessages.map(msg => (
                  <div key={msg._id} className="mb-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                        {msg.user.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
                            {msg.user}
                          </span>
                          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {formatDate(msg.timestamp)}
                          </span>
                        </div>
                        <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mt-1`}>{msg.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendCommunityMessage(e)}
                    placeholder="Type a message..."
                    className={`flex-1 px-4 py-2 border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-full focus:ring-2 focus:ring-purple-500 outline-none`}
                  />
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`p-2 rounded-full ${isRecording ? 'bg-red-500' : 'bg-gray-200'} hover:bg-opacity-80 transition`}
                  >
                    🎤
                  </button>
                  <button
                    onClick={(e) => sendCommunityMessage(e)}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full hover:shadow-lg transition font-semibold"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PROFILE VIEW */}
        {view === 'profile' && isLoggedIn && (
          <div className="max-w-4xl mx-auto">
            <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 shadow-sm`}>
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center space-x-6">
                  {profileData.profileImage ? (
                    <img 
                      src={profileData.profileImage} 
                      alt="Profile" 
                      className="w-24 h-24 rounded-full object-cover border-4 border-purple-500"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-3xl">
                      {currentUser?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-2`}>
                      {profileData.name || currentUser?.name}
                    </h2>
                    <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>{currentUser?.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowProfileEdit(true)}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition font-semibold"
                >
                  Edit Profile
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Bio</h3>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                    {profileData.bio || 'No bio yet'}
                  </p>
                </div>
                <div>
                  <h3 className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Age</h3>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                    {profileData.age || 'Not specified'}
                  </p>
                </div>
                <div>
                  <h3 className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Location</h3>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                    {profileData.location || 'Not specified'}
                  </p>
                </div>
                <div>
                  <h3 className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Date of Birth</h3>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                    {profileData.dob || 'Not specified'}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <h3 className={`font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2`}>Interests</h3>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                    {profileData.interests || 'No interests added yet'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SETTINGS VIEW */}
{view === 'settings' && (
  <div className="max-w-4xl mx-auto">
    <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} mb-8`}>Settings</h2>
    
    <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 shadow-sm space-y-6`}>
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'} mb-1`}>
            Theme
          </h3>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Choose your preferred theme
          </p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setTheme('light')}
            className={`px-4 py-2 rounded-lg ${
              theme === 'light' 
                ? 'bg-purple-600 text-white' 
                : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            }`}
          >
            ☀️ Light
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`px-4 py-2 rounded-lg ${
              theme === 'dark' 
                ? 'bg-purple-600 text-white' 
                : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            }`}
          >
            🌙 Dark
          </button>
        </div>
      </div>

      <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} pt-6`}>
        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'} mb-4`}>
          Notifications
        </h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Email notifications</span>
            <input type="checkbox" className="w-5 h-5 text-purple-600 rounded" defaultChecked />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Comment replies</span>
            <input type="checkbox" className="w-5 h-5 text-purple-600 rounded" defaultChecked />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Community invites</span>
            <input type="checkbox" className="w-5 h-5 text-purple-600 rounded" />
          </label>
        </div>
      </div>

      <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} pt-6`}>
        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'} mb-4`}>
          Privacy
        </h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between cursor-pointer">
            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Show profile to others</span>
            <input type="checkbox" className="w-5 h-5 text-purple-600 rounded" defaultChecked />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>Allow messages from non-friends</span>
            <input type="checkbox" className="w-5 h-5 text-purple-600 rounded" defaultChecked />
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} pt-6`}>
        <button
          onClick={() => showNotification('Settings saved successfully! ✅')}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition"
        >
          Save Settings
        </button>
      </div>
    </div>
  </div>
)}
</main>
      {/* MODALS - Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 max-w-md w-full shadow-2xl`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Welcome Back</h2>
              <button onClick={() => setShowLoginModal(false)} className={`${isDark ? 'text-gray-400' : 'text-gray-500'} hover:text-gray-700 text-3xl`}>×</button>
            </div>
            
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center space-x-2 border-2 border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition mb-4"
            >
              <span>🔍</span>
              <span className={isDark ? 'text-white' : 'text-gray-700'}>Continue with Google</span>
            </button>
            
            <div className="flex items-center my-4">
              <div className={`flex-1 border-t ${isDark ? 'border-gray-700' : 'border-gray-300'}`}></div>
              <span className={`px-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>OR</span>
              <div className={`flex-1 border-t ${isDark ? 'border-gray-700' : 'border-gray-300'}`}></div>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2 font-medium`}>Email</label>
                <input
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className={`w-full px-4 py-3 border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 outline-none`}
                />
              </div>
              <div>
                <label className={`block ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2 font-medium`}>Password</label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className={`w-full px-4 py-3 border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 outline-none`}
                />
              </div>
              <button onClick={handleLogin} disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              <p className={`text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Don't have an account?{' '}
                <button type="button" onClick={() => { setShowLoginModal(false); setShowRegisterModal(true); }} className="text-purple-600 font-semibold">
                  Sign Up
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
{/* Register Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 max-w-md w-full shadow-2xl`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Join MindSpace</h2>
              <button onClick={() => setShowRegisterModal(false)} className={`${isDark ? 'text-gray-400' : 'text-gray-500'} hover:text-gray-700 text-3xl`}>×</button>
            </div>
            
            <button
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center space-x-2 border-2 border-gray-300 py-3 rounded-lg hover:bg-gray-50 transition mb-4"
            >
              <span>🔍</span>
              <span className={isDark ? 'text-white' : 'text-gray-700'}>Sign up with Google</span>
            </button>
            
            <div className="flex items-center my-4">
              <div className={`flex-1 border-t ${isDark ? 'border-gray-700' : 'border-gray-300'}`}></div>
              <span className={`px-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>OR</span>
              <div className={`flex-1 border-t ${isDark ? 'border-gray-700' : 'border-gray-300'}`}></div>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2 font-medium`}>Name</label>
                <input
                  type="text"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  className={`w-full px-4 py-3 border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 outline-none`}
                />
              </div>
              <div>
                <label className={`block ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2 font-medium`}>Email</label>
                <input
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  className={`w-full px-4 py-3 border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 outline-none`}
                />
              </div>
              <div>
                <label className={`block ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2 font-medium`}>Password</label>
                <input
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  className={`w-full px-4 py-3 border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 outline-none`}
                />
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} mt-1`}>Must be at least 6 characters</p>
              </div>
              <button onClick={handleRegister} disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50">
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
              <p className={`text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Already have an account?{' '}
                <button type="button" onClick={() => { setShowRegisterModal(false); setShowLoginModal(true); }} className="text-purple-600 font-semibold">
                  Sign In
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* New Thread Modal */}
      {showNewThread && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 max-w-2xl w-full my-8 shadow-2xl`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Create New Post</h2>
              <button onClick={() => setShowNewThread(false)} className={`${isDark ? 'text-gray-400' : 'text-gray-500'} hover:text-gray-700 text-3xl`}>×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={`block ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2 font-medium`}>Title</label>
                <input
                  type="text"
                  value={newThreadData.title}
                  onChange={(e) => setNewThreadData({ ...newThreadData, title: e.target.value })}
                  className={`w-full px-4 py-3 border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 outline-none`}
                  placeholder="What's on your mind?"
                />
              </div>
              <div>
                <label className={`block ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2 font-medium`}>Content</label>
                <textarea
                  value={newThreadData.content}
                  onChange={(e) => setNewThreadData({ ...newThreadData, content: e.target.value })}
                  className={`w-full px-4 py-3 border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 outline-none h-32 resize-none`}
                  placeholder="Share your thoughts..."
                />
              </div>
              <div>
                <label className={`block ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2 font-medium`}>Category</label>
                <select
                  value={newThreadData.category}
                  onChange={(e) => setNewThreadData({ ...newThreadData, category: e.target.value })}
                  className={`w-full px-4 py-3 border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 outline-none`}
                >
                  <option>General</option>
                  <option>Anxiety</option>
                  <option>Depression</option>
                  <option>Stress</option>
                  <option>Relationships</option>
                  <option>Self-Care</option>
                  <option>Students</option>
                  <option>Work</option>
                  <option>Grief</option>
                  <option>Trauma</option>
                </select>
              </div>
              
              <div>
                <label className={`block ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2 font-medium`}>
                  📷 Add Image (optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, 'thread')}
                  className={`w-full px-4 py-2 border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg`}
                />
                {newThreadData.image && (
                  <div className="mt-2 relative">
                    <img src={newThreadData.image} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                    <button
                      type="button"
                      onClick={() => setNewThreadData({ ...newThreadData, image: null })}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>

              
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="anon"
                  checked={newThreadData.anonymous}
                  onChange={(e) => setNewThreadData({ ...newThreadData, anonymous: e.target.checked })}
                  className="w-4 h-4 text-purple-600"
                />
                <label htmlFor="anon" className={`ml-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Post anonymously
                </label>
              </div>
              <button 
                onClick={handleCreateThread} 
                disabled={loading} 
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50"
              >
                {loading ? 'Posting...' : 'Post Discussion'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Community Modal */}
      {showNewCommunity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 max-w-md w-full shadow-2xl`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Create Community</h2>
              <button onClick={() => setShowNewCommunity(false)} className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-3xl`}>×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={`block ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2 font-medium`}>Community Name</label>
                <input
                  type="text"
                  value={newCommunityData.name}
                  onChange={(e) => setNewCommunityData({ ...newCommunityData, name: e.target.value })}
                  className={`w-full px-4 py-3 border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 outline-none`}
                />
              </div>
              <div>
                <label className={`block ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2 font-medium`}>Description</label>
                <textarea
                  value={newCommunityData.description}
                  onChange={(e) => setNewCommunityData({ ...newCommunityData, description: e.target.value })}
                  className={`w-full px-4 py-3 border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 outline-none h-24 resize-none`}
                />
              </div>
              <div>
                <label className={`block ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2 font-medium`}>Category</label>
                <select
                  value={newCommunityData.category}
                  onChange={(e) => setNewCommunityData({ ...newCommunityData, category: e.target.value })}
                  className={`w-full px-4 py-3 border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 outline-none`}
                >
                  <option>General</option>
                  <option>Anxiety</option>
                  <option>Depression</option>
                  <option>Stress</option>
                  <option>Students</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="private"
                  checked={newCommunityData.isPrivate}
                  onChange={(e) => setNewCommunityData({ ...newCommunityData, isPrivate: e.target.checked })}
                  className="w-4 h-4 text-purple-600"
                />
                <label htmlFor="private" className={`ml-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Make this community private
                </label>
              </div>
              <button 
                onClick={handleCreateCommunity}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold"
              >
                Create Community
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Edit Modal */}
      {showProfileEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-8 max-w-2xl w-full my-8 shadow-2xl`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Edit Profile</h2>
              <button onClick={() => setShowProfileEdit(false)} className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-3xl`}>×</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className={`block ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2 font-medium`}>
                  Profile Picture
                </label>
                <div className="flex items-center space-x-4">
                  {profileData.profileImage ? (
                    <img src={profileData.profileImage} alt="Profile" className="w-20 h-20 rounded-full object-cover" />
                  ) : (
                    <div className="w-20 h-20 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-2xl">
                      {currentUser?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'profile')}
                    className={`flex-1 px-4 py-2 border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2 font-medium`}>Name</label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                    className={`w-full px-4 py-3 border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 outline-none`}
                  />
                </div>
                <div>
                  <label className={`block ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2 font-medium`}>Age</label>
                  <input
                    type="number"
                    value={profileData.age}
                    onChange={(e) => setProfileData({ ...profileData, age: e.target.value })}
                    className={`w-full px-4 py-3 border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 outline-none`}
                  />
                </div>
                <div>
                  <label className={`block ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2 font-medium`}>Date of Birth</label>
                  <input
                    type="date"
                    value={profileData.dob}
                    onChange={(e) => setProfileData({ ...profileData, dob: e.target.value })}
                    className={`w-full px-4 py-3 border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 outline-none`}
                  />
                </div>
                <div>
                  <label className={`block ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2 font-medium`}>Location</label>
                  <input
                    type="text"
                    value={profileData.location}
                    onChange={(e) => setProfileData({ ...profileData, location: e.target.value })}
                    className={`w-full px-4 py-3 border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 outline-none`}
                    placeholder="City, Country"
                  />
                </div>
              </div>

              <div>
                <label className={`block ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2 font-medium`}>Bio</label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                  className={`w-full px-4 py-3 border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 outline-none h-24 resize-none`}
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div>
                <label className={`block ${isDark ? 'text-gray-300' : 'text-gray-700'} mb-2 font-medium`}>Interests</label>
                <input
                  type="text"
                  value={profileData.interests}
                  onChange={(e) => setProfileData({ ...profileData, interests: e.target.value })}
                  className={`w-full px-4 py-3 border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-purple-500 outline-none`}
                  placeholder="Music, Reading, Sports (comma separated)"
                />
              </div>

              <button 
                onClick={handleUpdateProfile}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification.show && (
        <div className={`fixed top-4 right-4 px-6 py-4 rounded-lg shadow-2xl z-50 ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white font-semibold max-w-md animate-slide-in`}>
          <div className="flex items-center space-x-2">
            <span>{notification.type === 'success' ? '✓' : '⚠'}</span>
            <span>{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
