import React, { useState, useEffect } from 'react';
import { authService } from './services/authService';
import { threadService } from './services/threadService';

function App() {
  // State declarations
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showNewThread, setShowNewThread] = useState(false);
  const [threads, setThreads] = useState([]);
  const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });
  const [newThreadData, setNewThreadData] = useState({
    title: '',
    content: '',
    category: 'General',
    tags: [],
    anonymous: false
  });

  // Form data states
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [registerData, setRegisterData] = useState({ name: '', email: '', password: '' });

  // Trending threads (top 3)
  const trendingThreads = [
    { id: 1, title: 'Dealing with Anxiety at Work', author: 'Anonymous', likes: 23, comments: 1, time: '2h ago' },
    { id: 2, title: 'Finding Peace Through Meditation', author: 'Sarah M.', likes: 45, comments: 0, time: '3h ago' },
    { id: 3, title: 'Student Stress Management', author: 'Anonymous', likes: 18, comments: 0, time: '1d ago' }
  ];

  // Show notification function
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Check for existing session
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      setCurrentUser(JSON.parse(user));
      setIsLoggedIn(true);
    }
  }, []);

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await authService.login(loginData.email, loginData.password);
      setCurrentUser(data.user);
      setIsLoggedIn(true);
      setShowLoginModal(false);
      setLoginData({ email: '', password: '' });
      showNotification('Welcome back! 🎉');
    } catch (error) {
      showNotification(error.response?.data?.error || 'Login failed', 'error');
    }
  };

  // Handle register
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const data = await authService.register(registerData.name, registerData.email, registerData.password);
      setCurrentUser(data.user);
      setIsLoggedIn(true);
      setShowRegisterModal(false);
      setRegisterData({ name: '', email: '', password: '' });
      showNotification('Welcome to MindSpace! 🌸');
    } catch (error) {
      showNotification(error.response?.data?.error || 'Registration failed', 'error');
    }
  };

  // Handle logout
  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setIsLoggedIn(false);
    showNotification('Logged out successfully! 👋');
  };

  // Handle create thread
  const handleCreateThread = async (e) => {
    e.preventDefault();
    try {
      const result = await threadService.createThread({
        title: newThreadData.title,
        content: newThreadData.content,
        category: newThreadData.category,
        tags: newThreadData.tags,
        isAnonymous: newThreadData.anonymous
      });
      setThreads([result.thread, ...threads]);
      setShowNewThread(false);
      setNewThreadData({
        title: '',
        content: '',
        category: 'General',
        tags: [],
        anonymous: false
      });
      showNotification('Discussion posted! 💬');
    } catch (error) {
      showNotification(error.response?.data?.error || 'Failed to create thread', 'error');
    }
  };

  // Load threads on mount
  useEffect(() => {
    const loadThreads = async () => {
      try {
        const data = await threadService.getThreads();
        setThreads(data.threads || []);
      } catch (error) {
        console.error('Error loading threads:', error);
      }
    };
    loadThreads();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">🌸</span>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                MindSpace
              </h1>
            </div>
            
            <nav className="hidden md:flex items-center space-x-6 text-gray-600">
              <button className="hover:text-purple-600 transition">🏠 Home</button>
              <button className="hover:text-purple-600 transition">👥 Community</button>
              <button className="hover:text-purple-600 transition">📖 Resources</button>
              <button className="hover:text-purple-600 transition">🌙 Dark Mode</button>
            </nav>

            {isLoggedIn ? (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowNewThread(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition"
                >
                  ✍️ New Thread
                </button>
                <div className="relative group">
                  <button className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-semibold">
                      {currentUser?.name?.charAt(0).toUpperCase()}
                    </div>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 hidden group-hover:block">
                    <div className="px-4 py-2 border-b">
                      <p className="font-semibold text-gray-800">{currentUser?.name}</p>
                      <p className="text-sm text-gray-500">{currentUser?.email}</p>
                    </div>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600">
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
                >
                  Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Welcome */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-purple-100 to-pink-100 rounded-2xl p-8 text-center">
              <h2 className="text-3xl font-bold text-gray-800 mb-2">You Are Not Alone 🤗</h2>
              <p className="text-gray-600 mb-4">A safe space to share, connect, and heal</p>
              {!isLoggedIn && (
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="bg-purple-600 text-white px-8 py-3 rounded-full hover:bg-purple-700 transition shadow-lg"
                >
                  Join Community
                </button>
              )}
            </div>

            {/* Trending Section */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">🔥</span>
                <h3 className="text-xl font-bold text-gray-800">Trending</h3>
              </div>
              <div className="space-y-4">
                {trendingThreads.map(thread => (
                  <div key={thread.id} className="border-b pb-4 last:border-b-0 hover:bg-gray-50 p-3 rounded-lg transition cursor-pointer">
                    <h4 className="font-semibold text-gray-800 mb-2">{thread.title}</h4>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{thread.author} • {thread.time}</span>
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">❤️ {thread.likes}</span>
                        <span className="flex items-center">💬 {thread.comments}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Discussions */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Recent Discussions</h3>
              {threads.length === 0 ? (
                <div className="text-center py-12">
                  <span className="text-6xl mb-4 block">💬</span>
                  <p className="text-gray-500 text-lg">No discussions yet. Be the first to start one!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {threads.map(thread => (
                    <div key={thread._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-lg font-semibold text-gray-800 mb-2">{thread.title}</h4>
                          <p className="text-gray-600 mb-3 line-clamp-2">{thread.content}</p>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                              {thread.category}
                            </span>
                            <span className="text-gray-500">👤 {thread.author?.name || 'Anonymous'}</span>
                            <span className="text-gray-500">💬 {thread.commentsCount || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {/* Need Help Card */}
            <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-2xl p-6 border-2 border-red-200">
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl">🆘</span>
                <h3 className="text-lg font-bold text-gray-800">Need Help?</h3>
              </div>
              <div className="space-y-3">
                <a href="tel:988" className="flex items-center space-x-2 text-red-600 hover:text-red-700 font-semibold">
                  <span>📞</span>
                  <span>Crisis Helpline: 988</span>
                </a>
                <a href="sms:741741" className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-semibold">
                  <span>💬</span>
                  <span>Text HOME to 741741</span>
                </a>
              </div>
            </div>

            {/* Guidelines Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Community Guidelines</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-start space-x-2">
                  <span>💝</span>
                  <span>Be kind and supportive</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span>🔒</span>
                  <span>Respect privacy</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span>🚫</span>
                  <span>No medical advice</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span>⚠️</span>
                  <span>Report harmful content</span>
                </li>
              </ul>
            </div>

            {/* Categories Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Categories</h3>
              <div className="space-y-2">
                {['Anxiety', 'Depression', 'Relationships', 'Self-Care', 'Stress', 'Students'].map(cat => (
                  <button
                    key={cat}
                    className="w-full text-left px-4 py-2 rounded-lg hover:bg-purple-50 text-gray-700 transition"
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Footer Card */}
            <div className="bg-white rounded-2xl p-6 shadow-sm text-center">
              <p className="text-sm text-gray-500 mb-2">💙 You matter</p>
              <p className="text-xs text-gray-400">MindSpace is supportive, not medical advice</p>
              <p className="text-xs text-gray-400 mt-2">MindSpace © 2025 • Made with care 🌸</p>
            </div>
          </div>
        </div>
      </main>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Email</label>
                <input
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Password</label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg hover:shadow-lg transition font-semibold"
              >
                Sign In
              </button>
              <p className="text-center text-gray-600 text-sm">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setShowLoginModal(false);
                    setShowRegisterModal(true);
                  }}
                  className="text-purple-600 font-semibold hover:underline"
                >
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
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Join MindSpace</h2>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Name</label>
                <input
                  type="text"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Email</label>
                <input
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Password</label>
                <input
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg hover:shadow-lg transition font-semibold"
              >
                Create Account
              </button>
              <p className="text-center text-gray-600 text-sm">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setShowRegisterModal(false);
                    setShowLoginModal(true);
                  }}
                  className="text-purple-600 font-semibold hover:underline"
                >
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
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 my-8 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Create New Thread</h2>
              <button
                onClick={() => setShowNewThread(false)}
                className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateThread} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Title</label>
                <input
                  type="text"
                  value={newThreadData.title}
                  onChange={(e) => setNewThreadData({ ...newThreadData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
                  placeholder="What's on your mind?"
                  required
                  minLength={5}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Content</label>
                <textarea
                  value={newThreadData.content}
                  onChange={(e) => setNewThreadData({ ...newThreadData, content: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition h-32 resize-none"
                  placeholder="Share your thoughts..."
                  required
                  minLength={10}
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2 font-medium">Category</label>
                <select
                  value={newThreadData.category}
                  onChange={(e) => setNewThreadData({ ...newThreadData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition"
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
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={newThreadData.anonymous}
                  onChange={(e) => setNewThreadData({ ...newThreadData, anonymous: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <label htmlFor="anonymous" className="text-gray-700">Post anonymously</label>
              </div>
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg hover:shadow-lg transition font-semibold"
              >
                Post Thread
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification.show && (
        <div className={`fixed top-4 right-4 px-6 py-4 rounded-lg shadow-2xl z-50 animate-slide-in ${
          notification.type === 'success' 
            ? 'bg-green-500' 
            : 'bg-red-500'
        } text-white font-semibold`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}

export default App;
