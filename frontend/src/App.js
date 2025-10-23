import React, { useState, useEffect } from 'react';
import { authService } from './services/authService';
import { threadService } from './services/threadService';
import { commentService } from './services/commentService';
import { journalService } from './services/journalService';

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

  // Show notification function
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

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
        setThreads(data.threads);
      } catch (error) {
        console.error('Error loading threads:', error);
      }
    };
    loadThreads();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">🧠</span>
              <h1 className="text-2xl font-bold text-purple-600">MindSpace</h1>
            </div>
            {isLoggedIn ? (
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Welcome, <span className="font-semibold">{currentUser?.name}</span></span>
                <button
                  onClick={() => setShowNewThread(true)}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition"
                >
                  ✍️ New Thread
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
                >
                  Login
                </button>
                <button
                  onClick={() => setShowRegisterModal(true)}
                  className="bg-white text-purple-600 border-2 border-purple-600 px-6 py-2 rounded-lg hover:bg-purple-50 transition"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Recent Discussions</h2>
        {threads.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <span className="text-6xl mb-4 block">💬</span>
            <p className="text-gray-500 text-lg">No discussions yet. Be the first to start one!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {threads.map(thread => (
              <div key={thread._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">{thread.title}</h3>
                    <p className="text-gray-600 mb-3">{thread.content}</p>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
                        {thread.category}
                      </span>
                      <span>👤 {thread.author?.name || 'Anonymous'}</span>
                      <span>💬 {thread.commentsCount || 0} comments</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Login</h2>
              <button
                onClick={() => setShowLoginModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={loginData.email}
                  onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition font-semibold"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Register</h2>
              <button
                onClick={() => setShowRegisterModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  value={registerData.name}
                  onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition font-semibold"
              >
                Register
              </button>
            </form>
          </div>
        </div>
      )}

      {/* New Thread Modal */}
      {showNewThread && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Create New Thread</h2>
              <button
                onClick={() => setShowNewThread(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreateThread} className="space-y-4">
              <div>
                <label className="block text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  value={newThreadData.title}
                  onChange={(e) => setNewThreadData({ ...newThreadData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Content</label>
                <textarea
                  value={newThreadData.content}
                  onChange={(e) => setNewThreadData({ ...newThreadData, content: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent h-32"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">Category</label>
                <select
                  value={newThreadData.category}
                  onChange={(e) => setNewThreadData({ ...newThreadData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option>General</option>
                  <option>Anxiety</option>
                  <option>Depression</option>
                  <option>Stress</option>
                  <option>Relationships</option>
                  <option>Self-Care</option>
                </select>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={newThreadData.anonymous}
                  onChange={(e) => setNewThreadData({ ...newThreadData, anonymous: e.target.checked })}
                  className="w-4 h-4 text-purple-600"
                />
                <label className="ml-2 text-gray-700">Post anonymously</label>
              </div>
              <button
                type="submit"
                className="w-full bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition font-semibold"
              >
                Post Thread
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification.show && (
        <div className={`fixed top-4 right-4 px-6 py-4 rounded-lg shadow-lg z-50 ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}

export default App;
