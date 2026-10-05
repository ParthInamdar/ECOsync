import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, MapPin, Plus, UserCircle, Bell, MessageSquare } from 'lucide-react';
import api from '../utils/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (user) {
      api.get('/notifications/')
        .then(res => {
          setUnreadCount(res.data.unread_count);
          setNotifications(res.data.notifications);
        })
        .catch(err => console.error("Failed to fetch notifications", err));
        
      api.get('/chat/unread')
        .then(res => setUnreadChatCount(res.data.unread_count))
        .catch(err => console.error("Failed to fetch unread chats", err));
    }
  }, [user]);

  const handleToggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
      api.post('/notifications/mark-read').then(() => {
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      });
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-[72px]">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center pr-4 py-1">
            <Link to="/" className="flex items-center">
              <img src="/logo.png" alt="EcoSync Logo" className="h-10 w-auto object-contain" />
            </Link>
          </div>
          
          {/* Search Bars */}
          <div className="hidden md:flex flex-1 max-w-4xl mx-4 gap-4 items-center">
            {/* Location Selector */}
            <div className="relative flex w-1/4 max-w-[250px] border-2 border-gray-800 rounded flex-shrink-0 bg-white">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-500" />
              </div>
              <input 
                type="text" 
                placeholder="India" 
                defaultValue="India"
                className="w-full bg-transparent py-2.5 pl-10 pr-10 text-sm text-gray-900 outline-none"
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>

            {/* Main Search */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                const query = fd.get('q');
                if (query) window.location.href = `/search?q=${encodeURIComponent(query)}`;
              }}
              className="flex w-full border-2 border-gray-800 rounded bg-white overflow-hidden"
            >
              <input 
                name="q"
                type="text" 
                placeholder='Search "Properties"' 
                className="w-full bg-transparent py-2.5 px-4 text-sm text-gray-900 outline-none"
              />
              <button type="submit" className="bg-[#002f34] px-5 hover:bg-gray-900 transition-colors flex items-center justify-center">
                <Search className="w-5 h-5 text-white" />
              </button>
            </form>
          </div>

          {/* User Actions */}
          <div className="flex items-center gap-4 flex-shrink-0 pl-2">
            
            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/messages" className="text-gray-900 hover:text-gray-600 font-bold text-sm">
                  <MessageSquare className="w-6 h-6 inline-block" />
                </Link>
                <button className="text-gray-900 hover:text-gray-600 font-bold text-sm">
                  <Bell className="w-6 h-6 inline-block" />
                </button>
                <Link to={`/profile/${user.id}`} className="flex items-center gap-2 text-sm font-bold text-gray-900 hover:underline">
                  <UserCircle className="w-8 h-8 text-gray-700" />
                </Link>
                <button 
                  onClick={logout}
                  className="text-sm font-bold text-gray-900 hover:underline"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="text-base font-bold text-gray-900 hover:underline underline-offset-4 decoration-2">
                Login
              </Link>
            )}
            
            {/* SELL Button styled like OLX */}
            <Link 
              to="/add" 
              className="relative ml-2 inline-flex items-center justify-center rounded-full bg-white px-5 py-1.5 text-sm font-bold text-gray-900 transition-transform hover:scale-105"
              style={{
                boxShadow: '0 1px 3px rgba(0,0,0,0.1), inset 0 0 0 5px white, 0 0 0 4px transparent, -2px -2px 0 2px #3a77ff, 2px -2px 0 2px #23e5db, 2px 2px 0 2px #ffce32, -2px 2px 0 2px #ff7733',
                border: '1px solid transparent'
              }}
            >
              <Plus className="w-5 h-5 mr-1 text-black font-bold" strokeWidth={3} />
              SELL
            </Link>
          </div>

        </div>
      </div>
      
      {/* Mobile Search - Visible only on small screens */}
      <div className="md:hidden px-4 py-3 border-t border-gray-100 bg-white">
        <div className="flex w-full border-2 border-gray-300 rounded focus-within:border-teal-600 bg-white overflow-hidden">
          <input 
            type="text" 
            placeholder="Search for resources..." 
            className="w-full bg-transparent py-2 px-3 text-sm text-gray-900 outline-none"
          />
          <button className="bg-teal-600 px-4 flex items-center justify-center">
            <Search className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </nav>
  );
}
