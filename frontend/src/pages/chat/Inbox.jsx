import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, Clock } from 'lucide-react';

export default function Inbox() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      api.get('/chat/')
        .then(res => {
          setConversations(res.data.conversations);
          setLoading(false);
        })
        .catch(err => {
          console.error("Failed to load conversations", err);
          setLoading(false);
        });
    }
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#f2f4f5] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <MessageSquare className="w-6 h-6" /> Messages
        </h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {conversations.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg">No messages yet.</p>
              <p className="text-sm mt-1">When you contact a user or someone contacts you, it will show up here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {conversations.map(conv => (
                <Link 
                  key={conv.id} 
                  to={`/messages/${conv.id}`}
                  className={`flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors ${conv.unread_count > 0 ? 'bg-teal-50/30' : ''}`}
                >
                  <img 
                    src={conv.listing_image || "https://placehold.co/100x100/e2e8f0/64748b"} 
                    alt="" 
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0 border border-gray-200" 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className={`text-base font-semibold truncate ${conv.unread_count > 0 ? 'text-gray-900' : 'text-gray-800'}`}>
                        {conv.other_user_name}
                      </h3>
                      <span className="text-xs text-gray-500 flex items-center gap-1 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {new Date(conv.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-teal-700 mb-1 truncate">{conv.listing_title}</p>
                    <p className={`text-sm truncate ${conv.unread_count > 0 ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                      {conv.latest_message}
                    </p>
                  </div>
                  {conv.unread_count > 0 && (
                    <div className="w-5 h-5 bg-teal-600 text-white text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0">
                      {conv.unread_count}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
