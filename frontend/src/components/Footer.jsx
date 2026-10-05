import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { X, Send, Bot, AlertCircle } from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Footer() {
  const location = useLocation();
  const { user } = useAuth();
  const isAuthScreen = ['/login', '/register', '/reset-password'].includes(location.pathname);
  
  const [showIssueBot, setShowIssueBot] = useState(false);
  const [issueText, setIssueText] = useState('');
  const [issueResponses, setIssueResponses] = useState([{
    type: 'ai', text: "Hi! What bug have you found or what is wrong with the website? I'll report it straight to the admin team."
  }]);
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);

  if (isAuthScreen) return null;

  const handleReportIssue = async (e) => {
    e.preventDefault();
    if (!issueText.trim() || isSubmittingIssue) return;
    
    const userMessage = issueText;
    setIssueText('');
    setIssueResponses(prev => [...prev, { type: 'user', text: userMessage }]);
    setIsSubmittingIssue(true);
    
    try {
      const res = await api.post('/ai-helpers/report-issue', { description: userMessage });
      if (res.data.success) {
        setIssueResponses(prev => [...prev, { type: 'ai', text: res.data.ai_reply }]);
      }
    } catch (err) {
      setIssueResponses(prev => [...prev, { type: 'ai', text: "Ok, noted issue. We will resolve this issue ASAP." }]);
    } finally {
      setIsSubmittingIssue(false);
    }
  };

  return (
    <>
      <footer className="bg-[#002f34] text-gray-200 py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Brand Section */}
            <div className="col-span-1 md:col-span-1 pr-4">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                EcoSync <span className="text-xl">🌱</span>
              </h2>
              <p className="text-teal-400 font-medium mb-4 text-sm">Share more. Waste less.</p>
              <p className="text-sm text-gray-400 leading-relaxed">
                A community-powered platform to borrow, lend, rent, sell, donate and reuse resources nearby.
              </p>
            </div>

            {/* Explore Links */}
            <div>
              <h3 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Explore</h3>
              <ul className="space-y-2">
                <li><Link to="/search" className="text-sm text-gray-400 hover:text-white transition-colors">Resources</Link></li>
                <li><Link to="/" className="text-sm text-gray-400 hover:text-white transition-colors">Categories</Link></li>
                <li><Link to="/saved" className="text-sm text-gray-400 hover:text-white transition-colors">Saved</Link></li>
              </ul>
            </div>

            {/* Community Links */}
            <div>
              <h3 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Community</h3>
              <ul className="space-y-2">
                <li><Link to="/add" className="text-sm text-gray-400 hover:text-white transition-colors">Share Resource</Link></li>
                <li><Link to="/requests" className="text-sm text-gray-400 hover:text-white transition-colors">My Requests</Link></li>
                <li><Link to="/messages" className="text-sm text-gray-400 hover:text-white transition-colors">Messages</Link></li>
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h3 className="text-white font-bold mb-4 uppercase tracking-wider text-sm">Support</h3>
              <ul className="space-y-2">
                <li><Link to="#" className="text-sm text-gray-400 hover:text-white transition-colors">Help Center</Link></li>
                <li><a href="mailto:parth020716@gmail.com" className="text-sm text-gray-400 hover:text-white transition-colors">Contact</a></li>
                <li><button onClick={() => setShowIssueBot(true)} className="text-sm text-gray-400 hover:text-white transition-colors">Report Issue</button></li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-700 pt-8 pb-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left text-sm text-gray-400">
              <div>
                <p className="mb-1 text-gray-300">
                  <span className="mr-1">🌱</span> Built by students, powered by caffeine & deadlines.
                </p>
                <p className="text-xs text-gray-500 italic">
                  Hope you find EcoSync useful. If you don't... please don't tell our professors. 😂
                </p>
              </div>
              
              <div className="text-xs text-gray-500 mt-4 md:mt-0">
                © {new Date().getFullYear()} EcoSync • Built for learning, sharing & sustainability.
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* AI Issue Bot Floating Window */}
      {showIssueBot && (
        <div className="fixed bottom-6 right-6 w-[400px] bg-white rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col border border-gray-200">
          <div className="bg-teal-700 p-4 flex justify-between items-center text-white">
            <div className="flex items-center gap-2 font-semibold">
              <Bot className="w-6 h-6" />
              Report an Issue
            </div>
            <button onClick={() => setShowIssueBot(false)} className="hover:bg-teal-600 p-1.5 rounded transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 p-5 bg-gray-50 h-80 overflow-y-auto flex flex-col gap-4">
            {issueResponses.map((msg, i) => (
              <div key={i} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-2 rounded text-sm ${msg.type === 'user' ? 'bg-teal-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isSubmittingIssue && (
              <div className="flex justify-start">
                <div className="max-w-[85%] p-2 rounded text-sm bg-white border border-gray-200 text-gray-500 italic rounded-bl-none shadow-sm">
                  Analyzing...
                </div>
              </div>
            )}
          </div>
          
          <form onSubmit={handleReportIssue} className="border-t border-gray-200 bg-white p-2 flex gap-2">
            <input 
              type="text" 
              value={issueText}
              onChange={(e) => setIssueText(e.target.value)}
              placeholder="Describe the bug..." 
              className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:border-teal-500"
              disabled={isSubmittingIssue}
            />
            <button 
              type="submit" 
              disabled={isSubmittingIssue || !issueText.trim()}
              className="bg-teal-600 text-white p-2 rounded hover:bg-teal-700 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
