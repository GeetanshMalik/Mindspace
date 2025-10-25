import React, { useState, useEffect } from 'react';
import { authService } from './services/authService';
import { threadService } from './services/threadService';
import { commentService } from './services/commentService';

function App() {
  // State management
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [view, setView] = useState('home');
  const [selectedThread, setSelectedThread] = useState(null);
  const [threads, setThreads] = useState([]);
  const [comments, setComments] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showNewThread, setShowNewThread] = useState(false);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  
  // Form states
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '' });
  const [newThreadData, setNewThreadData] = useState({
    title: '',
    content: '',
    category: 'General',
    tags: '',
    anonymous: false
  });
  const [newComment, setNewComment] = useState('');

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
        setCurrentUser(JSON.parse(user));
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  // Load threads on mount and filter change
  useEffect(() => {
    loadThreads();
  }, [filter]);

  const loadThreads = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (filter !== 'all') {
        params.category = filter.charAt(0).toUpperCase() + filter.slice(1);
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
      console.error('Login error:', error);
      showNotification(error.response?.data?.error || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
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
      console.error('Registration error:', error);
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

  // Thread handlers
  const handleCreateThread = async (e) => {
    e.preventDefault();
    if (!newThreadData.title || !newThreadData.content) {
      showNotification('Please fill in all fields', 'error');
      return;
    }
    
    try {
      setLoading(true);
      const result = await threadService.createThread({
        title: newThreadData.title,
        content: newThreadData.content,
        category: newThreadData.category,
        tags: newThreadData.tags,
        isAnonymous: newThreadData.anonymous
      });
      
      setShowNewThread(false);
      setNewThreadData({ 
        title: '', 
        content: '', 
        category: 'General', 
        tags: '', 
        anonymous: false 
      });
      showNotification('Discussion posted! 💬');
      loadThreads();
    } catch (error) {
      console.error('Create thread error:', error);
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
      console.error('Load thread error:', error);
      showNotification('Failed to load thread details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLikeThread = async (threadId, event) => {
    if (event) {
      event.stopPropagation();
    }
    
    if (!isLoggedIn) {
      showNotification('Please login to like posts', 'error');
      setShowLoginModal(true);
      return;
    }
    
    try {
      await threadService.likeThread(threadId);
      
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
      console.error('Like thread error:', error);
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
      console.error('Post comment error:', error);
      showNotification(error.response?.data?.error || 'Failed to post comment', 'error');
    } finally {
      setLoading(false);
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

  const categories = ['All', 'General', 'Anxiety', 'Depression', 'Stress', 'Relationships', 'Self-Care', 'Students', 'Work'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <button 
              onClick={() => {
                setView('home');
                loadThreads();
              }} 
              className="flex items-center space-x-3 hover:opacity-80 transition"
            >
              <span className="text-3xl">🌸</span>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                MindSpace
              </h1>
            </button>

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
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold">
                      {currentUser?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 hidden group-hover:block">
                    <div className="px-4 py-2 border-b">
                      <p className="font-semibold text-gray-800 truncate">{currentUser?.name}</p>
                      <p className="text-sm text-gray-500 truncate">{currentUser?.email}</p>
                    </div>
                    <button 
                      onClick={handleLogout} 
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600"
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
      <main className="max-w-4xl mx-auto px-4 py-8">
        {view === 'home' ? (
          <>
            {/* Hero Banner */}
            {!isLoggedIn && (
              <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-8 text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-800 mb-2">You Are Not Alone 🤗</h2>
                <p className="text-gray-600 mb-4">A safe space to share, connect, and heal</p>
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="bg-purple-600 text-white px-8 py-3 rounded-full hover:bg-purple-700 transition shadow-lg font-semibold"
                >
                  Join Community
                </button>
              </div>
            )}

            {/* Category Filter */}
            <div className="bg-white rounded-2xl p-4 mb-6 shadow-sm overflow-x-auto">
              <div className="flex space-x-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilter(cat.toLowerCase())}
                    className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
                      filter === cat.toLowerCase()
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Loading State */}
            {loading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
                <p className="mt-4 text-gray-600">Loading discussions...</p>
              </div>
            )}

            {/* Threads List */}
            {!loading && (
              <div className="space-y-4">
                {threads.length === 0 ? (
                  <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                    <span className="text-6xl mb-4 block">💬</span>
                    <p className="text-gray-500 text-lg">
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
                      className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition cursor-pointer"
                    >
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {thread.author?.name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2 flex-wrap">
                            <span className="font-semibold text-gray-800">
                              {thread.author?.name || 'Anonymous'}
                            </span>
                            <span className="text-gray-500 text-sm">• {formatDate(thread.createdAt)}</span>
                            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                              {thread.category}
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-gray-800 mb-2">{thread.title}</h3>
                          <p className="text-gray-600 line-clamp-2 mb-3">{thread.content}</p>
                          <div className="flex items-center space-x-6 text-gray-500">
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
        ) : (
          /* Thread Detail View */
          selectedThread && (
            <div className="space-y-6">
              {/* Back Button */}
              <button
                onClick={() => {
                  setView('home');
                  loadThreads();
                }}
                className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-semibold"
              >
                <span>←</span>
                <span>Back to discussions</span>
              </button>

              {/* Thread Card */}
              <div className="bg-white rounded-2xl p-8 shadow-sm">
                <div className="flex items-start space-x-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                    {selectedThread.author?.name?.charAt(0).toUpperCase() || 'A'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-semibold text-gray-800 text-lg">
                        {selectedThread.author?.name || 'Anonymous'}
                      </span>
                      <span className="text-gray-500">• {formatDate(selectedThread.createdAt)}</span>
                    </div>
                    <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                      {selectedThread.category}
                    </span>
                  </div>
                </div>

                <h1 className="text-3xl font-bold text-gray-800 mb-4">{selectedThread.title}</h1>
                <p className="text-gray-700 text-lg whitespace-pre-wrap mb-6">{selectedThread.content}</p>

                <div className="flex items-center space-x-6 text-gray-600 border-t pt-4">
                  <button
                    onClick={() => handleLikeThread(selectedThread._id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                      selectedThread.isLiked ? 'bg-red-50 text-red-600' : 'hover:bg-gray-100'
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
                </div>
              </div>

              {/* Comment Form */}
              {isLoggedIn ? (
                <div className="bg-white rounded-2xl p-6 shadow-sm">
                  <h3 className="font-bold text-gray-800 mb-4">Add a comment</h3>
                  <form onSubmit={handleComment} className="space-y-4">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your thoughts..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
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
                <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
                  <p className="text-gray-600 mb-4">Please login to comment</p>
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
                <h3 className="font-bold text-gray-800 text-xl">Comments ({comments.length})</h3>
                {comments.length === 0 ? (
                  <div className="bg-white rounded-2xl p-8 text-center shadow-sm">
                    <p className="text-gray-500">No comments yet. Be the first to comment!</p>
                  </div>
                ) : (
                  comments.map(comment => (
                    <div key={comment._id} className="bg-white rounded-2xl p-6 shadow-sm">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white font-semibold">
                          {comment.author?.name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-semibold text-gray-800">
                              {comment.author?.name || 'Anonymous'}
                            </span>
                            <span className="text-gray-500 text-sm">• {formatDate(comment.createdAt)}</span>
                          </div>
                          <p className="text-gray-700">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        )}
      </main>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
              <button onClick={() => setShowLoginModal(false)} className="text-gray-500 hover:text-gray-700 text-3xl">×</button>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Email</label>
                <input
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  placeholder="What's on your mind?"
                  minLength={5}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Content</label>
                <textarea
                  value={newThreadData.content}
                  onChange={(e) => setNewThreadData({ ...newThreadData, content: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none h-32 resize-none"
                  placeholder="Share your thoughts..."
                  minLength={10}
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Category</label>
                <select
                  value={newThreadData.category}
                  onChange={(e) => setNewThreadData({ ...newThreadData, category: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option>General</option>
                  <option>Anxiety</option>
                  <option>Depression</option>
                  <option>Stress</option>
                  <option>Relationships</option>
                  <option>Self-Care</option>
                  <option>Students</option>
                  <option>Work</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="anon"
                  checked={newThreadData.anonymous}
                  onChange={(e) => setNewThreadData({ ...newThreadData, anonymous: e.target.checked })}
                  className="w-4 h-4 text-purple-600"
                />
                <label htmlFor="anon" className="ml-2 text-gray-700">Post anonymously</label>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50">
                {loading ? 'Posting...' : 'Post Discussion'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification.show && (
        <div className={`fixed top-4 right-4 px-6 py-4 rounded-lg shadow-2xl z-50 ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white font-semibold max-w-md`}>
          <div className="flex items-center space-x-2">
            <span>{notification.type === 'success' ? '✓' : '⚠'}</span>
            <span>{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App; outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Password</label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
              <p className="text-center text-sm text-gray-600">
                Don't have an account?{' '}
                <button type="button" onClick={() => { setShowLoginModal(false); setShowRegisterModal(true); }} className="text-purple-600 font-semibold">
                  Sign Up
                </button>
              </p>
            </form>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Join MindSpace</h2>
              <button onClick={() => setShowRegisterModal(false)} className="text-gray-500 hover:text-gray-700 text-3xl">×</button>
            </div>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Name</label>
                <input
                  type="text"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Email</label>
                <input
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Password</label>
                <input
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"
                  minLength={6}
                  required
                />
              </div>
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50">
                {loading ? 'Creating account...' : 'Create Account'}
              </button>
              <p className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <button type="button" onClick={() => { setShowRegisterModal(false); setShowLoginModal(true); }} className="text-purple-600 font-semibold">
                  Sign In
                </button>
              </p>
            </form>
          </div>
        </div>
      )}

      {/* New Thread Modal */}
      {showNewThread && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full my-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Create New Post</h2>
              <button onClick={() => setShowNewThread(false)} className="text-gray-500 hover:text-gray-700 text-3xl">×</button>
            </div>
            <form onSubmit={handleCreateThread} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Title</label>
                <input
                  type="text"
                  value={newThreadData.title}
                  onChange={(e) => setNewThreadData({ ...newThreadData, title: e.target.value })}
                  className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500
