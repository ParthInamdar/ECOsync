import { Link } from 'react-router-dom';

export default function Footer() {
  return (
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
              <li><Link to="#" className="text-sm text-gray-400 hover:text-white transition-colors">Contact</Link></li>
              <li><Link to="#" className="text-sm text-gray-400 hover:text-white transition-colors">Report Issue</Link></li>
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
  );
}
