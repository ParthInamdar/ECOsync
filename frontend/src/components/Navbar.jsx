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
          <div className="flex-shrink-0 flex items-center pr-4">
            <Link to="/" className="flex items-center">
              <img src="/logo.jpg" alt="EcoSync Logo" className="h-10 w-auto rounded-md object-contain" />
            </Link>
          </div>
          
          {/* Search Bar & Category (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-2xl">
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.target);
                const query = fd.get('q');
                const category = fd.get('category');
                let url = '/search?';
                if (query) url += `q=${encodeURIComponent(query)}&`;
                if (category && category !== 'All Categories') url += `category=${encodeURIComponent(category)}`;
                window.location.href = url;
              }}
              className="flex w-full border-2 border-gray-300 rounded focus-within:border-teal-600 bg-white overflow-hidden transition-colors"
            >
              <select name="category" className="bg-transparent py-2 pl-3 pr-2 text-sm text-gray-700 border-none outline-none cursor-pointer w-[140px] border-r border-gray-300">
                <option>All Categories</option>
                <option>Books</option>
                <option>Electronics</option>
                <option>Sports</option>
                <option>Tools</option>
                <option>Household</option>
                <option>Vehicles</option>
                <option>Fashion</option>
              </select>
              
              <input 
                name="q"
                type="text" 
                placeholder="Find cars, mobile phones and more..." 
                className="w-full bg-transparent py-2 px-3 text-sm text-gray-900 border-none outline-none"
              />
              
              <button type="submit" className="bg-teal-600 px-4 hover:bg-teal-700 transition-colors flex items-center justify-center">
                <Search className="w-5 h-5 text-white" />
              </button>
            </form>
          </div>

          {/* Location & User Actions */}
          <div className="flex items-center gap-6 pl-6">
            
            <div className="hidden lg:flex items-center gap-1.5 cursor-pointer group">
              <MapPin className="w-5 h-5 text-gray-600 group-hover:text-teal-600" />
              <span className="text-sm font-medium text-gray-700 group-hover:text-teal-600">Ahmedabad</span>
            </div>

            {user ? (
              <div className="flex items-center gap-3">
                <Link to="/messages" onClick={() => setUnreadChatCount(0)} className="relative flex items-center gap-1 text-gray-500 hover:text-teal-600">
                  <MessageSquare className="w-5 h-5" />
                  {unreadChatCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {unreadChatCount}
                    </span>
                  )}
                </Link>
                <div className="relative">
                  <button onClick={handleToggleNotifications} className="relative flex items-center gap-1 text-gray-500 hover:text-teal-600 focus:outline-none">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50">
                      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="font-bold text-gray-900">Notifications</h3>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 text-sm">No notifications yet</div>
                        ) : (
                          notifications.map((notif) => (
                            <div key={notif.id} className={`p-4 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 transition-colors ${!notif.is_read ? 'bg-teal-50/30' : ''}`}>
                              <p className="text-sm text-gray-800 font-medium mb-1">{notif.message}</p>
                              <p className="text-xs text-gray-500">{new Date(notif.created_at).toLocaleString()}</p>
                            </div>
                          ))
                        )}
                      </div>
                      <div className="bg-gray-50 p-2 text-center border-t border-gray-200">
                        <Link to="/requests" onClick={() => setShowNotifications(false)} className="text-sm font-semibold text-teal-600 hover:underline">
                          View all activity
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
                <Link to="/impact" className="flex items-center gap-1 text-sm font-bold text-green-600 hover:text-green-700">
                  <span className="hidden sm:inline">My Impact 🌍</span>
                </Link>
                {user.role === 'ADMIN' && (
                  <>
                    <div className="h-5 w-px bg-gray-300 mx-1"></div>
                    <Link to="/admin" className="flex items-center gap-1 text-sm font-bold text-red-600 hover:text-red-700">
                      <span className="hidden sm:inline">Admin</span>
                    </Link>
                  </>
                )}
                <div className="h-5 w-px bg-gray-300 mx-1"></div>
                <Link to={`/profile/${user.id}`} className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-teal-600">
                  <UserCircle className="w-6 h-6 text-gray-500" />
                  <span className="hidden sm:inline">{user.username}</span>
                </Link>
                <button 
                  onClick={logout}
                  className="text-sm font-medium text-gray-500 hover:text-gray-900 underline underline-offset-2 ml-2"
                >
                  Logout
                </button>
              </div>
            ) : (
              <Link to="/login" className="text-sm font-semibold text-gray-800 hover:underline underline-offset-2">
                Login
              </Link>
            )}
            
            <Link 
              to="/add" 
              className="inline-flex items-center justify-center rounded bg-teal-600 px-4 py-2 text-sm font-bold text-white hover:bg-teal-700 transition-colors shadow-sm gap-1.5"
            >
              <Plus className="w-4 h-4" />
              SHARE
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
