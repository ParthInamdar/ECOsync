import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { MapPin, Star, Sparkles, ChevronLeft, ChevronRight, BookOpen, Wrench, Laptop, Trophy, Tent, Home as HomeIcon, Palette, Gamepad2, Bike, Package } from 'lucide-react';
import api from '../utils/api';

const CATEGORIES = [
  'Books', 'Electronics', 'Sports', 'Tools', 'Household', 'Vehicles', 'Fashion', 'Other'
];

export default function Home() {
  const { user } = useAuth();
  const [resources, setResources] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(false);
  const scrollRef = useRef(null);

  const scrollLeft = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
  };

  const scrollRight = () => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
  };

  useEffect(() => {
    api.get('/resources/')
      .then(res => {
        setResources(res.data.resources);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to load resources", err);
        setLoading(false);
      });
      
    if (user) {
      setRecLoading(true);
      
      const fetchRecommendations = (lat, lon) => {
        let url = '/recommendations/';
        if (lat && lon) {
          url += `?lat=${lat}&lon=${lon}`;
        }
        api.get(url)
          .then(res => {
            if (res.data.success && res.data.recommendations.length > 0) {
              setRecommendations(res.data.recommendations);
            }
            setRecLoading(false);
          })
          .catch(err => {
            console.error("AI Recommendations not available.");
            setRecLoading(false);
          });
      };

      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            fetchRecommendations(pos.coords.latitude, pos.coords.longitude);
          },
          (err) => {
            console.warn("Location not granted, fetching generic recommendations.");
            fetchRecommendations(null, null);
          },
          { timeout: 5000 }
        );
      } else {
        fetchRecommendations(null, null);
      }
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-white pb-12 font-sans">
      
      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* Hero Categories Slider */}
        <div className="relative mb-10 group px-8">
          <button 
            onClick={scrollLeft} 
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md border border-gray-200 rounded-full p-2 transition-opacity focus:outline-none"
          >
            <ChevronLeft className="w-6 h-6 text-gray-900" />
          </button>
          
          <div 
            ref={scrollRef}
            className="flex overflow-x-auto gap-8 hide-scrollbar scroll-smooth py-2 px-2"
          >
            {[
              { name: 'Books & Study', icon: BookOpen, param: 'Books', color: 'bg-blue-100 text-blue-600' },
              { name: 'Tools & Equipment', icon: Wrench, param: 'Tools', color: 'bg-orange-100 text-orange-600' },
              { name: 'Electronics', icon: Laptop, param: 'Electronics', color: 'bg-gray-100 text-gray-800' },
              { name: 'Sports & Fitness', icon: Trophy, param: 'Sports', color: 'bg-red-100 text-red-600' },
              { name: 'Outdoor & Travel', icon: Tent, param: 'Outdoor', color: 'bg-green-100 text-green-700' },
              { name: 'Household', icon: HomeIcon, param: 'Household', color: 'bg-teal-100 text-teal-600' },
              { name: 'Hobbies & Creative', icon: Palette, param: 'Hobbies', color: 'bg-purple-100 text-purple-600' },
              { name: 'Games & Entertainment', icon: Gamepad2, param: 'Games', color: 'bg-indigo-100 text-indigo-600' },
              { name: 'Mobility', icon: Bike, param: 'Mobility', color: 'bg-yellow-100 text-yellow-700' },
              { name: 'Other', icon: Package, param: 'Other', color: 'bg-gray-100 text-gray-500' },
            ].map((cat) => {
              const IconComponent = cat.icon;
              return (
                <Link key={cat.name} to={`/search?category=${encodeURIComponent(cat.param)}`} className="flex flex-col items-center gap-2 group flex-shrink-0 w-[110px]">
                  <div className={`w-[90px] h-[90px] flex items-center justify-center rounded-full hover:shadow-md transition-all overflow-hidden border-2 border-white shadow-sm group-hover:scale-105 ${cat.color}`}>
                    <IconComponent className="w-10 h-10" />
                  </div>
                  <span className="text-[13px] font-medium text-gray-900 text-center leading-tight mt-1">{cat.name}</span>
                </Link>
              );
            })}
          </div>

          <button 
            onClick={scrollRight} 
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md border border-gray-200 rounded-full p-2 transition-opacity focus:outline-none"
          >
            <ChevronRight className="w-6 h-6 text-gray-900" />
          </button>
        </div>

        {/* Fresh Recommendations Header */}
        <div className="mb-4 flex justify-between items-end">
          <h2 className="text-2xl font-normal text-[#002f34]">Resources near you</h2>
        </div>

        {/* Resource Grid */}
        {loading ? (
          <div className="py-12 text-center text-gray-500">Loading resources...</div>
        ) : resources.length === 0 ? (
          <div className="py-12 text-center text-gray-500 bg-white rounded border border-gray-200 mb-8">
            <p className="mb-2">No resources available right now.</p>
            <Link to="/add" className="text-teal-600 hover:underline font-medium">Be the first to share a resource!</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
            {resources.map(resource => (
              <Link key={resource.id} to={`/resource/${resource.id}`} className="bg-white rounded border border-gray-200 overflow-hidden hover:shadow-lg transition-all flex flex-col h-full group relative">
                {/* Save Icon */}
                <div className="absolute top-2 right-2 z-10 bg-white/80 backdrop-blur-sm rounded-full p-1.5 shadow-sm hover:bg-white text-gray-400 hover:text-red-500 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                </div>
                
                {/* Image Section */}
                <div className="relative aspect-[4/3] w-full bg-gray-50 overflow-hidden border-b border-gray-100 flex items-center justify-center">
                  {resource.image_url ? (
                    <img 
                      src={resource.image_url} 
                      alt={resource.title} 
                      loading="lazy"
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                    />
                  ) : null}
                  {/* Fallback Icon */}
                  <div className={`flex-col items-center justify-center text-gray-400 ${resource.image_url ? 'hidden' : 'flex'}`}>
                    <Sparkles className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-[10px] font-medium uppercase tracking-wider">No Image</span>
                  </div>
                </div>
                
                {/* Content Section */}
                <div className="p-4 flex flex-col flex-grow">
                  {/* Listing Type Badge */}
                  <div className="mb-2">
                    <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold tracking-wider uppercase rounded-sm">
                      {resource.listing_type || 'SHARE'}
                    </span>
                  </div>
                  
                  {/* Title & Condition */}
                  <h3 className="text-[15px] font-medium text-gray-900 line-clamp-1 leading-tight mb-1">
                    {resource.title}
                  </h3>
                  
                  {/* Price / Contextual Value */}
                  <p className="text-[16px] font-bold text-[#006400] mb-2">
                    {resource.listing_type === 'FREE' || resource.listing_type === 'DONATE' ? 'Free' :
                     resource.listing_type === 'BORROW' ? 'Borrow' :
                     resource.price > 0 ? `₹${resource.price}${resource.price_unit ? resource.price_unit : ''}` : 'Free'}
                  </p>
                  
                  {/* Location & Metadata */}
                  <div className="mt-auto pt-2 flex items-center justify-between text-[11px] text-gray-500 font-medium border-t border-gray-50">
                    <div className="flex items-center gap-1 truncate max-w-[120px]">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{resource.location_name || 'India'}</span>
                    </div>
                    {resource.condition && (
                      <span className="px-1.5 py-0.5 bg-gray-50 rounded text-[10px]">{resource.condition}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
