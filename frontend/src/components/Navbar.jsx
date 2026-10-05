import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Search, MapPin, Plus, UserCircle, Bell, MessageSquare } from 'lucide-react';
import api from '../utils/api';

export default function Navbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const [userLocation, setUserLocation] = useState("India");

  const isAuthScreen = ['/login', '/register', '/reset-password'].includes(location.pathname);

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

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (pos) => {
            try {
              const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
              const data = await res.json();
              if (data && data.address) {
                const city = data.address.city || data.address.town || data.address.village || data.address.state || "India";
                setUserLocation(city);
              }
            } catch (err) {
              console.error("Failed to reverse geocode", err);
            }
          },
          (err) => {
            console.warn("Location permission denied or failed.");
          },
          { timeout: 5000 }
        );
      }
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

  if (isAuthScreen) return null;

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
            {/* Location Display */}
            <div className="relative flex w-1/4 max-w-[250px] border-2 border-gray-800 rounded flex-shrink-0 bg-white">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MapPin className="h-5 w-5 text-gray-500" />
              </div>
              <input 
                type="text" 
                placeholder="India" 
                value={userLocation}
                readOnly
                className="w-full bg-transparent py-2.5 pl-10 pr-3 text-sm text-gray-900 outline-none cursor-default"
              />
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
                placeholder="Search resources nearby..." 
                className="w-full bg-transparent py-2.5 px-4 text-sm text-gray-900 outline-none"
              />
              <button type="submit" className="bg-[#002f34] px-5 hover:bg-gray-900 transition-colors flex items-center justify-center">
                <Search className="w-5 h-5 text-white" />
              </button>
            </form>
          </div>

            {/* User Actions */}
            <div className="flex items-center gap-6 flex-shrink-0 pl-2">
              
              {user && (
                <div className="flex items-center gap-5">
                  <Link to="/messages" className="flex flex-col items-center justify-center text-gray-800 hover:text-black transition-colors relative">
                    <MessageSquare className="w-5 h-5" />
                    <span className="text-[11px] font-bold mt-1">Messages</span>
                    {unreadChatCount > 0 && <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{unreadChatCount}</span>}
                  </Link>
                  <button onClick={handleToggleNotifications} className="flex flex-col items-center justify-center text-gray-800 hover:text-black transition-colors relative">
                    <Bell className="w-5 h-5" />
                    <span className="text-[11px] font-bold mt-1">Alerts</span>
                    {unreadCount > 0 && <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">{unreadCount}</span>}
                  </button>
                </div>
              )}

              {/* Profile Hover Dropdown */}
              <div className="relative group cursor-pointer pb-4 -mb-4">
                <div className="flex flex-col items-center justify-center text-gray-800 group-hover:text-black transition-colors">
                  <UserCircle className="w-5 h-5" />
                  <span className="text-[11px] font-bold mt-1">Profile</span>
                </div>
                
                <div className="absolute top-full right-1/2 translate-x-1/2 pt-2 w-72 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="bg-white shadow-[0_0_15px_rgba(0,0,0,0.1)] rounded-sm border border-gray-100 relative text-left">
                    {/* Pink top border indicator */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-[#ff3f6c]"></div>
                    
                    <div className="p-5 border-b border-gray-100 mt-1">
                      <h3 className="font-bold text-[15px] text-gray-800 mb-0.5">Welcome</h3>
                      <p className="text-[13px] text-gray-500 mb-4">To access account and manage resources</p>
                      {user ? (
                        <button onClick={logout} className="w-full py-2.5 text-sm font-bold text-[#ff3f6c] border border-gray-200 hover:border-[#ff3f6c] transition-colors rounded">
                          LOGOUT
                        </button>
                      ) : (
                        <Link to="/login" className="block w-full text-center py-2.5 text-sm font-bold text-[#ff3f6c] border border-[#ff3f6c] hover:bg-[#ff3f6c] hover:text-white transition-colors rounded">
                          LOGIN / SIGNUP
                        </Link>
                      )}
                    </div>
                    <div className="py-2">
                      <Link to={user ? `/profile/${user.id}` : "/login"} className="block px-5 py-2 text-[14px] text-gray-600 hover:text-black hover:font-medium">My Profile</Link>
                      <Link to="/add" className="block px-5 py-2 text-[14px] text-gray-600 hover:text-black hover:font-medium">My Resources</Link>
                      <Link to="/" className="block px-5 py-2 text-[14px] text-gray-600 hover:text-black hover:font-medium">Saved Items</Link>
                      <Link to="/" className="block px-5 py-2 text-[14px] text-gray-600 hover:text-black hover:font-medium">Contact Us</Link>
                    </div>
                  </div>
                </div>
              </div>
            
            {/* Action Button styled for EcoSync */}
            <Link 
              to="/add" 
              className="relative ml-2 inline-flex items-center justify-center rounded-full bg-white px-5 py-1.5 text-sm font-bold text-gray-900 transition-transform hover:scale-105"
              style={{
                boxShadow: '0 1px 3px rgba(0,0,0,0.1), inset 0 0 0 5px white, 0 0 0 4px transparent, -2px -2px 0 2px #046c4e, 2px -2px 0 2px #059669, 2px 2px 0 2px #34d399, -2px 2px 0 2px #10b981',
                border: '1px solid transparent'
              }}
            >
              <Plus className="w-5 h-5 mr-1 text-black font-bold" strokeWidth={3} />
              SHARE RESOURCE
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
