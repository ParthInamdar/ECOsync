import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Send, ArrowLeft, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ChatRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [listing, setListing] = useState(null);
  const [otherUser, setOtherUser] = useState(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  
  const messagesEndRef = useRef(null);
  const isSendingRef = useRef(false);

  const fetchMessages = () => {
    if (isSendingRef.current) return;
    
    api.get(`/chat/${id}`)
      .then(res => {
        setMessages(res.data.messages);
        setListing(res.data.listing);
        setOtherUser(res.data.other_user);
        setLoading(false);
      })
      .catch(err => {
        if (loading) toast.error("Failed to load chat");
        console.error("Failed to load chat", err);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMessages();
    // Simple polling for new messages
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    const text = inputText;
    setInputText('');
    
    // Optimistically add message to UI
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      sender_id: user.id,
      text: text,
      is_read: false,
      created_at: new Date().toISOString()
    };
    setMessages(prev => [...prev, optimisticMsg]);
    
    isSendingRef.current = true;
    try {
      await api.post(`/chat/${id}/message`, { text });
      isSendingRef.current = false;
      fetchMessages(); // refresh to get real ID and exact timestamp
    } catch (err) {
      toast.error("Failed to send message");
      console.error("Failed to send", err);
      isSendingRef.current = false;
      fetchMessages(); // Rollback to actual state
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!listing) return <div className="min-h-screen flex items-center justify-center">Chat not found.</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#f2f4f5]">
      
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 flex-shrink-0 z-10 shadow-sm">
        <Link to="/messages" className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        
        <div className="flex-1 flex items-center justify-between min-w-0">
          <div>
            <h2 className="font-bold text-gray-900 truncate">{otherUser.name}</h2>
            <Link to={`/resource/${listing.id}`} className="text-xs text-teal-700 hover:underline flex items-center gap-1 truncate">
              {listing.title} • {listing.price > 0 ? `₹${listing.price}` : 'Free'}
            </Link>
          </div>
          <Link to={`/resource/${listing.id}`} className="flex-shrink-0 ml-4 hidden sm:block">
            <img src={listing.image || "https://placehold.co/100x100"} alt="" className="w-10 h-10 rounded object-cover border border-gray-200" />
          </Link>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            Say hi to start the conversation!
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${isMe ? 'bg-teal-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none shadow-sm'}`}>
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                  <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-teal-100' : 'text-gray-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4 flex-shrink-0">
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-end gap-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend(e);
              }
            }}
            placeholder="Type a message..."
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none max-h-32 min-h-[48px]"
            rows={1}
          />
          <button 
            type="submit" 
            disabled={!inputText.trim()}
            className="bg-teal-600 text-white p-3 rounded-full hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>

    </div>
  );
}
