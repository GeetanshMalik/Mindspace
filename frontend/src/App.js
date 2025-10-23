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

  // Show notification function
  const showNotification = (message, type = 'success') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: 'success' });
    }, 3000);
  };

  // Handle login
  const handleLogin = async (email, password) => {
    try {
      const data = await authService.login(email, password);
      setCurrentUser(data.user);
      setIsLoggedIn(true);
      setShowLoginModal(false);
      showNotification('Welcome back! 🎉');
    } catch (error) {
      showNotification(error.response?.data?.error || 'Login failed', 'error');
    }
  };

  // Handle register
  const handleRegister = async (name, email, password) => {
    try {
      const data = await authService.register(name, email, password);
      setCurrentUser(data.user);
      setIsLoggedIn(true);
      setShowRegisterModal(false);
      showNotification('Welcome to MindSpace! 🌸');
    } catch (error) {
      showNotification(error.response?.data?.error || 'Registration failed', 'error');
    }
  };

  // Handle create thread
  const handleCreateThread = async () => {
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
    <div className="App">
      <header>
        <h1>MindSpace - Mental Health Forum</h1>
        {isLoggedIn ? (
          <div>
            <span>Welcome, {currentUser?.name}</span>
            <button onClick={() => setShowNewThread(true)}>New Thread</button>
          </div>
        ) : (
          <div>
            <button onClick={() => setShowLoginModal(true)}>Login</button>
            <button onClick={() => setShowRegisterModal(true)}>Register</button>
          </div>
        )}
      </header>

      <main>
        {threads.map(thread => (
          <div key={thread._id} className="thread">
            <h3>{thread.title}</h3>
            <p>{thread.content}</p>
            <span>Category: {thread.category}</span>
          </div>
        ))}
      </main>

      {notification.show && (
        <div className={`notification ${notification.type}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}

export default App;
